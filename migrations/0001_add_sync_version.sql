-- Migration 0001: Add optimistic concurrency version column to gym_sync_state
-- Cloudflare D1 / SQLite 3
ALTER TABLE gym_sync_state ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
