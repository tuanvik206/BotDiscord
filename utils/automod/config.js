/**
 * Default configuration for auto-moderation
 */
export const DEFAULT_CONFIG = {
    // Spam Detection
    spam: {
        enabled: true,
        maxMessages: 5,           // Tối đa 5 tin nhắn
        timeWindow: 5000,         // Trong 5 giây (ms)
        maxDuplicates: 3,         // Tối đa 3 tin nhắn giống nhau
        maxMentions: 5,           // Tối đa 5 mentions
        maxEmojis: 15,            // Tối đa 15 emojis
        capsPercentage: 70,       // 70% chữ hoa = spam
        maxNewlines: 10           // Tối đa 10 dòng mới
    },

    // Link Filter
    links: {
        enabled: true,
        blockAll: true,          // Chặn tất cả links (true = chỉ whitelist được đi)
        allowWhitelist: true,     // Cho phép whitelist
        blockInvites: true,       // Chặn Discord invites
        blockShorteners: true,    // Chặn link rút gọn
        blockIpGrabbers: true     // Chặn IP grabbers
    },

    // Profanity Filter
    profanity: {
        enabled: true,
        filterLevel: 'moderate',  // 'mild', 'moderate', 'severe'
        detectBypass: true        // Phát hiện bypass (vd: đ.i.t)
    },

    // Warning System
    warnings: {
        enabled: true,
        resetAfterDays: 30,       // Reset warnings sau 30 ngày
        punishments: {
            1: { type: 'warn', duration: null },
            2: { type: 'timeout', duration: 300000 },      // 5 phút
            3: { type: 'timeout', duration: 3600000 },     // 1 giờ
            4: { type: 'timeout', duration: 86400000 },    // 1 ngày
            5: { type: 'kick', duration: null }
        }
    },

    // Logging
    logging: {
        enabled: true,
        logChannelId: null        // Set bằng /automod setup
    }
};

/**
 * Whitelist domains (cho phép)
 */
export const DEFAULT_WHITELIST = [
    'youtube.com',
    'youtu.be',
    'github.com',
    'google.com',
    'drive.google.com',
    'docs.google.com',
    'sheets.google.com',
    'slides.google.com',
    'wikipedia.org',
    'stackoverflow.com',
    'discord.com',
    'discordapp.com'
];

/**
 * Blacklist patterns (chặn)
 */
export const DEFAULT_BLACKLIST = [
    'discord.gg/',
    'discord.com/invite/',
    'bit.ly/',
    'tinyurl.com/',
    'grabify.link',
    'iplogger.org',
    'blasze.tk',
    'ps3cfw.com',
    'yip.su'
];

/**
 * Link rút gọn nguy hiểm
 */
export const LINK_SHORTENERS = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly'
];
