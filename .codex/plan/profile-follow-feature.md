# 任务：用户资料编辑与关注监督功能（profile-follow-feature）

## 需求摘要
- 支持登录用户编辑个人信息，并将数据存入数据库：头像（上传图片）、用户名（全局唯一 username）、昵称（展示用）。
- 为用户增加「关注」能力：可通过用户名或手机号搜索其他用户并关注，单向关注模型，类似微博。
- 支持监督功能：点击被关注用户，可查看其习惯和打卡历史统计视图（类似当前自己的统计页），打卡数据默认对登录用户公开。

## 方案概述（采用方案 1）
- 后端使用本地文件系统存储头像图片，挂载 `/uploads/avatars` 为静态资源目录，通过 URL 在前端展示，Docker 中使用卷挂载保证持久化。
- 在 `users` 表中新增全局唯一 `username` 字段，用于搜索和展示；`nickname` 作为展示名，可非唯一。
- 新增 `user_follows` 表管理关注关系（follower_id → followee_id），构建 REST API 支持关注/取消关注/获取关注列表。
- 暴露他人数据访问接口（习惯 + 打卡记录），通过 `/api/users/:id/habits` 和 `/api/users/:id/checkins`，对所有已登录用户开放访问。
- 前端通过 `services/storage.ts` 增加用户、头像、关注相关的 API 封装；在「我的」页面提供资料编辑和关注管理入口；新增 `/user/:userId/stats` 页面以只读方式展示他人统计视图。

## 执行步骤（高层）
1. **数据库与 schema**
   - 在 `backend/db.js` 中为 `users` 增加 `username VARCHAR(64) UNIQUE` 字段，并在服务启动时通过 `ALTER TABLE` 确保存在。
   - 新建 `user_follows` 表，包含 `id`, `follower_id`, `followee_id`, `created_at`，并加上唯一约束和外键约束。

2. **后端用户与头像 API**
   - 新建 `backend/routes/users.js`，实现：
     - `GET /api/users/me`：返回当前登录用户完整信息（含 username、nickname、avatar、统计字段）。
     - `PATCH /api/users/me`：更新 `username` 与 `nickname`，校验 username 唯一性。
     - `GET /api/users/search?q=`：按 `username` 模糊匹配 + `phone` 精确匹配，返回用户列表。
     - `GET /api/users/:id`：返回指定用户公开信息。
     - `GET /api/users/:id/habits` 和 `GET /api/users/:id/checkins`：返回指定用户的习惯和打卡记录。
   - 在 `backend/index.js` 中挂载 `/api/users` 路由。
   - 使用 `multer` 增加 `POST /api/users/me/avatar`，支持图片上传到 `uploads/avatars`，更新 `users.avatar` 为可访问 URL。
   - 在 `backend/index.js` 中增加静态资源挂载：`app.use('/uploads', express.static(...))`。

3. **后端关注 API**
   - 新建 `backend/routes/follows.js`，实现：
     - `GET /api/follows`：返回当前用户关注的用户列表（基本信息）。
     - `POST /api/follows`：Body `{ targetUserId }`，新增关注关系，幂等处理并禁止关注自己。
     - `DELETE /api/follows/:targetUserId`：取消关注。
   - 在 `backend/index.js` 中挂载 `/api/follows` 路由。

4. **登录补全 username 逻辑**
   - 更新 `backend/routes/auth.js` 登录逻辑：
     - 新建用户时插入 `username` 字段（可基于手机号派生默认用户名）。
     - 老用户登录时如 `username` 为空则自动生成并更新。
     - 在返回的 `user` JSON 中带上 `username` 字段。

5. **前端服务层扩展（services/storage.ts）**
   - 增加 User 类型字段 `username`（在 `types.ts` 中扩展 `User` 接口）。
   - 新增方法：
     - `fetchProfile()` / `updateProfile({ username?, nickname? })`。
     - `uploadAvatar(file: File)`。
     - `searchUsers(query: string)`、`getFollows()`、`followUser(targetUserId)`、`unfollowUser(targetUserId)`。
     - `fetchUserProfileById(userId)`、`fetchUserHabits(userId)`、`fetchUserCheckins(userId)`。

6. **前端 UI 改造**
   - 在「我的」（`pages/Profile.tsx`）中：
     - 展示 `username`，并增加“编辑资料”弹窗：支持修改 `username` + `nickname`，上传头像。
     - 增加“关注管理”区域：上半部分搜索用户，下半部分展示已关注用户列表；列表项点击跳转到 `/user/:userId/stats`。
   - 新建 `pages/UserStats.tsx`：
     - 路由 `/user/:userId/stats`（在 `App.tsx` 中增加私有路由），只读展示目标用户的统计数据，复用现有统计组件逻辑和工具方法。

7. **Docker 与部署**
   - 在 `docker-compose.yml` 中为 `backend` 服务增加头像目录卷挂载：`./uploads:/app/uploads`。
   - 确认 Nginx 前端仍通过 `/api` 路由访问后端，头像 URL `/uploads/...` 直接由后端容器对外暴露，或根据需要通过 Nginx 反向代理。

## 预期结果
- 用户可以在「我的」页面修改用户名、昵称并上传头像；所有信息持久化在 MySQL 中。
- 用户可以通过用户名或手机号搜索其他用户并关注/取消关注，在「关注列表」中看到关注的人。
- 用户可以从关注列表进入 `/user/:userId/stats`，查看对方的习惯和打卡历史统计视图，打卡数据默认对所有登录用户公开。
- 头像文件保存在后端容器挂载的 `uploads/avatars` 目录中，Docker 部署时通过卷保证持久存储。

