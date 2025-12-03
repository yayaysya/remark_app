# 任务：Docker 化全栈 Simple Habit 应用（方案 2）

## 需求摘要
- 为现有 React + Vite 前端增加独立 Node.js + Express + MySQL 后端，实现完整用户/习惯/打卡后端化。
- 所有敏感配置（数据库连接串、端口、密钥等）通过 `.env` 环境变量注入。
- 提供可用于生产的 `Dockerfile.frontend`、`backend/Dockerfile`、`docker-compose.yml` 和 `nginx.conf`。
- 使用 docker-compose 同时编排前端、后端、数据库，并为 MySQL 数据挂载宿主机目录实现持久化。

## 选定方案（方案 2）
- 后端承担用户注册/登录、习惯管理、打卡与代金券逻辑，MySQL 作为单一事实来源。
- 前端通过 `/api/*` 调用后端，不再使用 `localStorage` 持久化业务数据，仅保留 token 缓存。
- Nginx 容器负责静态文件与 `/api` 反向代理。

## 执行步骤概览
1. 在 `backend/` 下搭建 Node.js + Express + MySQL 后端骨架，封装连接池与自动建表。
2. 实现 `/api/auth` 相关路由：发送验证码、登录（自动注册）、获取当前用户，使用 JWT 进行认证。
3. 实现 `/api/habits` 路由：获取、创建、删除习惯，并维护与用户的关联。
4. 实现 `/api/checkins` 与 `/api/vouchers/spend`：支持打卡、撤销打卡和使用代金券的业务逻辑。
5. 重构前端 `services/storage.ts` 为统一 API 客户端，调整 `Login/Home/Stats/Honors/Profile` 等页面为异步请求后端。
6. 更新 `vite.config.ts`：配置 dev 端口与 `/api` 代理指向本地后端。
7. 新增 `Dockerfile.frontend`、`backend/Dockerfile`、`docker-compose.yml` 和 `nginx.conf`，并提供 `.env.example` 说明必要环境变量。

## 预期结果
- 本地开发：`npm run dev` + 本地启动后端，即可通过 `/api` 完整运行。
- 容器化：`cp .env.example .env && docker-compose up -d` 一键启动前端、后端、MySQL，数据库数据持久化到 `./mysql-data`。
- 代码结构清晰，前后端边界明确，方便后续扩展与优化。

