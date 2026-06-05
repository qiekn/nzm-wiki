// ============================================================
// 武器 Schema
// ============================================================

// 1. 定义字段在编辑器中的显示顺序 (及保存顺序)
export const FIELD_ORDER = [
  "title",
  "use_type",
  "weapon_type",
  "element",
  "rarity",
  "tags",
  "scope",
  // 核心数值放在中间
  "damage",
  "toughness_type",
  "enable_critical",
  "weekness_multiplier",
  // 基础属性
  "file_rate",
  "magazine",
  "total_ammo",
  "accuracy",
  "stability",
  "reload_time",
  "range",
  "explosion_range",
  "ignore_shield",
  "element_add_rate",
  "skill_cooldown",
  "pellets",
];

// 2. 定义字段类型 (告诉前端渲染什么组件)
export const FIELD_TYPES: Record<string, string> = {
  // Boolean 开关
  enable_critical: "boolean",
  ignore_shield: "boolean",

  // 数组 (Tags 输入框)
  tags: "array",

  // 复杂对象 (5个数值输入框)
  damage: "damage_object",

  // 下拉菜单 (Select) - 必须在这里标记为 'select'
  rarity: "select",
  use_type: "select",
  weapon_type: "select",
  element: "select",
  scope: "select",
  toughness_type: "select", // 确保这里也是 select

  // 纯数字输入
  weekness_multiplier: "number",
  file_rate: "number",
  magazine: "number",
  total_ammo: "number",
  accuracy: "number",
  stability: "number",
  reload_time: "number",
  range: "number",
  explosion_range: "number",
  element_add_rate: "number",
  skill_cooldown: "number",
  pellets: "number",
};

// 3. 定义下拉菜单的具体选项 (你的最新定义)
export const FIELD_OPTIONS: Record<string, string[]> = {
  rarity: ["稀有", "史诗", "传说"],
  use_type: ["主武器", "副武器", "近战武器"],
  weapon_type: [
    "突击步枪",
    "狙击步枪",
    "霰弹枪",
    "火箭发射器",
    "冲锋枪",
    "机枪",
    "手枪",
    "单发榴弹",
    "弓箭",
    "射手步枪",
    "连发榴弹",
    "喷射器",
    "暗器",
    "激光武器",
  ],
  element: ["物理", "火焰", "寒冷", "电弧", "腐蚀"],
  scope: ["不可开镜", "低倍镜", "中倍镜", "高倍镜"],
  toughness_type: ["冲击", "贯穿", "爆炸"],
  trap_type: ["地面", "墙壁", "天花板"],
  position: ["地面", "墙壁", "天花板"],
  type: ["normal", "elite", "boss"],
};

// ============================================================
// 陷阱 Schema
// ============================================================

export const TRAP_FIELD_ORDER = [
  "title",
  "position",
  "attack",
  "range",
  "hp",
  "price",
  "area",
  "description",
];

export const TRAP_FIELD_TYPES: Record<string, string> = {
  position: "select",
  attack: "number",
  range: "number",
  hp: "number",
  price: "number",
  // area 是文本类型 (如 1x1, 2x2, 4x4, 2x4)
};

// ============================================================
// 塔防敌人 Schema
// ============================================================

export const TD_ENEMY_FIELD_ORDER = [
  "title",
  "nickname",
  "type",
  "attack",
  "hp",
  "weight",
  "speed",
  "description",
];

export const TD_ENEMY_FIELD_TYPES: Record<string, string> = {
  type: "select",
  attack: "number",
  hp: "number",
  weight: "number",
  speed: "number",
};

// ============================================================
// 插件 Schema
// ============================================================

export const PERK_FIELD_ORDER = [
  "title",
  "id",
  "slot",
  "rarity",
  "icon",
  "weaponType",
  "description",
];

export const PERK_FIELD_TYPES: Record<string, string> = {
  slot: "number",
  rarity: "number",
};

// ============================================================
// 根据路径获取 schema
// ============================================================

export function getSchemaForPath(path: string) {
  if (path.includes("traps/") || path.includes("traps\\")) {
    return {
      fieldOrder: TRAP_FIELD_ORDER,
      fieldTypes: { ...TRAP_FIELD_TYPES },
      fieldOptions: FIELD_OPTIONS,
    };
  }
  if (path.includes("enemies/td/") || path.includes("enemies\\td\\")) {
    return {
      fieldOrder: TD_ENEMY_FIELD_ORDER,
      fieldTypes: { ...TD_ENEMY_FIELD_TYPES },
      fieldOptions: FIELD_OPTIONS,
    };
  }
  if (path.includes("perks/") || path.includes("perks\\")) {
    return {
      fieldOrder: PERK_FIELD_ORDER,
      fieldTypes: { ...PERK_FIELD_TYPES },
      fieldOptions: FIELD_OPTIONS,
    };
  }
  // 默认武器 schema
  return {
    fieldOrder: FIELD_ORDER,
    fieldTypes: FIELD_TYPES,
    fieldOptions: FIELD_OPTIONS,
  };
}
