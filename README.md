# 逆战未来 维基

[![GitHub Pages](https://github.com/qiekn/nzm-wiki/actions/workflows/deploy.yml/badge.svg)](https://github.com/qiekn/nzm-wiki/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-passing-brightgreen?logo=cloudflare)](https://nzm-wiki.pages.dev)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code%20Opus%204.6-blueviolet?logo=anthropic)](https://claude.ai/code)

在线访问：[GitHub Pages](https://qiekn.github.io/nzm-wiki) | [Cloudflare Pages](https://nzm-wiki.pages.dev)

技术栈: React, Next.js, TypeScript, Tailwind CSS, [MDX](https://mdxjs.com/)

其他玩家的 Fork

- https://lostlightll.github.io/nzm-wiki/


## 特性

### 搜索面板

按 `Ctrl/Cmd + p` 或点击搜索框打开搜索面板，支持：
- 拼音搜索（全拼、首字母缩写）
- 模糊匹配
- 键盘导航（↑↓ 选择，Enter 跳转，Esc 关闭）

### 命令面板

按 `Ctrl/Cmd + Shift + p` 打开命令面板，可快速执行：
- 打开计算器
- 跳转到 Github 文件页面 (只在 MDX 页面生效，方便快速修改)

### 悬浮计算器

PC 浏览器可以自由拖动，支持：
- 基础运算：`+ - * / ^ ()`
- 百分号：`25%` → `0.25`
- 中文变量：`攻击力 = 500`
- 公式变量：变量存储公式，引用时自动重新计算
- 循环引用检测

命令：
- `clear` / `cl` - 清屏（保留变量）
- `reset` - 清屏并清空变量
- `show <变量名>` - 查看公式定义
- `help` - 显示帮助
- `exit` / `quit` / `q` - 关闭

示例：
```
> 基础伤害 200
> 伤害倍率 0.8
> 最终伤害 = 基础伤害 * 伤害倍率
> 最终伤害 = 160
> 基础伤害 100
> 最终伤害 = 80    # 自动重新计算
```

## 开发指南

安装依赖：

```bash
pnpm i
```

启动开发服务器：

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看网站。

打开 [http://localhost:3000/editor](http://localhost:3000/editor) 使用一个内置编辑器编辑 MDX 文件 (另外本地开发环境下，也就是启用 `pnpm dev` 服务器时，可以在 MDX 页面上使用命令面板，快速跳转的该文件的内置编辑器编辑页面)。

<img alt="editor-preview" src="https://github.com/user-attachments/assets/f9a7e58f-d30f-4907-8895-667c28a406fb" />

### 注意事项

添加或修改 MDX 文件后，下面命令可以手动重新生成搜索索引（`pnpm build` 和 `pnpm dev` 时都是会自动执行的，仅当你手动添加了新文件又要开发环境下使用搜索面板搜索的时候才需要手动执行以下）：

```bash
pnpm index
```

添加新图片后，需要转换为 webp 格式 (png 原图会保留，下面的命令会在 `/public/webp` 下存放所有的压缩后的 webp 格式，为了加快加载速度)：

```bash
pnpm webp
```

## 可用于 MDX 文档的 React 组件

<details>
<summary>点击展开组件文档</summary>

### Frontmatter

MDX 文件支持以下 frontmatter 字段：

| 字段         | 类型                 | 默认值 | 说明                   |
| :---         | :---                 | :---   | :---                   |
| `title`      | string               | -       | 页面标题                              |
| `tag`        | string               | -       | 分类标签                              |
| `toc`        | boolean              | `true`  | 是否显示目录                          |
| `draft`      | boolean              | `false` | 草稿模式（仅 dev 可见，build 时排除） |
| `page-width` | string               | `lg`    | 页面宽度                              |
| `keywords`   | string 或者 string[] | -       | 自定义额外的搜索关键词                |
| `nickname`   | string               | -       | 别名（用于搜索）                      |

`page-width` 可选值：

| 值     | Tailwind class | 宽度   |
| :---   | :---           | :---   |
| `sm`   | max-w-xl       | 576px  |
| `md`   | max-w-2xl      | 672px  |
| `lg`   | max-w-3xl      | 768px  |
| `xl`   | max-w-4xl      | 896px  |
| `2xl`  | max-w-5xl      | 1024px |
| `3xl`  | max-w-6xl      | 1152px |
| `full` | max-w-7xl      | 1280px |

也支持自定义宽度值（如 `1200px`、`80rem`），移动端会自动撑满屏幕。

搜索会自动索引：`title`、`keywords`、`nickname`、`tags`、`weapon_type`、`element`、`rarity`、`tag` 等字段。

### Callout

```mdx
<Callout>默认灰色提示</Callout>
<Callout color="blue">蓝色提示</Callout>
<Callout color="green">绿色提示</Callout>
<Callout color="yellow">黄色提示</Callout>
<Callout color="red">红色提示</Callout>
<Callout color="purple">紫色提示</Callout>
```

### Highlight

```mdx
<Highlight>默认 sunny 黄色高亮</Highlight>
<Highlight color="sunny">sunny - #faeb7b</Highlight>
<Highlight color="peach">peach - #f6c9b6</Highlight>
<Highlight color="cyan">cyan - #bee2dc</Highlight>
<Highlight color="violet">violet - #b8bcfa</Highlight>
<Highlight color="magenta">magenta - #e9b5fa</Highlight>
<Highlight color="hazy">hazy - #d3d3d3</Highlight>
```

### Text Color

```mdx
<Red>Red - #cf5148</Red>
<Yellow>Yellow - #cb9434</Yellow>
<Green>Green - #50946e</Green>
<Grey>Grey - #7d7a75</Grey>
<Orange>Orange - #d27b2d</Orange>
<Brown>Brown - #9f765a</Brown>
<Blue>Blue - #387dc9</Blue>
<Purple>Purple - #9a6bb4</Purple>
<Pink>Pink - #c14c8a</Pink>
```

```mdx
<Fire>Fire - #f8c618</Fire>
<Ice>Ice - #90f5ff</Ice>
<Shock>Shock - #a09eff</Shock>
<Corrosive>Corrosive - #c3db2a</Corrosive>
<Kinetic>Kinetic - #becacc</Kinetic>
```

### VideoGif

以类似 GIF 的方式展示 mp4 视频（自动播放、循环、静音、无控制栏）。视频文件放在 `public/videos/` 目录下。

```mdx
<VideoGif src="/videos/snake-god-slash.mp4" />
<VideoGif src="/videos/demo.mp4" alt="技能演示" width={400} />
```

| 属性    | 类型   | 必填 | 说明                          |
| :---    | :---   | :--- | :---                          |
| `src`   | string | 是   | mp4 路径，如 `"/videos/xxx.mp4"` |
| `alt`   | string | 否   | 无障碍描述                    |
| `width` | number | 否   | 视频宽度（px）                |

### Credit

致谢来源卡片，通常放在页面末尾。

```mdx
<Credit platform="bilibili" author="逆战未来" url="https://www.bilibili.com/video/BV1x4QgBKEoR" title="BV1x4QgBKEoR" />
<Credit platform="douyin" author="逆战未来" url="https://v.douyin.com/mv1-Ieg5xjQ/" title="mv1-Ieg5xjQ" />
<Credit author="某作者" url="https://example.com" title="参考文章" />
```

| 属性       | 类型   | 默认值   | 说明                   |
| :---       | :---   | :---     | :---                   |
| `platform` | string | `"link"` | 平台                   |
| `author`   | string | -        | 作者名                 |
| `url`      | string | -        | 链接地址               |
| `title`    | string | -        | 标题（显示在作者名旁） |

`platform` 可选：`bilibili`, `youtube`, `twitter`, `github`, `douyin`, `tieba`, `link`

### LevelTable

带等级色条的表格，用于展示陷阱/技能的等级数据。等级 1-4 分别有不同颜色标识。数据支持 `"400x3=1200"` 格式，会自动将 `x` 转换为 `×`。

```mdx
<LevelTable
  headers={["等级", "伤害", "冷却", "DPS"]}
  data={[
    [1, "400×3=1200", "5.5秒", 218],
    [2, "480×3=1440", "2.5秒", 576],
    [3, "600×3=1800", "2.5秒", 720],
    [4, "720×3=2160", "2.5秒", 864],
  ]}
/>
```

| 属性      | 类型                  | 说明                            |
| :---      | :---                  | :---                            |
| `headers` | string[]              | 表头                            |
| `data`    | (string\|number)[][] | 行数据，第一列为等级（1-4）     |

### DataTable

通用数据表格，支持图标列、对齐方式和 `**加粗**` 高亮。

```mdx
<DataTable
  headers={["元素类型", "最多层数", "效果", "持续时间"]}
  align={["left", "center", "left", "left"]}
  data={[
    { icon: "/icons/elements/fire.png", cells: ["火焰(灼烧)", 5, "每 **2** 秒承受 **10 × 层数** 的伤害", "每 **2** 秒衰减 **1** 层"] },
    { icon: "/icons/elements/cryo.png", cells: ["寒冷(冰缓)", 3, "移速逐级降低", "**10** 秒未刷新直接消失"] },
  ]}
/>
```

| 属性       | 类型                                | 默认值 | 说明                  |
| :---       | :---                                | :---   | :---                  |
| `headers`  | string[]                            | -      | 表头                  |
| `align`    | `("left"\|"center"\|"right")[]`     | -      | 各列对齐方式          |
| `nowrap`   | number[]                            | -      | 不换行的列索引        |
| `iconSize` | number                              | 24     | 图标尺寸（px）        |
| `data`     | RowData[]                           | -      | 行数据                |

RowData 格式：
- 简单行 `CellValue[]` — 直接是每列的值
- 带图标行 `{ icon: string, cells: CellValue[] }` — icon 在最左列显示

CellValue 为 `string | number | ReactNode`。字符串中 `**text**` 会自动高亮。

### WeaponSkill / ActiveSkill / PassiveSkill

武器技能展示组件。`WeaponSkill` 是外层容器，内部放 `ActiveSkill` 和 `PassiveSkill`。

```mdx
<WeaponSkill>
  <ActiveSkill
    name="飓龙连击"
    icon="/icons/weapons/skills/T_Weapon_Skill_20003000011_2.png"
    duration={-1}
    cooldown={25}
    count={1}
  >
    技能描述文字
  </ActiveSkill>
  <PassiveSkill
    name="炙热龙炎"
    tag="快速连发"
    icon="/icons/weapons/skills/T_Weapon_Skill_20003000011_1.png"
  >
    被动技能描述
  </PassiveSkill>
</WeaponSkill>
```

ActiveSkill 属性：

| 属性       | 类型      | 说明                          |
| :---       | :---      | :---                          |
| `name`     | string    | 技能名称                      |
| `icon`     | string    | 图标路径                      |
| `duration` | number    | 持续时间（秒），-1 表示无限   |
| `cooldown` | number    | 冷却时间（秒）                |
| `count`    | number    | 可累积次数                    |
| `children` | ReactNode | 技能描述                      |

PassiveSkill 属性同 ActiveSkill，额外支持 `tag`（自定义标签文字，如"快速连发"）。

### BossCard / BossCardGrid

Boss 卡片组件。`BossCard` 通过 `title` 属性匹配 boss 数据自动渲染卡片。`BossCardGrid` 是网格容器。

```mdx
<BossCardGrid>
  <BossCard title="金牌打手" />
  <BossCard title="Z博士" />
  <BossCard title="变异Z博士" />
</BossCardGrid>
```

| 属性    | 类型   | 说明                       |
| :---    | :---   | :---                       |
| `title` | string | Boss 名称（匹配数据源）    |

### BuffCard / BuffCardGrid / CardRef / BuffDetail

Buff/Debuff 卡片系统，数据来自 `data/cards-data.json`。

```mdx
<BuffCardGrid defaultSize={140}>
  <CardRef slug="element-invasion" />
  <CardRef slug="weak-point-boost" />
  <CardRef slug="easy-toughness" />
</BuffCardGrid>
```

`CardRef` 属性：

| 属性   | 类型   | 说明                                |
| :---   | :---   | :---                                |
| `slug` | string | 卡片的 slug（对应 cards-data.json） |

`BuffCardGrid` 属性：

| 属性          | 类型      | 说明              |
| :---          | :---      | :---              |
| `defaultSize` | number    | 卡片默认尺寸（px） |
| `children`    | ReactNode | CardRef 列表      |

`BuffDetail` 属性（单独展示某个 buff/debuff 详情）：

| 属性       | 类型              | 说明           |
| :---       | :---              | :---           |
| `name`     | string            | 名称           |
| `icon`     | string            | 图标路径       |
| `type`     | `"buff"\|"debuff"` | 类型           |
| `effect`   | string            | 效果描述       |
| `children` | ReactNode         | 详细说明       |

### 无属性工具组件

直接使用，无需传参：

```mdx
<AtkChart />          {/* 武器攻击力强化等级 / 消耗折线图 */}
<WeaponAttenuationChart /> {/* 当前武器伤害衰减图 */}
<CritCalculator />    {/* 暴击期望计算器（含概率坍缩机制） */}
<DamageCalculator />  {/* 武器伤害计算器 */}
<PeekabooGrid />      {/* 捉迷藏物品图鉴网格 */}
```

</details>

## 脚本

解码 CG：
```bash
python3 ./scripts/convert.py "/e/games/WeGameApps/rail_apps/逆战：未来(2002130)/NZM/Content/Movies"
```

解包 Pak：
```bash
./scripts/decrypt.sh NZM/Content/AIBehavior/
```

更多详细介绍 [BV1fVfXB8EkT](https://www.bilibili.com/video/BV1fVfXB8EkT)

## 更多内容

更多关于逆战未来的内容，见 https://qiekn.notion.site/nzm (我的一些随手笔记，类似于草稿纸)
