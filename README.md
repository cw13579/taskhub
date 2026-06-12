# TaskHub 渠道任务协作平台 -- 基准源码 V1.2

## 项目概述

TaskHub 是一个轻量级的渠道任务协作平台，用于渠道经理向合作伙伴下发司机外呼任务（Cooper 表格）并进行进度跟踪。管理员和用户分别为独立入口，数据通过 GitHub 仓库 JSON 文件实时共享。

**V1.2 新增**：GitHub 数据同步，管理员推送任务后所有伙伴自动同步，无需每台电脑本地存储。

---

## 项目文件结构

```
task-hub-v1.2/
├── index.html          # 伙伴端入口（桌面）
├── admin.html          # 管理后台入口（管理员专用）
├── mobile.html         # 移动端入口（手机自动跳转）
├── tasks.json          # 任务数据文件（GitHub 共享）
├── .nojekyll           # GitHub Pages 配置（跳过 Jekyll）
├── css/
│   └── style.css       # 全局样式表
├── js/
│   ├── app.js          # 伙伴端逻辑脚本
│   └── github-sync.js  # GitHub 数据同步模块
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

## GitHub 数据同步（V1.2 新增）

管理后台侧栏底部的 GitHub Data Sync 面板用于数据同步：

1. 在管理后台输入 GitHub Personal Access Token
2. 点击 **Push to GitHub** 将当前任务数据推送到仓库
3. 伙伴端打开页面时自动从 GitHub 拉取最新数据
4. Token 需在 GitHub Settings > Developer settings > Personal access tokens 创建，勾选 `repo` 权限

## 数据存储路径

| 存储位置 | 数据类型 | 用途 |
|---------|---------|------|
| `tasks.json` (GitHub) | JSON | 共享的任务、公司、审批、Cooper 链接数据 |
| `localStorage.th3_global` | JSON | 本地缓存（伙伴端从 GitHub 同步后写入） |
| `localStorage.th3_users` | JSON | 用户个人数据（备注、自建 Cooper 等） |
| `localStorage.gh_token` | String | 管理员 GitHub Token（仅管理后台使用） |

## 核心功能

### 角色划分（独立入口）

- **管理后台** (`admin.html`): 日历视图、新增/编辑/删除任务、公司管理、Cooper 管理、审批管理、GitHub 数据同步
- **伙伴端** (`index.html` / `mobile.html`): 查看本公司任务、标记完成、打标备注、添加个人 Cooper 链接

### 功能模块

1. **日历视图** -- 月历展示，有任务的日期显示绿点，点击日期可筛选
2. **任务管理** -- 管理员创建任务（含公司、伙伴、Cooper 链接、反馈要求、达标目标）
3. **公司管理** -- 管理员维护公司列表和成员
4. **状态流转** -- 点击勾选框：待处理 <-> 已完成
5. **打标/备注** -- 用户修改优先级、添加备注标签
6. **常用 Cooper** -- 管理员统一添加 + 用户自添加
7. **GitHub 数据同步** -- 管理员推送 -> 伙伴端自动拉取 -> 跨设备实时共享
8. **移动端适配** -- 手机浏览器自动跳转移动版

## 版本记录

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0 | 2026-06-11 | 正式版：管理后台与伙伴端独立入口，URL 分享 |
| V1.1 | 2026-06-12 | 功能优化：日历视图、审批流、多公司管理 |
| V1.2 | 2026-06-12 | GitHub 数据同步：跨设备共享、新版布局（侧栏+日历）、管理端 UI 美化 |
