-- =====================================================
-- SECURITY: Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE automod_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Projects: Allow all operations (service role only)
CREATE POLICY "Service role full access on projects"
ON projects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Project Members: Allow all operations (service role only)
CREATE POLICY "Service role full access on project_members"
ON project_members FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Project Channels: Allow all operations (service role only)
CREATE POLICY "Service role full access on project_channels"
ON project_channels FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Warnings: Allow all operations (service role only)
CREATE POLICY "Service role full access on warnings"
ON warnings FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Automod Config: Allow all operations (service role only)
CREATE POLICY "Service role full access on automod_config"
ON automod_config FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on audit_logs"
ON audit_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_guild ON audit_logs(guild_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Stores audit trail for sensitive operations';
