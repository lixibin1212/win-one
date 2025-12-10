"""
完整的安全认证后端 - 包含所有高级功能
- hCaptcha 验证码
- 邮箱验证激活
- Redis 速率限制
- 登录日志
- 异常检测
- 用户名+密码登录
- Google OAuth 登录
"""
from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, validator
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool
from datetime import datetime, timedelta
import aiohttp
import os
import secrets
import re
from typing import Optional
from user_agents import parse as parse_user_agent
import httpx
import logging
from dotenv import load_dotenv
from schemas import VideoGenerationRequest, TaskResponse
from service import veo_service

# 加载 .env 文件
load_dotenv()

# === 配置日志 ===
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Redis 和速率限制
try:
    import redis
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️  Redis 未安装，速率限制功能将被禁用")

# === 环境变量配置 ===
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 14  # 14 days

# 数据库
SUPABASE_URL = os.getenv("SUPABASE_URL", "postgresql://postgres:password@localhost:5432/postgres")

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# hCaptcha
HCAPTCHA_SECRET = os.getenv("HCAPTCHA_SECRET", "")
HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify"

# 邮件配置
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@yourdomain.com")

# 前端 URL（用于邮箱验证链接）
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3002")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# CORS
CORS_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://localhost:3002").split(",")

# === Sora API Configuration ===
SORA_API_KEY = "sk-a4f3a6be3c7a4c6d95633f4092586b59"
SORA_BASE_URL = "https://api.grsai.com/v1"

# === Nano Banana API Configuration ===
NANO_API_KEY = "sk-pKzjE8Mz3UNxSWBd39s8DvXVNCf1g6v4CNbmhzb0Vv0koFVl"
NANO_BASE_URL = "https://api.xgai.site/v1"

# === 初始化 FastAPI ===
app = FastAPI(title="安全认证系统", version="2.0.0")

# === Redis 速率限制 ===
if REDIS_AVAILABLE:
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        limiter = Limiter(key_func=get_remote_address, storage_uri=REDIS_URL)
        app.state.limiter = limiter
        app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    except Exception as e:
        print(f"⚠️  Redis 连接失败: {e}, 速率限制功能将被禁用")
        REDIS_AVAILABLE = False

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 密码加密 ===
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# === OAuth2 ===
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# ============================================
# Pydantic 模型
# ============================================

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    captcha_token: str  # hCaptcha token
    
    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', v):
            raise ValueError('用户名必须是3-20位字母、数字或下划线')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码至少8位')
        if not re.search(r'[A-Z]', v):
            raise ValueError('密码必须包含大写字母')
        if not re.search(r'[a-z]', v):
            raise ValueError('密码必须包含小写字母')
        if not re.search(r'[0-9]', v):
            raise ValueError('密码必须包含数字')
        return v

class UserLogin(BaseModel):
    username: str
    password: str
    captcha_token: Optional[str] = None

class GoogleLoginReq(BaseModel):
    id_token: str

class EmailVerifyReq(BaseModel):
    token: str

class ResendVerificationReq(BaseModel):
    email: EmailStr

class ForgotPasswordReq(BaseModel):
    email: EmailStr

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码至少8位')
        if not re.search(r'[A-Z]', v):
            raise ValueError('密码必须包含大写字母')
        if not re.search(r'[a-z]', v):
            raise ValueError('密码必须包含小写字母')
        if not re.search(r'[0-9]', v):
            raise ValueError('密码必须包含数字')
        return v

class SoraGenerateRequest(BaseModel):
    prompt: str
    url: Optional[str] = None
    aspectRatio: str = "9:16"
    duration: int = 10
    size: str = "small"

class NanoGenerateRequest(BaseModel):
    model: str
    prompt: str
    aspect_ratio: Optional[str] = "16:9"
    image_size: Optional[str] = "1K"
    images: Optional[list[str]] = None

# ============================================
# 数据库工具函数
# ============================================

# 创建 SQLAlchemy 引擎(使用 Supabase Transaction Pooler)
# Transaction Pooler 端口6543,用户名格式: postgres.项目ref
DATABASE_URL = "postgresql://postgres.vvrexwgovtnjdcdlwciw:6PeHd7pRt6zlbqXA@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    connect_args={
        "sslmode": "require",
        "connect_timeout": 10
    }
)

