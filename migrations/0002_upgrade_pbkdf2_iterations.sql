-- Migration 0002: Add iterations column to gym_users to support OWASP 210,000 PBKDF2 hash upgrade
-- Cloudflare D1 / SQLite 3
ALTER TABLE gym_users ADD COLUMN iterations INTEGER NOT NULL DEFAULT 100000;
