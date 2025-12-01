# 安全认证系统# 🔐 登录系统现状总结



企业级全栈认证系统,基于 FastAPI + React + Supabase PostgreSQL。## 📊 完善程度：85%



## ✨ 功能特性### ✅ 已完成的核心功能



### 🔐 认证方式#### 后端 (FastAPI)

- **用户名 + 密码登录** - 带密码强度验证- ✅ 用户注册接口 (`/register`)

- **Google OAuth 登录** - 一键登录- ✅ 邮箱/密码登录 (`/token`)

- **邮箱验证** - 注册后必须验证邮箱才能激活- ✅ Google OAuth 登录 (`/login/google`)

- **忘记密码** - 通过邮件重置密码- ✅ JWT Token 生成和验证

- ✅ Token 刷新机制 (`/refresh`)

### 🛡️ 安全功能- ✅ 用户信息查询 (`/me`)

- **hCaptcha 验证码** - 防机器人注册- ✅ 密码 bcrypt 加密

- **JWT 令牌认证** - 无状态会话管理- ✅ 角色权限系统（free/premium/admin）

- **bcrypt 密码加密** - 行业标准加密- ✅ 积分系统

- **登录日志记录** - 完整的审计追踪- ✅ CORS 跨域支持

- **异常登录检测** - 新设备/IP 自动提醒- ✅ 单元测试覆盖

- **账号锁定机制** - 5次失败自动锁定

#### 前端 (React + TypeScript)

---- ✅ Material-UI 精美界面（毛玻璃效果）

- ✅ 邮箱/密码登录表单

## 🚀 快速开始- ✅ Google One Tap 登录集成

- ✅ 自动 Token 刷新（5分钟）

### 1️⃣ 后端设置- ✅ 登录状态持久化

- ✅ 用户信息展示

```bash- ✅ 登出功能

cd backend- ✅ 错误提示

pip install -r requirements.txt

---

# 配置 .env 文件(参考下方环境变量说明)

uvicorn app:app --reload --port 8000## ⚠️ 需要完成的配置（15%）

```

### 🔴 必须完成（阻塞运行）

### 2️⃣ 前端设置

#### 1. 创建 Supabase 数据库表

```bash**状态：** ❌ 未创建  

cd frontend**影响：** 系统无法注册/登录  

npm install**解决方案：**

npm start  # 访问 http://localhost:3003

```**方法一：使用 SQL 脚本（推荐）**

```sql

### 3️⃣ 数据库初始化-- 在 Supabase Dashboard → SQL Editor 中执行

-- 脚本位置: backend/init_db.sql

在 Supabase SQL Editor 执行 `backend/init_db.sql````



---**方法二：使用 Python 脚本**

```powershell

## 📁 项目结构cd backend

pip install python-dotenv  # 如果未安装

```python init_db.py

Vwin/```

├── backend/

│   ├── app.py              # FastAPI 主程序#### 2. 配置 Supabase 数据库 URL

│   ├── requirements.txt    # Python 依赖**状态：** ⚠️ 使用占位符  

│   ├── init_db.sql         # 数据库初始化**当前值：** `postgresql://user:pass@host:6543/postgres`  

│   └── .env               # 环境变量**需要：** 真实的 Supabase 连接字符串

├── frontend/

