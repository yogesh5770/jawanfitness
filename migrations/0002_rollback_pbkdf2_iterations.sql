-- Rollback 0002: Drop iterations column from gym_users
-- Cloudflare D1 / SQLite 3
ALTER TABLE gym_users DROP COLUMN iterations;
