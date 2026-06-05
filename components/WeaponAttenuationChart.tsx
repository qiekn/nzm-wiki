"use client";

import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  damage: number;
  percent: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  pellets: number | null;
}

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

function formatPercent(value: number): string {
  return `${formatNumber(value, 1)}%`;
}

function isChartPoint(value: unknown): value is ChartPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as Record<string, unknown>;
  return (
    typeof point.distance === "number" &&
    typeof point.damage === "number" &&
    typeof point.percent === "number"
  );
}

function getScaleAtDistance(distance: number, begin: number, end: number, minScale: number): number {
  if (distance <= begin) return 1;
  if (distance >= end) return minScale;
  const progress = (distance - begin) / (end - begin);
  return 1 - (1 - minScale) * progress;
}

function getChartMax(end: number): number {
  return Math.max(5, Math.ceil((end + 5) / 5) * 5);
}

function getTicks(max: number): number[] {
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += 5) {
    ticks.push(value);
  }
  return ticks;
}

function buildChartData(baseDamage: number, begin: number, end: number, minScale: number): ChartPoint[] {
  const maxDistance = getChartMax(end);
  const distances = new Set<number>(getTicks(maxDistance));
  distances.add(Number(begin.toFixed(3)));
  distances.add(Number(end.toFixed(3)));

  return [...distances]
    .sort((a, b) => a - b)
    .map((distance) => {
      const scaleAtDistance = getScaleAtDistance(distance, begin, end, minScale);
      return {
        distance,
        damage: baseDamage * scaleAtDistance,
        percent: scaleAtDistance * 100,
      };
    });
}

function CustomTooltip({
  active,
  payload,
  pellets,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  if (!isChartPoint(data)) return null;

  const hasPellets = pellets !== null && pellets > 1;

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm shadow-lg">
      <p className="text-zinc-400">
        距离 <span className="text-zinc-200">{formatNumber(data.distance, 1)}m</span>
      </p>
      <p className="text-zinc-400">
        伤害{" "}
        <span className="text-sky-400">
          {formatNumber(data.damage, 1)}
          {hasPellets ? ` x ${pellets}` : ""}
        </span>
      </p>
      <p className="text-zinc-400">
        百分比 <span className="text-amber-400">{formatPercent(data.percent)}</span>
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

  const baseDamage = toNumber(damage) ?? (weapon?.damage?.base ? weapon.damage.base * 500 : null);
  const attenuationBegin = toNumber(begin) ?? toNumber(weapon?.attenuation_begin);
  const attenuationEnd = toNumber(end) ?? toNumber(weapon?.attenuation_end);
  const attenuationScale = toNumber(scale) ?? toNumber(weapon?.attenuation_scale);
  const pelletCount = toNumber(pellets) ?? toNumber(weapon?.pellets);

  const chartData = useMemo(() => {
    if (
      baseDamage === null ||
      attenuationBegin === null ||
      attenuationEnd === null ||
      attenuationScale === null ||
      baseDamage <= 0 ||
      attenuationEnd <= attenuationBegin ||
      attenuationScale >= 1
    ) {
      return null;
    }

    return buildChartData(baseDamage, attenuationBegin, attenuationEnd, attenuationScale);
  }, [baseDamage, attenuationBegin, attenuationEnd, attenuationScale]);

  if (!chartData || attenuationBegin === null || attenuationEnd === null) {
    return null;
  }

  const xMax = getChartMax(attenuationEnd);
  const minDamage = chartData.reduce((min, point) => Math.min(min, point.damage), Infinity);
  const maxDamage = chartData.reduce((max, point) => Math.max(max, point.damage), 0);

  return (
    <div className="not-prose my-6 h-72 w-full rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-3 sm:h-80 sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="distance"
            type="number"
            domain={[0, xMax]}
            ticks={getTicks(xMax)}
            interval="preserveStartEnd"
            tickFormatter={(value) => `${value}m`}
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={{ stroke: "#3f3f46" }}
          />
          <YAxis
            dataKey="damage"
            type="number"
            domain={[Math.max(0, Math.floor(minDamage * 0.9)), Math.ceil(maxDamage * 1.05)]}
            tickFormatter={(value) => formatNumber(Number(value), 0)}
            stroke="#71717a"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={{ stroke: "#3f3f46" }}
            width={42}
          />
          <ReferenceLine x={attenuationBegin} stroke="#52525b" strokeDasharray="4 4" />
          <ReferenceLine x={attenuationEnd} stroke="#52525b" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => (
              <CustomTooltip active={active} payload={payload} pellets={pelletCount} />
            )}
          />
          <Area
            type="linear"
            dataKey="damage"
            stroke="#38bdf8"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: "#38bdf8", stroke: "#0369a1", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export const AttenuationChart = WeaponAttenuationChart;
