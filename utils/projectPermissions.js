import { PermissionFlagsBits } from 'discord.js';
import { getProjectById, getProjectByName } from './database.js';

/**
 * Kiểm tra xem user có phải là leader của project không
 */
export function isProjectLeader(userId, projectId) {
    const project = getProjectById(projectId);
    return project && project.leaderId === userId;
}

/**
 * Kiểm tra xem user có phải là member của project không
 */
export function isProjectMember(userId, projectId) {
    const project = getProjectById(projectId);
    return project && project.members.includes(userId);
}

/**
 * Kiểm tra xem user có thể quản lý project không
 * (Phải là leader hoặc có quyền MANAGE_CHANNELS)
 */
export function canManageProject(member, projectId) {
    // Admin hoặc có quyền MANAGE_CHANNELS
    if (member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return { success: true };
    }
    
    // Hoặc là leader của project
    if (isProjectLeader(member.id, projectId)) {
        return { success: true };
    }
    
    return { 
        success: false, 
        reason: 'Bạn không có quyền quản lý project này! Chỉ leader hoặc admin mới có thể quản lý.' 
    };
}

/**
 * Thiết lập permissions cho category và channels của project
 */
export async function setupProjectPermissions(category, role, leaderId, guild) {
    const everyoneRole = guild.roles.everyone;
    
    // Permissions cho category
    await category.permissionOverwrites.set([
        {
            id: everyoneRole.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: role.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
            ]
        },
        {
            id: leaderId,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.ManageMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.MoveMembers
            ]
        },
        {
            id: guild.members.me.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageRoles
            ]
        }
    ]);
}
