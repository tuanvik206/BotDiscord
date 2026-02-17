import { DEFAULT_CONFIG, DEFAULT_WHITELIST, DEFAULT_BLACKLIST } from './config.js';
import { checkSpam } from './spamDetector.js';
import { checkLinks } from './linkFilter.js';
import { checkProfanity } from './profanityFilter.js';
import { addWarning, getPunishment, applyPunishment } from './warningSystem.js';
import { warningEmbed, errorEmbed } from '../embedBuilder.js';
import { supabase } from '../supabase.js';

/**
 * Main Automod Handler - Using Supabase for config
 */

// Config cache
let configCache = {};
let whitelistCache = {};
let blacklistCache = {};

/**
 * Load config from Supabase
 */
async function loadConfig(guildId) {
    // Check cache first
    if (configCache[guildId]) {
        return configCache[guildId];
    }

    const { data, error } = await supabase
        .from('automod_config')
        .select('*')
        .eq('guild_id', guildId)
        .single();

    if (error || !data) {
        // Return default config if not found
        configCache[guildId] = DEFAULT_CONFIG;
        whitelistCache[guildId] = DEFAULT_WHITELIST;
        blacklistCache[guildId] = DEFAULT_BLACKLIST;
        return DEFAULT_CONFIG;
    }

    configCache[guildId] = data.config;
    whitelistCache[guildId] = data.whitelist || DEFAULT_WHITELIST;
    blacklistCache[guildId] = data.blacklist || DEFAULT_BLACKLIST;

    return data.config;
}

/**
 * Chạy automod checks
 */
export async function runAutomod(message) {
    // Bỏ qua bots
    if (message.author.bot) return;

    // Bỏ qua admins/moderators
    if (message.member.permissions.has('Administrator')) return;
    if (message.member.permissions.has('ManageMessages')) return;

    try {
        const guildId = message.guild.id;
        const config = await loadConfig(guildId);
        const whitelist = whitelistCache[guildId] || DEFAULT_WHITELIST;
        const blacklist = blacklistCache[guildId] || DEFAULT_BLACKLIST;

        // 1. Kiểm tra spam
        if (config.spam.enabled) {
            const spamCheck = checkSpam(message, config);
            if (spamCheck.isSpam) {
                await handleViolation(message, 'spam', spamCheck.reason);
                return;
            }
        }

        // 2. Kiểm tra links
        if (config.links.enabled) {
            const linkCheck = checkLinks(message, config, whitelist, blacklist);
            if (linkCheck.hasViolation) {
                await handleViolation(message, 'link', linkCheck.reason);
                return;
            }
        }

        // 3. Kiểm tra profanity
        if (config.profanity.enabled) {
            const profanityCheck = checkProfanity(message, config);
            if (profanityCheck.hasProfanity) {
                await handleViolation(message, 'profanity', profanityCheck.reason);
                return;
            }
        }

    } catch (error) {
        console.error('Lỗi trong automod:', error);
    }
}

/**
 * Xử lý vi phạm
 */
