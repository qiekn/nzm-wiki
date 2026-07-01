import type { ElementType, WeaponType } from "@/types";

// 精灵图配置
export interface SpriteConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  sheet: "common" | "hud" | "weapon_type";
  rotated?: boolean; // 精灵图中是否旋转存储（顺时针90度）
}

// 元素类型图标坐标 (common.png = T_Common_0_0.png)
// 坐标来自 ElementConfigDataTable → PaperSprite BakedSourceUV
export const ELEMENT_SPRITES: Record<ElementType, SpriteConfig> = {
  火焰: { x: 1865, y: 1423, width: 96, height: 96, sheet: "common" },
  寒冷: { x: 1965, y: 1423, width: 96, height: 96, sheet: "common" },
  电弧: { x: 1365, y: 1723, width: 96, height: 96, sheet: "common" },
  腐蚀: { x: 1365, y: 1623, width: 96, height: 96, sheet: "common" },
  物理: { x: 1365, y: 1523, width: 96, height: 96, sheet: "common" },
};

// 武器属性图标坐标 (common.png = T_Common_0_0.png)
// 坐标来自 WeaponAttrList.json → PaperSprite BakedSourceUV
export const STAT_SPRITES: Record<string, SpriteConfig> = {
  damage:               { x: 1105, y: 379, width: 96, height: 96, sheet: "common" },  // 单发伤害 (gjjg_01)
  fireRate:             { x: 1584, y: 644, width: 96, height: 97, sheet: "common" },  // 射速 (gjjg_10)
  reloadTime:           { x: 1788, y: 539, width: 96, height: 97, sheet: "common" },  // 换弹时间 (gjjg_15)
  weaknessMultiplier:   { x: 1470, y: 452, width: 96, height: 97, sheet: "common" },  // 弱点伤害 (gjjg_12)
  magazine:             { x: 1584, y: 543, width: 96, height: 97, sheet: "common" },  // 弹夹 (gjjg_08)
  totalAmmo:            { x: 1584, y: 442, width: 96, height: 97, sheet: "common" },  // 总弹量 (gjjg_07)
  explosionRange:       { x: 1205, y: 479, width: 96, height: 96, sheet: "common" },  // 爆炸范围 (gjjg_24)
  accuracy:             { x: 873,  y: 612, width: 96, height: 96, sheet: "common" },  // 精准度 (gjjg_09)
  hitRate:              { x: 1688, y: 640, width: 96, height: 97, sheet: "common" },  // 射击命中率 (gjjg_05)
  weakpointHitRate:     { x: 873,  y: 612, width: 96, height: 96, sheet: "common" },  // 弱点命中率 (gjjg_09)
  stability:            { x: 1205, y: 379, width: 96, height: 96, sheet: "common" },  // 稳定度 (gjjg_02)
  range:                { x: 1305, y: 379, width: 96, height: 96, sheet: "common" },  // 射程 (gjjg_03)
  lightAttack:          { x: 1470, y: 654, width: 96, height: 97, sheet: "common" },  // 轻击伤害 (gjjg_14)
  heavyAttack:          { x: 1105, y: 479, width: 96, height: 96, sheet: "common" },  // 重击伤害 (gjjg_16)
  crit:                 { x: 1265, y: 1523, width: 96, height: 96, sheet: "common" }, // 暴击 (Hunter_boss_damege)
};

// 武器类型图标坐标 (weapon_type.png, 748x1659)
// 坐标来自 UE PaperSprite 的 BakedSourceUV / BakedSourceDimension
// rotated=true 表示精灵图中宽高互换（顺时针旋转90度存储）
export const WEAPON_TYPE_SPRITES: Record<WeaponType, SpriteConfig> = {
  喷射器:     { x: 1, y: 1,    width: 438, height: 148, sheet: "weapon_type" },            // Blaster
  机枪:       { x: 1, y: 151,  width: 438, height: 148, sheet: "weapon_type" },            // MG
  连发榴弹:   { x: 1, y: 301,  width: 438, height: 148, sheet: "weapon_type" },            // MultiGrenade
  手枪:       { x: 1, y: 451,  width: 438, height: 148, sheet: "weapon_type" },            // Pistol
  突击步枪:   { x: 1, y: 601,  width: 438, height: 148, sheet: "weapon_type" },            // Rifle
  霰弹枪:     { x: 1, y: 751,  width: 438, height: 148, sheet: "weapon_type" },            // ShotGun
  单发榴弹:   { x: 1, y: 901,  width: 438, height: 148, sheet: "weapon_type" },            // SingleGrenade
  冲锋枪:     { x: 1, y: 1051, width: 438, height: 148, sheet: "weapon_type" },            // SMG
  狙击步枪:   { x: 1, y: 1201, width: 438, height: 148, sheet: "weapon_type" },            // Sniper
  弓箭:       { x: 441, y: 1,    width: 438, height: 148, sheet: "weapon_type", rotated: true }, // Bow
  射手步枪:   { x: 441, y: 441,  width: 438, height: 148, sheet: "weapon_type", rotated: true }, // DMR
  火箭发射器: { x: 441, y: 881,  width: 438, height: 148, sheet: "weapon_type", rotated: true }, // Launcher
  近战武器:   { x: 591, y: 881,  width: 438, height: 148, sheet: "weapon_type", rotated: true }, // Melee
  暗器:       { x: 1, y: 1351,  width: 438, height: 148, sheet: "weapon_type" },                // Throwing — 来自玄凌飞刃图标
  激光武器:   { x: 1, y: 1501,  width: 438, height: 148, sheet: "weapon_type" },                // Laser — 来自浪里白条图标
};

// 武器槽位图标（复用武器类型精灵）
export const WEAPON_SLOT_SPRITES: Record<string, SpriteConfig> = {
  主武器:   WEAPON_TYPE_SPRITES["突击步枪"],   // Rifle
  副武器:   WEAPON_TYPE_SPRITES["手枪"],       // Pistol
  近战武器: { x: 591, y: 881, width: 438, height: 148, sheet: "weapon_type", rotated: true }, // Melee
};

// 精灵图路径
export const SPRITE_SHEETS = {
  common: "/spritesheets/common.png",
  hud: "/spritesheets/hud.png",
  weapon_type: "/spritesheets/weapon_type.png",
} as const;
