import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import { hasPermission, botHasPermission } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Khóa/mở khóa kênh (toggle)')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Kênh cần khóa/mở (mặc định là kênh hiện tại)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do khóa/mở kênh')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // Kiểm tra quyền của user
        if (!hasPermission(interaction.member, PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                embeds: [errorEmbed('Không có quyền', 'Bạn không có quyền quản lý kênh!')],
                ephemeral: true
            });
        }

        // Kiểm tra quyền của bot
        if (!botHasPermission(interaction.guild, PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                embeds: [errorEmbed('Bot không có quyền', 'Bot không có quyền quản lý kênh!')],
                ephemeral: true
            });
        }

        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'Không có lý do';

        // Kiểm tra xem channel có phải là text channel không
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                embeds: [errorEmbed('Lỗi', 'Chỉ có thể khóa text channel!')],
                ephemeral: true
            });
        }

        try {
            // Lấy permission của @everyone role
            const everyoneRole = interaction.guild.roles.everyone;
            const permissions = channel.permissionOverwrites.cache.get(everyoneRole.id);
            
            // Kiểm tra xem kênh đã bị khóa chưa
            const isLocked = permissions?.deny.has(PermissionFlagsBits.SendMessages);

            if (isLocked) {
                // Mở khóa kênh
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null
                });

                await interaction.reply({
                    embeds: [successEmbed(
                        '🔓 Đã mở khóa kênh',
                        `**Kênh:** ${channel}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}\n\nThành viên có thể gửi tin nhắn trong kênh này.`
                    )]
                });
            } else {
                // Khóa kênh
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false
                });

                await interaction.reply({
                    embeds: [errorEmbed(
                        '🔒 Đã khóa kênh',
                        `**Kênh:** ${channel}\n**Lý do:** ${reason}\n**Bởi:** ${interaction.user.tag}\n\nChỉ moderators mới có thể gửi tin nhắn trong kênh này.`
                    )]
                });
            }
        } catch (error) {
            console.error('Lỗi khi khóa/mở kênh:', error);
            await interaction.reply({
                embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi khóa/mở kênh!')],
                ephemeral: true
            });
        }
    }
};
