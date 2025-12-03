# Repository Guidelines

## 项目结构与模块组织
- 前端入口：`index.html`、`index.tsx`、`App.tsx`。
- 页面：`pages/`（如 `Home.tsx`、`Stats.tsx`、`Profile.tsx`）存放路由页面组件。
- 组件：`components/`（如 `BottomNav.tsx`、`Confetti.tsx`）存放可复用 UI。
- 业务与状态：`services/storage.ts` 负责本地存储与模拟登录状态；`types.ts` 定义核心类型；`utils.ts` 存放通用工具。
- 配置：`vite.config.ts`、`tsconfig.json`、`package.json` 位于仓库根目录。

## 构建、开发与运行
- 安装依赖：`npm install`
- 本地开发：`npm run dev`（Vite 开发服务器，默认 http://localhost:5173）
- 生产构建：`npm run build`（输出到 `dist/`）
- 构建预览：`npm run preview`（在本地以生产模式预览 `dist/`）

## 代码风格与命名约定
- 语言：TypeScript + React 函数组件，使用 React Hooks。
- 风格：2 空格缩进、单引号、语句结尾保留分号；尽量保持 JSX 简洁、组件小而专一。
- 命名：组件与页面使用 `PascalCase`（如 `Login.tsx`），工具函数与变量使用 `camelCase`。
- 样式：使用 Tailwind 风格的原子类组合，避免内联样式和魔法数，复用常见 className 片段。

## 测试与验证指南
- 当前未集成自动化测试框架，修改后至少完成基本手动验收：登录/登出、打卡、凭证消耗、导航切换。
- 如需添加测试，推荐使用 Vitest + React Testing Library，测试文件命名为 `*.test.ts(x)` 并集中在与被测文件相同目录。

## 提交与变更说明（Commit & PR）
- 建议使用类似 Conventional Commits 的格式，例如：`feat: add retroactive checkin flow`、`fix: handle missing auth token`。
- 每次改动前保持最小变更集：单个分支聚焦单一功能或修复。
- PR 描述中至少包含：改动目的、主要技术方案、影响范围以及手动测试步骤；如涉及 UI 变更，请附关键界面截图或录屏。

