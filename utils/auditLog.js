import { supabase } from './supabase.js';

/**
 * Audit logging utility for tracking sensitive operations
 */

/**
 * Log an action to the audit trail
 * @param {Object} params - Audit log parameters
 * @param {string} params.guildId - Guild ID
 * @param {string} params.userId - User who performed the action
 * @param {string} params.action - Action performed (e.g., 'project_created', 'project_deleted')
 * @param {string} [params.targetType] - Type of target (e.g., 'project', 'user')
 * @param {string} [params.targetId] - ID of the target
 * @param {Object} [params.details] - Additional details
 */
export async function logAudit({ guildId, userId, action, targetType, targetId, details = {} }) {
    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert({
                guild_id: guildId,
                user_id: userId,
                action,
                target_type: targetType,
                target_id: targetId,
                details
            });
        
        if (error) {
            console.error('[Audit] Failed to log action:', action, error.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('[Audit] Error logging action:', error.message);
        return false;
    }
}

/**
 * Get audit logs for a guild
 */
export async function getAuditLogs(guildId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('guild_id', guildId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('[Audit] Failed to fetch logs:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[Audit] Error fetching logs:', error.message);
        return [];
    }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(guildId, userId, limit = 50) {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('guild_id', guildId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('[Audit] Failed to fetch user logs:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[Audit] Error fetching user logs:', error.message);
        return [];
    }
}
