import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { warningEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, canModerate } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Cảnh báo một thành viên')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người dùng cần cảnh báo')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do cảnh báo')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền cảnh báo thành viên!')]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

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
                embeds: [errorEmbed('Không thể cảnh báo', moderateCheck.reason)]
            });
        }

        // Gửi DM cho user
        try {
            await targetUser.send({
                embeds: [warningEmbed(
                    'Bạn đã nhận cảnh báo',
                    `**Server:** ${interaction.guild.name}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}\n\nVui lòng tuân thủ quy định của server!`
                )]
            });
        } catch (error) {
            // Không thể gửi DM
            await interaction.editReply({
                embeds: [errorEmbed('Không thể gửi DM', 'Không thể gửi tin nhắn riêng cho người dùng này. Họ có thể đã tắt DM.')]
            });
            return;
        }

        // Phản hồi thành công
        await interaction.editReply({
            embeds: [warningEmbed(
                'Đã cảnh báo thành viên',
                `**Người bị cảnh báo:** ${targetUser.tag}\n**Lý do:** ${reason}\n**Thời gian:** <t:${Math.floor(Date.now() / 1000)}:F>`
            )]
        });
    }
};
