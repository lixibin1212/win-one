-- 完整的数据库结构（含安全功能）
-- 执行前请备份现有数据！

-- ============================================
-- 1. 用户表 (users) - 升级版
-- ============================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 基础信息
    username VARCHAR(50) UNIQUE NOT NULL,              -- 用户名（登录用）
    email VARCHAR(255) UNIQUE NOT NULL,                -- 邮箱（必须绑定）
    password_hash TEXT,                                 -- 密码（Google登录时可为空）
    
    -- 角色和积分
    role VARCHAR(50) DEFAULT 'free' NOT NULL,          -- free/premium/admin
    points INTEGER DEFAULT 100 NOT NULL,
    
    -- 邮箱验证
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,     -- 邮箱是否已验证
    verification_token VARCHAR(255),                    -- 邮箱验证令牌
    verification_token_expires TIMESTAMP WITH TIME ZONE, -- 验证令牌过期时间
    
    -- OAuth 登录标识
    google_id VARCHAR(255),                            -- Google OAuth ID
    oauth_provider VARCHAR(50),                        -- 登录提供商：google/github等
    
    -- 安全字段
    is_active BOOLEAN DEFAULT FALSE NOT NULL,          -- 账号是否激活（邮箱验证后为true）
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,          -- 账号是否被锁定
    failed_login_attempts INTEGER DEFAULT 0,           -- 失败登录次数
    last_login_at TIMESTAMP WITH TIME ZONE,            -- 最后登录时间
    last_login_ip VARCHAR(45),                         -- 最后登录IP
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================
-- 2. 登录日志表 (login_logs)
-- ============================================
CREATE TABLE login_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 登录信息
    username VARCHAR(50),                              -- 尝试登录的用户名
    login_method VARCHAR(50) NOT NULL,                 -- password/google/github
    success BOOLEAN NOT NULL,                          -- 是否成功
    
    -- 设备和位置信息
    ip_address VARCHAR(45) NOT NULL,                   -- IP地址
    user_agent TEXT,                                   -- 浏览器UA
    device_type VARCHAR(50),                           -- 设备类型
    location VARCHAR(255),                             -- 地理位置（可选）
    
    -- 异常标记
    is_suspicious BOOLEAN DEFAULT FALSE,               -- 是否可疑
    suspicious_reason TEXT,                            -- 可疑原因
    
    -- 时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX idx_login_logs_created_at ON login_logs(created_at);
CREATE INDEX idx_login_logs_success ON login_logs(success);
CREATE INDEX idx_login_logs_suspicious ON login_logs(is_suspicious);

-- ============================================
-- 3. 邮箱验证记录表 (email_verifications)
-- ============================================
CREATE TABLE email_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);

-- ============================================
-- 4. 密码重置记录表 (password_resets)
-- ============================================
CREATE TABLE password_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- ============================================
-- 5. 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 表注释
-- ============================================
COMMENT ON TABLE users IS '用户表：存储所有用户信息';
COMMENT ON COLUMN users.username IS '用户名（登录时使用，唯一）';
COMMENT ON COLUMN users.email IS '邮箱地址（必须绑定并验证）';
COMMENT ON COLUMN users.email_verified IS '邮箱是否已通过验证';
COMMENT ON COLUMN users.is_active IS '账号是否激活（邮箱验证后自动激活）';
COMMENT ON COLUMN users.is_locked IS '账号是否被锁定（多次登录失败后锁定）';

COMMENT ON TABLE login_logs IS '登录日志表：记录所有登录尝试';
COMMENT ON COLUMN login_logs.is_suspicious IS '是否为可疑登录（异地、新设备等）';

COMMENT ON TABLE email_verifications IS '邮箱验证记录表';
COMMENT ON TABLE password_resets IS '密码重置记录表';

-- ============================================
-- 7. 初始化管理员账号（可选）
-- ============================================
-- 密码: Admin@123 (请务必修改)
-- INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
-- VALUES (
--     'admin',
--     'admin@example.com',
--     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEgQQiq',
--     'admin',
--     TRUE,
--     TRUE
-- );
