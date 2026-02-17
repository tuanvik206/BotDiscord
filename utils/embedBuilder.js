import { EmbedBuilder } from 'discord.js';

/**
 * Màu sắc chuyên nghiệp cho embeds
 */
const COLORS = {
    SUCCESS: 0x00D26A,    // Green - Màu xanh lá tươi
    ERROR: 0xF23F43,      // Red - Màu đỏ rực
    WARNING: 0xF0B232,    // Yellow/Orange - Màu vàng cam
    INFO: 0x5865F2,       // Blurple - Màu tím Discord
    PRIMARY: 0x5865F2,    // Primary Discord color
    SECONDARY: 0x99AAB5,  // Gray
    PREMIUM: 0xFFD700     // Gold
};

/**
 * Icons cho các loại embed
 */
const ICONS = {
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️',
    MODERATION: '🛡️',
    PROJECT: '📁',
    HELP: '❓',
    SETTINGS: '⚙️',
    STATS: '📊',
    USER: '👤',
    CHANNEL: '💬',
    ROLE: '🎭',
    TIME: '⏰',
    LOCK: '🔒',
    UNLOCK: '🔓'
};

/**
 * Tạo base embed với styling chuyên nghiệp
 */
function createBaseEmbed(color) {
    return new EmbedBuilder()
        .setColor(color)
        .setTimestamp()
        .setFooter({ 
            text: 'Discord Bot • Quản Lý Lớp Học',
            iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' // Có thể thay bằng logo bot
        });
}

/**
 * Success embed - Thông báo thành công
 */
export function successEmbed(title, description, fields = null) {
    const embed = createBaseEmbed(COLORS.SUCCESS)
        .setTitle(`${ICONS.SUCCESS} ${title}`)
        .setDescription(description);

    if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    }

    return embed;
}

/**
 * Error embed - Thông báo lỗi
 */
export function errorEmbed(title, description, fields = null) {
    const embed = createBaseEmbed(COLORS.ERROR)
        .setTitle(`${ICONS.ERROR} ${title}`)
        .setDescription(description);

    if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    }

    return embed;
}

/**
 * Warning embed - Cảnh báo
 */
export function warningEmbed(title, description, fields = null) {
    const embed = createBaseEmbed(COLORS.WARNING)
        .setTitle(`${ICONS.WARNING} ${title}`)
        .setDescription(description);

    if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    }

    return embed;
}

/**
 * Info embed - Thông tin
 */
export function infoEmbed(title, description, fields = null) {
    const embed = createBaseEmbed(COLORS.INFO)
        .setTitle(`${ICONS.INFO} ${title}`)
        .setDescription(description);

    if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    }

    return embed;
}

/**
 * Moderation embed - Cho các lệnh moderation
 */
export function moderationEmbed(action, target, moderator, reason = null, duration = null) {
    const embed = createBaseEmbed(COLORS.WARNING)
        .setTitle(`${ICONS.MODERATION} Moderation Action: ${action}`)
        .addFields(
            { name: '👤 Target', value: target, inline: true },
            { name: '🛡️ Moderator', value: moderator, inline: true }
        );

    if (reason) {
        embed.addFields({ name: '📝 Reason', value: reason, inline: false });
    }

    if (duration) {
        embed.addFields({ name: '⏰ Duration', value: duration, inline: true });
    }

    return embed;
}

/**
 * Project embed - Cho project management
 */
export function projectEmbed(title, description, projectData = null) {
    const embed = createBaseEmbed(COLORS.PRIMARY)
        .setTitle(`${ICONS.PROJECT} ${title}`)
        .setDescription(description);

    if (projectData) {
        if (projectData.leader) {
            embed.addFields({ name: '👑 Leader', value: projectData.leader, inline: true });
        }
        if (projectData.members) {
            embed.addFields({ name: '👥 Members', value: projectData.members, inline: true });
        }
        if (projectData.channels) {
            embed.addFields({ name: '💬 Channels', value: projectData.channels, inline: false });
        }
        if (projectData.createdAt) {
            embed.addFields({ name: '📅 Created', value: projectData.createdAt, inline: true });
        }
    }

    return embed;
}

/**
 * Help embed - Cho help command
 */
export function helpEmbed(title, description, commands = null) {
    const embed = createBaseEmbed(COLORS.INFO)
        .setTitle(`${ICONS.HELP} ${title}`)
        .setDescription(description);

    if (commands && Array.isArray(commands)) {
        commands.forEach(cmd => {
            embed.addFields({
                name: `\`/${cmd.name}\` ${cmd.emoji || ''}`,
                value: cmd.description,
                inline: cmd.inline || false
            });
        });
    }

    return embed;
}

/**
 * Stats embed - Cho thống kê
 */
export function statsEmbed(title, stats) {
    const embed = createBaseEmbed(COLORS.PRIMARY)
        .setTitle(`${ICONS.STATS} ${title}`);

    if (stats && typeof stats === 'object') {
        Object.entries(stats).forEach(([key, value]) => {
            embed.addFields({
                name: key,
                value: String(value),
                inline: true
            });
        });
    }

    return embed;
}

/**
 * Custom embed - Tùy chỉnh hoàn toàn
 */
export function customEmbed(options) {
    const {
        color = COLORS.PRIMARY,
        title,
        description,
        fields = null,
        thumbnail = null,
        image = null,
        author = null,
        footer = null,
        timestamp = true
    } = options;

    const embed = new EmbedBuilder()
        .setColor(color);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (image) embed.setImage(image);
    if (author) embed.setAuthor(author);
    
    if (footer) {
        embed.setFooter(footer);
    } else {
        embed.setFooter({ text: 'Discord Bot • Quản Lý Lớp Học' });
    }

    if (timestamp) embed.setTimestamp();

    if (fields && Array.isArray(fields)) {
        fields.forEach(field => {
            embed.addFields({
                name: field.name,
                value: field.value,
                inline: field.inline || false
            });
        });
    }

    return embed;
}

// Export colors và icons để có thể sử dụng ở nơi khác
export { COLORS, ICONS };
