import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission, canModerate } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick một thành viên khỏi server')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người dùng cần kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do kick')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.KickMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền kick thành viên!')]
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.KickMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền kick thành viên!')]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        // Lấy member object
        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch (error) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Không thể tìm thấy thành viên này!')]
            });
        }

        // Kiểm tra có thể moderate không
        const moderateCheck = canModerate(interaction.member, targetMember);
        if (!moderateCheck.success) {
            return interaction.editReply({
                embeds: [errorEmbed('Không thể kick', moderateCheck.reason)]
            });
        }

        // Gửi DM cho user trước khi kick
        try {
            await targetUser.send({
                embeds: [errorEmbed(
                    'Bạn đã bị kick',
                    `**Server:** ${interaction.guild.name}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}`
                )]
            });
        } catch (error) {
            // Không thể gửi DM, tiếp tục kick
        }

        // Thực hiện kick
        try {
            await targetMember.kick(`${reason} | Bởi: ${interaction.user.tag}`);

            await interaction.editReply({
                embeds: [successEmbed(
                    'Đã kick thành viên',
                    `**Người bị kick:** ${targetUser.tag}\n**Lý do:** ${reason}`
                )]
            });
        } catch (error) {
            console.error('Lỗi khi kick:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi kick thành viên!')]
            });
        }
    }
};
