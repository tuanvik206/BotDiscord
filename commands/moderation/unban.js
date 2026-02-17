import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban một người dùng bằng ID')
        .addStringOption(option =>
            option
                .setName('user_id')
                .setDescription('ID của người dùng cần unban')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do unban')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền unban thành viên!')],
                ephemeral: true
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền unban thành viên!')],
                ephemeral: true
            });
        }

        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        // Kiểm tra ID có hợp lệ không
        if (!/^\d{17,19}$/.test(userId)) {
            return interaction.reply({
                embeds: [errorEmbed('ID không hợp lệ', 'Vui lòng nhập một Discord User ID hợp lệ!')],
                ephemeral: true
            });
        }

        try {
            // Kiểm tra xem user có bị ban không
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return interaction.reply({
                    embeds: [errorEmbed('Không tìm thấy', 'Người dùng này không bị ban trong server!')],
                    ephemeral: true
                });
            }

            // Thực hiện unban
            await interaction.guild.members.unban(userId, `${reason} | Bởi: ${interaction.user.tag}`);

            await interaction.reply({
                embeds: [successEmbed(
                    'Đã unban người dùng',
                    `**Người được unban:** ${bannedUser.user.tag} (${userId})\n**Lý do:** ${reason}`
                )]
            });
        } catch (error) {
            console.error('Lỗi khi unban:', error);
            await interaction.reply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi unban người dùng!')],
                ephemeral: true
            });
        }
    }
};
