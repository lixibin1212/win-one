#!/usr/bin/env python3
"""
系统配置检查工具
检查所有必需的配置是否正确
"""
import os
import sys
from pathlib import Path

def check_env_file(file_path: str, required_vars: list) -> bool:
    """检查环境变量文件"""
    if not os.path.exists(file_path):
        print(f"  ❌ 文件不存在: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    missing = []
    placeholder = []
    
    for var in required_vars:
        if var not in content:
            missing.append(var)
        elif any(x in content for x in ['change-me', 'your-', 'example', 'user:pass']):
            # 检查是否使用了占位符
            for line in content.split('\n'):
                if line.startswith(var) and any(x in line for x in ['change-me', 'your-', 'example', 'user:pass']):
                    placeholder.append(var)
                    break
    
    if missing:
        print(f"  ❌ 缺少环境变量: {', '.join(missing)}")
        return False
    
    if placeholder:
        print(f"  ⚠️  需要配置: {', '.join(placeholder)}")
        return False
    
    print(f"  ✅ 配置完整")
    return True

def check_database_connection() -> bool:
    """检查数据库连接"""
    try:
        from dotenv import load_dotenv
        import psycopg2
        
        load_dotenv()
        url = os.getenv('SUPABASE_URL')
        
        if not url or 'user:pass' in url:
            print("  ⚠️  数据库 URL 未配置或使用占位符")
            return False
        
        print("  🔗 正在测试数据库连接...")
        conn = psycopg2.connect(url, connect_timeout=5)
        cursor = conn.cursor()
        
        # 检查 users 表是否存在
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        """)
        exists = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        if exists:
            print("  ✅ 数据库连接成功，users 表已存在")
            return True
        else:
            print("  ⚠️  数据库连接成功，但 users 表不存在")
            print("     请运行: python init_db.py")
            return False
            
    except ImportError:
        print("  ⚠️  缺少依赖包，请运行: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"  ❌ 数据库连接失败: {e}")
        return False

def main():
    print("=" * 60)
    print("🔍 系统配置检查")
    print("=" * 60)
    
    results = []
    
    # 检查后端环境变量
    print("\n📋 1. 后端环境变量 (backend/.env)")
    backend_env = Path(__file__).parent / '.env'
    results.append(check_env_file(
        str(backend_env),
        ['JWT_SECRET_KEY', 'SUPABASE_URL', 'CORS_ALLOW_ORIGINS']
    ))
    
    # 检查前端环境变量
    print("\n📋 2. 前端环境变量 (frontend/.env)")
    frontend_env = Path(__file__).parent.parent / 'frontend' / '.env'
    results.append(check_env_file(
        str(frontend_env),
        ['REACT_APP_API_BASE']
    ))
    
    # 检查数据库
    print("\n🗄️  3. 数据库连接")
    results.append(check_database_connection())
    
    # 检查依赖
    print("\n📦 4. Python 依赖")
    try:
        import fastapi
        import psycopg2
        import jwt
        import passlib
        print("  ✅ 核心依赖已安装")
        results.append(True)
    except ImportError as e:
        print(f"  ❌ 缺少依赖: {e}")
        print("     请运行: pip install -r requirements.txt")
        results.append(False)
    
    # 总结
    print("\n" + "=" * 60)
    total = len(results)
    passed = sum(results)
    
    if passed == total:
        print("✅ 所有检查通过！系统已准备就绪。")
        print("\n🚀 启动命令：")
        print("   后端: uvicorn app:app --reload --port 8001")
        print("   前端: cd ../frontend && npm start")
    else:
        print(f"⚠️  {passed}/{total} 项检查通过，请修复以上问题。")
        print("\n📚 详细配置说明请参考: ../SETUP.md")
    
    print("=" * 60)
    return 0 if passed == total else 1

if __name__ == '__main__':
    sys.exit(main())
