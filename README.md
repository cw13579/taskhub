# TaskHub 渠道任务协作平台 -- 基准源码 V1.3

## 项目概述

TaskHub 是一个轻量级的渠道任务协作平台，用于渠道经理向合作伙伴下发司机外呼任务（Cooper 表格）并进行进度跟踪。管理员和用户分别为独立入口，数据通过 GitHub 仓库 JSON 文件实时共享。

**V1.3 新增**：双向同步。伙伴端完成/标记任务后自动推送回 GitHub，管理端实时可见进度，无需手动刷新。管理员所有操作（新增/编辑/删除任务、公司管理、审批）也自动推送。

---

## 项目文件结构

```
task-hub-v1.3/
├── index.html          # 伙伴端入口（桌面）
├── admin.html          # 管理后台入口（管理员专用）
├── mobile.html         # 移动端入口（手机自动跳转）
├── tasks.json          # 任务数据文件（GitHub 共享，含 _token 元数据）
├── .nojekyll           # GitHub Pages 配置
├── css/
│   └── style.css       # 全局样式表
├── js/
│   ├── app.js          # 伙伴端逻辑脚本
│   └── github-sync.js  # GitHub 双向同步模块（含SHA冲突重试）
└── README.md           # 配套说明文档
```

## 入口链接

| 入口 | 文件 | 访问方式 |
|------|------|---------|
| 渠道伙伴（桌面） | `index.html` | 双击打开或发布为网址 |
| 管理后台 | `admin.html` | 管理员专用，独立入口 |
| 移动端 | `mobile.html` | 手机浏览器自动跳转 |

当前外网部署地址（GitHub Pages）：

| 页面 | 地址 |
|------|------|
| 伙伴端（桌面） | https://cw13579.github.io/taskhub/ |
| 伙伴端（手机） | https://cw13579.github.io/taskhub/mobile.html |
| 管理后台 | https://cw13579.github.io/taskhub/admin.html |

## 运行环境与启动

### 依赖环境

- 任何现代浏览器（Chrome 90+ / Edge 90+ / Firefox 90+ / Safari 15+）
- 无后端服务依赖
- 无需安装任何运行时或依赖包

### 本地启动方式

1. 直接双击 `index.html`（伙伴端）或 `admin.html`（管理后台）
2. 或拖拽文件到浏览器窗口
3. 手机浏览器打开 `index.html` 自动跳转 `mobile.html`

### 访问参数

| 参数 | 用途 |
|------|------|
| `?desktop=1` | 手机端强制使用桌面版 |
| `?mobile=1` | 强制切回移动版 |

## GitHub 双向同步（V1.3 新增）

### 工作原理

1. **管理员**在侧栏 GitHub Data Sync 面板输入 Token 并 Push
2. Token 嵌入 `tasks.json` 的 `_token` 字段，随数据一同推送
3. **伙伴端**加载页面时从 `tasks.json` 读取 Token，自动获得写入权限
4. 伙伴完成/标记任务后，数据**自动推送**回 GitHub（无需手动操作）
5. 管理员任何操作（新增/编辑/删除/审批）也自动推送
6. 并发写入冲突时自动重试（最多3次，间隔500ms）

### 初始设置

在管理后台左侧栏底部 GitHub Data Sync 面板：
输入 GitHub Personal Access Token → 点击 **Push to GitHub**。

Token 要求：在 GitHub Settings > Developer settings > Personal access tokens (classic) 创建，勾选 `repo` 权限。

## 数据存储路径

| 存储位置 | 数据类型 | 用途 |
|---------|---------|------|
| `tasks.json` (GitHub) | JSON | 共享的任务、公司、审批、Cooper、Token |
| `localStorage.th3_global` | JSON | 本地缓存（从 GitHub 同步） |
| `localStorage.th3_users` | JSON | 用户个人数据（备注、自建 Cooper） |
| `localStorage.gh_token` | String | 管理员 GitHub Token |

## 核心功能

### 角色划分（独立入口）

- **管理后台** (`admin.html`): 日历视图、新增/编辑/删除任务、公司管理、Cooper管理、审批管理、GitHub数据同步
- **伙伴端** (`index.html` / `mobile.html`): 查看本公司任务、标记完成、打标备注、添加个人Cooper链接

### 功能模块

1. **日历视图** -- 月历展示，有任务的日期显示绿点，点击日期可筛选
2. **任务管理** -- 管理员创建任务（含公司、伙伴、Cooper 链接、反馈要求、达标目标）
3. **公司管理** -- 管理员维护公司列表和成员
4. **状态流转** -- 点击勾选框：待处理 <-> 已完成（自动同步到GitHub）
5. **打标/备注** -- 用户修改优先级、添加备注标签（自动同步）
6. **常用 Cooper** -- 管理员统一添加 + 用户自添加
7. **双向同步** -- 管理员推送 <-> 伙伴自动拉取/推送，跨设备实时共享
8. **移动端适配** -- 手机浏览器自动跳转移动版

## 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0 | 2026-06-11 | 正式版：管理后台与伙伴端独立入口，URL 分享 |
| V1.1 | 2026-06-12 | 功能优化：日历视图、审批流、多公司管理 |
| V1.2 | 2026-06-12 | GitHub 数据同步：跨设备共享、新版布局（侧栏+日历）、管理端 UI 美化 |
| V1.3 | 2026-06-12 | 双向同步：伙伴自动推送、SHA冲突重试、Token内置共享 |
