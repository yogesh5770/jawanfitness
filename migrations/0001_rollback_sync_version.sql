-- Rollback 0001: Drop version column from gym_sync_state
-- Cloudflare D1 / SQLite 3
ALTER TABLE gym_sync_state DROP COLUMN version;
