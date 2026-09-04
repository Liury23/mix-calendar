# Mix Calendar

English | [中文](#中文说明)

A calendar widget for [Obsidian](https://obsidian.md) combining the Gregorian and Lunar (Chinese) calendars with 5 levels of periodic notes, task tracking, and holiday support. It merges the ideas of [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) and [Chinese Calendar](https://github.com/devil-tamachan/obsidian-chinese-calendar) into one view.

## Features

### Calendar views
- **Month view** — classic month grid with ISO week numbers, lunar dates, festivals, and holiday/workday badges
- **Year view** — 4 quarters × 3 months layout; open or create monthly, quarterly, and yearly notes
- **Selection highlight** and nav-button tooltips

### Lunar calendar & holidays
- **Lunar dates**, the 24 solar terms, and traditional festivals
- **Chinese statutory holidays** — 休 (day off) / 班 (workday) badges with custom overrides
- **Gan-Zhi year & zodiac** shown under the calendar title

### Periodic notes (5 levels)
- **Daily / Weekly / Monthly / Quarterly / Yearly notes**, each with its own enabled flag, date format, folder, and template
- **Confirm before create** — clicking a missing note asks first; existing notes open directly
- **Context menu** — open, reveal in file explorer, or delete an existing note
- **Date sync** — opening a daily note moves the calendar to its month

### Tasks & links
- **Task indicators** — parses `- [ ]` / `- [x]` checkboxes and shows completion dots
- **Click a task dot** to open the note and jump to the first incomplete task
- **Backlink counts** for daily notes (up to 5 dots + overflow badge)
- **Aggregated progress** (`3/5`) on weekly/monthly/quarterly/yearly notes

### Interaction
- **Hover preview** on dates that already have a note
- **Ctrl/Cmd + click** to open in a new split
- **Keyboard navigation** — `←` `→` `↑` `↓` to page, `t` for today

### Performance & theming
- **Incremental indexing** — O(1) updates on create/delete/rename/modify, no full-vault rescans
- **Custom CSS classes** injectable onto the calendar container
- **First-run migration** from Core Daily Notes, Calendar, and Chinese Calendar plugins
- **Template path auto-repair** for legacy paths

## Install

### From Obsidian Community Plugins

1. Open **Settings → Community plugins**
2. Browse and search for **Mix Calendar**, then install and enable it

Requires Obsidian **1.7.2 or later**.

### Manual install

1. Download `main.js`, `styles.css`, and `manifest.json` from the [latest release](https://github.com/Liury23/mix-calendar/releases)
2. Place them in `<vault>/.obsidian/plugins/mix-calendar/`
3. Restart Obsidian and enable Mix Calendar under Community plugins

### Build from source

```bash
git clone https://github.com/Liury23/mix-calendar
cd mix-calendar
npm install
npm run build
# Deploy to your vault
cp main.js styles.css manifest.json <vault>/.obsidian/plugins/mix-calendar/
```

## Settings

### General
| Setting | Description |
|---------|-------------|
| Week start | Sunday / Monday / Locale default |
| UI language | 中文 / English |
| Locale override | Override moment.js locale (7 options) |
| Confirm before create | Ask before creating a missing note |

### Appearance
| Setting | Description |
|---------|-------------|
| Show lunar info | Lunar dates, solar terms, festivals |
| Show holiday badges | Statutory holiday / makeup workday badges |
| Show week numbers | ISO week numbers in month view |
| Past date transparent | Dim past dates |
| Show task indicators | Checkbox completion dots |
| Show link count | Backlink count in the cell corner |
| Task / link dot size | Dot diameter in px |
| Custom CSS classes | Space-separated classes injected onto the container |

### Periodic notes (5 levels)

Each level configures: **enabled**, **date format** (moment.js format used for filenames), **folder**, and **template**. Defaults:

- Daily: `YYYY/YYYY-MM/YYYY-MM-DD` · Weekly: `YYYY/YYYY-[W]WW` · Monthly: `YYYY/YYYY-MM` · Quarterly: `YYYY/YYYY-[Q]Q` · Yearly: `YYYY`

### Custom holidays

Override the built-in statutory holiday table, one `YYYY-MM-DD:休` or `YYYY-MM-DD:班` per line. Lines starting with `#` are comments.

```
# Company holiday
2026-05-05:休
# Makeup workday
2026-10-10:班
```

## Template variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{date}}` | Current date | `2026-01-15` |
| `{{time}}` | Current time | `09:30` |
| `{{title}}` | Full title | `2026-01-15 Thursday` |
| `{{yesterday}}` / `{{tomorrow}}` | Adjacent dates | `2026-01-14` |
| `{{lunarYear}}` | Gan-Zhi + zodiac year | `甲辰龙年` |
| `{{lunarMonth}}` / `{{lunarDay}}` | Lunar month / day | `正月` / `初三` |
| `{{solarTerm}}` | Solar term (if any) | `立春` |
| `{{festival}}` | Festival (if any) | `春节` |
| `{{ganZhiYear}}` / `{{zodiac}}` | Gan-Zhi year / zodiac | `甲辰` / `龙` |
| `{{quarter}}` | Quarter (quarterly notes) | `Q1` |
| `{{quarterStart}}` / `{{quarterEnd}}` | Quarter bounds | `2026-01-01` |
| `{{sunday}}`–`{{saturday}}` | Each day of this week | `2026-01-12` |
| `{{weekStart}}` / `{{weekEnd}}` | Week bounds | `2026-01-12` |
| `{{date+Nd:format}}` | Date offset | `{{date+7d:YYYY-MM-DD}}` |

## Commands

| Command | Description |
|---------|-------------|
| Open calendar | Open the calendar view |
| Reveal open note | Jump the calendar to the month of the currently open note |

## Development

```bash
npm run dev          # Watch mode
npm run build        # Typecheck + production build
npm run test         # Unit tests
npm run lint         # ESLint (obsidianmd rule set)
npm run typecheck    # tsc --noEmit
```

Stack: TypeScript + Svelte 4 + esbuild + lunar-typescript + vitest. Releases run through GitHub Actions with build-provenance attestations; publish the draft release created for each tag.

## Acknowledgments

- **[dust-obsidian-calendar](https://github.com/a-nano-dust/dust-obsidian-calendar)** by [a-nano-dust](https://github.com/a-nano-dust) — inspiration
- **[Calendar](https://github.com/liamcain/obsidian-calendar-plugin)**, **[Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes)**, and **[obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface)** by [Liam Cain](https://github.com/liamcain) — core design patterns for periodic-note indexing, month view interactions, and the daily-notes interface
- **[obsidian-lunar-calendar](https://github.com/DevilRoshan/obsidian-lunar-calendar)** by [DevilRoshan](https://github.com/DevilRoshan) — lunar calendar integration

## License

MIT

---

# 中文说明

English | [中文](#中文说明)

Mix Calendar 是一个 Obsidian 日历插件，在同一视图中合并公历与农历、节假日、任务状态以及 5 种颗粒度的周期性笔记。它融合了 [Calendar](https://github.com/liamcain/obsidian-calendar-plugin) 与 [Chinese Calendar](https://github.com/devil-tamachan/obsidian-chinese-calendar) 的功能。

## 功能

### 日历视图
- **月视图** — 标准月历网格，含 ISO 周数、农历、节日、休/班标记
- **年视图** — 4 季度 × 3 月布局，支持月记/季记/年记创建与打开
- **选中日期高亮**、导航按钮 tooltip

### 农历与节日
- **农历信息** — 农历日期、二十四节气、传统节日
- **法定节假日** — 「休」「班」角标，支持自定义覆盖
- **干支生肖年** — 日历标题下方显示干支年 + 生肖

### 周期性笔记（5 级）
- **日记 / 周记 / 月记 / 季记 / 年记** — 每种独立配置（启用、格式、文件夹、模板）
- **创建前确认** — 点击不存在的笔记时弹出确认框；已存在则直接打开
- **右键菜单** — 打开、在文件浏览器中显示、删除
- **自动日期同步** — 打开日记时日历自动跟随到对应月份

### 任务与链接
- **任务完成指示** — 解析 `- [ ]` / `- [x]` checkbox，圆点显示完成状态
- **点击任务圆点** — 打开笔记并跳转到第一个未完成任务
- **反向链接计数** — 日记反链数量（最多 5 个点 + 溢出计数）
- **任务汇总** — 周记/月记/季记/年记显示 `3/5` 形式进度

### 交互增强
- **Hover 预览** — 悬停已有笔记的日期格显示内容预览
- **Ctrl/Cmd + 点击** — 在新分栏中打开笔记
- **键盘导航** — `←` `→` `↑` `↓` 翻页，`t` 跳到今天

### 性能与主题
- **增量索引** — 创建/删除/重命名/修改笔记时 O(1) 更新
- **自定义 CSS 类** — 注入到日历容器，适配不同主题
- **设置自动迁移** — 首次运行自动从 Core Daily Notes、Calendar、Chinese Calendar 导入
- **模板路径自动修复** — 向后兼容旧路径

## 安装

### 从 Obsidian 社区插件安装

1. 打开 **设置 → 第三方插件**
2. 浏览搜索 **Mix Calendar**，安装并启用

需要 Obsidian **1.7.2 或更高版本**。

### 手动安装

1. 从[最新 Release](https://github.com/Liury23/mix-calendar/releases) 下载 `main.js`、`styles.css`、`manifest.json`
2. 放到 `<vault>/.obsidian/plugins/mix-calendar/`
3. 重启 Obsidian，在第三方插件中启用

### 从源码构建

```bash
git clone https://github.com/Liury23/mix-calendar
cd mix-calendar
npm install
npm run build
# 部署到 vault
cp main.js styles.css manifest.json <vault>/.obsidian/plugins/mix-calendar/
```

## 设置

### 通用
| 设置 | 说明 |
|------|------|
| 每周起始日 | 周日 / 周一 / 系统默认 |
| 界面语言 | 中文 / English |
| 本地化覆盖 | 覆盖 moment.js 地区设置（7 种） |
| 创建前确认 | 创建缺失笔记前先确认 |

### 显示
| 设置 | 说明 |
|------|------|
| 农历信息 | 显示农历/节气/节日 |
| 休/班标记 | 法定休假日和调休上班角标 |
| 周数显示 | 月视图左侧 ISO 周号 |
| 过去日期半透明 | 将过去日期变淡 |
| 任务完成指示 | checkbox 完成状态圆点 |
| 显示链接数 | 单元格角落显示反向链接数 |
| 任务/链接圆点大小 | 圆点直径（像素） |
| 自定义 CSS 类 | 空格分隔，注入到日历容器 |

### 周期笔记（5 级）

每级独立配置 **启用**、**日期格式**（moment.js 格式，决定文件名）、**文件夹**、**模板**。默认值：

- 日记 `YYYY/YYYY-MM/YYYY-MM-DD` · 周记 `YYYY/YYYY-[W]WW` · 月记 `YYYY/YYYY-MM` · 季记 `YYYY/YYYY-[Q]Q` · 年记 `YYYY`

### 自定义节假日

以 `YYYY-MM-DD:休` 或 `YYYY-MM-DD:班` 格式覆盖法定节假日库，每行一条，`#` 开头为注释。

```
# 公司假期
2026-05-05:休
# 公司调休
2026-10-10:班
```

## 模板变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `{{date}}` | 当前日期 | `2026-01-15` |
| `{{time}}` | 当前时间 | `09:30` |
| `{{title}}` | 完整标题 | `2026-01-15 Thursday` |
| `{{yesterday}}` / `{{tomorrow}}` | 相邻日期 | `2026-01-14` |
| `{{lunarYear}}` | 干支生肖年 | `甲辰龙年` |
| `{{lunarMonth}}` / `{{lunarDay}}` | 农历月 / 农历日 | `正月` / `初三` |
| `{{solarTerm}}` | 节气（如有） | `立春` |
| `{{festival}}` | 节日（如有） | `春节` |
| `{{ganZhiYear}}` / `{{zodiac}}` | 干支年 / 生肖 | `甲辰` / `龙` |
| `{{quarter}}` | 季度（季记专用） | `Q1` |
| `{{quarterStart}}` / `{{quarterEnd}}` | 季度起止 | `2026-01-01` |
| `{{sunday}}`–`{{saturday}}` | 本周每天日期 | `2026-01-12` |
| `{{weekStart}}` / `{{weekEnd}}` | 本周起止 | `2026-01-12` |
| `{{date+Nd:format}}` | 日期偏移 | `{{date+7d:YYYY-MM-DD}}` |

## 命令

| 命令 | 说明 |
|------|------|
| Open calendar | 打开日历视图 |
| Reveal open note | 将日历跳转到当前打开笔记的月份 |

## 开发

```bash
npm run dev          # 监视模式
npm run build        # 类型检查 + 生产构建
npm run test         # 单元测试
npm run lint         # ESLint（obsidianmd 规则集）
npm run typecheck    # tsc --noEmit
```

技术栈: TypeScript + Svelte 4 + esbuild + lunar-typescript + vitest。发布通过 GitHub Actions 完成，带构建来源证明（artifact attestation）；打 tag 后发布为 draft，确认后手动 publish。

## 致谢

- **[dust-obsidian-calendar](https://github.com/a-nano-dust/dust-obsidian-calendar)** by [a-nano-dust](https://github.com/a-nano-dust) — 灵感来源
- **[Calendar](https://github.com/liamcain/obsidian-calendar-plugin)**、**[Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes)**、**[obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface)** by [Liam Cain](https://github.com/liamcain) — 周期性笔记索引、月视图交互与日记接口的核心设计范式
- **[obsidian-lunar-calendar](https://github.com/DevilRoshan/obsidian-lunar-calendar)** by [DevilRoshan](https://github.com/DevilRoshan) — 农历系统集成

## 许可

MIT
