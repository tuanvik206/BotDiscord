import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Thiết lập slowmode cho kênh')
        .addIntegerOption(option =>
            option
                .setName('duration')
                .setDescription('Thời gian chờ giữa các tin nhắn (giây, 0 để tắt)')
                .setMinValue(0)
                .setMaxValue(21600) // 6 giờ = 21600 giây (giới hạn của Discord)
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Kênh cần thiết lập slowmode (mặc định là kênh hiện tại)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // Defer immediately to prevent timeout
        await interaction.deferReply({ flags: 64 });

        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ManageChannels)) {
            return interaction.editReply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền quản lý kênh!')]
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.ManageChannels)) {
            return interaction.editReply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền quản lý kênh!')]
            });
        }

        const duration = interaction.options.getInteger('duration');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        // Kiểm tra xem channel có phải là text channel không
        if (channel.type !== ChannelType.GuildText) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Chỉ có thể thiết lập slowmode cho text channel!')]
            });
        }

        try {
            await channel.setRateLimitPerUser(duration);

            if (duration === 0) {
                await interaction.editReply({
                    embeds: [successEmbed(
                        'Đã tắt slowmode',
                        `**Kênh:** ${channel}\nSlowmode đã được tắt.`
                    )]
                });
            } else {
                // Format thời gian
                let timeString;
                if (duration < 60) {
                    timeString = `${duration} giây`;
                } else if (duration < 3600) {
                    timeString = `${Math.floor(duration / 60)} phút`;
                } else {
                    const hours = Math.floor(duration / 3600);
                    const minutes = Math.floor((duration % 3600) / 60);
                    timeString = minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
                }

                await interaction.editReply({
                    embeds: [successEmbed(
                        'Đã thiết lập slowmode',
                        `**Kênh:** ${channel}\n**Thời gian chờ:** ${timeString}\n\nThành viên phải chờ ${timeString} giữa các tin nhắn.`
                    )]
                });
            }
        } catch (error) {
            console.error('Lỗi khi thiết lập slowmode:', error);
            await interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi thiết lập slowmode!')]
            });
        }
    }
};
