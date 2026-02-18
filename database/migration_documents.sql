-- =====================================================
-- DATABASE CLEANUP & NEW FEATURES
-- =====================================================

-- 1. DROP UNUSED TABLES (Clean up old AutoMod tables)
-- =====================================================
DROP TABLE IF EXISTS warnings CASCADE;
DROP TABLE IF EXISTS automod_config CASCADE;

-- 2. CREATE DOCUMENTS TABLE (New Study Feature)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    subject TEXT NOT NULL, -- Môn học (Math, Physics, IT...)
    description TEXT,
    added_by TEXT NOT NULL, -- User ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_doc_per_guild UNIQUE (guild_id, url)
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_guild_subject ON documents(guild_id, subject);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

-- Comment
COMMENT ON TABLE documents IS 'Stores study materials and document links';
