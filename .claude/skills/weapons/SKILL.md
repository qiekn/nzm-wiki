---
name: weapons
description: "nzm-wiki 武器数据维护指南。用于修改 data/weapons/*.mdx、武器类型、武器图鉴排序、射速/射击间隔、换弹时间、伤害字段，以及从 refs/Exports/NZM/Content 下的官方 JSON 表提取武器配置。"
---

# 武器数据维护

## 基本约定

- 武器 MDX 数据在 `data/weapons/*.mdx`。
- `NZM/Content/...` 路径在本项目中对应 `refs/Exports/NZM/Content/...`。
- 不要存手写射速字段 `file_rate`。武器单发耗时存 `fire_interval`。
- 页面显示射速时用 `60 / fire_interval` 计算每分钟射速。
- 显示数字时，整数显示整数，小数显示小数点后一位。
- 近战武器通常不显示射速，保持 `fire_interval: null`，除非用户明确要求写入。

## 射速设计

武器数据层只保存射击间隔：

```yaml
fire_interval: 0.3
```

展示层再计算射速：

```ts
rpm = 60 / fire_interval
```

相关代码位置：

- `types/index.ts`：`Weapon.fire_interval`
- `constants/schema.ts`：编辑器字段顺序和字段类型
- `components/WeaponCard.tsx`：射速展示
- `components/DamageCalculator.tsx`：套用武器数据时把 `fire_interval` 转成 RPM
- `scripts/generate-search-index.ts`：生成 `public/weapon-stats.json` 时输出 `fire_interval`

不要从旧的 `file_rate` 反推 `fire_interval`，除非用户明确要求临时迁移。官方数据可用时必须以官方 JSON 为准。

## ASC 属性提取

提取 `fire_interval`、弹夹容量和总备弹数前，先检查这些文件是否存在：

```text
refs/Exports/NZM/Content/DataTables/WeaponPrototypeConfig.json
refs/Exports/NZM/Content/Attributes/AutoGenerate/attr_weapon_asc.json
```

如果缺任意文件，停止提取并提示用户缺少哪些 JSON 文件，让用户重新导出或放到项目对应目录。不要猜测、不要用手写射速补数据。

可选文件：

```text
refs/Exports/NZM/Content/DataTables/WeaponFeelParamTable.json
```

该文件用于后坐力、换弹等手感参数；如果任务只涉及 `fire_interval`，它不是必需文件。

提取流程：

1. 读取武器 MDX frontmatter 的 `prototype_id`。
2. 在 `WeaponPrototypeConfig.json` 中按 `PrototypeID` 查找行。
3. 如果同一个 `PrototypeID` 有多行，优先选择 `Mode === 0` 的行；否则选择第一条有 `ASCTypeID` 的行。
4. 读取选中行的 `ASCTypeID`。
5. 在 `attr_weapon_asc.json` 中按 `ASCTypeID` 查找行。
6. 从 ASC 行读取字段并写入 MDX：
   - `FireIntervalBase` -> `fire_interval`
   - `ClipAmmoCountBase` -> `magazine`
   - `MaxAmmoCount` -> `total_ammo`
7. 找不到 `PrototypeID`、`ASCTypeID`、`FireIntervalBase`、`ClipAmmoCountBase` 或 `MaxAmmoCount` 时，不要静默跳过；汇总并报告给用户。

例子：死神猎手通过 `WeaponPrototypeConfig.json` 查到 `ASCTypeID: "239"`，再在 `attr_weapon_asc.json` 查 `239` 这一行；其中 `ClipAmmoCountBase` 是弹夹容量，`MaxAmmoCount` 是总备弹数。

JSON 表常见结构是：

```ts
const rows = Array.isArray(data) ? data[0]?.Rows : data.Rows;
```

`attr_weapon_asc.json` 可能既以行 key 表示 ASC ID，也可能在行内有 `ASCTypeID` 字段。实现时同时支持这两种索引方式。

## 数据更新规则

- 批量更新前先 dry-run，输出将变化的武器数量、样例、缺失项。
- 写回时只改相关 frontmatter 字段，避免重排整个 MDX。
- 保留用户已有的无关改动，不要回滚。
- 写回后确认：
  - `data/weapons` 中没有 `file_rate`
  - 非近战武器的 `fire_interval`、`magazine`、`total_ammo` 与官方 ASC 表一致
  - 近战武器按需求保持 `fire_interval: null`

## 验证

常用验证命令：

```bash
pnpm index
pnpm exec eslint components/WeaponCard.tsx components/DamageCalculator.tsx scripts/generate-search-index.ts constants/schema.ts types/index.ts lib/weapons.ts
```

如果只改数据，至少运行 `pnpm index`，并抽查 `public/weapon-stats.json` 是否包含 `fire_interval` 且不包含 `file_rate`。
