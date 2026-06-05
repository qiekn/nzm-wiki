用户会提供一个或多个武器名称: $ARGUMENTS
如果没有参数则检查所有武器。武器 MDX 在 data/weapons/，跳过近战武器（只有被动无主动）。

所有数据表路径相对于 `refs/Exports/NZM/Content/DataTables/`

## 核心原则

- **全部并行、ID 拼接**：多把武器的 ID 用 `|` 拼接成一条 pattern，每个数据源只查一次
- **少取上下文**：`-A 15` 够，不要 `-A 50+`
- **不死磕模板变量**：`{GPModifier:...}`、`{GPNumericalID:...}` 等无法从 json 解析的，直接 `??` 占位
- **保留原 MDX 已填数值**：若 MDX 原有数值（如 `200%`、`60%`），描述替换后保留，不写成 `??`

## Step 1: 查基础 ID（1 次 Grep）

```
Grep WeaponPrototypeConfig.json
pattern: "武器1":|"武器2":|...
-A 8
```

取 PrototypeID、ActiveSkillID。weapon_type_id = PrototypeID 第 3-4 位去前导零（如 20019000001 → 19）。

## Step 2: 并行发起全部数据查询（同一条消息 4 个 Grep）

**权威源说明**（这些是实际工作的源，不是 Main 合并表）:

| 数据 | 文件 | Key |
|---|---|---|
| 主动冷却/参数 | `SkillConfigTable_Weapon_PVE.json` | `{SkillID}_1` |
| 主动图标 | `GPSkillIconResourceDataTable.json` | `{SkillID}` |
| 主动名称+描述 | `Ability/SkillDesConfig_Skill.json` | `{SkillID}` |
| 被动（名称/描述/图标） | `MGE/DT_GPMGESkillDesConfig_Weapon.json` | 以 `T_Weapon_Skill_{PrototypeID}` 图标路径为锚 |

### 四个并行查询

1. **主动参数**
   - pattern: `"{S1}_1":|"{S2}_1":|...`
   - `-A 20`
   - 提取: `ChargeNeedTime`（cooldown）、`SkillCount`（count）、`Parameters` 中 Tag 含 `EffectDuration` / `SummonerDuration` 的字段（BuffDuration/FieldDuration/LifeTime 等）为 duration；都没则 -1

2. **主动图标**
   - pattern: `"{S1}":|"{S2}":|...`
   - `-A 5`
   - 提取: `ActiveIcon.AssetPathName`
   - 路径含 `/ActiveSkills/` → 主动；含 `/Normal/...._2` → 主动；其余同理

3. **主动名称+描述**
   - pattern: `"{S1}":|"{S2}":|...`
   - `-A 20`
   - 提取: `SkillName.LocalizedString`、`SkillDescription.LocalizedString`

4. **被动**
   - pattern: `T_Weapon_Skill_{P1}[\._"]|T_Weapon_Skill_{P2}[\._"]|...`（以图标路径做锚）
   - `-B 20 -A 2`（从图标向上找同一条记录的 MGEName、MGEDescription）
   - 提取: `MGEName.LocalizedString`、`MGEDescription.LocalizedString`、`MGEIcon.AssetPathName`

## Step 3: 图标复制（1 次 Bash，批量）

**命名约定（必须遵守）**：
- 主动图标：`T_Weapon_Skill_{XXX}_2.png`
- 被动图标：`T_Weapon_Skill_{XXX}_1.png`
- 源已带 `_1`/`_2` 后缀 → 保持后缀
- 源不带后缀 → 按上表加后缀

源路径映射：
- `AssetPathName` 含 `/ActiveSkills/T_xxx` → 来源 `refs/.../WeaponSkill/ActiveSkills/T_xxx.png`
- `AssetPathName` 含 `/Normal/T_xxx_1` → 来源 `refs/.../WeaponSkill/Normal/T_xxx_1.png`
- `AssetPathName` 含 `/Normal/T_xxx`（无后缀，被动） → 来源 `refs/.../WeaponSkill/Normal/T_xxx.png`

目标全部写入 `public/icons/weapons/skills/`。

用一条 `cp ... && cp ... && ...` 把所有图标复制完。

## Step 4: 模板变量处理（简化）

**直接用 `??` 占位**的：
- `{GPModifier:ID:BaseValue:...}` — 蓝图属性，数据表查不到
- `{GPNumericalID:ID:HpCalScale:...}` / `{GPNUMERICALID:...}` — 同上
- `{Buff:...}`、`{Passive:...}`、`{Ability:...}` — 除非 MDX 原有值，否则 `??`

**可以解析**的：
- Skill Parameters（Step 2.1 已取到，如 BuffDuration 用于 duration）

**MDX 语法警告**：`{` 在 MDX 中是 JSX 表达式，**描述文本绝不能出现未转义的大括号**。必须把 `{...}` 模板替换成 `??` 或数值。

## Step 5: 并行写入 MDX

### 保留原有数值

若原 MDX 描述已填数值（`200%`、`60%`、`34%`、`176%` 等），**替换时保留**。这些是已人工校验的值。

### front-matter（scope 后、damage 前）

缺失则添加：
- `weapon_type_id: {从 PrototypeID 提取}`
- `prototype_id: '{PrototypeID}'`（带引号保字符串）
- `active_skill_id: {SkillID}`

若 `skill_cooldown` 与查到的 ChargeNeedTime 不同，同步更新。

### WeaponSkill 组件

```mdx
<WeaponSkill>
  <ActiveSkill
    name="技能名"
    icon="/icons/weapons/skills/T_Weapon_Skill_XXX_2.png"
    duration={69,105}
    cooldown={69,105}
    count={1}
  >
    技能描述，数值用 <Yellow>值</Yellow> 包裹。
  </ActiveSkill>

  <PassiveSkill
    name="被动名"
    icon="/icons/weapons/skills/T_Weapon_Skill_XXX_1.png"
  >
    被动描述，数值用 <Yellow>值</Yellow> 包裹，关键词用 <Blue>词</Blue> 包裹。
  </PassiveSkill>
</WeaponSkill>
```

描述文本转换：
- `<qiangdiao>值</>` → `<Yellow>值</Yellow>`
- `<T002>关键词</>` → `<Blue>关键词</Blue>`
- 去掉末尾 `\n`

## 已知坑

- `DT_GPMGESkillDesConfigTable_Main.json` 是合并视图但不完整，**不要查它**，直接查上表中的专门文件
- `GPActiveSkillDataTable.json` 里的 `CooldownDuration` 有时为 0 或与实际不符，**以 `SkillConfigTable_Weapon_PVE.json.ChargeNeedTime` 为准**
- 主/被动图标可能同名但在不同文件夹（`ActiveSkills/` vs `Normal/`），**必须加 `_1`/`_2` 区分**
- 被动 MGE Key 的命名规律不稳定（如玄凌飞刃 20019000001 → `1019010001_1` 不是 `1019001001_1`），不要靠推导 Key，直接按图标路径锚定