def get_user_by_username(username: str):
    """通过用户名获取用户"""
    logger.info(f"🔍 查询用户: {username}")
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE username=:username"),
                {"username": username}
            )
            user = result.fetchone()
            if user:
                logger.info(f"✅ 找到用户: {username}")
                return dict(user._mapping)  # 转换为字典
            else:
                logger.info(f"ℹ️  用户不存在: {username}")
                return None
    except Exception as e:
        logger.error(f"❌ 查询用户失败: {e}")
        raise

def get_user_by_email(email: str):
    """通过邮箱获取用户"""
    logger.info(f"🔍 查询邮箱: {email}")
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT * FROM users WHERE email=:email"),
                {"email": email}
            )
            user = result.fetchone()
            if user:
                logger.info(f"✅ 找到邮箱: {email}")
                return dict(user._mapping)
            else:
                logger.info(f"ℹ️  邮箱不存在: {email}")
                return None
    except Exception as e:
        logger.error(f"❌ 查询邮箱失败: {e}")
        raise

def create_user(username: str, email: str, password: str, google_id: str = None):
    """创建新用户"""
    logger.info(f"👤 创建用户 - 用户名: {username}, 邮箱: {email}")
    
    hashed = pwd_context.hash(password) if password else None
    verification_token = secrets.token_urlsafe(32)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    INSERT INTO users (
                        username, email, password_hash, google_id, 
                        email_verified, is_active, verification_token,
                        verification_token_expires
                    )
                    VALUES (:username, :email, :password_hash, :google_id, 
                            :email_verified, :is_active, :verification_token,
                            :verification_token_expires)
                    RETURNING *
                """),
                {
                    "username": username,
                    "email": email,
                    "password_hash": hashed,
                    "google_id": google_id,
                    "email_verified": google_id is not None,
                    "is_active": google_id is not None,
                    "verification_token": verification_token if not google_id else None,
                    "verification_token_expires": datetime.utcnow() + timedelta(hours=24) if not google_id else None
                }
            )
            user = result.fetchone()
            conn.commit()
            logger.info(f"✅ 用户创建成功 - ID: {user[0]}")
            return dict(user._mapping), verification_token if not google_id else None
    except Exception as e:
        logger.error(f"❌ 创建用户失败: {e}")
        raise

def verify_email_token(token: str):
    """验证邮箱令牌"""
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    UPDATE users 
                    SET email_verified = TRUE, 
                        is_active = TRUE,
                        verification_token = NULL,
                        verification_token_expires = NULL
                    WHERE verification_token = :token 
                      AND verification_token_expires > NOW()
                    RETURNING *
                """),
                {"token": token}
            )
            user = result.fetchone()
            conn.commit()
            return dict(user._mapping) if user else None
    except Exception as e:
        logger.error(f"❌ 验证邮箱失败: {e}")
        raise

def log_login_attempt(
    username: str,
    user_id: Optional[str],
    success: bool,
    ip_address: str,
    user_agent: str,
    login_method: str = "password",
    is_suspicious: bool = False,
    suspicious_reason: str = None
):
    """记录登录日志"""
    ua = parse_user_agent(user_agent)
    device_type = "mobile" if ua.is_mobile else "pc" if ua.is_pc else "bot"
    
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO login_logs (
                        user_id, username, login_method, success,
                        ip_address, user_agent, device_type,
                        is_suspicious, suspicious_reason
                    )
                    VALUES (:user_id, :username, :login_method, :success,
                            :ip_address, :user_agent, :device_type,
                            :is_suspicious, :suspicious_reason)
                """),
                {
                    "user_id": user_id,
                    "username": username,
                    "login_method": login_method,
                    "success": success,
                    "ip_address": ip_address,
                    "user_agent": user_agent,
                    "device_type": device_type,
                    "is_suspicious": is_suspicious,
                    "suspicious_reason": suspicious_reason
                }
            )
            conn.commit()
    except Exception as e:
        logger.error(f"❌ 记录登录日志失败: {e}")

def update_login_info(user_id: str, ip_address: str):
    """更新用户登录信息"""
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE users 
                    SET last_login_at = NOW(),
                        last_login_ip = :ip_address,
                        failed_login_attempts = 0
                    WHERE id = :user_id
                """),
                {"ip_address": ip_address, "user_id": user_id}
            )
            conn.commit()
    except Exception as e:
        logger.error(f"❌ 更新登录信息失败: {e}")

