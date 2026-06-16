-- ============================================================
-- SekolahKu Database Schema (Cloudflare D1 / SQLite)
-- Migration: 001_initial_schema
-- ============================================================

PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. SUBSCRIPTIONS (Paket Berlangganan)
-- ============================================================
CREATE TABLE subscriptions (
    id          TEXT PRIMARY KEY,
    plan_name   TEXT    NOT NULL,
    price       INTEGER NOT NULL DEFAULT 0,
    features    TEXT    NOT NULL DEFAULT '[]',
    max_users   INTEGER NOT NULL DEFAULT 10,
    max_students INTEGER NOT NULL DEFAULT 100,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. USERS (Pengguna — Owner, Admin, Guru, Siswa, Staf)
-- ============================================================
CREATE TABLE users (
    id                TEXT PRIMARY KEY,
    email             TEXT    NOT NULL UNIQUE,
    name              TEXT    NOT NULL,
    role              TEXT    NOT NULL CHECK (role IN ('owner','admin','guru','siswa','staf')),
    avatar_url        TEXT,
    google_id         TEXT,
    subscription_id   TEXT    REFERENCES subscriptions(id) ON DELETE SET NULL,
    active_period_end TEXT,
    status            TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','blocked')),
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_status   ON users(status);

-- ============================================================
-- 3. KELAS (Classes / Rombel)
-- ============================================================
CREATE TABLE kelas (
    id         TEXT PRIMARY KEY,
    nama       TEXT NOT NULL,
    tingkat    INTEGER NOT NULL,
    wali_kelas TEXT REFERENCES users(id) ON DELETE SET NULL,
    tahun_ajaran TEXT NOT NULL DEFAULT '2025/2026',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_kelas_wali ON kelas(wali_kelas);

-- ============================================================
-- 4. MATA PELAJARAN
-- ============================================================
CREATE TABLE mata_pelajaran (
    id         TEXT PRIMARY KEY,
    nama       TEXT NOT NULL,
    kode       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 5. PERANGKAT AJAR (AI Teaching Modules)
-- ============================================================
CREATE TABLE perangkat_ajar (
    id               TEXT PRIMARY KEY,
    user_id          TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kelas_id         TEXT    REFERENCES kelas(id) ON DELETE SET NULL,
    mapel_id         TEXT    REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
    topic            TEXT    NOT NULL,
    time_allocation  TEXT    NOT NULL,
    text_model_used  TEXT,
    image_model_used TEXT,
    ai_response_json TEXT,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_perangkat_ajar_user   ON perangkat_ajar(user_id);
CREATE INDEX idx_perangkat_ajar_kelas  ON perangkat_ajar(kelas_id);

-- ============================================================
-- 6. JURNAL PEMBELAJARAN (Learning Journal)
-- ============================================================
CREATE TABLE jurnal_pembelajaran (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kelas_id          TEXT REFERENCES kelas(id) ON DELETE SET NULL,
    mapel_id          TEXT REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
    date              TEXT NOT NULL,
    class_name        TEXT,
    material_progress TEXT,
    activities        TEXT,
    obstacles         TEXT,
    follow_up         TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_jurnal_user  ON jurnal_pembelajaran(user_id);
CREATE INDEX idx_jurnal_date  ON jurnal_pembelajaran(date);

-- ============================================================
-- 7. ABSENSI (Attendance)
-- ============================================================
CREATE TABLE absensi (
    id         TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kelas_id   TEXT NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    date       TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('Hadir','Sakit','Izin','Alfa','Terlambat')),
    note       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(student_id, kelas_id, date)
);

CREATE INDEX idx_absensi_student ON absensi(student_id);
CREATE INDEX idx_absensi_kelas   ON absensi(kelas_id);
CREATE INDEX idx_absensi_date    ON absensi(date);

-- ============================================================
-- 8. PENILAIAN (Assessments / Grades)
-- ============================================================
CREATE TABLE penilaian (
    id          TEXT PRIMARY KEY,
    student_id  TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kelas_id    TEXT REFERENCES kelas(id) ON DELETE SET NULL,
    mapel_id    TEXT REFERENCES mata_pelajaran(id) ON DELETE SET NULL,
    type        TEXT    NOT NULL CHECK (type IN ('Tugas','UH','Praktik','UTS','UAS')),
    score       REAL    NOT NULL CHECK (score >= 0 AND score <= 100),
    description TEXT,
    date        TEXT    NOT NULL DEFAULT (datetime('now')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_penilaian_student ON penilaian(student_id);
CREATE INDEX idx_penilaian_type    ON penilaian(type);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Subscription plans
INSERT INTO subscriptions (id, plan_name, price, features, max_users, max_students) VALUES
    ('plan_free',    'Gratis',   0,      '["Perangkat Ajar AI (terbatas)","Jurnal Pembelajaran","Absensi (max 50 siswa)","Penilaian Dasar"]', 3, 50),
    ('plan_pro',     'Pro',      99000,  '["Akses AI Penuh","Semua Fitur","Absensi Unlimited","Cetak PDF/Excel","Rekap Nilai Otomatis"]', 50, 500),
    ('plan_sekolah', 'Sekolah',  299000, '["Semua Fitur Pro","Multi-Admin","KOP Sekolah Custom","Import CSV","Prioritas Support"]', 999, 9999);

-- Default mata pelajaran
INSERT INTO mata_pelajaran (id, nama, kode) VALUES
    ('mapel_bind',  'Bahasa Indonesia',  'BIND'),
    ('mapel_bing',  'Bahasa Inggris',    'BING'),
    ('mapel_mtk',   'Matematika',        'MTK'),
    ('mapel_ipa',   'Ilmu Pengetahuan Alam',  'IPA'),
    ('mapel_ips',   'Ilmu Pengetahuan Sosial','IPS'),
    ('mapel_pkn',   'Pendidikan Kewarganegaraan','PKN'),
    ('mapel_pai',   'Pendidikan Agama Islam','PAI'),
    ('mapel_pjok',  'PJOK',              'PJOK'),
    ('mapel_sbk',   'Seni Budaya',       'SBK'),
    ('mapel_tik',   'Informatika',       'TIK');
