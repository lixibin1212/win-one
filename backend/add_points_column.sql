-- 为 users 表添加积分字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 如果需要给现有用户设置初始积分，可以运行以下命令
-- UPDATE users SET points = 0 WHERE points IS NULL;
