/**
 * Rate limiting utility for Discord bot commands
 */

const cooldowns = new Map();

/**
 * Check if user is on cooldown for a command
 * @param {string} userId - Discord user ID
 * @param {string} commandName - Command name
 * @param {number} cooldownSeconds - Cooldown duration in seconds
 * @returns {{allowed: boolean, reason?: string, timeLeft?: number}}
 */
export function checkCooldown(userId, commandName, cooldownSeconds = 5) {
    const key = `${userId}-${commandName}`;
    const now = Date.now();
    
    if (cooldowns.has(key)) {
        const expirationTime = cooldowns.get(key) + (cooldownSeconds * 1000);
        
        if (now < expirationTime) {
            const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
            return { 
                allowed: false, 
                reason: `⏱️ Vui lòng đợi ${timeLeft}s trước khi dùng lệnh này lại!`,
                timeLeft: parseFloat(timeLeft)
            };
        }
    }
    
    cooldowns.set(key, now);
    
    // Auto cleanup after cooldown expires
    setTimeout(() => cooldowns.delete(key), cooldownSeconds * 1000);
    
    return { allowed: true };
}

/**
 * Clear cooldown for a user (admin override)
 */
export function clearCooldown(userId, commandName) {
    const key = `${userId}-${commandName}`;
    cooldowns.delete(key);
}

/**
 * Get remaining cooldown time
 */
export function getCooldownTime(userId, commandName) {
    const key = `${userId}-${commandName}`;
    
    if (!cooldowns.has(key)) {
        return 0;
    }
    
    const now = Date.now();
    const expirationTime = cooldowns.get(key);
    const timeLeft = Math.max(0, (expirationTime - now) / 1000);
    
    return timeLeft;
}
