#!/usr/bin/env python3
"""快速初始化数据库"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

def init_db():
    print("=" * 60)
    print("🚀 开始初始化数据库...")
    print("=" * 60)
    
    try:
        print("📡 连接数据库...")
        conn = psycopg2.connect(SUPABASE_URL)
        cursor = conn.cursor()
        
        print("📝 创建 users 表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT,
                role VARCHAR(50) DEFAULT 'free' NOT NULL,
                points INTEGER DEFAULT 100 NOT NULL,
                email_verified BOOLEAN DEFAULT FALSE NOT NULL,
                verification_token VARCHAR(255),
                verification_token_expires TIMESTAMP WITH TIME ZONE,
                google_id VARCHAR(255),
                oauth_provider VARCHAR(50),
                is_active BOOLEAN DEFAULT FALSE NOT NULL,
                is_locked BOOLEAN DEFAULT FALSE NOT NULL,
                failed_login_attempts INTEGER DEFAULT 0,
                last_login_at TIMESTAMP WITH TIME ZONE,
                last_login_ip VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("📇 创建索引...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);")
        
        print("📊 创建 login_logs 表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_logs (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR(50),
                login_method VARCHAR(50) NOT NULL,
                success BOOLEAN NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                device_type VARCHAR(50),
                location VARCHAR(255),
                is_suspicious BOOLEAN DEFAULT FALSE,
                suspicious_reason TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);")
        
        conn.commit()
        
        print("\n" + "=" * 60)
        print("✅ 数据库初始化成功！")
        print("=" * 60)
        print("\n📋 已创建的表:")
        print("  ✅ users - 用户表")
        print("  ✅ login_logs - 登录日志表")
        print("\n🎉 现在可以启动后端并测试注册了！")
        print("=" * 60)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        print("\n💡 请检查:")
        print("  1. SUPABASE_URL 是否正确")
        print("  2. 网络连接是否正常")
        print("  3. 数据库权限是否足够")

if __name__ == "__main__":
    init_db()
