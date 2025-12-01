#!/usr/bin/env python3
"""
数据库初始化脚本
使用 Python 代码创建 users 表（如果不存在）
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

def init_database():
    """初始化数据库表"""
    if not SUPABASE_URL:
        print("❌ 错误：未配置 SUPABASE_URL 环境变量")
        print("请在 .env 文件中配置正确的 Supabase 连接字符串")
        return False
    
    try:
        print("🔗 正在连接数据库...")
        conn = psycopg2.connect(SUPABASE_URL)
        cursor = conn.cursor()
        
        print("📝 创建 users 表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) DEFAULT 'free' NOT NULL,
                points INTEGER DEFAULT 100 NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("📇 创建索引...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """)
        
        print("⚙️ 创建触发器...")
        cursor.execute("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """)
        
        cursor.execute("""
            DROP TRIGGER IF EXISTS update_users_updated_at ON users;
            CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """)
        
        conn.commit()
        
        # 检查表是否创建成功
        cursor.execute("""
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        print("\n✅ 数据库初始化成功！")
        print("\n📋 users 表结构：")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} {f'(默认: {col[2]})' if col[2] else ''}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ 数据库错误：{e}")
        print("\n💡 请检查：")
        print("  1. Supabase URL 是否正确")
        print("  2. 网络连接是否正常")
        print("  3. 数据库权限是否足够")
        return False
    except Exception as e:
        print(f"\n❌ 未知错误：{e}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Supabase 数据库初始化工具")
    print("=" * 50)
    success = init_database()
    print("=" * 50)
    exit(0 if success else 1)