def increment_failed_login(username: str):
    """增加失败登录次数"""
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE users 
                    SET failed_login_attempts = failed_login_attempts + 1,
                        is_locked = CASE 
                            WHEN failed_login_attempts >= 4 THEN TRUE 
                            ELSE FALSE 
                        END
                    WHERE username = :username
                """),
                {"username": username}
            )
            conn.commit()
    except Exception as e:
        logger.error(f"❌ 增加失败登录次数失败: {e}")

def check_suspicious_login(user_id: str, ip_address: str, user_agent: str) -> tuple[bool, str]:
    """检测可疑登录"""
    try:
        with engine.connect() as conn:
            # 检查是否是新 IP
            result = conn.execute(
                text("""
                    SELECT COUNT(*) as count 
                    FROM login_logs 
                    WHERE user_id = :user_id AND ip_address = :ip_address AND success = TRUE
                """),
                {"user_id": user_id, "ip_address": ip_address}
            )
            row = result.fetchone()
            
            if row[0] == 0:
                return True, "新IP地址登录"
            
            # 检查是否是新设备
            ua = parse_user_agent(user_agent)
            device_type = "mobile" if ua.is_mobile else "pc"
            
            result = conn.execute(
                text("""
                    SELECT COUNT(*) as count 
                    FROM login_logs 
                    WHERE user_id = :user_id AND device_type = :device_type AND success = TRUE
                """),
                {"user_id": user_id, "device_type": device_type}
            )
            row = result.fetchone()
            
            if row[0] == 0:
                return True, f"新设备类型登录: {device_type}"
        
        return False, ""
    except Exception as e:
        logger.error(f"❌ 检测可疑登录失败: {e}")
        return False, ""

# ============================================
# 验证码验证
# ============================================

async def verify_hcaptcha(token: str, remote_ip: str) -> bool:
    """验证 hCaptcha token"""
    if not HCAPTCHA_SECRET:
        logger.warning("⚠️  未配置 hCaptcha，跳过验证（仅开发环境）")
        return True  # 开发环境可跳过
    
    logger.info(f"🔐 正在验证 hCaptcha token...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                HCAPTCHA_VERIFY_URL,
                data={
                    "secret": HCAPTCHA_SECRET,
                    "response": token,
                    "remoteip": remote_ip
                }
            )
            result = response.json()
            success = result.get("success", False)
            
            if success:
                logger.info(f"✅ hCaptcha 验证成功")
            else:
                logger.error(f"❌ hCaptcha 验证失败: {result}")
            
            return success
        except Exception as e:
            logger.error(f"❌ hCaptcha 验证异常: {e}")
            return False

# ============================================
# 邮件发送
# ============================================

async def send_verification_email(email: str, token: str):
    """发送邮箱验证邮件"""
    verification_url = f"{FRONTEND_URL}/verify?token={token}"
    
    logger.info(f"📧 开始发送验证邮件...")
    logger.info(f"📮 收件人: {email}")
    logger.info(f"🔗 验证链接: {verification_url}")
    
    if not SMTP_USER:
        logger.warning(f"⚠️  未配置 SMTP，跳过发送邮件")
        logger.info(f"📋 请复制以下链接手动验证:")
        logger.info(f"👉 {verification_url}")
        return
    
    subject = "验证您的邮箱地址"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>欢迎注册！</h2>
        <p>请点击下面的链接验证您的邮箱地址：</p>
        <p><a href="{verification_url}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">验证邮箱</a></p>
        <p>或复制此链接到浏览器：<br>{verification_url}</p>
        <p>此链接将在24小时后过期。</p>
        <hr>
        <p style="color: #666; font-size: 12px;">如果您没有注册账号，请忽略此邮件。</p>
    </body>
    </html>
    """
    
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        logger.info(f"📤 连接 SMTP 服务器: {SMTP_HOST}:{SMTP_PORT}")
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM
        message["To"] = email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"✅ 验证邮件已成功发送到: {email}")
    except Exception as e:
        logger.error(f"❌ 发送邮件失败: {e}")
        logger.info(f"📋 验证链接（请手动复制）:")
        logger.info(f"👉 {verification_url}")

