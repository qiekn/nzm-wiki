"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { Weapon } from "@/types";

export interface WeaponAttenuationChartProps {
  weapon?: Weapon;
  damage?: number | string | null;
  begin?: number | string | null;
  end?: number | string | null;
  scale?: number | string | null;
  pellets?: number | string | null;
}

interface ChartPoint {
  distance: number;
  percent: number;
  damage: number;
}

interface LabelViewBox {
  x: number;
  y: number;
}

type AttenuationTooltipProps = TooltipContentProps<number, string> & {
  pellets: number | null;
};

// 与 AtkChart 同一套配色：蓝色系列线，zinc 灰度做坐标轴、网格和辅助线
const SERIES_COLOR = "#3b82f6";
const SURFACE_COLOR = "#191919";
const GRID_COLOR = "#3f3f46";
const GUIDE_COLOR = "#71717a";
const TEXT_COLOR = "#a1a1aa";

// 纵轴固定 0% ~ 100%，所有武器共用同一把尺子
const Y_TICKS = [0, 25, 50, 75, 100];
// 横轴刻度步长候选，最多 6 格；结束衰减之后再留 25% 的平台段
const X_TICK_STEPS = [5, 10, 20, 25, 50, 100, 200, 500];
const MAX_X_INTERVALS = 6;
const X_HEADROOM_RATIO = 1.25;

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatNumber(value: number, fractionDigits = 1): string {
  const rounded = Number(value.toFixed(fractionDigits));
  return rounded.toLocaleString("zh-CN", {
    maximumFractionDigits: fractionDigits,
  });
}

function formatMeters(value: number): string {
  return `${formatNumber(value, 1)}m`;
}

function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

function isChartPoint(value: unknown): value is ChartPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.distance === "number" &&
    typeof point.percent === "number" &&
    typeof point.damage === "number"
  );
}

function getScaleAtDistance(
  distance: number,
  begin: number,
  end: number,
  minScale: number,
): number {
  if (distance <= begin) return 1;
  if (distance >= end) return minScale;
  const progress = (distance - begin) / (end - begin);
  return 1 - (1 - minScale) * progress;
}

function getXAxisLayout(end: number): { max: number; ticks: number[] } {
  const raw = Math.max(end * X_HEADROOM_RATIO, 5);
  let step = X_TICK_STEPS[X_TICK_STEPS.length - 1];
  for (const candidate of X_TICK_STEPS) {
    if (Math.ceil(raw / candidate) <= MAX_X_INTERVALS) {
      step = candidate;
      break;
    }
  }
  const max = Math.ceil(raw / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  return { max, ticks };
}

function buildChartData(
  baseDamage: number,
  begin: number,
  end: number,
  minScale: number,
  xMax: number,
): ChartPoint[] {
  // 每米一个采样点，悬停时十字线能贴着任意距离读数；再补上精确的起止点
  const distances = new Set<number>();
  for (let distance = 0; distance <= xMax; distance += 1) {
    distances.add(distance);
  }
  distances.add(xMax);
  distances.add(Number(begin.toFixed(3)));
  distances.add(Number(end.toFixed(3)));

  return [...distances]
    .sort((a, b) => a - b)
    .map((distance) => {
      const scale = getScaleAtDistance(distance, begin, end, minScale);
      return {
        distance,
        percent: scale * 100,
        damage: baseDamage * scale,
      };
    });
}

function getLabelViewBox(props: unknown): LabelViewBox | null {
  if (!props || typeof props !== "object") return null;
  const viewBox = (props as { viewBox?: unknown }).viewBox;
  if (!viewBox || typeof viewBox !== "object") return null;
  const { x, y } = viewBox as { x?: unknown; y?: unknown };
  if (typeof x !== "number" || typeof y !== "number") return null;
  return { x, y };
}

/** 起止距离标签：贴在虚线顶端，文字朝远离衰减区的一侧，避免两个标签相撞 */
function renderDistanceLabel(text: string, side: "left" | "right") {
  const DistanceLabel = (props: unknown) => {
    const viewBox = getLabelViewBox(props);
    if (!viewBox) return <g />;
    const isLeft = side === "left";
    return (
      <text
        x={isLeft ? viewBox.x - 5 : viewBox.x + 5}
        y={viewBox.y - 7}
        fill={TEXT_COLOR}
        fontSize={11}
        textAnchor={isLeft ? "end" : "start"}
      >
        {text}
      </text>
    );
  };
  return DistanceLabel;
}

/** 最低倍率标签：贴在曲线右端；倍率很高时改放线下，避免顶出绘图区 */
function renderFloorLabel(text: string, placeBelow: boolean) {
  const FloorLabel = (props: unknown) => {
    const viewBox = getLabelViewBox(props);
    if (!viewBox) return <g />;
    return (
      <text
        x={viewBox.x - 4}
        y={placeBelow ? viewBox.y + 15 : viewBox.y - 7}
        fill={TEXT_COLOR}
        fontSize={11}
        textAnchor="end"
      >
        {text}
      </text>
    );
  };
  return FloorLabel;
}

function AttenuationTooltip({
  active,
  payload,
  pellets,
}: AttenuationTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  if (!isChartPoint(point)) return null;

  const hasPellets = pellets !== null && pellets > 1;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="text-zinc-400">
        距离 <span className="text-zinc-200">{formatMeters(point.distance)}</span>
      </p>
      <p className="text-zinc-400">
        伤害倍率{" "}
        <span className="text-blue-400">{formatPercent(point.percent)}</span>
      </p>
      <p className="text-zinc-400">
        单发伤害{" "}
        <span className="text-amber-400">
          {formatNumber(point.damage, 1)}
          {hasPellets ? ` x ${pellets}` : ""}
        </span>
      </p>
    </div>
  );
}

