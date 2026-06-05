"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Weapon, ElementType } from "@/types";
import { getAssetPath } from "@/lib/path";
import { RARITY_KEY_MAP, RARITY_CARD_STYLES } from "@/constants/common";

const ELEMENT_ICONS: Record<ElementType, string> = {
  火焰: "/icons/elements/fire.png",
  寒冷: "/icons/elements/cryo.png",
  电弧: "/icons/elements/shock.png",
  腐蚀: "/icons/elements/corossive.png",
  物理: "/icons/elements/kinetic.png",
};

function formatSingleDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const roundedInt = Math.round(rounded);
  if (Math.abs(rounded - roundedInt) < 0.001) {
    return String(roundedInt);
  }
  return rounded.toFixed(1);
}

function formatDamage(base: number | undefined | null, pellets?: number): string {
  if (base === null || base === undefined) return "-";
  const damage = formatSingleDecimal(base * 500);
  if (pellets && pellets > 1) {
    return `${damage} x ${pellets}`;
  }
  return damage;
}

function WeaponImage({ name, size = "normal" }: { name: string; size?: "small" | "normal" }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  const height = size === "small" ? "h-24" : "h-28";

  return (
    <div className={`relative ${height} w-full overflow-hidden`}>
      <Image
        src={getAssetPath(`/icons/weapons/normal/${name}.png`)}
        alt={name}
        width={320}
        height={160}
        className="mx-auto h-full w-auto object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

/**
 * 简洁模式卡片 - 只有名称、图片、元素图标
 */
function SimpleCard({ weapon }: { weapon: Weapon }) {
  const rarityKey = weapon.rarity ? RARITY_KEY_MAP[weapon.rarity] : "common";
  const rarityStyle = RARITY_CARD_STYLES[rarityKey];
  const elementIcon = ELEMENT_ICONS[weapon.element];

  return (
    <Link href={`/weapons/${encodeURIComponent(weapon.slug)}`}>
      <div
        className={`relative rounded-lg border-2 ${rarityStyle.border} ${rarityStyle.bg} p-3 transition-transform hover:scale-[1.02]`}
      >
        {elementIcon && (
          <div className="absolute right-2 top-2 z-10">
            <Image
              src={getAssetPath(elementIcon)}
              alt={weapon.element}
              width={20}
              height={20}
            />
          </div>
        )}
        <h3 className="mb-2 text-base font-semibold text-white">{weapon.title}</h3>
        <WeaponImage name={weapon.title} size="small" />
      </div>
    </Link>
  );
}

/**
 * 详细模式卡片 - 显示更多属性
 */
function DetailedCard({ weapon }: { weapon: Weapon }) {
  const rarityKey = weapon.rarity ? RARITY_KEY_MAP[weapon.rarity] : "common";
  const rarityStyle = RARITY_CARD_STYLES[rarityKey];
  const elementIcon = ELEMENT_ICONS[weapon.element];
  const tags = Array.isArray(weapon.tags) ? weapon.tags : [];

  const formatValue = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "" || val === -1) return "-";
    return val;
  };

  return (
    <Link href={`/weapons/${encodeURIComponent(weapon.slug)}`}>
      <div
        className={`relative rounded-lg border-2 ${rarityStyle.border} ${rarityStyle.bg} p-5 transition-transform hover:scale-[1.02] min-w-[360px]`}
      >
        {elementIcon && (
          <div className="absolute right-4 top-4 z-10">
            <Image
              src={getAssetPath(elementIcon)}
              alt={weapon.element}
              width={28}
              height={28}
            />
          </div>
        )}

        <h3 className="text-xl font-semibold text-white">{weapon.title}</h3>
        <div className="mt-1 mb-4 flex flex-wrap items-center gap-1.5 text-sm text-zinc-400">
          {weapon.use_type && <span>{weapon.use_type}</span>}
          {weapon.weapon_type && <span>· {weapon.weapon_type}</span>}
          {weapon.scope && <span>· {weapon.scope}</span>}
          {tags.length > 0 &&
            tags.map((tag) => (
              <span key={tag}>· {tag}</span>
            ))}
        </div>

        <div className="flex justify-center">
          <Image
            src={getAssetPath(`/icons/weapons/normal/${weapon.title}.png`)}
            alt={weapon.title || ""}
            width={320}
            height={160}
            className="object-contain"
            style={{ width: 320, height: 'auto' }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-base">
          <div className="flex justify-between">
            <span className="text-zinc-500">单发伤害</span>
            <span className="text-white">{formatDamage(weapon.damage?.base, weapon.pellets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">射速</span>
            <span className="text-white">{formatValue(weapon.file_rate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">弹夹</span>
            <span className="text-white">{formatValue(weapon.magazine)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">总弹量</span>
            <span className="text-white">{formatValue(weapon.total_ammo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">弱点倍率</span>
            <span className="text-white">{weapon.weekness_multiplier}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">破韧伤害</span>
            <span className="text-white">{formatValue(weapon.damage?.toughness)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">换弹时间</span>
            <span className="text-white">{formatValue(weapon.reload_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">技能冷却</span>
            <span className="text-white">{formatValue(weapon.skill_cooldown)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * 列表页武器卡片
 */
export function WeaponCard({ weapon, showDetails = false }: { weapon: Weapon; showDetails?: boolean }) {
  if (showDetails) {
    return <DetailedCard weapon={weapon} />;
  }
  return <SimpleCard weapon={weapon} />;
}

/**
 * 详情页武器卡片 - 完整版
 */
export function WeaponDetailCard({ weapon }: { weapon: Weapon }) {
  const rarityKey = weapon.rarity ? RARITY_KEY_MAP[weapon.rarity] : "common";
  const rarityStyle = RARITY_CARD_STYLES[rarityKey];
  const elementIcon = ELEMENT_ICONS[weapon.element];
  const tags = Array.isArray(weapon.tags) ? weapon.tags : [];

  const formatValue = (val: number | string | null | undefined) => {
    if (val === null || val === undefined || val === "" || val === -1) return "-";
    return val;
  };

  return (
    <div className={`rounded-lg border-2 ${rarityStyle.border} ${rarityStyle.bg} p-6`}>
      {/* 头部 */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{weapon.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            {weapon.use_type && <span>{weapon.use_type}</span>}
            {weapon.weapon_type && <span>· {weapon.weapon_type}</span>}
            {weapon.scope && <span>· {weapon.scope}</span>}
            {tags.length > 0 &&
              tags.map((tag) => (
                <span key={tag} className="flex items-center gap-2">
                  <span>·</span>
                  <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                    {tag}
                  </span>
                </span>
              ))}
          </div>
        </div>
        {elementIcon && (
          <Image
            src={getAssetPath(elementIcon)}
            alt={weapon.element}
            width={32}
            height={32}
          />
        )}
      </div>

      {/* 武器图片 */}
      <div className="relative mb-6 h-32 w-full">
        <Image
          src={getAssetPath(`/icons/weapons/normal/${weapon.title}.png`)}
          alt={weapon.title || ""}
          width={320}
          height={160}
          className="mx-auto object-contain"
        />
      </div>

      {/* 伤害数据 */}
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-400">伤害数据</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">单发伤害</span>
            <span className="text-white">{formatDamage(weapon.damage?.base, weapon.pellets)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">冲击伤害</span>
            <span className="text-white">{formatValue(weapon.damage?.impulse)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">破韧伤害</span>
            <span className="text-white">{formatValue(weapon.damage?.toughness)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">血肉伤害</span>
            <span className="text-white">{formatValue(weapon.damage?.flesh)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">受伤伤害</span>
            <span className="text-white">{formatValue(weapon.damage?.hurtable)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">弱点倍率</span>
            <span className="text-white">{weapon.weekness_multiplier}</span>
          </div>
        </div>
      </div>

      {/* 武器属性 */}
      <div className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-zinc-400">武器属性</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">射速</span>
            <span className="text-white">{formatValue(weapon.file_rate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">弹夹</span>
            <span className="text-white">{formatValue(weapon.magazine)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">总弹量</span>
            <span className="text-white">{formatValue(weapon.total_ammo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">换弹时间</span>
            <span className="text-white">{formatValue(weapon.reload_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">技能冷却</span>
            <span className="text-white">{formatValue(weapon.skill_cooldown)}</span>
          </div>
          {weapon.skill_cooldown && weapon.skill_cooldown !== "" && weapon.skill_cooldown !== -1 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">充能速率</span>
              <span className="text-white">{(100 / Number(weapon.skill_cooldown)).toFixed(2)}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500">精准度</span>
            <span className="text-white">{formatValue(weapon.accuracy)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">稳定度</span>
            <span className="text-white">{formatValue(weapon.stability)}</span>
          </div>
        </div>
      </div>

      {/* 特殊属性 */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-400">特殊属性</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">破韧类型</span>
            <span className="text-white">{weapon.toughness_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">可以暴击</span>
            <span className="text-white">{weapon.enable_critical ? "是" : "否"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">无视护盾</span>
            <span className="text-white">{weapon.ignore_shield ? "是" : "否"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">元素异常概率</span>
            <span className="text-white">
              {weapon.element_add_rate > 0 ? `${(weapon.element_add_rate * 100).toFixed(1)}%` : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
