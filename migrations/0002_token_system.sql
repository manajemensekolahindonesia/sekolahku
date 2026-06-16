-- Migration 002: Token System + Settings
-- ============================================================

-- Add token-related columns to users
ALTER TABLE users ADD COLUMN tokens INTEGER DEFAULT 2;
ALTER TABLE users ADD COLUMN tokens_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN reports_generated INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_reset_date TEXT;
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'Free';
ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_active TEXT;

-- Add profile fields to users
ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN nip TEXT;
ALTER TABLE users ADD COLUMN jenjang TEXT;
ALTER TABLE users ADD COLUMN tahun_pelajaran TEXT;
ALTER TABLE users ADD COLUMN nama_sekolah TEXT;
ALTER TABLE users ADD COLUMN kepala_sekolah TEXT;
ALTER TABLE users ADD COLUMN logo_url TEXT;

-- Token usage logs
CREATE TABLE IF NOT EXISTS token_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'AI Generation',
  tokens_spent INTEGER NOT NULL DEFAULT 1,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Settings table for global configs
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('maintenance_mode', 'false');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_trial_active', 'false');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_trial_days', '3');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_trial_tier', 'Premium');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_trial_tokens', '50');
INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement_text', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('announcement_active', 'false');

-- Update owner to have unlimited tokens
UPDATE users SET tier = 'Titan', tokens = 999999 WHERE role = 'owner';
