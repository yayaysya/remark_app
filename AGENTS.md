# Repository Guidelines

## 项目结构与模块组织
- 前端入口：`index.html`、`index.tsx`、`App.tsx`。
- 页面：`pages/` 存放路由页面（如 `Home.tsx`、`Follow.tsx`、`Profile.tsx`、`Stats.tsx`）。
- 组件：`components/` 存放可复用 UI（如统计视图、弹窗、分享卡片等）。
- 前端业务：`services/storage.ts` 封装所有 HTTP 调用和本地缓存；`types.ts` 定义核心类型；`utils.ts` 存放通用工具。
- 后端：`backend/` 为 Node.js + Express + MySQL 服务，`index.js` 为入口，`db.js` 管理连接与建表，`routes/` 下按领域拆分路由。
- 部署与容器：`docker-compose.yml`、`Dockerfile.frontend`、`backend/Dockerfile`、`nginx.conf` 用于本地与生产部署。

## 构建、开发与运行
- 前端依赖：仓库根目录执行 `npm install`。
- 后端依赖：`cd backend && npm install`。
- 本地前端开发：`npm run dev`（默认 http://localhost:5173）。
- 本地后端开发：`cd backend && npm start`（默认端口由 `.env` 的 `BACKEND_PORT` 或 `PORT` 控制）。
- 生产构建：`npm run build`（产物输出到 `dist/`，由 Nginx 提供静态资源与反向代理）。
- 一键容器化环境：配置好 `.env` 后运行 `docker-compose up -d`。

## 代码风格与命名约定
- 语言：前端 TypeScript + React Hooks，后端 Node.js + Express。
- 基本风格：2 空格缩进、单引号、语句结尾保留分号，避免魔法数与深层嵌套。
- 命名：组件与页面使用 `PascalCase`，函数、变量与 hooks 使用 `camelCase`，React hooks 以 `use` 开头。
- 样式：优先组合原子类，复用常见 className 片段，避免复杂内联样式。

## 测试与验证指南
- 当前未集成自动化测试框架，修改后至少完成以下手动验收：邮箱注册/登录、个人资料编辑与头像上传、习惯创建与打卡、关注/取消关注、查看他人统计、分享战报生成与下载。
- 如需添加测试，推荐前端使用 Vitest + React Testing Library（文件命名 `*.test.tsx`），后端使用 Jest 或 Vitest（文件命名 `*.test.ts`），测试文件与被测模块同目录存放。

## 提交与变更说明（Commit & PR）
- 提交信息建议使用类似 Conventional Commits 的格式，如：`feat: add email auth flow`、`fix: handle avatar upload error`。
- 单次提交聚焦单一问题或特性，避免混合重构与功能开发。
- PR 描述中至少包含：改动目的、核心方案、影响范围、数据库变更说明（如有）以及手动验证步骤；涉及 UI 的改动请附关键界面截图或短视频。

## 配置与安全
- 所有敏感配置（数据库账号、`DATABASE_URL`、`JWT_SECRET`、端口等）必须放在 `.env` 或 1Panel 环境变量中，严禁提交到版本库。
- 修改配置相关逻辑时，请同步更新 `DEPLOYMENT.md` 并在 PR 中明确标注。
