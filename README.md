# Mix Calendar

混合日历（Mix Calendar）是一个 Obsidian 插件，合并了 [Calendar](https://github.com/liamcain/calendar) 和 [Chinese Calendar](https://github.com/devil-tamachan/obsidian-chinese-calendar) 的功能，在一个日历视图中同时提供公历、农历、节假日、任务状态以及 5 种颗粒度的周期性笔记。

## 功能

### 日历视图
- **月视图** — 标准月历网格，含 ISO 周数、农历、节日、休/班标记
- **年视图** — 4 季度 × 3 月布局，支持月记/季记/年记创建与打开
- **选中日期高亮** — 点击日期后该格高亮显示
- **导航按钮 tooltip** — 悬停上一月/下一月/今天按钮显示提示文字

### 农历与节日
- **农历信息** — 农历日期、二十四节气、传统节日
- **法定节假日** — 显示「休」「班」角标，支持自定义覆盖
- **干支生肖年** — 日历标题下方显示干支年 + 生肖

### 周期性笔记（5 级）
- **日记 / 周记 / 月记 / 季记 / 年记** — 每种独立配置（启用、格式、文件夹、模板）
- **创建前确认** — 点击不存在的笔记时弹出确认框；已存在则直接打开
- **右键菜单** — 已有笔记的日期格右键可打开、在文件浏览器中显示、删除
- **自动日期同步** — 打开日记时日历自动跟随到对应月份

### 任务与链接
- **任务完成指示** — 解析笔记内 `- [ ]` / `- [x]` checkbox，圆点显示完成状态
- **任务圆点点击** — 点击任务圆点打开笔记并跳转到第一个未完成任务
- **反向链接计数** — 日期格右下角显示该日记的反链数量（最多 5 个点 + 溢出计数）
- **周记/月记/季记/年记任务汇总** — 显示 `3/5` 形式的完成进度

### 交互增强
- **Hover 预览** — 悬停已有笔记的日期格时显示笔记内容预览
- **Ctrl/Cmd + 点击** — 在新分栏中打开笔记
- **键盘导航** — ← → ↑ ↓ 翻页、`t` 跳到今天
- **工具提示** — 悬停圆点显示任务或链接详情

### 性能与主题
- **增量索引** — 创建/删除/重命名/修改笔记时 O(1) 更新，不再全库扫描
- **自定义 CSS 类** — 通过设置注入自定义 CSS class，适配不同主题
- **设置自动迁移** — 首次运行自动从 Core Daily Notes、Calendar、Chinese Calendar 插件导入设置
- **模板路径自动修复** — 自动将旧模板路径迁移到新路径（向后兼容）

## 安装

### 从 Obsidian 社区插件安装

（即将上架）

### 手动安装

1. 下载最新 `main.js`、`styles.css`、`manifest.json`
2. 放到 `<vault>/.obsidian/plugins/mix-calendar/`
3. 重启 Obsidian，在"社区插件"中启用 Mix Calendar

### 从源码构建

```bash
git clone <repo-url>
cd mix-calendar
npm install
npm run build
# 部署到 vault
cp main.js styles.css manifest.json <vault>/.obsidian/plugins/mix-calendar/
```

## 设置

### 通用设置
| 设置 | 说明 |
|------|------|
| 每周起始日 | 周日 / 周一 / 系统默认 |
| 界面语言 | 中文 / English |
| 本地化覆盖 | 覆盖 moment.js 地区设置（zh-cn, en-us 等 7 种） |

### 显示设置
| 设置 | 说明 |
|------|------|
| 农历信息 | 显示农历/节气/节日 |
| 休/班标记 | 显示法定休假日和调休上班角标 |
| 周数显示 | 月视图左侧 ISO 周号 |
| 过去日期半透明 | 将过去日期变淡 |
| 任务完成指示 | 显示 checkbox 完成状态圆点 |
| 显示链接数 | 在右下角显示反向链接数 |
| 自定义 CSS 类 | 空格分隔的 CSS class，注入到日历容器 |

### 笔记设置（5 级）

每级笔记独立配置：

- **启用** — 是否显示和索引该级笔记
- **日期格式** — moment.js 格式，用于文件名。示例：
  - 日记: `YYYY/YYYY-MM/YYYY-MM-DD`
  - 周记: `YYYY/YYYY-[W]WW`
  - 月记: `YYYY/YYYY-MM`
  - 季记: `YYYY/YYYY-[Q]Q`
  - 年记: `YYYY`
- **文件夹路径** — vault 内的相对路径
- **模板路径** — 模板文件路径（可选）

### 自定义节假日

在文本框中以 `YYYY-MM-DD:休` 或 `YYYY-MM-DD:班` 格式覆盖法定节假日库结果，每行一条。支持 `#` 注释。

```
# 公司假期
2026-05-05:休
# 公司调休
2026-10-10:班
```

## 模板变量

创建笔记时，以下变量会被替换：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{{date}}` | 当前日期 | `2026-01-15` |
| `{{time}}` | 当前时间 | `09:30` |
| `{{title}}` | 完整标题 | `2026-01-15 Thursday` |
| `{{yesterday}}` | 昨天日期 | `2026-01-14` |
| `{{tomorrow}}` | 明天日期 | `2026-01-16` |
| `{{lunarYear}}` | 干支生肖年 | `甲辰龙年` |
| `{{lunarMonth}}` | 农历月 | `正月` |
| `{{lunarDay}}` | 农历日 | `初三` |
| `{{solarTerm}}` | 节气（如有） | `立春` |
| `{{festival}}` | 节日（如有） | `春节` |
| `{{ganZhiYear}}` | 干支年 | `甲辰` |
| `{{zodiac}}` | 生肖 | `龙` |
| `{{quarter}}` | 季度（季记专用） | `Q1` |
| `{{quarterStart}}` | 季度开始日期（季记专用） | `2026-01-01` |
| `{{quarterEnd}}` | 季度结束日期（季记专用） | `2026-03-31` |
| `{{sunday}}`-`{{saturday}}` | 本周每天日期 | `2026-01-12` |
| `{{date+Nd:format}}` | 日期偏移 | `{{date+7d:YYYY-MM-DD}}` |
| `{{weekStart}}` | 本周开始 | `2026-01-12` |
| `{{weekEnd}}` | 本周结束 | `2026-01-18` |

## 键盘快捷键

| 键 | 功能 |
|----|------|
| `←` / `→` | 上/下一月（月视图）或上/下一年（年视图） |
| `↑` / `↓` | 同上 |
| `t` | 跳到今天 |

## 命令

| 命令 | 说明 |
|------|------|
| Open Mix Calendar | 打开日历视图 |
| Reveal open note | 将日历跳转到当前打开日记的月份 |

## 交互

- **点击日期格** → 打开已有笔记，或弹出确认框创建新笔记
- **Ctrl/Cmd + 点击日期格** → 在新分栏中打开笔记
- **悬停日期格** → 显示笔记内容预览（Hover Preview）
- **点击周号格** → 打开/创建周记
- **点击任务圆点** → 打开笔记并跳转到第一个未完成任务
- **右键日期格** → 右键菜单（打开、在文件浏览器中显示、删除）
- **右键月格（年视图）** → 打开/创建月记

## 开发

```bash
npm run dev          # 监视模式
npm run build        # 生产构建
npm run test         # 运行单元测试
npm run test:watch   # 监视模式运行测试
npm run deploy       # 构建 + 部署到 vault
```

技术栈: TypeScript + Svelte 4 + esbuild + lunar-typescript + vitest

## 致谢

本插件融合并借鉴了以下优秀作品的设计思路和部分实现，特此致谢。

### 灵感来源

- **[dust-obsidian-calendar](https://github.com/a-nano-dust/dust-obsidian-calendar)** by [a-nano-dust](https://github.com/a-nano-dust) — 特别感谢其灵感启发

### 核心参考

- **[Calendar](https://github.com/liamcain/obsidian-calendar-plugin)** by [Liam Cain](https://github.com/liamcain) — Obsidian 日历插件的开发者，提供了周期性笔记索引、月视图交互、hover 预览等核心设计范式
- **[Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes)** by [Liam Cain](https://github.com/liamcain) — 周期性笔记管理的基础设施
- **[obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface)** by [Liam Cain](https://github.com/liamcain) — 日记接口 SDK
- **[obsidian-lunar-calendar](https://github.com/DevilRoshan/obsidian-lunar-calendar)** by [DevilRoshan](https://github.com/DevilRoshan) — 将农历、节气、节假日系统引入 Obsidian 日历的开发者

## 许可

MIT
