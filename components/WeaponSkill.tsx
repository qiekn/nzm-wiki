import React from "react";
import Image from "next/image";
import { getAssetPath } from "@/lib/path";

// 外层容器
export function WeaponSkill({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose flex flex-col px-8 py-2 bg-[#1e1f20] rounded-xl border border-white/5 shadow-lg my-6">
      {children}
    </div>
  );
}

// 内部基础组件
interface BaseSkillProps {
  name: string;
  tag?: string;
  tagColor?: string;
  icon: string;
  duration?: number;
  cooldown?: number;
  count?: number;
  children?: React.ReactNode;
}

function SkillMeta({
  duration,
  cooldown,
  count,
}: {
  duration?: number;
  cooldown?: number;
  count?: number;
}) {
  const items: { label: string; value: string }[] = [];

  if (duration != null && duration > 0) {
    items.push({ label: "持续", value: `${duration}秒` });
  }
  if (cooldown != null && cooldown > 0) {
    items.push({ label: "冷却", value: `${cooldown}秒` });
  }
  if (count != null && count > 1) {
    items.push({ label: "可累积", value: `${count}次` });
  }

  if (items.length === 0) return null;

  return (
    <>
      {items.map((item) => (
        <span
          key={item.label}
          className="text-[12px] px-2 py-0.5 rounded-sm font-bold tracking-wider flex items-center justify-center bg-[#30393e] text-slate-300"
        >
          {item.label} <span className="text-slate-300">{item.value}</span>
        </span>
      ))}
    </>
  );
}

function BaseSkillItem({
  name,
  tag,
  tagColor,
  icon,
  duration,
  cooldown,
  count,
  children,
}: BaseSkillProps) {
  return (
    <div className="flex items-start gap-6 border-b border-white/6 py-6 last:border-0">
      {/* 技能图标 */}
      <div className="shrink-0 w-16 h-16 relative mt-1">
        <Image
          src={getAssetPath(icon)}
          alt={name}
          fill
          className="object-contain drop-shadow-md"
        />
      </div>

      {/* 技能信息 */}
      <div className="flex flex-col grow">
        {/* 标题栏 */}
        <div className="flex items-center gap-3 mb-3.5 flex-wrap">
          {/* 左侧竖线装饰 */}
          <div className="w-0.75 h-4.5 bg-gray-200 rounded-full shadow-sm"></div>

          <h3 className="text-[20px] font-bold text-gray-50 leading-none tracking-wide">
            {name}
          </h3>

          {/* 技能标签 */}
          {tag && (
            <span
              className={`text-[12px] px-2 py-0.5 rounded-sm font-bold tracking-wider flex items-center justify-center ${tagColor}`}
            >
              {tag}
            </span>
          )}

          {/* 技能参数 */}
          <SkillMeta duration={duration} cooldown={cooldown} count={count} />
        </div>

        {/* 技能描述 */}
        <div className="text-slate-400 text-[16px] leading-[1.7] pr-4">
          {children || "技能描述信息(待更新)"}
        </div>
      </div>
    </div>
  );
}

// 技能组件 (暴露给 MDX 使用)

// 主动技能
export function ActiveSkill(props: Omit<BaseSkillProps, "tagColor" | "tag">) {
  return (
    <BaseSkillItem
      tag="主动技能"
      tagColor="bg-[#30393e] text-slate-300"
      {...props}
    />
  );
}

// 被动技能
export function PassiveSkill(props: Omit<BaseSkillProps, "tagColor">) {
  return (
    <BaseSkillItem
      // tag="被动技能"
      // tagColor="bg-[#30393e] text-slate-300"
      {...props}
      tag={undefined}
    />
  );
}
