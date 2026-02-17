/**
 * Spam Detector - Phát hiện spam messages
 */

const userMessageCache = new Map(); // userId -> messages[]

/**
 * Kiểm tra spam
 */
export function checkSpam(message, config) {
    const userId = message.author.id;
    const now = Date.now();

    // Lấy hoặc tạo cache cho user
    if (!userMessageCache.has(userId)) {
        userMessageCache.set(userId, []);
    }

    const userMessages = userMessageCache.get(userId);

    // Xóa tin nhắn cũ (ngoài time window)
    const recentMessages = userMessages.filter(
        msg => now - msg.timestamp < config.spam.timeWindow
    );

    // Thêm tin nhắn mới
    recentMessages.push({
        content: message.content,
        timestamp: now
    });

    userMessageCache.set(userId, recentMessages);

    // 1. Kiểm tra rate limiting (quá nhiều tin nhắn)
    if (recentMessages.length > config.spam.maxMessages) {
        return {
            isSpam: true,
            type: 'rate_limit',
            reason: `Gửi quá ${config.spam.maxMessages} tin nhắn trong ${config.spam.timeWindow / 1000} giây`
        };
    }

    // 2. Kiểm tra duplicate messages
    const duplicates = recentMessages.filter(
        msg => msg.content === message.content
    );
    if (duplicates.length > config.spam.maxDuplicates) {
        return {
            isSpam: true,
            type: 'duplicate',
            reason: `Gửi tin nhắn trùng lặp ${duplicates.length} lần`
        };
    }

    // 3. Kiểm tra mention spam
    const mentions = message.mentions.users.size + 
                    (message.mentions.everyone ? 10 : 0); // @everyone/@here = 10 mentions
    if (mentions > config.spam.maxMentions) {
        return {
            isSpam: true,
            type: 'mention_spam',
            reason: `Spam ${mentions} mentions`
        };
    }

    // 4. Kiểm tra emoji spam
    const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length + 
                       (message.content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (emojiCount > config.spam.maxEmojis) {
        return {
            isSpam: true,
            type: 'emoji_spam',
            reason: `Spam ${emojiCount} emojis`
        };
    }

    // 5. Kiểm tra CAPS spam
    const upperCase = (message.content.match(/[A-Z]/g) || []).length;
    const letters = (message.content.match(/[A-Za-z]/g) || []).length;
    if (letters > 10 && (upperCase / letters) * 100 > config.spam.capsPercentage) {
        return {
            isSpam: true,
            type: 'caps_spam',
            reason: `Sử dụng quá nhiều CHỮ HOA (${Math.round((upperCase / letters) * 100)}%)`
        };
    }

    // 6. Kiểm tra newline spam
    const newlines = (message.content.match(/\n/g) || []).length;
    if (newlines > config.spam.maxNewlines) {
        return {
            isSpam: true,
            type: 'newline_spam',
            reason: `Spam ${newlines} dòng mới`
        };
    }

    return { isSpam: false };
}

/**
 * Xóa cache cũ (gọi định kỳ để tiết kiệm memory)
 */
export function cleanupCache() {
    const now = Date.now();
    const maxAge = 60000; // 1 phút

    for (const [userId, messages] of userMessageCache.entries()) {
        const recentMessages = messages.filter(
            msg => now - msg.timestamp < maxAge
        );

        if (recentMessages.length === 0) {
            userMessageCache.delete(userId);
        } else {
            userMessageCache.set(userId, recentMessages);
        }
    }
}

// Cleanup mỗi phút
setInterval(cleanupCache, 60000);
