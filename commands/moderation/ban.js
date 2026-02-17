import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission, canModerate } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('cam')
        .setDescription('Cấm một thành viên khỏi server')
        .addUserOption(option =>
            option
                .setName('nguoidung')
                .setDescription('Người dùng cần cấm')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('lydo')
                .setDescription('Lý do cấm')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option
                .setName('xoatin')
                .setDescription('Số ngày tin nhắn cần xóa (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.BanMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền ban thành viên!')]
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.BanMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền ban thành viên!')]
            });
        }

        const targetUser = interaction.options.getUser('nguoidung');
        const reason = interaction.options.getString('lydo') || 'Không có lý do';
        const deleteDays = interaction.options.getInteger('xoatin') || 0;

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
                embeds: [errorEmbed('Không thể ban', moderateCheck.reason)]
            });
        }

        // Gửi DM cho user trước khi ban
        try {
            await targetUser.send({
                embeds: [errorEmbed(
                    'Bạn đã bị ban',
                    `**Server:** ${interaction.guild.name}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}`
                )]
            });
        } catch (error) {
            // Không thể gửi DM, tiếp tục ban
        }

        // Thực hiện ban
        try {
            await targetMember.ban({
                deleteMessageSeconds: deleteDays * 24 * 60 * 60,
                reason: `${reason} | Bởi: ${interaction.user.tag}`
            });

            await interaction.editReply({
                embeds: [successEmbed(
                    'Đã ban thành viên',
                    `**Người bị ban:** ${targetUser.tag}\n**Lý do:** ${reason}\n**Tin nhắn đã xóa:** ${deleteDays} ngày`
                )]
            });
        } catch (error) {
            console.error('Lỗi khi ban:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi ban thành viên!')]
            });
        }
    }
};
