import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { pinyin } from "pinyin-pro";

interface SearchItem {
  title: string;
  slug: string;
  path: string;
  category: string;
  keywords: string[];
  pinyin: string[];  // 预计算的拼音
}

const baseDir = path.join(process.cwd(), "data");

// 分类映射
const categoryMap: Record<string, string> = {
  weapons: "武器",
  perks: "特性",
  traps: "陷阱",
  "enemies/lc/boss": "首领",
  "enemies/td": "塔防敌人",
  cards: "卡牌",
  posts: "文章",
};

// 路径映射（用于生成实际的访问路径）
const pathMap: Record<string, string> = {
  weapons: "/weapons",
  perks: "/perks",
  traps: "/traps",
  "enemies/lc/boss": "/enemies/lc",
  "enemies/td": "/enemies/td",
  cards: "/cards",
  posts: "/posts",
};

function scanDirectory(dirPath: string, relativePath: string = ""): SearchItem[] {
  const results: SearchItem[] = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // 路由组目录（以括号开头）不包含在 slug 中
      if (entry.name.startsWith("(")) {
        results.push(...scanDirectory(fullPath, relativePath));
      } else {
        const currentRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        results.push(...scanDirectory(fullPath, currentRelativePath));
      }
    } else if (entry.name.endsWith(".mdx")) {
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(fileContent);

      // draft 文章不加入搜索索引
      if (data.draft) continue;

      const fileName = entry.name.replace(/\.mdx$/, "");
      const slug = relativePath ? `${relativePath}/${fileName}` : fileName;

      // 确定分类
      let category = "其他";
      let urlPath = "";

      for (const [prefix, cat] of Object.entries(categoryMap)) {
        if (slug.startsWith(prefix)) {
          category = cat;
          break;
        }
      }

      // 确定 URL 路径
      for (const [prefix, p] of Object.entries(pathMap)) {
        if (slug.startsWith(prefix)) {
          const remainder = slug.slice(prefix.length);
          urlPath = p + remainder;
          break;
        }
      }

      if (!urlPath) {
        urlPath = `/${slug}`;
      }

      // 收集关键词
      const keywords: string[] = [];

      // 添加文件名作为关键词
      keywords.push(fileName);

      // 添加 title
      if (data.title) {
        keywords.push(data.title);
      }

      // 添加 nickname（陷阱、敌人等有此字段）
      if (data.nickname) {
        keywords.push(data.nickname);
      }

      // 添加自定义 keywords 字段
      if (data.keywords) {
        if (Array.isArray(data.keywords)) {
          keywords.push(...data.keywords);
        } else if (typeof data.keywords === "string") {
          keywords.push(data.keywords);
        }
      }

      // 添加 tags（武器有此字段）
      if (data.tags && Array.isArray(data.tags)) {
        keywords.push(...data.tags);
      }

      // 添加 weapon_type
      if (data.weapon_type) {
        keywords.push(data.weapon_type);
      }

      // 添加 element
      if (data.element) {
        keywords.push(data.element);
      }

      // 添加 rarity
      if (data.rarity) {
        keywords.push(data.rarity);
      }

      // 添加 tag（文章有此字段）
      if (data.tag) {
        if (Array.isArray(data.tag)) {
          keywords.push(...data.tag);
        } else {
          keywords.push(data.tag);
        }
      }

      // 生成拼音索引（全拼和首字母）
      const allText = [data.title || fileName, ...keywords].filter(Boolean);
      const pinyinSet = new Set<string>();
      for (const text of allText) {
        // 全拼
        const fullPinyin = pinyin(String(text), { toneType: "none", type: "array" }).join("");
        if (fullPinyin) pinyinSet.add(fullPinyin.toLowerCase());
        // 首字母
        const initials = pinyin(String(text), { pattern: "first", toneType: "none", type: "array" }).join("");
        if (initials) pinyinSet.add(initials.toLowerCase());
      }

      results.push({
        title: data.title || fileName,
        slug,
        path: urlPath,
        category,
        keywords: [...new Set(keywords.filter(Boolean).map(String))],
        pinyin: [...pinyinSet],
      });
    }
  }

  return results;
}

