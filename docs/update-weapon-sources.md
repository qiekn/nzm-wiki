# update-weapon 数据来源

`scripts/update-weapon.ts` 顶部的 `EXPORT_CONTENT_DIR` 默认指向 `refs/Exports/NZM/Content`。用户给的 `NZM/Content/...` 路径在仓库里按这个目录解析。

脚本默认 dry-run，不写文件、不复制图片。用法：`pnpm exec tsx scripts/update-weapon.ts 飓风之龙 幽冥毒皇`。加 `--write` 才落盘并复制武器图片/技能图片。武器名必须精确匹配中文名；输入错误时脚本会报错并提示相近候选。指定武器的 MDX 不存在时，脚本会按官方数据创建 `data/weapons/{武器名}.mdx`；已存在时默认只补缺失/空值，不覆盖已填写字段；加 `--overwrite` 才覆盖脚本负责的 frontmatter 字段。正文内容始终保留。`reload_time` 使用游戏内显示规则：`WeaponChangeClipTimeBase + WeaponChangeClipEndToFireTime` 后向上取整。

## 主键链路

| 数据 | 来源 | Key / 关联方式 | 处理 |
| :--- | :--- | :--- | :--- |
| wiki 武器页 | `data/weapons/*.mdx` | frontmatter `prototype_id`，缺失时用 `title` | 每个 MDX 独立处理 |
| 武器配置行 | `DataTables/WeaponPrototypeConfig.json` | 优先 `row.PrototypeID === prototype_id`，同 ID 优先 `Mode === 0` | 取得 `PrototypeID`、`ASCTypeID`、`NumericalID`、`ActiveSkillID`、`WeaponType` |
| ASC 属性行 | `Attributes/AutoGenerate/attr_weapon_asc.json` | `Rows[ASCTypeID]`，fallback 到行内 `ASCTypeID` | 取得射速、弹药、弹丸、衰减 |
| 伤害数值行 | `DataTables/numerical_config_equip.json` | `${WeaponPrototypeConfig.NumericalID}_1` | 取得伤害、弱点、暴击、护盾、元素异常、破刃类型 |
| 物品行 | `DataTables/WeaponItemTable.json` | `row.ModelID === PrototypeID` | 取得物品 `ItemID` 和名称 fallback |
| 通用物品行 | `DataTables/System/Items/CommonItemDataTable.json` | `Rows[WeaponItemTable.ItemID]` | 取得显示名、稀有度、官方图标 AssetPath |

## 字段来源

| wiki 字段 / 数据 | 来源字段 | 转换 |
| :--- | :--- | :--- |
| 武器名称 | `CommonItemDataTable.Name.LocalizedString`，fallback `WeaponItemTable.WeaponName` / `WeaponPrototypeConfig.Rows` key | 写 `title` |
| key / PrototypeID | `WeaponPrototypeConfig.PrototypeID` | 写 `prototype_id` |
| `weapon_type_id` | `WeaponPrototypeConfig.WeaponType` | 直接写入 |
| `weapon_type` | `WeaponPrototypeConfig.WeaponType` | 脚本内数字映射到中文类型 |
| `active_skill_id` | `WeaponPrototypeConfig.ActiveSkillID` | 直接写入 |
| `asc_type_id` | `WeaponPrototypeConfig.ASCTypeID` | 直接写入 |
| `element` | `numerical_config_equip.ElementType` | Unreal enum 映射到 `物理/火焰/寒冷/电弧/腐蚀` |
| `rarity` | `CommonItemDataTable.Quality` | `2 -> 稀有`，`3 -> 史诗`，`4 -> 传说` |
| `scope` | `LuaDataTable/WeaponItemConfigTable.Weapon_Scope.LocalizedString` | 直接写入 |
| 武器图片 | `CommonItemDataTable.IconPath.LargeIcon`，fallback `NormalIcon` | `--write` 时从 `refs/Exports/NZM/Content/UI/UI_Textures/...` 复制到 `public/icons/weapons/large/{title}.png` |
| 单发伤害 | `numerical_config_equip.HpCalScale` | 写 `damage.base`；页面是否展示成整数由前端/文案决定 |
| pulse / impulse | `numerical_config_equip.ImpulseBase` | 写 `damage.impulse` |
| toughness | `numerical_config_equip.ToughnessBase` | 写 `damage.toughness` |
| flesh | `numerical_config_equip.FleshDamageBase` | 写 `damage.flesh` |
| hurtable | `numerical_config_equip.HurtableBase` | 写 `damage.hurtable` |
| 霰弹枪弹丸数 | `attr_weapon_asc.SplinterNum` | 写 `pellets`；非霰弹也保留原表数值 |
| 弱点倍率 | `numerical_config_equip.WeaknessDamageAddScale` | `1 + WeaknessDamageAddScale`，写 `weekness_multiplier`；`EnableWeaknessDamage` false 时写 `null` |
| 射速 | `attr_weapon_asc.FireIntervalBase` | 写 `fire_interval`；页面用 `60 / fire_interval` 算 RPM |
| 弹夹容量 | `attr_weapon_asc.ClipAmmoCountBase` | 写 `magazine` |
| 总弹容量 | `attr_weapon_asc.MaxAmmoCount` | 写 `total_ammo` |
| 精准度 | `DataTables/Weapon/WeaponRecoilScoreTable.WeaponAccuracy` | 直接写 `accuracy`；fallback `LuaDataTable/WeaponItemConfigTable.AccuracyInt` |
| 稳定度 | `DataTables/Weapon/WeaponRecoilScoreTable.WeaponStability` | 直接写 `stability`；fallback `LuaDataTable/WeaponItemConfigTable.StabilityInt` |
| 换弹时间 | `WeaponFeelParamTable.WeaponChangeClipTimeBase` + `WeaponChangeClipEndToFireTime`，用 `LuaDataTable/WeaponItemConfigTable.WeaponMODConfigID` 连接 | 按游戏内显示向上取整，写 `reload_time`；实际可开火时间通常只需要 `WeaponChangeClipTimeBase` 跑完 |
| 开始衰减距离 | `attr_weapon_asc.DistanceBeginAttenuationBase` | 除以 `100`，厘米转米，写 `attenuation_begin` |
| 结束衰减距离 | `attr_weapon_asc.DistanceEndAttenuationBase` | 除以 `100`，厘米转米，写 `attenuation_end` |
| 最小伤害系数 | `attr_weapon_asc.AttenuationMinScale` | 写 `attenuation_scale` |
| 每米衰减多少伤害 | 由 `attenuation_begin/end/scale` 推导 | `(1 - attenuation_scale) / (attenuation_end - attenuation_begin)`；不写 frontmatter |
| 破刃/破韧类型 | `numerical_config_equip.ToughnessDamageType` | enum 映射，写 `toughness_type` |
| 是否可以暴击 | `numerical_config_equip.bEnableCriticalDamage` | 写 `enable_critical` |
| 是否无视护盾 | `numerical_config_equip.bDamageIgnoreShield` | 写 `ignore_shield` |
| 元素异常概率 | `numerical_config_equip.ElementAddRate` | 写 `element_add_rate` |