export function WeaponAttenuationChart({
  weapon,
  damage,
  begin,
  end,
  scale,
  pellets,
}: WeaponAttenuationChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const baseDamage =
    toNumber(damage) ?? (weapon?.damage?.base ? weapon.damage.base * 500 : null);
  const attenuationBegin = toNumber(begin) ?? toNumber(weapon?.attenuation_begin);
  const attenuationEnd = toNumber(end) ?? toNumber(weapon?.attenuation_end);
  const attenuationScale = toNumber(scale) ?? toNumber(weapon?.attenuation_scale);
  const pelletCount = toNumber(pellets) ?? toNumber(weapon?.pellets);

  const chart = useMemo(() => {
    if (
      baseDamage === null ||
      attenuationBegin === null ||
      attenuationEnd === null ||
      attenuationScale === null ||
      baseDamage <= 0 ||
      attenuationBegin < 0 ||
      attenuationEnd <= attenuationBegin ||
      attenuationScale < 0 ||
      attenuationScale >= 1
    ) {
      return null;
    }

    const { max, ticks } = getXAxisLayout(attenuationEnd);
    return {
      xMax: max,
      xTicks: ticks,
      floorPercent: attenuationScale * 100,
      data: buildChartData(
        baseDamage,
        attenuationBegin,
        attenuationEnd,
        attenuationScale,
        max,
      ),
    };
  }, [baseDamage, attenuationBegin, attenuationEnd, attenuationScale]);

  if (!chart || attenuationBegin === null || attenuationEnd === null) {
    return null;
  }

  const beginLabel = formatMeters(attenuationBegin);
  const endLabel = formatMeters(attenuationEnd);
  const floorLabel = formatPercent(chart.floorPercent);

  return (
    <div className="not-prose my-6 rounded-xl border border-zinc-700/50 p-3 sm:p-4">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <h3 className="text-sm font-semibold text-zinc-300">伤害衰减</h3>
        <p className="text-xs text-zinc-500">
          {beginLabel} 起衰减 · {endLabel} 外为 {floorLabel}
        </p>
      </div>
      <div className="h-52 w-full sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chart.data}
            margin={{ top: 22, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.3} />
                <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal
              vertical={false}
              stroke={GRID_COLOR}
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey="distance"
              type="number"
              domain={[0, chart.xMax]}
              ticks={chart.xTicks}
              tickFormatter={(value) => `${value}m`}
              tick={{ fill: TEXT_COLOR, fontSize: 11 }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={{ stroke: GRID_COLOR }}
            />
            <YAxis
              dataKey="percent"
              type="number"
              domain={[0, 100]}
              ticks={Y_TICKS}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: TEXT_COLOR, fontSize: 11 }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={{ stroke: GRID_COLOR }}
              width={40}
            />
            {/* 衰减区间：淡灰色底带 + 起止虚线 */}
            <ReferenceArea
              x1={attenuationBegin}
              x2={attenuationEnd}
              fill={GUIDE_COLOR}
              fillOpacity={0.12}
              stroke="none"
            />
            <ReferenceLine
              x={attenuationBegin}
              stroke={GUIDE_COLOR}
              strokeDasharray="4 3"
              label={renderDistanceLabel(
                beginLabel,
                attenuationBegin > 0 ? "left" : "right",
              )}
            />
            <ReferenceLine
              x={attenuationEnd}
              stroke={GUIDE_COLOR}
              strokeDasharray="4 3"
              label={renderDistanceLabel(endLabel, "right")}
            />
            <Tooltip
              cursor={{ stroke: GUIDE_COLOR, strokeWidth: 1 }}
              content={(props: TooltipContentProps<number, string>) => (
                <AttenuationTooltip {...props} pellets={pelletCount} />
              )}
            />
            <Area
              type="linear"
              dataKey="percent"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: SERIES_COLOR,
                stroke: SURFACE_COLOR,
                strokeWidth: 2,
              }}
              isAnimationActive={false}
            />
            {/* 最低倍率：直接标在曲线右端 */}
            <ReferenceDot
              x={chart.xMax}
              y={chart.floorPercent}
              r={0}
              fill="none"
              stroke="none"
              label={renderFloorLabel(floorLabel, chart.floorPercent > 85)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const AttenuationChart = WeaponAttenuationChart;
