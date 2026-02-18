import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getConfig, getWhitelist, getBlacklist } from '../../utils/automod/automodHandler.js';
import { checkLinks } from '../../utils/automod/linkFilter.js';
import { infoEmbed, COLORS } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('debug_automod')
        .setDescription('Kiểm tra thông tin debug cho AutoMod (Admin Only)')
        .addStringOption(option => 
            option.setName('check_url')
                .setDescription('Link cần test (để kiểm tra xem có bị chặn không)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages), // Cho phép mọi người chạy để check quyền của chính họ

    async execute(interaction) {
        const urlToTest = interaction.options.getString('check_url');
        const config = await getConfig(interaction.guild.id);
        const whitelist = getWhitelist(interaction.guild.id);
        const blacklist = getBlacklist(interaction.guild.id);

        // Chế độ Test Link
        if (urlToTest) {
            const fakeMessage = { content: urlToTest };
            const result = checkLinks(fakeMessage, config, whitelist, blacklist);

            const status = result.hasViolation 
                ? `⛔ **BỊ CHẶN**\n> Lý do: ${result.reason}\n> Config: ${config.links.blockAll ? 'Strict' : 'Basic'}`
                : `✅ **HỢP LỆ**\n> Không phát hiện vi phạm.\n> Regex Match: ${urlToTest.match(/(https?:\/\/[^\s]+)/gi) ? 'Yes' : 'No'}`;

            return interaction.reply({
                embeds: [infoEmbed('Kết quả Test Link', `Link: \`${urlToTest}\`\n\n${status}`)],
                flags: 64
            });
        }

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
