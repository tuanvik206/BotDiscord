-- =====================================================
-- Discord Bot Database Schema for Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    max_members INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_project_name_per_guild UNIQUE (guild_id, name)
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_guild ON projects(guild_id);
CREATE INDEX IF NOT EXISTS idx_projects_leader ON projects(leader_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);

-- =====================================================
-- 2. PROJECT MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_member_per_project UNIQUE (project_id, user_id)
);

-- Indexes for project_members
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- =====================================================
-- 3. PROJECT CHANNELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL CHECK (channel_type IN ('announcements', 'general', 'tasks', 'resources', 'meeting', 'study')),
    channel_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_channel_type_per_project UNIQUE (project_id, channel_type)
);

-- Indexes for project_channels
CREATE INDEX IF NOT EXISTS idx_project_channels_project ON project_channels(project_id);

-- =====================================================
-- 4. WARNINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('spam', 'link', 'profanity')),
    reason TEXT NOT NULL,
    moderator TEXT DEFAULT 'automod',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for warnings
CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guild_id, user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_created ON warnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_warnings_type ON warnings(type);

-- =====================================================
-- 5. AUTOMOD CONFIG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS automod_config (
    guild_id TEXT PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
    blacklist TEXT[] DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for automod_config table
DROP TRIGGER IF EXISTS update_automod_config_updated_at ON automod_config;
CREATE TRIGGER update_automod_config_updated_at
    BEFORE UPDATE ON automod_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS (Optional - for easier queries)
-- =====================================================

-- View: Projects with member count
CREATE OR REPLACE VIEW projects_with_stats AS
SELECT 
    p.*,
    COUNT(DISTINCT pm.user_id) as member_count,
    COUNT(DISTINCT pc.id) as channel_count
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
LEFT JOIN project_channels pc ON p.id = pc.project_id
GROUP BY p.id;

-- View: User warning counts
CREATE OR REPLACE VIEW user_warning_counts AS
SELECT 
    guild_id,
    user_id,
    COUNT(*) as total_warnings,
    MAX(created_at) as last_warning,
    COUNT(CASE WHEN type = 'spam' THEN 1 END) as spam_warnings,
    COUNT(CASE WHEN type = 'link' THEN 1 END) as link_warnings,
    COUNT(CASE WHEN type = 'profanity' THEN 1 END) as profanity_warnings
FROM warnings
GROUP BY guild_id, user_id;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE projects IS 'Stores Discord project information';
COMMENT ON TABLE project_members IS 'Stores project membership relationships';
COMMENT ON TABLE project_channels IS 'Stores project channel mappings';
COMMENT ON TABLE warnings IS 'Stores user warnings from auto-moderation';
COMMENT ON TABLE automod_config IS 'Stores per-guild auto-moderation configuration';

-- =====================================================
-- DONE!
-- =====================================================
-- Run this script in Supabase SQL Editor
-- Then verify tables were created in Table Editor
