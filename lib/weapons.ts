import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Weapon } from "@/types";
import { RARITY_ORDER } from "@/constants/common";
import { WEAPON_TYPES } from "@/constants/weapons";

const WEAPONS_DIR = path.join(process.cwd(), "data/weapons");
const isDev = process.env.NODE_ENV === "development";
const WEAPON_TYPE_ORDER = new Map(WEAPON_TYPES.map((item, index) => [item.type, index]));

/**
 * 从 MDX frontmatter 获取所有武器数据
 */
export async function getAllWeapons(): Promise<Weapon[]> {
  if (!fs.existsSync(WEAPONS_DIR)) {
    console.warn(`Weapons directory not found: ${WEAPONS_DIR}`);
    return [];
  }

  const files = fs.readdirSync(WEAPONS_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const filePath = path.join(WEAPONS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(content);
      const slug = file.replace(/\.mdx$/, "");

      return {
        slug,
        ...data,
      } as Weapon;
    })
    .filter((w) => !w.draft || isDev)
    .sort((a, b) => {
      const rarityA = a.rarity ? RARITY_ORDER[a.rarity] : 0;
      const rarityB = b.rarity ? RARITY_ORDER[b.rarity] : 0;
      if (rarityA !== rarityB) return rarityB - rarityA;

      const typeA = a.weapon_type ? WEAPON_TYPE_ORDER.get(a.weapon_type) ?? 99 : 99;
      const typeB = b.weapon_type ? WEAPON_TYPE_ORDER.get(b.weapon_type) ?? 99 : 99;
      if (typeA !== typeB) return typeA - typeB;

      return a.title.localeCompare(b.title, "zh-CN");
    });
}

/**
 * 根据 slug 获取单个武器数据
 */
export async function getWeaponBySlug(slug: string): Promise<Weapon | null> {
  const decodedSlug = decodeURIComponent(slug);
  const filePath = path.join(WEAPONS_DIR, `${decodedSlug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const { data } = matter(content);

  return {
    slug: decodedSlug,
    ...data,
  } as Weapon;
}
