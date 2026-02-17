import { supabase } from '../supabase.js';

/**
 * =====================================================
 * WARNING SYSTEM - Using Supabase
 * =====================================================
 */

/**
 * Thêm warning cho user
 */
export async function addWarning(userId, guildId, type, reason) {
    const { error } = await supabase
        .from('warnings')
        .insert({
            guild_id: guildId,
            user_id: userId,
            type,
            reason,
            moderator: 'automod'
        });

    if (error) {
        console.error('Error adding warning:', error);
        return 0;
    }

    // Get total warnings count
    const { count } = await supabase
        .from('warnings')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildId)
        .eq('user_id', userId);

    return count || 0;
}

/**
 * Lấy warnings của user
 */
export async function getWarnings(userId, guildId) {
    const { data, error } = await supabase
        .from('warnings')
        .select('*')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        return null;
    }

    return {
        userId,
        guildId,
        warnings: data.map(w => ({
            type: w.type,
            reason: w.reason,
            timestamp: w.created_at,
            moderator: w.moderator
        })),
        totalWarnings: data.length,
        lastWarning: data[0].created_at
    };
}

/**
 * Reset warnings của user
 */
export async function resetWarnings(userId, guildId) {
    const { error } = await supabase
        .from('warnings')
        .delete()
        .eq('guild_id', guildId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error resetting warnings:', error);
        return false;
    }

    return true;
}

/**
 * Xóa warnings cũ (gọi định kỳ)
 */
export async function cleanupOldWarnings(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
        .from('warnings')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

    if (error) {
        console.error('Error cleaning up warnings:', error);
    }
}

/**
 * Lấy punishment dựa trên số warnings
 */
export function getPunishment(warningCount, config) {
    return config.warnings.punishments[warningCount] || null;
}

/**
 * Áp dụng punishment
 */
export async function applyPunishment(member, punishment, reason) {
    try {
        if (punishment.type === 'warn') {
            return {
                success: true,
                action: 'warned',
                message: 'Đã nhận cảnh báo'
            };
        }

        if (punishment.type === 'timeout') {
            await member.timeout(punishment.duration, reason);
            const minutes = Math.floor(punishment.duration / 60000);
            return {
                success: true,
                action: 'timeout',
                message: `Timeout ${minutes} phút`
            };
        }

        if (punishment.type === 'kick') {
            await member.kick(reason);
            return {
                success: true,
                action: 'kick',
                message: 'Đã kick khỏi server'
            };
        }

        return {
            success: false,
            action: 'unknown',
            message: 'Punishment không xác định'
        };

    } catch (error) {
        console.error('Lỗi khi apply punishment:', error);
        return {
            success: false,
            action: 'error',
            message: error.message
        };
    }
}

// Cleanup warnings cũ mỗi ngày
setInterval(() => cleanupOldWarnings(30), 24 * 60 * 60 * 1000);
