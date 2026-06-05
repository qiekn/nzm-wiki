"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { getAssetPath } from "@/lib/path";
import { RARITY_OPTIONS } from "@/constants/common";
import { STAT_SPRITES } from "@/constants/sprites";
import { SpriteIcon } from "@/components/SpriteIcon";

/**
 * 解析乘区表达式
 * 支持格式：
 * - "1 + 0.3"       → 1.3
 * - "1 + 30%"       → 1.3
 * - "1 + 0.3 + 10%" → 1.4
 * - "130%"           → 1.3
 * - "1.3"            → 1.3
 */
function parseMultiplierExpr(input: string): number | null {
  const s = input.trim();
  if (!s) return null;

  // 含 + 号：各项相加
  if (s.includes("+")) {
    const parts = s.split("+");
    let sum = 0;
    for (const part of parts) {
      const v = parseSingleToken(part.trim());
      if (v === null) return null;
      sum += v;
    }
    return sum;
  }

  return parseSingleToken(s);
}

function parseSingleToken(s: string): number | null {
  if (!s) return null;
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? null : n / 100;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

interface ExtraMultiplier {
  id: number;
  name: string;
  expr: string;
}

interface WeaponStat {
  title: string;
  weapon_type: string | null;
  element: string | null;
  rarity: string | null;
  damage_base: number | null;
  weekness_multiplier: number | null;
  fire_interval: number | null;
  magazine: number | null;
  reload_time: number | null;
  enable_critical: boolean | null;
  pinyin: string[];
}

function matchWeapon(weapon: WeaponStat, query: string): boolean {
  const q = query.toLowerCase();
  if (weapon.title.toLowerCase().includes(q)) return true;
  for (const py of weapon.pinyin) {
    if (py.includes(q)) return true;
  }
  return false;
}

export function DamageCalculator() {
  const [weapons, setWeapons] = useState<WeaponStat[]>([]);
  const [baseDmg, setBaseDmg] = useState(100);
  const [weakpointMul, setWeakpointMul] = useState(1.0);
  const [weakpointHitRate, setWeakpointHitRate] = useState(100);
  const [hitRate, setHitRate] = useState(100);

  // 暴击模式：direct = 直接输入等效增伤，detail = 输入暴击率+暴击伤害
  const [critMode, setCritMode] = useState<"direct" | "detail">("detail");
  const [critBoostPct, setCritBoostPct] = useState(0);
  const [critRate, setCritRate] = useState(5);
  const [critDmg, setCritDmg] = useState(150);

  const handleCritModeToggle = useCallback(
    (mode: "direct" | "detail") => {
      if (mode === "direct" && critMode === "detail") {
        const effective = (critRate / 100) * (critDmg / 100 - 1) * 100;
        setCritBoostPct(parseFloat(effective.toFixed(2)));
      }
      setCritMode(mode);
    },
    [critMode, critRate, critDmg],
  );

  const [perkExpr, setPerkExpr] = useState("1");
  const [perkLastValid, setPerkLastValid] = useState(1);
  const [perkLabel, setPerkLabel] = useState("插件乘区");
  const [editingPerkLabel, setEditingPerkLabel] = useState(false);

  const [fireRate, setFireRate] = useState(600);
  const [reloadTime, setReloadTime] = useState(2.0);
  const [magSize, setMagSize] = useState(30);

  const [extras, setExtras] = useState<ExtraMultiplier[]>([]);
  const [nextId, setNextId] = useState(1);
  const [extraSectionName, setExtraSectionName] = useState("额外乘区");
  const [editingSectionName, setEditingSectionName] = useState(false);

  // 加载武器数据
  useEffect(() => {
    fetch(getAssetPath("/weapon-stats.json"))
      .then((r) => r.json())
      .then((data: WeaponStat[]) => setWeapons(data))
      .catch(() => {});
  }, []);

  const applyWeapon = (w: WeaponStat) => {
    if (w.damage_base !== null) setBaseDmg(Math.round(w.damage_base * 500));
    if (w.weekness_multiplier !== null) setWeakpointMul(w.weekness_multiplier);
    if (w.fire_interval !== null && w.fire_interval > 0) {
      setFireRate(60 / w.fire_interval);
    }
    if (w.magazine !== null) setMagSize(w.magazine);
    if (w.reload_time !== null) setReloadTime(w.reload_time);
  };

  // 解析插件乘区
  const perkParsed = useMemo(() => parseMultiplierExpr(perkExpr), [perkExpr]);
  const perkValue = perkParsed !== null ? perkParsed : perkLastValid;
  const perkInvalid = perkParsed === null && perkExpr.trim() !== "";

  // 记住最后有效值
  const handlePerkChange = useCallback((val: string) => {
    setPerkExpr(val);
    const parsed = parseMultiplierExpr(val);
    if (parsed !== null) {
      setPerkLastValid(parsed);
    }
  }, []);

  // 额外乘区解析
  const extraValues = useMemo(() => {
    return extras.map((e) => {
      const parsed = parseMultiplierExpr(e.expr);
      return { ...e, parsed, value: parsed ?? 1 };
    });
  }, [extras]);

  // 暴击伤害倍率
  const critDmgMul = useMemo(() => {
    if (critMode === "direct") {
      return 1 + critBoostPct / 100;
    }
    return critDmg / 100;
  }, [critMode, critBoostPct, critDmg]);

  // 暴击率（用于 DPS 期望计算）
  const effectiveCritRate = useMemo(() => {
    if (critMode === "direct") return 0;
    return critRate / 100;
  }, [critMode, critRate]);

  // 基础乘区（插件 × 额外）
  const baseMultiplier = useMemo(() => {
    const extraProduct = extraValues.reduce((acc, e) => acc * e.value, 1);
    return perkValue * extraProduct;
  }, [perkValue, extraValues]);

  // 四种单次伤害
  const dmgNormal = baseDmg * baseMultiplier;
  const dmgWeakpoint = dmgNormal * weakpointMul;
  const dmgCrit = dmgNormal * critDmgMul;
  const dmgWeakpointCrit = dmgNormal * weakpointMul * critDmgMul;

  // DPS 期望单次伤害（考虑弱点命中率和暴击率）
  const expectedDmgPerShot = useMemo(() => {
    const hitRate = weakpointHitRate / 100;
    const cr = effectiveCritRate;
    // 四种情况加权
    return (
      dmgNormal * (1 - hitRate) * (1 - cr) +
      dmgWeakpoint * hitRate * (1 - cr) +
      dmgCrit * (1 - hitRate) * cr +
      dmgWeakpointCrit * hitRate * cr
    );
  }, [
    dmgNormal,
    dmgWeakpoint,
    dmgCrit,
    dmgWeakpointCrit,
    weakpointHitRate,
    effectiveCritRate,
  ]);

  // DPS
  const rps = fireRate / 60;
  const effectiveHitRate = hitRate / 100;
  const dpsNoReload = expectedDmgPerShot * effectiveHitRate * rps;
  const magDuration = magSize / rps;
  const dpsWithReload =
    reloadTime > 0
      ? (expectedDmgPerShot * effectiveHitRate * magSize) /
        (magDuration + reloadTime)
      : dpsNoReload;

  const addExtra = () => {
    setExtras((prev) => [...prev, { id: nextId, name: "增伤", expr: "1" }]);
    setNextId((n) => n + 1);
  };

  const removeExtra = (id: number) => {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExtra = (id: number, field: "name" | "expr", val: string) => {
    setExtras((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    );
  };

  return (
    <div className="not-prose rounded-lg border border-zinc-700/80 bg-zinc-900/80 p-4 sm:p-5">
      {/* 武器选择 */}
      {weapons.length > 0 && (
        <div className="mb-3">
          <WeaponSelect weapons={weapons} onSelect={applyWeapon} />
        </div>
      )}

      {/* 固定输入行 */}
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={<StatLabel icon="damage" text="武器基础伤害" />}
          value={baseDmg}
          onChange={setBaseDmg}
          min={0}
          max={99999}
          step={1}
        />
        <InputField
          label={<StatLabel icon="weaknessMultiplier" text="弱点倍率" />}
          value={weakpointMul}
          onChange={setWeakpointMul}
          min={1.0}
          max={10}
          step={0.1}
          decimals={1}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <InputField
          label={<StatLabel icon="hitRate" text="射击命中率" />}
          unit="%"
          value={hitRate}
          onChange={setHitRate}
          min={0}
          max={100}
          step={5}
        />
        <InputField
          label={<StatLabel icon="weakpointHitRate" text="弱点命中率" />}
          unit="%"
          value={weakpointHitRate}
          onChange={setWeakpointHitRate}
          min={0}
          max={100}
          step={5}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <InputField
          label={<StatLabel icon="fireRate" text="射速" />}
          unit="发/分钟"
          value={fireRate}
          onChange={setFireRate}
          min={1}
          max={6000}
          step={10}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <InputField
          label={<StatLabel icon="magazine" text="弹夹容量" />}
          value={magSize}
          onChange={setMagSize}
          min={1}
          max={9999}
          step={1}
        />
        <InputField
          label={<StatLabel icon="reloadTime" text="换弹时间" />}
          unit="秒"
          value={reloadTime}
          onChange={setReloadTime}
          min={0}
          max={30}
          step={0.1}
          decimals={1}
        />
      </div>

      {/* 暴击区域 */}
      <div className="mt-3">
        <div className="mb-1.5">
          <CritModeToggle mode={critMode} onToggle={handleCritModeToggle} />
        </div>
        {critMode === "direct" ? (
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="暴击等效增伤"
              unit="%"
              value={critBoostPct}
              onChange={setCritBoostPct}
              min={0}
              max={500}
              step={5}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="暴击率"
              unit="%"
              value={critRate}
              onChange={setCritRate}
              min={0}
              max={100}
              step={5}
            />
            <InputField
              label="暴击伤害"
              unit="%"
              value={critDmg}
              onChange={setCritDmg}
              min={100}
              max={500}
              step={5}
            />
          </div>
        )}
      </div>

      {/* 插件乘区 */}
      <div className="mt-3">
        <ExprField
          label={
            editingPerkLabel ? (
              <input
                type="text"
                className="w-20 rounded border border-zinc-600/80 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-400"
                value={perkLabel}
                onChange={(e) => setPerkLabel(e.target.value)}
                onBlur={() => setEditingPerkLabel(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingPerkLabel(false);
                }}
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer hover:text-zinc-300"
                onClick={() => setEditingPerkLabel(true)}
              >
                {perkLabel || "插件乘区"}
              </span>
            )
          }
          value={perkExpr}
          onChange={handlePerkChange}
          invalid={perkInvalid}
          parsedHint={perkParsed !== null ? `= ${perkParsed}` : undefined}
        />
      </div>

      {/* 额外乘区 */}
      {extras.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs text-zinc-400">
            {editingSectionName ? (
              <input
                type="text"
                className="w-20 rounded border border-zinc-600/80 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 outline-none focus:border-zinc-400"
                value={extraSectionName}
                onChange={(e) => setExtraSectionName(e.target.value)}
                onBlur={() => setEditingSectionName(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingSectionName(false);
                }}
                autoFocus
              />
            ) : (
              <span
                className="cursor-pointer hover:text-zinc-300"
                onClick={() => setEditingSectionName(true)}
              >
                {extraSectionName || "额外乘区"}
              </span>
            )}
          </div>
          {extraValues.map((e) => (
            <div key={e.id} className="flex items-end gap-2">
              <div className="w-24 shrink-0">
                <input
                  type="text"
                  className="w-full rounded-md border border-zinc-600/80 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-400"
                  value={e.name}
                  onChange={(ev) => updateExtra(e.id, "name", ev.target.value)}
                  placeholder="名称"
                />
              </div>
              <div className="flex-1">
                <ExprField
                  value={e.expr}
                  onChange={(val) => updateExtra(e.id, "expr", val)}
                  invalid={e.parsed === null && e.expr.trim() !== ""}
                  parsedHint={e.parsed !== null ? `= ${e.parsed}` : undefined}
                />
              </div>
              <button
                type="button"
                className="mb-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-zinc-600/80 bg-zinc-800 text-sm text-zinc-400 transition-colors hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-400"
                onClick={() => removeExtra(e.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="mt-3 rounded-md border border-dashed border-zinc-600/80 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300"
        onClick={addExtra}
      >
        + 添加乘区
      </button>

      {/* 分割线 */}
      <div className="my-4 border-t border-zinc-700/60" />

      {/* 输出 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">普通命中</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
            {Math.round(dmgNormal).toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">弱点命中</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-yellow-400">
            {Math.round(dmgWeakpoint).toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">普通暴击</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-orange-400">
            {Math.round(dmgCrit).toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">弱点暴击</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-red-400">
            {Math.round(dmgWeakpointCrit).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">DPS (不换弹)</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
            {Math.round(dpsNoReload).toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border border-zinc-700/60 bg-zinc-800/40 px-3 py-2.5">
          <div className="text-[11px] text-zinc-500">DPS (含换弹)</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">
            {Math.round(dpsWithReload).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  decimals,
}: {
  label: ReactNode;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  decimals?: number;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = useCallback(() => {
    if (draft === null) return;
    const v = parseFloat(draft);
    if (!isNaN(v)) {
      onChange(Math.min(Math.max(v, min), max));
    }
    setDraft(null);
  }, [draft, onChange, min, max]);

  const display =
    draft ?? (decimals !== undefined ? value.toFixed(decimals) : value);

  return (
    <div>
      <label className="mb-1.5 block text-xs text-zinc-400">{label}</label>
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <input
            type="number"
            className="w-full appearance-none rounded-md border border-zinc-600/80 bg-zinc-800 py-1.5 pl-3 pr-7 text-sm tabular-nums text-zinc-100 outline-none transition-colors focus:border-zinc-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
            value={display}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
            min={min}
            max={max}
            step={step}
          />
          {unit && (
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              {unit}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-col overflow-hidden rounded border border-zinc-600/80">
          <button
            type="button"
            className="flex h-[14px] w-5 items-center justify-center bg-zinc-800 text-[10px] leading-none text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 active:bg-zinc-600"
            onClick={() => {
              const next =
                decimals !== undefined
                  ? parseFloat((value + step).toFixed(decimals))
                  : value + step;
              onChange(Math.min(next, max));
            }}
          >
            ▲
          </button>
          <div className="h-px bg-zinc-600/80" />
          <button
            type="button"
            className="flex h-[14px] w-5 items-center justify-center bg-zinc-800 text-[10px] leading-none text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200 active:bg-zinc-600"
            onClick={() => {
              const next =
                decimals !== undefined
                  ? parseFloat((value - step).toFixed(decimals))
                  : value - step;
              onChange(Math.max(next, min));
            }}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

function CritModeToggle({
  mode,
  onToggle,
}: {
  mode: "direct" | "detail";
  onToggle: (m: "direct" | "detail") => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
        <SpriteIcon
          sprite={STAT_SPRITES.crit}
          size={14}
          className="opacity-80"
        />
        暴击
      </span>
      <span className="inline-flex overflow-hidden rounded border border-zinc-600/80 text-[10px] leading-none">
        <button
          type="button"
          className={`px-1.5 py-0.5 transition-colors ${
            mode === "detail"
              ? "bg-zinc-700 text-zinc-200"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => onToggle("detail")}
        >
          暴击率/伤害
        </button>
        <span className="w-px bg-zinc-600/80" />
        <button
          type="button"
          className={`px-1.5 py-0.5 transition-colors ${
            mode === "direct"
              ? "bg-zinc-700 text-zinc-200"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
          onClick={() => onToggle("direct")}
        >
          等效增伤
        </button>
      </span>
    </span>
  );
}

function WeaponSelect({
  weapons,
  onSelect,
}: {
  weapons: WeaponStat[];
  onSelect: (w: WeaponStat) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return weapons;
    return weapons.filter((w) => matchWeapon(w, query));
  }, [weapons, query]);
  const safeHighlightIndex =
    filtered.length > 0 ? Math.min(highlightIndex, filtered.length - 1) : 0;

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 滚动高亮项到可视区域
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.children[safeHighlightIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [safeHighlightIndex, open]);

  const handleSelect = (w: WeaponStat) => {
    setSelected(w.title);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    onSelect(w);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[safeHighlightIndex]) {
      e.preventDefault();
      handleSelect(filtered[safeHighlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs text-zinc-400">武器模板</label>
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-md border border-zinc-600/80 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-400"
        placeholder={selected ?? "搜索武器名称或拼音缩写"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && filtered.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-zinc-600/80 bg-zinc-800 py-1 shadow-lg"
        >
          {filtered.map((w, i) => {
            const rarityColor =
              RARITY_OPTIONS.find((r) => r.type === w.rarity)?.color ??
              "text-zinc-300";
            return (
              <button
                key={w.title}
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                  i === safeHighlightIndex ? "bg-zinc-700" : "hover:bg-zinc-700/50"
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(w);
                }}
              >
                <span className={`flex-1 truncate ${rarityColor}`}>
                  {w.title}
                </span>
                {w.weapon_type && (
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {w.weapon_type}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <SpriteIcon
        sprite={STAT_SPRITES[icon]}
        size={14}
        className="opacity-80"
      />
      {text}
    </span>
  );
}

function ExprField({
  label,
  value,
  onChange,
  invalid,
  parsedHint,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  parsedHint?: string;
}) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs text-zinc-400">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md border bg-zinc-800 px-3 py-1.5 text-sm tabular-nums text-zinc-100 outline-none transition-colors focus:border-zinc-400 ${
            invalid ? "border-red-500/60" : "border-zinc-600/80"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="1 + 0.3 或 130%"
        />
        {parsedHint && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
            {parsedHint}
          </span>
        )}
      </div>
    </div>
  );
}
