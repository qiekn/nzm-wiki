import type { WeaponType } from "@/types";
import { ELEMENT_COLORS } from "./common";
import { WEAPON_TYPE_SPRITES, WEAPON_SLOT_SPRITES, type SpriteConfig } from "./sprites";

export { ELEMENT_COLORS };
export { RARITY_OPTIONS, RARITY_BG_COLORS } from "./common";

export type WeaponSlot = "主武器" | "副武器" | "近战武器";

export const WEAPON_SLOTS: { type: WeaponSlot; sprite: SpriteConfig }[] = [
  { type: "主武器", sprite: WEAPON_SLOT_SPRITES["主武器"] },
  { type: "副武器", sprite: WEAPON_SLOT_SPRITES["副武器"] },
  { type: "近战武器", sprite: WEAPON_SLOT_SPRITES["近战武器"] },
];

export const WEAPON_TYPES: { type: WeaponType; icon: string; sprite: SpriteConfig }[] = [
  { type: "突击步枪", icon: "", sprite: WEAPON_TYPE_SPRITES["突击步枪"] },
  { type: "狙击步枪", icon: "", sprite: WEAPON_TYPE_SPRITES["狙击步枪"] },
  { type: "霰弹枪", icon: "", sprite: WEAPON_TYPE_SPRITES["霰弹枪"] },
  { type: "火箭发射器", icon: "", sprite: WEAPON_TYPE_SPRITES["火箭发射器"] },
  { type: "冲锋枪", icon: "", sprite: WEAPON_TYPE_SPRITES["冲锋枪"] },
  { type: "机枪", icon: "", sprite: WEAPON_TYPE_SPRITES["机枪"] },
  { type: "手枪", icon: "", sprite: WEAPON_TYPE_SPRITES["手枪"] },
  { type: "单发榴弹", icon: "", sprite: WEAPON_TYPE_SPRITES["单发榴弹"] },
  { type: "弓箭", icon: "", sprite: WEAPON_TYPE_SPRITES["弓箭"] },
  { type: "射手步枪", icon: "", sprite: WEAPON_TYPE_SPRITES["射手步枪"] },
  { type: "连发榴弹", icon: "", sprite: WEAPON_TYPE_SPRITES["连发榴弹"] },
  { type: "喷射器", icon: "", sprite: WEAPON_TYPE_SPRITES["喷射器"] },
  { type: "暗器", icon: "", sprite: WEAPON_TYPE_SPRITES["暗器"] },
  { type: "激光武器", icon: "", sprite: WEAPON_TYPE_SPRITES["激光武器"] },
];

export const ELEMENT_TYPES: { type: keyof typeof ELEMENT_COLORS; iconSrc: string; color: string }[] = [
  { type: "火焰", iconSrc: "/icons/elements/fire.png", color: ELEMENT_COLORS["火焰"] },
  { type: "寒冷", iconSrc: "/icons/elements/cryo.png", color: ELEMENT_COLORS["寒冷"] },
  { type: "电弧", iconSrc: "/icons/elements/shock.png", color: ELEMENT_COLORS["电弧"] },
  { type: "腐蚀", iconSrc: "/icons/elements/corossive.png", color: ELEMENT_COLORS["腐蚀"] },
  { type: "物理", iconSrc: "/icons/elements/kinetic.png", color: ELEMENT_COLORS["物理"] },
];
