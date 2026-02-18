import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { customEmbed, COLORS, ICONS } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Xem thông tin chi tiết của thành viên')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('Người cần xem (để trống để xem bản thân)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(targetUser.id);

        // Format ngày tháng
        const formatDate = (date) => {
            return `<t:${Math.floor(date.getTime() / 1000)}:f> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;
        };

        // Lấy roles (trừ @everyone)
        const roles = member.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(r => r)
            .slice(0, 10); // Lấy tối đa 10 role
        
        const rolesDisplay = roles.length > 0 ? roles.join(' ') : 'Không có';
        const rolesCount = member.roles.cache.size - 1; // Trừ @everyone

        // Key Permissions
        const keyPermissions = [
            'Administrator',
            'ManageGuild',
            'BanMembers',
            'KickMembers',
            'ManageMessages'
        ];
        
        const permissions = member.permissions.toArray()
            .filter(p => keyPermissions.includes(p))
            .map(p => `\`${p}\``)
            .join(', ');

        const embed = customEmbed({
            title: `${ICONS.USER} Thông tin thành viên: ${targetUser.tag}`,
            color: member.displayColor || COLORS.PRIMARY,
            thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 512 }),
            image: targetUser.bannerURL({ dynamic: true, size: 1024 }),
            fields: [
                {
                    name: '👤 Identity',
                    value: `> **ID:** \`${targetUser.id}\`\n> **Bot:** ${targetUser.bot ? '🤖 Có' : '👤 Không'}`,
                    inline: true
                },
                {
                    name: '📅 Timeline',
                    value: `> **Tạo Account:**\n${formatDate(targetUser.createdAt)}\n> **Vào Server:**\n${formatDate(member.joinedAt)}`,
                    inline: false
                },
                {
                    name: `🎭 Roles [${rolesCount}]`,
                    value: rolesDisplay + (rolesCount > 10 ? ` ...và ${rolesCount - 10} role khác` : ''),
                    inline: false
                },
                {
                    name: '🛡️ Key Permissions',
                    value: permissions || 'Thành viên thường',
                    inline: false
                }
            ],
            footer: { text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }
        });

        await interaction.reply({ embeds: [embed] });
    }
};