async def send_password_reset_email(email: str, token: str):
    """发送密码重置邮件"""
    logger.info(f"📧 开始发送密码重置邮件...")
    logger.info(f"📮 收件人: {email}")
    
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    logger.info(f"🔗 重置链接: {reset_url}")
    
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("⚠️  未配置 SMTP，跳过发送邮件")
        logger.info(f"📋 请复制以下链接手动重置密码:")
        logger.info(f"👉 {reset_url}")
        return
    
    subject = "重置您的密码"
    html_content = f"""
    <html>
      <body>
        <h2>密码重置请求</h2>
        <p>您好,</p>
        <p>我们收到了重置您账户密码的请求。</p>
        <p>请点击下面的链接重置密码（链接24小时内有效）：</p>
        <p><a href="{reset_url}">重置密码</a></p>
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        <p>此链接将在24小时后过期。</p>
      </body>
    </html>
    """
    
    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        logger.info(f"📤 连接 SMTP 服务器: {SMTP_HOST}:{SMTP_PORT}")
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = SMTP_FROM
        message["To"] = email
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True
        )
        logger.info(f"✅ 密码重置邮件已成功发送到: {email}")
    except Exception as e:
        logger.error(f"❌ 发送邮件失败: {e}")
        logger.info(f"📋 重置链接（请手动复制）:")
        logger.info(f"👉 {reset_url}")

# ============================================
# JWT Token 工具
# ============================================

def create_access_token(data: dict):
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    """获取当前用户"""
    credentials_exception = HTTPException(status_code=401, detail="无效的认证信息")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
        
        user = get_user_by_username(username)
        if not user:
            raise credentials_exception
        
        if not user['is_active']:
            raise HTTPException(status_code=403, detail="账号未激活，请验证邮箱")
        
        if user['is_locked']:
            raise HTTPException(status_code=403, detail="账号已被锁定")
        
        return user
    except JWTError:
        raise credentials_exception

# ============================================
# API 路由
# ============================================

@app.post("/register")
async def register(
    data: UserRegister,
    request: Request,
    background_tasks: BackgroundTasks
):
    """用户注册"""
    logger.info(f"📝 收到注册请求 - 用户名: {data.username}, 邮箱: {data.email}")
    
    # 1. 验证 hCaptcha
    client_ip = request.client.host
    logger.info(f"🔍 验证 hCaptcha - IP: {client_ip}")
    
    if not await verify_hcaptcha(data.captcha_token, client_ip):
        logger.warning(f"❌ hCaptcha 验证失败 - 用户名: {data.username}")
        raise HTTPException(status_code=400, detail="验证码验证失败")
    
    logger.info(f"✅ hCaptcha 验证成功")
    
    # 2. 检查用户名是否已存在
    if get_user_by_username(data.username):
        logger.warning(f"❌ 用户名已存在: {data.username}")
        raise HTTPException(status_code=409, detail="用户名已被注册")
    
    logger.info(f"✅ 用户名可用: {data.username}")
    
    # 3. 检查邮箱是否已存在
    if get_user_by_email(data.email):
        logger.warning(f"❌ 邮箱已存在: {data.email}")
        raise HTTPException(status_code=409, detail="邮箱已被注册")
    
    logger.info(f"✅ 邮箱可用: {data.email}")
    
    # 4. 创建用户
    try:
        logger.info(f"💾 创建新用户...")
        user, verification_token = create_user(data.username, data.email, data.password)
        logger.info(f"✅ 用户创建成功 - ID: {user['id']}")
    except Exception as e:
        logger.error(f"❌ 创建用户失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建用户失败: {str(e)}")
    
    # 5. 发送验证邮件（后台任务）
    if verification_token:
        logger.info(f"📧 准备发送验证邮件到: {data.email}")
        logger.info(f"🔑 验证令牌: {verification_token}")
        background_tasks.add_task(send_verification_email, data.email, verification_token)
    
    logger.info(f"🎉 注册流程完成 - 用户名: {data.username}")
    
    return {
        "message": "注册成功！请查收验证邮件激活账号。",
        "username": user['username'],
        "email": user['email']
    }

@app.post("/verify-email")
async def verify_email(data: EmailVerifyReq):
    """验证邮箱"""
    user = verify_email_token(data.token)
    if not user:
        raise HTTPException(status_code=400, detail="验证链接无效或已过期")
    
    # 生成登录 token
    token = create_access_token({
        "sub": user['username'],
        "role": user['role'],
        "points": user['points']
    })
    
    return {
        "message": "邮箱验证成功！",
        "access_token": token,
        "token_type": "bearer"
    }

