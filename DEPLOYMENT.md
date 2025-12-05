# 部署与运行指南

## 一、本地开发环境启动（推荐先走这一步）

1. 基础依赖  
   - Node.js ≥ 20（用于前端与后端）  
   - MySQL 8（本地或容器均可）

2. 准备数据库（示例）  
   在本地 MySQL 中执行：
   ```sql
   CREATE DATABASE remark_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
   CREATE USER 'remark_app'@'%' IDENTIFIED BY 'ShawSong123';
   GRANT ALL PRIVILEGES ON remark_app.* TO 'remark_app'@'%';
   FLUSH PRIVILEGES;
   ```

3. 配置后端环境变量  
   在 `backend/` 目录下创建 `.env`（仅用于本地开发）：
   ```env
   BACKEND_PORT=3000
   JWT_SECRET=dev-secret-change-me
   DATABASE_URL=mysql://remark_app:ShawSong123@localhost:3306/remark_app
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
   - 在登录页切换到“注册”标签，输入邮箱 + 密码（至少 6 位，可选昵称）→ 注册并自动登录。  
   - 返回登录标签，使用同一邮箱 + 密码登录。  
   - 登录成功后可创建习惯、打卡，并在统计/荣誉页看到数据更新。

## 二、使用 1Panel 通过 Docker 部署（单独部署）

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

     # 容器内部后端始终监听 3000 端口
     # BACKEND_PORT 仅用于映射到宿主机端口，可根据需要调整
     BACKEND_PORT=33002
     JWT_SECRET=生产环境随机长密钥
     DATABASE_URL=mysql://habit_user:习惯库密码@db:3306/habit_app

     # FRONTEND_PORT 是前端 Nginx 在宿主机暴露的端口
     FRONTEND_PORT=18082  # 示例：18082，后续由 1Panel Nginx 反向代理到此端口
     ```

2. 在 1Panel 中创建编排（以“应用编排 / 自定义编排”为例）  
   - 在 1Panel 面板中选择：`应用管理` → `应用编排` → `新建编排`。  
   - 工作目录指向 `/opt/apps/remark_app`（该目录中必须包含 `docker-compose.yml`、`Dockerfile.frontend`、`backend/`、`nginx.conf`、`.env`）。  
   - 编排内容直接使用仓库中的 `docker-compose.yml`，如需修改端口/卷路径可以在 1Panel 中编辑后再保存。

3. 数据持久化与端口  
   - `docker-compose.yml` 中的 `./mysql-data:/var/lib/mysql` 会将 MySQL 数据持久化到工作目录下的 `mysql-data/`。  
   - MySQL 容器默认不再映射到宿主机端口（`db` 只在 Docker 网络内部使用），减少与宿主机已有 MySQL 的端口冲突风险。  
   - 确保服务器防火墙/安全组开放 `FRONTEND_PORT`（如 18082），对外只暴露前端服务。

4. 部署与验证  
   - 在 1Panel 中点击“部署/启动”编排，等待三个容器正常运行：`db`、`backend`、`frontend`。  
   - 查看 `backend` 日志，确认数据库连接与服务启动正常（有 `[db] Connected and schema ensured`、`[server] Listening on port 3000`）。  
   - 浏览器访问：`http://服务器IP:FRONTEND_PORT/`（例如 `http://服务器IP:18082/`），按本地方式完成登录和打卡验证。

> 生产环境建议：  
> - 修改所有默认密码与 `JWT_SECRET`。  
> - 升级/回滚时，优先更新代码目录，随后在 1Panel 中重新构建/部署编排，`mysql-data/` 卷会保留业务数据。  

## 三、在已有 hand.bigbanana.cloud 环境中共存部署（1Panel + 多域名）

你当前情况：

- 服务器上已有一个站点 `hand.bigbanana.cloud`，后端代理地址为 `http://127.0.0.1:3000`。  
- 希望在同一主机上新增本项目，对外通过 `chuang.bigbanana.cloud` 访问，并且不影响原有站点。

### 1. 端口规划（避免与已有服务冲突）

由于 `hand.bigbanana.cloud` 已经使用了 `127.0.0.1:3000` 作为后端，这个端口不能再被本项目占用。因此：

1. 在 `.env` 中设置：
   ```env
   # 避免占用 3000，改用高位端口映射到宿主机
   BACKEND_PORT=33002
   FRONTEND_PORT=18082
   ```
   含义：
   - 容器内部后端仍然监听 3000 端口（由 `docker-compose.yml` 和应用内部约定），  
   - 宿主机将 `127.0.0.1:33002` 映射到容器 `backend:3000`，  
   - 宿主机将 `127.0.0.1:18082` 映射到容器前端 Nginx（`frontend:80`）。

2. 保持现有 `hand.bigbanana.cloud -> 127.0.0.1:3000` 的反向代理配置不变。

### 2. 在 1Panel 中部署本项目（编排层面）

步骤与“二、使用 1Panel 通过 Docker 部署” 基本一致：

1. 在 1Panel 中创建新的“应用编排”，工作目录指向 `/opt/apps/remark_app`，使用本仓库的 `docker-compose.yml` 与 `.env`。  
2. 部署/启动编排，确认：
   - `db`、`backend`、`frontend` 三个容器都处于运行状态；  
   - `backend` 日志中存在 `[server] Listening on port 3000`；  
   - 在服务器上本地访问 `curl http://127.0.0.1:18082/` 能返回前端 HTML。

此时：

- 旧站点仍然通过 `hand.bigbanana.cloud` + `127.0.0.1:3000` 访问；  
- 新项目前端暂时通过 `http://服务器IP:18082/` 访问。

### 3. 在 1Panel 中为 chuang.bigbanana.cloud 配置反向代理

1. 在 1Panel 控制台中打开“网站/站点管理”（具体名称取决于 1Panel 版本），点击“创建站点”：  
   - 域名填写：`chuang.bigbanana.cloud`；  
   - 类型选择：**反向代理**（或“反代站点”）；  
   - 反向代理目标地址配置为：`http://127.0.0.1:18082`。  

2. 如需 HTTPS：
   - 在 1Panel 中为 `chuang.bigbanana.cloud` 申请或导入证书；  
   - 启用强制 HTTPS（可选）。  

3. 保存配置并重载 Nginx 后，你应可以通过：
   ```text
   https://chuang.bigbanana.cloud
   ```
   访问本项目，而原有：
   ```text
   https://hand.bigbanana.cloud
   ```
   仍然保持使用原有后端 `http://127.0.0.1:3000`。

### 4. 验证共存效果

1. 分别访问：
   - `https://hand.bigbanana.cloud`（旧站点）；  
   - `https://chuang.bigbanana.cloud`（本项目）。  
2. 确认：
   - 两个站点都可正常访问；  
   - 在 `chuang.bigbanana.cloud` 上完成注册/登录 → 创建习惯 → 打卡 → 生成分享卡片，各功能正常；  
   - 旧站点的访问和功能没有受到影响。

> 提示：  
> - 若后续你需要再新增其他项目，只需为新项目分配不同的 `FRONTEND_PORT`，并在 1Panel 中为对应域名配置新的反向代理到该端口，即可与现有多个站点共存。  
> - 后端容器内部端口可以固定为 3000，通过宿主机不同端口映射 + 反向代理来隔离，不必暴露多个 3000。  
