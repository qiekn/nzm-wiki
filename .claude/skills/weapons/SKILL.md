---
name: weapons
description: "nzm-wiki 武器数据维护指南。用于修改 data/weapons/*.mdx、武器类型、图鉴排序、射击间隔、换弹时间、伤害字段、ASCTypeID、武器衰减字段，以及从 refs/Exports/NZM/Content 下的官方 JSON 表提取武器配置。"
---

# 武器数据维护

## 基本约定

- 武器 MDX 数据在 `data/weapons/*.mdx`。
- 用户给出的 `NZM/Content/...` 路径在本项目中对应 `refs/Exports/NZM/Content/...`。
- 不要保存手写射速字段 `file_rate`。武器单发耗时存 `fire_interval`。
- 页面显示射速时用 `60 / fire_interval` 计算每分钟射速。
- 显示数字时，整数显示整数，小数显示小数点后一位。
- 近战武器通常不显示射速，保持 `fire_interval: null`，除非用户明确要求写入。
- 批量更新前先 dry-run，输出将变化的武器数量、样例和缺失项。
- 写回时只改相关 frontmatter 字段，避免重排整个 MDX。
- 保留用户已有的无关改动，不要回滚。

## 射速设计

武器数据层只保存射击间隔：

```yaml
fire_interval: 0.3
```

展示层再计算射速：

```ts
rpm = 60 / fire_interval;
```

相关代码位置：

- `types/index.ts`: `Weapon.fire_interval`
- `constants/schema.ts`: 编辑器字段顺序和字段类型
- `components/WeaponCard.tsx`: 射速展示
- `components/DamageCalculator.tsx`: 套用武器数据时把 `fire_interval` 转成 RPM
- `scripts/generate-search-index.ts`: 生成 `public/weapon-stats.json` 时输出 `fire_interval`

不要从旧的 `file_rate` 反推 `fire_interval`，除非用户明确要求临时迁移。官方数据可用时必须以官方 JSON 为准。

## ASC 属性提取

提取 `fire_interval`、弹夹容量、总备弹数、`asc_type_id` 和武器衰减前，先检查这些文件是否存在：

```text
refs/Exports/NZM/Content/DataTables/WeaponPrototypeConfig.json
refs/Exports/NZM/Content/Attributes/AutoGenerate/attr_weapon_asc.json
```

如果缺任意文件，停止提取并提示用户缺少哪个 JSON 文件，让用户重新导出或放到项目对应目录。不要猜测，不要用手写数据补。

可选文件：

```text
refs/Exports/NZM/Content/DataTables/WeaponFeelParamTable.json
```

该文件用于后坐力、换弹等手感参数；如果任务只涉及 `fire_interval` 或衰减，它不是必需文件。

JSON 表常见结构是：

```ts
const rows = Array.isArray(data) ? data[0]?.Rows : data.Rows;
```

`WeaponPrototypeConfig.json` 的 `Rows` 通常以武器中文名为 key，不是以 `PrototypeID` 为 key。优先遍历 `Rows`，用 `row.PrototypeID === frontmatter.prototype_id` 查找；也可以用 MDX 的 `title` 或文件名对应的中文名直接匹配 `Rows` key，作为 fallback 或交叉校验。

提取流程：

1. 读取武器 MDX frontmatter 的 `prototype_id`。
2. 在 `WeaponPrototypeConfig.json` 中优先按 `PrototypeID` 查找行；如果缺少 `prototype_id` 或匹配失败，再按武器中文名匹配 `Rows` key。
3. 如果同一个 `PrototypeID` 有多行，优先选择 `Mode === 0` 的行；否则选择第一条有 `ASCTypeID` 的行。按中文名匹配时，如果该行的 `PrototypeID` 与 MDX 中已有 `prototype_id` 冲突，停止并报告，不要静默覆盖。
4. 读取选中行的 `ASCTypeID`，并写入 MDX 的 `asc_type_id`。
5. 在 `attr_weapon_asc.json` 中按 `ASCTypeID` 查找行。既支持 row key 是 ASC ID，也支持行内字段 `ASCTypeID`。
6. 从 ASC 行读取字段并写入 MDX：
   - `FireIntervalBase` -> `fire_interval`
   - `ClipAmmoCountBase` -> `magazine`
   - `MaxAmmoCount` -> `total_ammo`
   - `DistanceBeginAttenuationBase / 100` -> `attenuation_begin`
   - `DistanceEndAttenuationBase / 100` -> `attenuation_end`
   - `AttenuationMinScale` -> `attenuation_scale`
7. 找不到 `PrototypeID`、`ASCTypeID`、ASC 行或需要的字段时，不要静默跳过；汇总并报告给用户。

注意：

- 不要把 `weapon_type_id` 当成 `ASCTypeID`。`ASCTypeID` 只能来自 `WeaponPrototypeConfig.json` 的匹配行。
- 中文名查找只能用于匹配 `WeaponPrototypeConfig.json` 的 `Rows` key，得到的仍然是该行里的 `ASCTypeID`；不要直接拿中文名去查 `attr_weapon_asc.json`。
- 结束衰减字段是 `DistanceEndAttenuationBase`，不要使用不存在或含义不明的 `DistanceMinScaleBase`。
- `DistanceBeginAttenuationBase` 和 `DistanceEndAttenuationBase` 都要除以 100，单位才是米。
- `AttenuationMinScale` 是最小伤害系数，直接写入 `attenuation_scale`。
- 衰减速率展示由前端根据开始、结束、系数计算，MDX 不额外存展示字符串。

例子：飓风之龙的 `prototype_id` 是 `20003000011`，在 `WeaponPrototypeConfig.json` 查到 `ASCTypeID: "143"`，再到 `attr_weapon_asc.json` 查 `143`。该 ASC 行中 `DistanceBeginAttenuationBase: 1000`、`DistanceEndAttenuationBase: 2000`、`AttenuationMinScale: 0.3`，所以 MDX 写入 `attenuation_begin: 10`、`attenuation_end: 20`、`attenuation_scale: 0.3`。

## 数据更新规则

- 批量更新前先 dry-run，输出将变化的武器数量、样例和缺失项。
- 写回时只改相关 frontmatter 字段，避免重排整个 MDX。
- 保留用户已有的无关改动，不要回滚。
- 写回后确认：
  - `data/weapons` 中没有 `file_rate`
  - 非近战武器的 `fire_interval`、`magazine`、`total_ammo` 与官方 ASC 表一致
  - 有衰减数据的武器包含 `asc_type_id`、`attenuation_begin`、`attenuation_end`、`attenuation_scale`
  - `public/weapon-stats.json` 同步输出 `asc_type_id` 和衰减字段
  - 近战武器按需求保持 `fire_interval: null`

## 验证

常用验证命令：

```bash
pnpm index
pnpm exec eslint components/WeaponCard.tsx components/DamageCalculator.tsx scripts/generate-search-index.ts constants/schema.ts types/index.ts lib/weapons.ts
```

如果只改数据，至少运行 `pnpm index`，并抽查 `public/weapon-stats.json` 是否包含 `asc_type_id`、`attenuation_begin`、`attenuation_end`、`attenuation_scale`，且不包含 `file_rate`。
