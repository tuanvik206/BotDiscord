import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission, canModerate } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout một thành viên (mute)')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Người dùng cần mute')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Thời gian mute (phút)')
                .setMinValue(1)
                .setMaxValue(40320) // 28 ngày = 40320 phút (giới hạn của Discord)
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do mute')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ModerateMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền mute thành viên!')]
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.ModerateMembers)) {
            return interaction.editReply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền mute thành viên!')]
            });
        }

        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
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
                embeds: [errorEmbed('Không thể mute', moderateCheck.reason)]
            });
        }

        // Tính thời gian timeout (milliseconds)
        const timeoutDuration = duration * 60 * 1000;
        const timeoutUntil = Date.now() + timeoutDuration;

        // Gửi DM cho user trước khi mute
        try {
            await targetUser.send({
                embeds: [errorEmbed(
                    'Bạn đã bị mute',
                    `**Server:** ${interaction.guild.name}\n**Thời gian:** ${duration} phút\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}\n**Hết hạn:** <t:${Math.floor(timeoutUntil / 1000)}:R>`
                )]
            });
        } catch (error) {
            // Không thể gửi DM, tiếp tục mute
        }

        // Thực hiện timeout
        try {
            await targetMember.timeout(timeoutDuration, `${reason} | Bởi: ${interaction.user.tag}`);

            await interaction.editReply({
                embeds: [successEmbed(
                    'Đã mute thành viên',
                    `**Người bị mute:** ${targetUser.tag}\n**Thời gian:** ${duration} phút\n**Lý do:** ${reason}\n**Hết hạn:** <t:${Math.floor(timeoutUntil / 1000)}:R>`
                )]
            });
        } catch (error) {
            console.error('Lỗi khi mute:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi mute thành viên!')]
            });
        }
    }
};
