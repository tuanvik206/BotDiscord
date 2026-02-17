import { LINK_SHORTENERS } from './config.js';

/**
 * Link Filter - Lọc links nguy hiểm
 */

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const DISCORD_INVITE_REGEX = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[a-zA-Z0-9]+/gi;
const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

/**
 * Kiểm tra links trong message
 */
export function checkLinks(message, config, whitelist, blacklist) {
    const content = message.content;
    const urls = content.match(URL_REGEX) || [];

    if (urls.length === 0) {
        return { hasViolation: false };
    }

    // Kiểm tra Discord invites
    if (config.links.blockInvites) {
        const invites = content.match(DISCORD_INVITE_REGEX);
        if (invites && invites.length > 0) {
            return {
                hasViolation: true,
                type: 'discord_invite',
                reason: 'Discord invite link không được phép',
                urls: invites
            };
        }
    }

    // Kiểm tra IP addresses
    const ips = content.match(IP_REGEX);
    if (ips && ips.length > 0) {
        return {
            hasViolation: true,
            type: 'ip_address',
            reason: 'IP address không được phép',
            urls: ips
        };
    }

    // Kiểm tra từng URL
    for (const url of urls) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.toLowerCase();

            // Kiểm tra blacklist
            for (const blacklisted of blacklist) {
                if (url.toLowerCase().includes(blacklisted.toLowerCase())) {
                    return {
                        hasViolation: true,
                        type: 'blacklisted',
                        reason: `Link bị chặn: ${blacklisted}`,
                        urls: [url]
                    };
                }
            }

            // Kiểm tra link shorteners
            if (config.links.blockShorteners) {
                for (const shortener of LINK_SHORTENERS) {
                    if (domain.includes(shortener)) {
                        return {
                            hasViolation: true,
                            type: 'link_shortener',
                            reason: `Link rút gọn không được phép: ${shortener}`,
                            urls: [url]
                        };
                    }
                }
            }

            // Kiểm tra whitelist (nếu không trong whitelist thì chặn)
            if (config.links.allowWhitelist) {
                const isWhitelisted = whitelist.some(allowed => 
                    domain.includes(allowed.toLowerCase())
                );

                if (!isWhitelisted && config.links.blockAll) {
                    return {
                        hasViolation: true,
                        type: 'not_whitelisted',
                        reason: 'Link không nằm trong danh sách cho phép',
                        urls: [url]
                    };
                }
            }

        } catch (error) {
            // URL không hợp lệ
            continue;
        }
    }

    return { hasViolation: false };
}

/**
 * Thêm domain vào whitelist
 */
export function addToWhitelist(whitelist, domain) {
    if (!whitelist.includes(domain.toLowerCase())) {
        whitelist.push(domain.toLowerCase());
        return true;
    }
    return false;
}

/**
 * Xóa domain khỏi whitelist
 */
export function removeFromWhitelist(whitelist, domain) {
    const index = whitelist.indexOf(domain.toLowerCase());
    if (index > -1) {
        whitelist.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * Thêm pattern vào blacklist
 */
export function addToBlacklist(blacklist, pattern) {
    if (!blacklist.includes(pattern.toLowerCase())) {
        blacklist.push(pattern.toLowerCase());
        return true;
    }
    return false;
}

/**
 * Xóa pattern khỏi blacklist
 */
export function removeFromBlacklist(blacklist, pattern) {
    const index = blacklist.indexOf(pattern.toLowerCase());
    if (index > -1) {
        blacklist.splice(index, 1);
        return true;
    }
    return false;
}
