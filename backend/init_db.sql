-- ============================================
-- 完整的数据库表结构
-- 包含所有安全认证功能所需的表
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    
    -- 验证和状态
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    
    -- 邮箱验证
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMP,
    
    -- 登录安全
    failed_login_attempts INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    
    -- 用户信息
    role VARCHAR(20) DEFAULT 'user',
    identity VARCHAR(20) DEFAULT 'free',
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20),
    CONSTRAINT chk_username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- 为常用查询字段创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- 2. 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50),
    
    -- 登录信息
    login_method VARCHAR(20) DEFAULT 'password', -- password, google
    success BOOLEAN NOT NULL,
    
    -- 设备和位置信息
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(20), -- mobile, pc, bot
    
    -- 异常检测
    is_suspicious BOOLEAN DEFAULT FALSE,
    suspicious_reason TEXT,
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT NOW()
);

-- 为 login_logs 表创建索引
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs(ip_address);

-- 3. 邮箱验证记录表 (可选,用于审计)
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- 为 email_verifications 表创建索引
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);

-- 4. 密码重置表 (新增)
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 为 password_resets 表创建索引
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- 自动清理过期的密码重置记录 (PostgreSQL 定时任务,可选)
-- 注意: Supabase 可能需要通过 pg_cron 扩展来实现
COMMENT ON TABLE password_resets IS '密码重置令牌表,建议定期清理过期记录';

-- ============================================
-- 辅助函数和触发器
-- ============================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 users 表添加自动更新触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 示例数据 (可选,仅用于测试)
-- ============================================

-- 插入测试用户 (密码: Test1234)
-- INSERT INTO users (username, email, password_hash, email_verified, is_active)
-- VALUES (
--     'testuser',
--     'test@example.com',
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJQqJqQqC',
--     TRUE,
--     TRUE
-- );

-- ============================================
-- 权限设置 (根据需要调整)
-- ============================================

-- 如果使用 RLS (Row Level Security),可以添加策略
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- 创建策略示例 (允许用户查看自己的数据)
-- CREATE POLICY users_select_own ON users
--     FOR SELECT
--     USING (auth.uid() = id);

-- ============================================
-- 完成提示
-- ============================================

-- 执行完成后,验证表是否创建成功:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('users', 'login_logs', 'email_verifications', 'password_resets');