async function handleViolation(message, type, reason) {
    try {
        const guildId = message.guild.id;
        const config = await loadConfig(guildId);

        // Xóa tin nhắn vi phạm
        await message.delete().catch(() => {});

        // Thêm warning
        const warningCount = await addWarning(
            message.author.id,
            guildId,
            type,
            reason
        );

        // Lấy punishment
        const punishment = getPunishment(warningCount, config);

        // Thông báo cho user
        const violationEmbed = warningEmbed(
            'Vi Phạm Quy Định',
            `Tin nhắn của bạn đã bị xóa do vi phạm quy định.\n\n` +
            `**Lý do:** ${reason}\n` +
            `**Loại:** ${getViolationType(type)}\n` +
            `**Cảnh báo:** ${warningCount}/5`
        );

        // Gửi DM cho user
        try {
            await message.author.send({ embeds: [violationEmbed] });
        } catch (error) {
            // User có thể tắt DM
        }

        // Áp dụng punishment nếu có
        if (punishment && config.warnings.enabled) {
            const result = await applyPunishment(message.member, punishment, reason);
            
            if (result.success) {
                // Thông báo punishment
                const punishmentEmbed = errorEmbed(
                    'Auto-Moderation',
                    `${message.author} đã bị ${result.message} do vi phạm quy định lần ${warningCount}.\n\n` +
                    `**Lý do:** ${reason}`
                );

                await message.channel.send({ embeds: [punishmentEmbed] });

                // Tự động xóa thông báo sau 10 giây
                setTimeout(async () => {
                    try {
                        const messages = await message.channel.messages.fetch({ limit: 1 });
                        const lastMessage = messages.first();
                        if (lastMessage && lastMessage.author.id === message.client.user.id) {
                            await lastMessage.delete();
                        }
                    } catch (error) {
                        // Ignore
                    }
                }, 10000);
            }
        }

        // Log vi phạm
        await logViolation(message, type, reason, warningCount, config);

    } catch (error) {
        console.error('Lỗi khi xử lý vi phạm:', error);
    }
}

/**
 * Log vi phạm
 */
async function logViolation(message, type, reason, warningCount, config) {
    if (!config.logging.enabled || !config.logging.logChannelId) {
        return;
    }

    try {
        const logChannel = await message.guild.channels.fetch(config.logging.logChannelId);
        if (!logChannel) return;

        const logEmbed = warningEmbed(
            '🚨 Auto-Mod Violation',
            null,
            [
                { name: '👤 User', value: `${message.author} (${message.author.tag})`, inline: true },
                { name: '📝 Type', value: getViolationType(type), inline: true },
                { name: '⚠️ Warnings', value: `${warningCount}/5`, inline: true },
                { name: '💬 Channel', value: `${message.channel}`, inline: true },
                { name: '📅 Time', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '❌ Reason', value: reason, inline: false },
                { name: '📄 Content', value: message.content.substring(0, 1000) || '*No content*', inline: false }
            ]
        );

        await logChannel.send({ embeds: [logEmbed] });

    } catch (error) {
        console.error('Lỗi khi log vi phạm:', error);
    }
}

/**
 * Get violation type display name
 */
function getViolationType(type) {
    const types = {
        'spam': '🚫 Spam',
        'link': '🔗 Link không hợp lệ',
        'profanity': '🤬 Từ ngữ không phù hợp'
    };
    return types[type] || type;
}

/**
 * Update config in Supabase
 */
export async function updateConfig(guildId, newConfig) {
    const { error } = await supabase
        .from('automod_config')
        .upsert({
            guild_id: guildId,
            config: newConfig
        });

    if (error) {
        console.error('Error updating config:', error);
        return false;
    }

    // Update cache
    configCache[guildId] = newConfig;
    return true;
}

/**
 * Get current config
 */
export async function getConfig(guildId) {
    return await loadConfig(guildId);
}

/**
 * Update whitelist
 */
export async function updateWhitelist(guildId, newWhitelist) {
    const { error } = await supabase
        .from('automod_config')
        .upsert({
            guild_id: guildId,
            whitelist: newWhitelist
        });

    if (error) {
        console.error('Error updating whitelist:', error);
        return false;
    }

    whitelistCache[guildId] = newWhitelist;
    return true;
}

/**
 * Get whitelist
 */
export function getWhitelist(guildId) {
    return whitelistCache[guildId] || DEFAULT_WHITELIST;
}

/**
 * Update blacklist
 */
export async function updateBlacklist(guildId, newBlacklist) {
    const { error } = await supabase
        .from('automod_config')
        .upsert({
            guild_id: guildId,
            blacklist: newBlacklist
        });

    if (error) {
        console.error('Error updating blacklist:', error);
        return false;
    }

    blacklistCache[guildId] = newBlacklist;
    return true;
}

/**
 * Get blacklist
 */
export function getBlacklist(guildId) {
    return blacklistCache[guildId] || DEFAULT_BLACKLIST;
}
