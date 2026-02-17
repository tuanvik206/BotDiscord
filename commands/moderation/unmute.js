import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission, canModerate } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Gỡ timeout cho một thành viên (unmute)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người dùng cần unmute')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do unmute')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền unmute thành viên!')],
                ephemeral: true
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền unmute thành viên!')],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        // Lấy member object
        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch (error) {
            return interaction.reply({
                embeds: [errorEmbed('Lỗi', 'Không thể tìm thấy thành viên này!')],
                ephemeral: true
            });
        }

        // Kiểm tra xem user có đang bị timeout không
        if (!targetMember.communicationDisabledUntil) {
            return interaction.reply({
                embeds: [errorEmbed('Không bị mute', 'Người dùng này không bị mute!')],
                ephemeral: true
            });
        }

        // Kiểm tra có thể moderate không
        const moderateCheck = canModerate(interaction.member, targetMember);
        if (!moderateCheck.success) {
            return interaction.reply({
                embeds: [errorEmbed('Không thể unmute', moderateCheck.reason)],
                ephemeral: true
            });
        }

        // Gửi DM cho user
        try {
            await targetUser.send({
                embeds: [successEmbed(
                    'Bạn đã được unmute',
                    `**Server:** ${interaction.guild.name}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}`
                )]
            });
        } catch (error) {
            // Không thể gửi DM, tiếp tục unmute
        }

        // Thực hiện unmute (gỡ timeout)
        try {
            await targetMember.timeout(null, `${reason} | Bởi: ${interaction.user.tag}`);

            await interaction.reply({
                embeds: [successEmbed(
                    'Đã unmute thành viên',
                    `**Người được unmute:** ${targetUser.tag}\n**Lý do:** ${reason}`
                )]
            });
        } catch (error) {
            console.error('Lỗi khi unmute:', error);
            await interaction.reply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi unmute thành viên!')],
                ephemeral: true
            });
        }
    }
};
