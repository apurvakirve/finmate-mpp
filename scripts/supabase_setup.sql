-- ============================================================
-- FinMate - Complete Supabase Database Setup
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ============================================================

-- =====================
-- 1. USERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    balance NUMERIC DEFAULT 0,
    cash_balance NUMERIC DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add missing columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS cash_balance NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Initialize null cash_balance values
UPDATE users SET cash_balance = 0 WHERE cash_balance IS NULL;

-- =====================
-- 2. TRANSACTIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    from_user_id BIGINT REFERENCES users(id),
    to_user_id BIGINT REFERENCES users(id),
    from_name TEXT,
    to_name TEXT,
    amount NUMERIC NOT NULL,
    type TEXT DEFAULT 'transfer',
    method TEXT DEFAULT 'direct',
    transaction_type TEXT DEFAULT 'other',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table already exists, add missing columns:
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'direct';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'other';

-- =====================
-- 3. ENABLE REALTIME
-- =====================
-- Enable realtime for both tables (needed for live updates in the app)
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- =====================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================
-- Disable RLS for simplicity (the app uses anon key with direct access)
-- If you want to enable RLS later, you'll need to create proper policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