function generateSearchIndex() {
  console.log("Generating search index...");

  const items = scanDirectory(baseDir);

  // 按分类排序
  items.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category, "zh-CN");
    }
    return a.title.localeCompare(b.title, "zh-CN");
  });

  const outputPath = path.join(process.cwd(), "public", "search-index.json");

  // 确保目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), "utf-8");

  console.log(`Generated search index with ${items.length} items`);
  console.log(`Output: ${outputPath}`);
}

generateSearchIndex();
generateWeaponStats();

function generateWeaponStats() {
  console.log("Generating weapon stats...");

  const weaponsDir = path.join(baseDir, "weapons");
  if (!fs.existsSync(weaponsDir)) {
    console.log("No weapons directory found, skipping.");
    return;
  }

  const files = fs.readdirSync(weaponsDir).filter((f) => f.endsWith(".mdx"));

  interface WeaponStat {
    title: string;
    use_type: string | null;
    weapon_type: string | null;
    element: string | null;
    rarity: string | null;
    damage_base: number | null;
    weekness_multiplier: number | null;
    fire_interval: number | null;
    magazine: number | null;
    reload_time: number | null;
    attenuation_begin: number | null;
    attenuation_end: number | null;
    attenuation_scale: number | null;
    enable_critical: boolean | null;
    pinyin: string[];
  }

  const weapons: WeaponStat[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(weaponsDir, file), "utf-8");
    const { data } = matter(content);

    const title = data.title || file.replace(/\.mdx$/, "");

    // 过滤近战武器
    if (data.use_type === "近战武器") continue;

    // 拼音
    const pinyinSet = new Set<string>();
    const fullPy = pinyin(String(title), { toneType: "none", type: "array" }).join("");
    if (fullPy) pinyinSet.add(fullPy.toLowerCase());
    const initials = pinyin(String(title), { pattern: "first", toneType: "none", type: "array" }).join("");
    if (initials) pinyinSet.add(initials.toLowerCase());

    weapons.push({
      title,
      use_type: data.use_type || null,
      weapon_type: data.weapon_type || null,
      element: data.element || null,
      rarity: data.rarity || null,
      damage_base: data.damage?.base ?? null,
      weekness_multiplier: typeof data.weekness_multiplier === "number" ? data.weekness_multiplier : null,
      fire_interval: typeof data.fire_interval === "number" ? data.fire_interval : null,
      magazine: typeof data.magazine === "number" ? data.magazine : null,
      reload_time: typeof data.reload_time === "number" ? data.reload_time : null,
      attenuation_begin: typeof data.attenuation_begin === "number" ? data.attenuation_begin : null,
      attenuation_end: typeof data.attenuation_end === "number" ? data.attenuation_end : null,
      attenuation_scale: typeof data.attenuation_scale === "number" ? data.attenuation_scale : null,
      enable_critical: data.enable_critical ?? null,
      pinyin: [...pinyinSet],
    });
  }

  weapons.sort((a, b) => {
    // 一级：稀有度降序（传说 > 史诗 > 稀有）
    const rarityOrder: Record<string, number> = { "传说": 3, "史诗": 2, "稀有": 1 };
    const ra = rarityOrder[a.rarity ?? ""] ?? 0;
    const rb = rarityOrder[b.rarity ?? ""] ?? 0;
    if (ra !== rb) return rb - ra;
    // 二级：use_type 主武器优先
    const ua = a.use_type === "主武器" ? 0 : 1;
    const ub = b.use_type === "主武器" ? 0 : 1;
    if (ua !== ub) return ua - ub;
    // 三级：中文名排序
    return a.title.localeCompare(b.title, "zh-CN");
  });

  const outputPath = path.join(process.cwd(), "public", "weapon-stats.json");
  fs.writeFileSync(outputPath, JSON.stringify(weapons, null, 2), "utf-8");

  console.log(`Generated weapon stats with ${weapons.length} items`);
  console.log(`Output: ${outputPath}`);
}