@app.post("/resend-verification")
async def resend_verification(
    data: ResendVerificationReq,
    background_tasks: BackgroundTasks
):
    """重新发送验证邮件"""
    user = get_user_by_email(data.email)
    if not user:
        # 安全考虑：不透露邮箱是否存在
        return {"message": "如果该邮箱已注册，验证邮件将发送到您的邮箱"}
    
    if user['email_verified']:
        raise HTTPException(status_code=400, detail="该邮箱已验证")
    
    # 生成新 token
    new_token = secrets.token_urlsafe(32)
    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    UPDATE users 
                    SET verification_token = :token,
                        verification_token_expires = :expires
                    WHERE email = :email
                """),
                {
                    "token": new_token,
                    "expires": datetime.utcnow() + timedelta(hours=24),
                    "email": data.email
                }
            )
            conn.commit()
    except Exception as e:
        logger.error(f"❌ 更新验证令牌失败: {e}")
        raise HTTPException(status_code=500, detail="服务器错误")
    
    background_tasks.add_task(send_verification_email, data.email, new_token)
    
    return {"message": "验证邮件已重新发送"}

@app.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordReq,
    background_tasks: BackgroundTasks
):
    """请求重置密码"""
    logger.info(f"🔐 收到密码重置请求: {data.email}")
    
    user = get_user_by_email(data.email)
    if not user:
        # 安全考虑：不透露邮箱是否存在
        logger.info(f"ℹ️  邮箱不存在，但返回成功消息")
        return {"message": "如果该邮箱已注册，重置链接将发送到您的邮箱"}
    
    # 生成重置令牌
    reset_token = secrets.token_urlsafe(32)
    logger.info(f"🎫 生成重置令牌: {reset_token[:10]}...")
    
    try:
        with engine.connect() as conn:
            # 先删除该邮箱的旧重置请求
            conn.execute(
                text("DELETE FROM password_resets WHERE email = :email"),
                {"email": data.email}
            )
            
            # 插入新的重置请求
            conn.execute(
                text("""
                    INSERT INTO password_resets (email, token, expires_at)
                    VALUES (:email, :token, :expires_at)
                """),
                {
                    "email": data.email,
                    "token": reset_token,
                    "expires_at": datetime.utcnow() + timedelta(hours=24)
                }
            )
            conn.commit()
            logger.info(f"✅ 重置令牌已保存到数据库")
    except Exception as e:
        logger.error(f"❌ 保存重置令牌失败: {e}")
        raise HTTPException(status_code=500, detail="服务器错误")
    
    # 发送邮件
    background_tasks.add_task(send_password_reset_email, data.email, reset_token)
    
    return {"message": "如果该邮箱已注册，重置链接将发送到您的邮箱"}

@app.post("/reset-password")
async def reset_password(data: ResetPasswordReq):
    """使用令牌重置密码"""
    logger.info(f"🔐 收到密码重置确认请求")
    
    try:
        with engine.connect() as conn:
            # 查找有效的重置请求
            result = conn.execute(
                text("""
                    SELECT email FROM password_resets
                    WHERE token = :token AND expires_at > NOW()
                """),
                {"token": data.token}
            )
            row = result.fetchone()
            
            if not row:
                logger.warning(f"⚠️  无效或过期的重置令牌")
                raise HTTPException(status_code=400, detail="重置链接无效或已过期")
            
            email = row[0]
            logger.info(f"✅ 找到有效的重置请求: {email}")
            
            # 更新用户密码
            new_hash = pwd_context.hash(data.new_password)
            conn.execute(
                text("""
                    UPDATE users 
                    SET password_hash = :password_hash,
                        failed_login_attempts = 0,
                        is_locked = FALSE
                    WHERE email = :email
                """),
                {"password_hash": new_hash, "email": email}
            )
            
            # 删除已使用的重置令牌
            conn.execute(
                text("DELETE FROM password_resets WHERE token = :token"),
                {"token": data.token}
            )
            
            conn.commit()
            logger.info(f"✅ 密码已成功重置: {email}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 重置密码失败: {e}")
        raise HTTPException(status_code=500, detail="服务器错误")
    
    return {"message": "密码重置成功，请使用新密码登录"}

@app.post("/token")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """用户名 + 密码登录"""
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # 1. 获取用户
    user = get_user_by_username(form_data.username)
    
    if not user:
        log_login_attempt(form_data.username, None, False, client_ip, user_agent)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 2. 检查账号状态
    if user['is_locked']:
        log_login_attempt(
            form_data.username, user['id'], False, client_ip, user_agent,
            is_suspicious=True, suspicious_reason="账号已锁定"
        )
        raise HTTPException(status_code=403, detail="账号已被锁定，请联系管理员")
    
    if not user['is_active']:
        log_login_attempt(
            form_data.username, user['id'], False, client_ip, user_agent,
            is_suspicious=True, suspicious_reason="账号未激活"
        )
        raise HTTPException(status_code=403, detail="账号未激活，请先验证邮箱")
    
    # 3. 验证密码
    if not user['password_hash'] or not pwd_context.verify(form_data.password, user['password_hash']):
        increment_failed_login(form_data.username)
        log_login_attempt(form_data.username, user['id'], False, client_ip, user_agent)
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    # 4. 检测可疑登录
    is_suspicious, reason = check_suspicious_login(user['id'], client_ip, user_agent)
    
    # 5. 记录登录日志
    log_login_attempt(
        form_data.username, user['id'], True, client_ip, user_agent,
        is_suspicious=is_suspicious, suspicious_reason=reason
    )
    
    # 6. 更新登录信息
    update_login_info(user['id'], client_ip)
    
    # 7. 生成 token
    token = create_access_token({
        "sub": user['username'],
        "role": user['role'],
        "points": user['points']
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "suspicious_login": is_suspicious
    }

@app.post("/login/google")
async def login_google(
    data: GoogleLoginReq,
    request: Request
):
    """Google OAuth 登录"""
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # 1. 验证 Google token
    async with aiohttp.ClientSession() as session:
        async with session.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={data.id_token}"
        ) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Google token 验证失败")
            google_data = await resp.json()
            
            if google_data.get('aud') != GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=401, detail="Google Client ID 不匹配")
    
    email = google_data['email']
    google_id = google_data['sub']
    name = google_data.get('name', email.split('@')[0])
    
    # 2. 查找或创建用户
    user = get_user_by_email(email)
    
    if not user:
        # 生成唯一用户名
        username = email.split('@')[0]
        counter = 1
        while get_user_by_username(username):
            username = f"{email.split('@')[0]}{counter}"
            counter += 1
        
        user, _ = create_user(username, email, "", google_id=google_id)
    
    # 3. 记录登录
    log_login_attempt(
        user['username'], user['id'], True, client_ip, user_agent,
        login_method="google"
    )
    update_login_info(user['id'], client_ip)
    
    # 4. 生成 token
    token = create_access_token({
        "sub": user['username'],
        "role": user['role'],
        "points": user['points']
    })
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/me")
async def get_me(user = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "username": user['username'],
        "email": user['email'],
        "role": user['role'],
        "points": user['points'],
        "email_verified": user['email_verified'],
        "created_at": user['created_at']
    }

@app.post("/refresh")
async def refresh_token(user = Depends(get_current_user)):
    """刷新 token"""
    new_token = create_access_token({
        "sub": user['username'],
        "role": user['role'],
        "points": user['points']
    })
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }

@app.get("/")
def read_root():
    logger.info("🏠 访问根路径")
    return {
        "message": "安全认证系统 API",
        "version": "2.0.0",
        "features": [
            "用户名+密码登录",
            "Google OAuth 登录",
            "邮箱验证激活",
            "hCaptcha 验证码",
            "登录日志",
            "异常检测",
            "速率限制"
        ]
    }

# === Veo Video Generation APIs ===

@app.post("/api/generate/video", response_model=TaskResponse)
async def generate_video(request: VideoGenerationRequest, user = Depends(get_current_user)):
    """统一视频生成接口，根据 model 字段选择行为（veo2 或 veo2-fast-frames）"""
    try:
        task_id = await veo_service.generate_video(request)
        # 记录到数据库（pending）
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        INSERT INTO generations (task_id, model, prompt, images, aspect_ratio, status, created_at)
                        VALUES (:task_id, :model, :prompt, :images, :aspect_ratio, :status, NOW())
                    """),
                    {
                        "task_id": task_id,
                        "model": request.model,
                        "prompt": request.prompt,
                        "images": (request.images or []),
                        "aspect_ratio": request.aspect_ratio,
                        "status": "pending",
                    }
                )
                conn.commit()
        except Exception as e:
            logger.warning(f"Insert generations failed: {e}")
        return {"task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task_status(task_id: str, user = Depends(get_current_user)):
    """
    获取生成任务状态
    """
    try:
        result = await veo_service.get_task_status(task_id)
        # 如果成功，更新数据库 video_url / status
        try:
            status = result.get("status")
            video_url = result.get("video_url") or (result.get("data", {}) if isinstance(result.get("data"), dict) else {}).get("video_url")
            if status == "succeeded":
                with engine.connect() as conn:
                    conn.execute(
                        text("""
                            UPDATE generations
                            SET status = 'succeeded', video_url = :video_url, completed_at = NOW()
                            WHERE task_id = :task_id
                        """),
                        {"video_url": video_url, "task_id": task_id}
                    )
                    conn.commit()
            elif status == "failed":
                with engine.connect() as conn:
                    conn.execute(
                        text("""
                            UPDATE generations
                            SET status = 'failed', completed_at = NOW()
                            WHERE task_id = :task_id
                        """),
                        {"task_id": task_id}
                    )
                    conn.commit()
        except Exception as e:
            logger.warning(f"Update generations failed: {e}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === Sora Proxy APIs ===

@app.post("/api/proxy/sora/generate")
async def sora_generate(req: SoraGenerateRequest, user = Depends(get_current_user)):
    """Sora 视频生成代理接口"""
    url = f"{SORA_BASE_URL}/video/sora-video"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SORA_API_KEY}"
    }
    payload = {
        "model": "sora-2",
        "prompt": req.prompt,
        "webHook": "-1",
        "aspectRatio": req.aspectRatio,
        "duration": req.duration,
        "size": req.size,
        "shutProgress": False
    }
    if req.url:
        payload["url"] = req.url

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=30.0)
            if resp.status_code != 200:
                logger.error(f"Sora API Error: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail="Sora API 调用失败")
            
            data = resp.json()
            if data.get("code") != 0:
                raise HTTPException(status_code=400, detail=data.get("msg", "Unknown error"))
            task_id = data["data"]["id"]
            # 记录到 generations（pending）
            try:
                with engine.connect() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO generations (task_id, model, prompt, images, aspect_ratio, status, created_at)
                            VALUES (:task_id, :model, :prompt, :images, :aspect_ratio, :status, NOW())
                            """
                        ),
                        {
                            "task_id": task_id,
                            "model": "sora2",
                            "prompt": req.prompt,
                            "images": [],
                            "aspect_ratio": req.aspectRatio,
                            "status": "pending",
                        },
                    )
                    conn.commit()
            except Exception as e:
                logger.warning(f"Insert generations (sora) failed: {e}")
            return {"task_id": task_id}
        except httpx.RequestError as e:
            logger.error(f"Sora Request Error: {e}")
            raise HTTPException(status_code=500, detail="Sora API 请求异常")

@app.get("/api/proxy/sora/result/{task_id}")
async def sora_result(task_id: str, user = Depends(get_current_user)):
    """Sora 结果查询代理接口"""
    url = f"{SORA_BASE_URL}/draw/result"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SORA_API_KEY}"
    }
    # 注意：该接口是 POST 请求查询结果
    payload = {"id": task_id}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=30.0)
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Sora Result API 调用失败")
            
            data = resp.json()
            if data.get("code") != 0:
                return {"status": "failed", "error": data.get("msg")}
            
            inner_data = data.get("data", {})
            status = inner_data.get("status")
            
            # 映射状态到前端通用格式
            # Sora status: 'succeeded', 'processing' (假设), 'failed'
            if status == "succeeded":
                results = inner_data.get("results", [])
                video_url = results[0].get("url") if results else None
                # 更新 generations 成功记录
                try:
                    with engine.connect() as conn:
                        conn.execute(
                            text(
                                """
                                UPDATE generations
                                SET status = 'succeeded', video_url = :video_url, completed_at = NOW()
                                WHERE task_id = :task_id
                                """
                            ),
                            {"video_url": video_url, "task_id": task_id},
                        )
                        conn.commit()
                except Exception as e:
                    logger.warning(f"Update generations (sora success) failed: {e}")
                return {"status": "succeeded", "video_url": video_url, "raw": inner_data}
            elif status == "failed":
                try:
                    with engine.connect() as conn:
                        conn.execute(
                            text(
                                """
                                UPDATE generations
                                SET status = 'failed', completed_at = NOW()
                                WHERE task_id = :task_id
                                """
                            ),
                            {"task_id": task_id},
                        )
                        conn.commit()
                except Exception as e:
                    logger.warning(f"Update generations (sora failed) failed: {e}")
                return {"status": "failed", "error": inner_data.get("failure_reason")}
            else:
                return {"status": "processing", "progress": inner_data.get("progress", 0)}
                
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail="Sora Result API 请求异常")

# === Nano Banana Proxy APIs ===

@app.post("/api/proxy/nano/generate")
async def nano_generate(req: NanoGenerateRequest, user = Depends(get_current_user)):
    """Nano Banana 图片生成代理接口"""
    url = f"{NANO_BASE_URL}/images/generations"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {NANO_API_KEY}"
    }
    
    payload = {
        "model": req.model,
        "prompt": req.prompt,
        "aspect_ratio": req.aspect_ratio,
        "response_format": "url"
    }
    
    if req.model == "nano-banana-2" and req.image_size:
        payload["image_size"] = req.image_size
        
    if req.images:
        payload["image"] = req.images

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=60.0)
            if resp.status_code != 200:
                logger.error(f"Nano API Error: {resp.text}")
                raise HTTPException(status_code=resp.status_code, detail="Nano API 调用失败")
            
            data = resp.json()
            # Nano API 直接返回结果，不需要轮询
            # 将同步结果写入 generations 表
            try:
                # 生成内部 task_id（nano-<随机>）
                import uuid
                task_id = f"nano-{uuid.uuid4().hex}"
                # 提取图片/视频 URL（Nano 返回通常是图片列表或单一 url）
                image_urls: list[str] = []
                video_url = None
                # 常见返回结构：{"data": [{"url": "..."}, ...]} 或 {"url": "..."}
                if isinstance(data, dict):
                    if isinstance(data.get("data"), list):
                        for it in data["data"]:
                            u = it.get("url") if isinstance(it, dict) else None
                            if u:
                                image_urls.append(u)
                    elif data.get("url"):
                        image_urls.append(data["url"])  # 统一当作图片URL
                # 插入 succeeded 记录
                with engine.connect() as conn:
                    conn.execute(
                        text(
                            """
                            INSERT INTO generations (task_id, model, prompt, images, aspect_ratio, status, video_url, created_at, completed_at)
                            VALUES (:task_id, :model, :prompt, :images, :aspect_ratio, :status, :video_url, NOW(), NOW())
                            """
                        ),
                        {
                            "task_id": task_id,
                            "model": req.model,
                            "prompt": req.prompt,
                            "images": image_urls,
                            "aspect_ratio": req.aspect_ratio or "16:9",
                            "status": "succeeded",
                            "video_url": video_url,
                        },
                    )
                    conn.commit()
                # 将内部 task_id 回传，便于统一历史查询（可选）
                data["task_id"] = task_id
            except Exception as e:
                logger.warning(f"Insert generations (nano) failed: {e}")
            return data
        except httpx.RequestError as e:
            logger.error(f"Nano Request Error: {e}")
            raise HTTPException(status_code=500, detail="Nano API 请求异常")

# === 启动事件 ===
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 安全认证系统启动中...")
    logger.info("=" * 60)
    logger.info(f"📊 配置信息:")
    logger.info(f"  - 数据库: {'✅ 已配置' if SUPABASE_URL and 'user:pass' not in SUPABASE_URL else '❌ 未配置'}")
    logger.info(f"  - hCaptcha: {'✅ 已配置' if HCAPTCHA_SECRET else '⚠️  未配置（开发模式）'}")
    logger.info(f"  - SMTP: {'✅ 已配置' if SMTP_USER else '⚠️  未配置（将打印验证链接）'}")
    logger.info(f"  - Redis: {'✅ 已配置' if REDIS_AVAILABLE else '⚠️  未配置（速率限制禁用）'}")
    logger.info(f"  - Google OAuth: {'✅ 已配置' if GOOGLE_CLIENT_ID else '⚠️  未配置'}")
    logger.info(f"  - 前端 URL: {FRONTEND_URL}")
    logger.info(f"  - CORS 允许: {', '.join(CORS_ORIGINS)}")
    logger.info("=" * 60)
    logger.info("✅ 系统已就绪，等待请求...")
    logger.info("=" * 60)