## 技能来源

| 技能数据 | 来源 | Key / 关联方式 | 处理 |
| :--- | :--- | :--- | :--- |
| 主动技能 ID | `WeaponPrototypeConfig.ActiveSkillID` | 见主键链路 | 写 `active_skill_id` |
| 主动技能冷却 | `DataTables/SkillConfigTable_Weapon_PVE.json` | `${ActiveSkillID}_1` | `ChargeNeedTime` 写 `skill_cooldown` |
| 主动技能次数 | `SkillConfigTable_Weapon_PVE.SkillCount` | `${ActiveSkillID}_1` | dry-run 报告，暂不改正文组件 |
| 主动技能持续时间 | `SkillConfigTable_Weapon_PVE.Parameters` | `Tags` 含 `EffectDuration` 或 `SummonerDuration` | dry-run 报告，暂不改正文组件 |
| 主动技能名称/描述 | `DataTables/Ability/SkillDesConfig_Skill.json` | `Rows[ActiveSkillID]` | dry-run 报告，模板变量仍需人工处理 |
| 主动技能图片 | `DataTables/GPSkillIconResourceDataTable.json` | `Rows[ActiveSkillID].ActiveIcon.AssetPathName` | `--write` 时复制到 `public/icons/weapons/skills/{asset}.png` |
| 被动技能名称/描述/图片 | `DataTables/MGE/DT_GPMGESkillDesConfig_Weapon.json` | `MGEIcon.AssetPathName` 包含 `T_Weapon_Skill_{PrototypeID}` | dry-run 报告所有匹配被动；`--write` 时复制图标到 `public/icons/weapons/skills/{asset}.png`；不依赖不稳定 MGE key 推导 |
| 技能标签 | `WeaponPrototypeConfig.WeaponMechanismTags` | Unreal tag 字符串 | 脚本内做常见中文映射，仅报告，不自动覆盖 `tags` |

## 换弹时间说明

`WeaponFeelParamTable` 中：

- `WeaponChangeClipTimeBase` 是实际换弹动作时间，跑完后基本可以射击。
- `WeaponChangeClipEndToFireTime` 是换弹后的后摇/到可开火间隔。
- wiki 的 `reload_time` 先和游戏内显示统一，使用 `Math.ceil(WeaponChangeClipTimeBase + WeaponChangeClipEndToFireTime)`。

## 已确认样本

- `飓风之龙`: `PrototypeID 20003000011 -> ASCTypeID 143 -> NumericalID 120300110`。
- `attr_weapon_asc.143`: `FireIntervalBase 0.33`，`SplinterNum 6`，`DistanceBeginAttenuationBase 1000 -> 10m`，`DistanceEndAttenuationBase 2000 -> 20m`，`AttenuationMinScale 0.3`。
- `numerical_config_equip.120300110_1`: `HpCalScale 0.11`，`ImpulseBase 1`，`ToughnessBase 1`，`FleshDamageBase 0.8`，`HurtableBase 0.8`，`WeaknessDamageAddScale 0.2 -> 1.2`，`ElementAddRate 0.06`。
- `Weapon/WeaponRecoilScoreTable.20003000011`: `WeaponAccuracy 59`，`WeaponStability 64`。
## 图片复制

Unreal `AssetPathName` 会按 `/Game/.../Asset.Asset` 转换为 `refs/Exports/NZM/Content/.../Asset.png`。

- 武器图目标：`public/icons/weapons/large/{武器中文名}.png`。
- 技能图目标：`public/icons/weapons/skills/{资源名}.png`。
- dry-run 只报告 `sourcePath` 和 `webPath`，不复制。
- `--write` 会创建目标目录并覆盖复制；找不到源图时汇总为 `missing-source` 并返回失败码。
## 已存在文件和新建文件

- 不加 `--write` 永远只是 dry-run。
- 指定的武器 MDX 不存在时，脚本从 `WeaponPrototypeConfig.json` 等官方表提取数据，创建最小 MDX frontmatter 和空正文。
- 指定的武器 MDX 已存在时，默认 `fill-missing`：只写入缺失字段、`null`、空字符串或空数组；已有人工填写值不覆盖。
- 加 `--overwrite` 时才按官方数据覆盖脚本负责的 frontmatter 字段。
- 无论是否 `--overwrite`，脚本不重写正文、不删除无关 frontmatter 字段。