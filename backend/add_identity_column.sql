-- Add identity column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity VARCHAR(20) DEFAULT 'free';
-- Update existing users to have 'free' identity if null
UPDATE users SET identity = 'free' WHERE identity IS NULL;
