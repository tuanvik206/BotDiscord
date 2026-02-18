import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getConfig, getWhitelist } from '../../utils/automod/automodHandler.js';
import { infoEmbed, COLORS } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('debug_automod')
        .setDescription('Kiểm tra thông tin debug cho AutoMod (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Cho phép mọi người chạy để check quyền của chính họ

    async execute(interaction) {
        const config = await getConfig(interaction.guild.id);
        const whitelist = getWhitelist(interaction.guild.id);
        const member = interaction.member;

        const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
        const hasManageMessages = member.permissions.has(PermissionFlagsBits.ManageMessages);
        const isBypassed = isAdmin || hasManageMessages;

        const debugInfo = [
            `**User Info:**`,
            `> User: ${interaction.user.tag}`,
            `> Roles: ${member.roles.cache.map(r => r.name).join(', ')}`,
            `> Admin Perm: ${isAdmin ? '✅ YES' : '❌ NO'}`,
            `> Manage Msg: ${hasManageMessages ? '✅ YES' : '❌ NO'}`,
            `> **AutoMod Bypass:** ${isBypassed ? '⛔ YES (Bạn sẽ KHÔNG bị Bot chặn)' : '✅ NO (Bạn sẽ bị Bot chặn)'}`,
            ``,
            `**Config Info (Links):**`,
            `> Enabled: ${config.links.enabled ? '✅' : '❌'}`,
            `> Block All: ${config.links.blockAll ? '🔒 YES (Strict)' : '🔓 NO (Basic)'}`,
            `> Whitelist Allowed: ${config.links.allowWhitelist ? '✅' : '❌'}`,
            `> Whitelist Count: ${whitelist.length}`,
        ];

        await interaction.reply({
            embeds: [infoEmbed('AutoMod Debug Report', debugInfo.join('\n'))],
            flags: 64
        });
    }
};
