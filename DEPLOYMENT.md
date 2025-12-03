# 部署与运行指南

## 一、本地开发环境启动（推荐先走这一步）

1. 基础依赖  
   - Node.js ≥ 20（用于前端与后端）  
   - MySQL 8（本地或容器均可）

2. 准备数据库（示例）  
   在本地 MySQL 中执行：
   ```sql
   CREATE DATABASE habit_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   CREATE USER 'songshouli'@'%' IDENTIFIED BY 'ShawSong123';
   GRANT ALL PRIVILEGES ON habit_app.* TO 'songshouli'@'%';
   FLUSH PRIVILEGES;
   ```

3. 配置后端环境变量  
   在 `backend/` 目录下创建 `.env`（仅用于本地开发）：
   ```env
   BACKEND_PORT=3000
   JWT_SECRET=dev-secret-change-me
   DATABASE_URL=mysql://habit_user:habit_password@localhost:3306/habit_app
   ```

4. 启动后端服务  
   ```bash
   cd backend
   npm install
   npm start
   ```
   启动成功后应看到日志：`[server] Listening on port 3000`。

5. 启动前端（Vite）  
   ```bash
   cd /path/to/remark_app
   npm install
   npm run dev
   ```
   默认访问：`http://localhost:5173`，前端通过代理访问 `http://localhost:3000/api/*`。

6. 手动验证登录流程  
   - 在登录页输入手机号 → 点击 `Get Code`。  
   - 在后端控制台中查看验证码日志（`[auth] send-code for <phone>: <code>`），将验证码填入页面 → `Start`。  
   - 登录成功后可创建习惯、打卡，并在统计/荣誉页看到数据更新。

## 二、使用 1Panel 通过 Docker 部署

> 前提：服务器已安装 Docker 与 1Panel，并具备外网访问权限。

1. 准备代码与配置  
   - 将本仓库上传或拉取到服务器某目录，例如：`/opt/apps/remark_app`。  
   - 在该目录下执行：
     ```bash
     cd /opt/apps/remark_app
     cp .env.example .env
     ```
   - 编辑 `.env`，根据生产环境修改：
     ```env
     MYSQL_ROOT_PASSWORD=强密码
     MYSQL_DATABASE=habit_app
     MYSQL_USER=habit_user
     MYSQL_PASSWORD=习惯库密码

     BACKEND_PORT=3000
     JWT_SECRET=生产环境随机长密钥
     DATABASE_URL=mysql://habit_user:习惯库密码@db:3306/habit_app

     FRONTEND_PORT=80  # 对外暴露端口，可改为 8080 等
     ```

2. 在 1Panel 中创建编排（以“应用编排 / 自定义编排”为例）  
   - 在 1Panel 面板中选择：`应用管理` → `应用编排` → `新建编排`。  
   - 工作目录指向 `/opt/apps/remark_app`（该目录中必须包含 `docker-compose.yml`、`Dockerfile.frontend`、`backend/`、`nginx.conf`、`.env`）。  
   - 编排内容直接使用仓库中的 `docker-compose.yml`，如需修改端口/卷路径可以在 1Panel 中编辑后再保存。

3. 数据持久化与端口  
   - `docker-compose.yml` 中的 `./mysql-data:/var/lib/mysql` 会将 MySQL 数据持久化到工作目录下的 `mysql-data/`。  
   - 确保服务器防火墙/安全组开放 `FRONTEND_PORT`（默认为 80），MySQL 端口一般不对公网开放（3306 可只在内网使用）。

4. 部署与验证  
   - 在 1Panel 中点击“部署/启动”编排，等待三个容器正常运行：`db`、`backend`、`frontend`。  
   - 查看 `backend` 日志，确认数据库连接与服务启动正常（有 `[db] Connected and schema ensured`、`[server] Listening on port 3000`）。  
   - 浏览器访问：`http://服务器IP/`（或 `http://服务器IP:FRONTEND_PORT/`），按本地方式完成登录和打卡验证。

> 生产环境建议：  
> - 修改所有默认密码与 `JWT_SECRET`。  
> - 若对安全敏感，可在上线前去掉 `/api/auth/send-code` 返回验证码的字段，仅保留日志输出或接入短信服务。  
> - 升级/回滚时，优先更新代码目录，随后在 1Panel 中重新构建/部署编排，`mysql-data/` 卷会保留业务数据。  

