import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa tin nhắn hàng loạt')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Số lượng tin nhắn cần xóa (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Chỉ xóa tin nhắn của user này (tùy chọn)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn cần quyền Manage Messages để xóa tin nhắn!')]
            });
        }

        // Kiểm tra quyền bot
        if (!hasPermission(interaction.guild.members.me, PermissionFlagsBits.ManageMessages)) {
            return interaction.editReply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot cần quyền Manage Messages để xóa tin nhắn!')]
            });
        }

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: amount + 1 }); // +1 để bỏ qua lệnh

            // Lọc tin nhắn (bỏ qua tin nhắn quá 14 ngày vì Discord API không cho phép xóa)
            let messagesToDelete = messages.filter(msg => {
                const isRecent = Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000;
                return isRecent;
            });

            // Nếu có target user, chỉ xóa tin nhắn của user đó
            if (targetUser) {
                messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
            }

            // Xóa tin nhắn
            if (messagesToDelete.size === 0) {
                return interaction.editReply({
                    embeds: [errorEmbed('Không có tin nhắn', 'Không tìm thấy tin nhắn nào để xóa!')]
                });
            }

            // Discord chỉ cho phép bulkDelete tối đa 100 tin nhắn
            const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

            // Thông báo thành công
            const successMessage = targetUser
                ? `Đã xóa ${deleted.size} tin nhắn của ${targetUser.tag}`
                : `Đã xóa ${deleted.size} tin nhắn`;

            await interaction.editReply({
                embeds: [successEmbed('Xóa tin nhắn thành công', successMessage)]
            });

            // Tự động xóa thông báo sau 5 giây
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    // Ignore error nếu message đã bị xóa
                }
            }, 5000);

        } catch (error) {
            console.error('Lỗi khi xóa tin nhắn:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi xóa tin nhắn!')]
            });
        }
    }
};