│   └── src/**获取步骤：**

│       ├── App.tsx         # React 主组件1. 登录 https://app.supabase.com/

│       └── index.tsx       # 入口文件2. 选择项目 → Settings → Database

└── README.md3. 复制 Connection string (URI 格式，使用 Transaction pooling)

```4. 更新 `backend/.env` 中的 `SUPABASE_URL`



---#### 3. 配置 JWT 密钥

**状态：** ⚠️ 使用弱密钥  

## 🔧 环境变量**当前值：** `change-me`  

**需要：** 强随机字符串

### backend/.env

**生成密钥：**

```env```python

JWT_SECRET_KEY=your-secret-keyimport secrets

SUPABASE_URL=postgresql://user:pass@host:6543/postgresprint(secrets.token_urlsafe(32))

CORS_ALLOW_ORIGINS=http://localhost:3003```

SMTP_HOST=smtp.qq.com

SMTP_PORT=587---

SMTP_USER=your-email@qq.com

SMTP_PASSWORD=your-qq-auth-code### 🟡 可选配置

SMTP_FROM=your-email@qq.com

FRONTEND_URL=http://localhost:3003#### 4. Google OAuth（如需要 Google 登录）

```**状态：** ⚠️ 未配置  

**步骤：**

---1. 访问 https://console.cloud.google.com/

2. 创建 OAuth 2.0 客户端 ID

## 🛠️ 技术栈3. 配置重定向 URI: `http://localhost:3002`

4. 更新 `.env` 文件中的 `GOOGLE_CLIENT_ID`

- **后端**: FastAPI + SQLAlchemy + JWT + bcrypt

- **前端**: React 19 + TypeScript + Material-UI---

- **数据库**: Supabase PostgreSQL

- **安全**: hCaptcha + Google OAuth## 🚀 快速开始



---### 1. 安装依赖



## 📖 使用流程**后端：**

```powershell

1. **注册** → 填写信息 → 完成验证码 → 收到验证邮件cd backend

2. **激活** → 点击邮件链接 → 账号激活pip install -r requirements.txt

3. **登录** → 用户名/密码 或 Google 登录```

4. **忘记密码** → 输入邮箱 → 收到重置链接 → 设置新密码

**前端：**

---```powershell

cd frontend

**🎉 祝您使用愉快!**npm install

```

### 2. 配置检查
```powershell
cd backend
python check_setup.py
```

### 3. 初始化数据库
```powershell
cd backend
python init_db.py
```

### 4. 启动服务

**后端（终端 1）：**
```powershell
cd backend
uvicorn app:app --reload --port 8001
```

**前端（终端 2）：**
```powershell
cd frontend
npm start
```

### 5. 访问系统
- 🌐 前端: http://localhost:3002
- 📚 API 文档: http://localhost:8001/docs

---

## 📁 项目结构

```
Vwin/
├── backend/
│   ├── app.py              # FastAPI 主应用
│   ├── requirements.txt    # Python 依赖
│   ├── .env                # 环境变量 ⚠️ 需配置
│   ├── init_db.sql         # 数据库初始化 SQL
│   ├── init_db.py          # 数据库初始化脚本
│   ├── check_setup.py      # 配置检查工具
│   └── test_auth.py        # 单元测试
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # 主应用组件
│   │   ├── auth.ts         # 认证客户端
│   │   └── ...
│   ├── package.json        # Node 依赖
│   └── .env                # 前端环境变量
│
├── SETUP.md                # 详细配置指南
└── README.md               # 本文件
```

---

## 🗄️ 数据库表结构

```sql
users 表:
- id            UUID (主键)
- email         VARCHAR(255) (唯一)
- password_hash TEXT
- role          VARCHAR(50) (默认: 'free')
- points        INTEGER (默认: 100)
- created_at    TIMESTAMP
- updated_at    TIMESTAMP
```

---

## 🔒 安全特性

- ✅ bcrypt 密码加密
- ✅ JWT Token 认证
- ✅ CORS 白名单
- ✅ SQL 注入防护（参数化查询）
- ⚠️ Token 存储在 localStorage（生产环境建议改用 httpOnly Cookie）

---

## 🧪 测试

```powershell
cd backend
pytest test_auth.py -v
```

**测试覆盖：**
- ✅ 用户注册
- ✅ 用户登录
- ✅ Token 验证
- ✅ Token 刷新

---

## 📝 待添加功能建议

1. 🔐 邮箱验证
2. 🔑 密码重置/找回
3. 👤 用户资料编辑
4. 🔒 双因素认证 (2FA)
5. 📊 用户活动日志
6. 🚫 账号封禁/解封
7. 💳 积分充值系统
8. 📧 邮件通知

---

## 🐛 故障排查

### 问题：无法连接数据库
**解决：**
- 检查 `SUPABASE_URL` 是否正确
- 确认网络连接
- 检查 Supabase 项目状态

### 问题：导入错误
**解决：**
```powershell
pip install -r requirements.txt
```

### 问题：CORS 错误
**解决：**
- 检查 `CORS_ALLOW_ORIGINS` 配置
- 确认前端地址正确

---

## 📚 相关文档

- [详细配置指南](./SETUP.md)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Supabase 文档](https://supabase.com/docs)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

---

## ✅ 检查清单

启动前请确认：

- [ ] 已安装后端依赖 (`pip install -r requirements.txt`)
- [ ] 已安装前端依赖 (`npm install`)
- [ ] 已配置 `backend/.env` 中的 `SUPABASE_URL`
- [ ] 已配置 `JWT_SECRET_KEY`
- [ ] 已运行 `init_db.py` 创建数据库表
- [ ] （可选）已配置 Google OAuth
- [ ] 运行 `check_setup.py` 检查通过

---

**总结：系统核心功能已完成，只需完成数据库配置即可运行！** 🎉
#   w i n  
 