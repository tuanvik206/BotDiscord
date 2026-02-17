import { PermissionFlagsBits } from 'discord.js';

/**
 * Kiểm tra xem user có quyền cần thiết không
 */
export function hasPermission(member, permission) {
    return member.permissions.has(permission);
}

/**
 * Kiểm tra xem bot có quyền cần thiết không
 */
export function botHasPermission(guild, permission) {
    return guild.members.me.permissions.has(permission);
}

/**
 * Kiểm tra role hierarchy - đảm bảo moderator có role cao hơn target
 */
export function canModerate(moderator, target) {
    // Không thể moderate chính mình
    if (moderator.id === target.id) {
        return { success: false, reason: 'Bạn không thể thực hiện hành động này với chính mình!' };
    }

    // Không thể moderate owner của server
    if (target.id === target.guild.ownerId) {
        return { success: false, reason: 'Không thể thực hiện hành động này với chủ sở hữu server!' };
    }

    // Không thể moderate bot
    if (target.user.bot && target.id === target.client.user.id) {
        return { success: false, reason: 'Không thể thực hiện hành động này với bot!' };
    }

    // Kiểm tra role hierarchy
    if (moderator.roles.highest.position <= target.roles.highest.position) {
        return { success: false, reason: 'Bạn không thể thực hiện hành động này với người có role cao hơn hoặc bằng bạn!' };
    }

    // Kiểm tra bot có thể moderate target không
    if (target.guild.members.me.roles.highest.position <= target.roles.highest.position) {
        return { success: false, reason: 'Bot không thể thực hiện hành động này với người có role cao hơn hoặc bằng bot!' };
    }

    return { success: true };
}

/**
 * Kiểm tra xem target có thể bị moderate không (cho các hành động không cần member object)
 */
export function canModerateById(guild, moderatorId, targetId) {
    if (moderatorId === targetId) {
        return { success: false, reason: 'Bạn không thể thực hiện hành động này với chính mình!' };
    }

    if (targetId === guild.ownerId) {
        return { success: false, reason: 'Không thể thực hiện hành động này với chủ sở hữu server!' };
    }

    return { success: true };
}
