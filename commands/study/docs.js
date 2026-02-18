import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addDocument, searchDocuments, getDocumentsBySubject, deleteDocument, getSubjects } from '../../utils/documentHandler.js';
import { successEmbed, errorEmbed, infoEmbed, customEmbed, COLORS, ICONS } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Quản lý tài liệu học tập')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Thêm tài liệu mới')
                .addStringOption(option => option.setName('title').setDescription('Tên tài liệu').setRequired(true))
                .addStringOption(option => option.setName('url').setDescription('Link tài liệu').setRequired(true))
                .addStringOption(option => option.setName('subject').setDescription('Môn học (Toán, Lý, IT...)').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Mô tả thêm')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Tìm kiếm tài liệu')
                .addStringOption(option => option.setName('query').setDescription('Tên tài liệu cần tìm').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách tài liệu theo môn')
                .addStringOption(option => option.setName('subject').setDescription('Môn học').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Xóa tài liệu (ID lấy từ lệnh search/list)')
                .addStringOption(option => option.setName('id').setDescription('ID tài liệu').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subcommand === 'add') {
            const title = interaction.options.getString('title');
            const url = interaction.options.getString('url');
            const subject = interaction.options.getString('subject');
            const description = interaction.options.getString('description') || '';

            // Basic URL validation
            if (!url.match(/^https?:\/\/.+/)) {
                return interaction.reply({ embeds: [errorEmbed('Thất bại', 'Link không hợp lệ! Phải bắt đầu bằng `http://` hoặc `https://`')], flags: 64 });
            }

            await interaction.deferReply();
            const result = await addDocument(guildId, title, url, subject, interaction.user.id, description);

            if (result.success) {
                const embed = successEmbed(
                    'Đã thêm tài liệu!',
                    `**📚 ${title}**\n🔗 [Truy cập tài liệu](${url})\n📂 Môn: \`${subject}\`\n👤 Người thêm: <@${interaction.user.id}>`
                );
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ embeds: [errorEmbed('Lỗi', result.reason)] });
            }
        }

        else if (subcommand === 'search') {
            const query = interaction.options.getString('query');
            await interaction.deferReply();
            
            const docs = await searchDocuments(guildId, query);

            if (docs.length === 0) {
                return interaction.editReply({ embeds: [infoEmbed('Không tìm thấy', `Không có tài liệu nào khớp với từ khóa: \`${query}\``)] });
            }

            const embed = customEmbed({
                title: `🔍 Kết quả tìm kiếm: "${query}"`,
                description: `Tìm thấy **${docs.length}** tài liệu.`,
                color: COLORS.INFO,
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/2997/2997235.png'
            });

            docs.forEach((doc, index) => {
                embed.addFields({
                    name: `${index + 1}. ${doc.title} (${doc.subject})`,
                    value: `🔗 [Link](${doc.url}) • ID: \`${doc.id}\`\n${doc.description ? `📝 ${doc.description}` : ''}`,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });
        }

        else if (subcommand === 'list') {
            const subject = interaction.options.getString('subject');
            await interaction.deferReply();

            const docs = await getDocumentsBySubject(guildId, subject);

            if (docs.length === 0) {
                return interaction.editReply({ embeds: [infoEmbed('Trống', `Chưa có tài liệu nào cho môn: \`${subject}\``)] });
            }

            const embed = customEmbed({
                title: `📚 Tài liệu môn: ${subject}`,
                description: `Danh sách **${docs.length}** tài liệu gần nhất.`,
                color: COLORS.PRIMARY,
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/3389/3389081.png'
            });

            docs.forEach((doc, index) => {
                embed.addFields({
                    name: `${index + 1}. ${doc.title}`,
                    value: `🔗 [Link](${doc.url}) • ID: \`${doc.id}\``,
                    inline: false
                });
            });

            await interaction.editReply({ embeds: [embed] });
        }

        else if (subcommand === 'delete') {
            // Check permission (Admin or owner of document logic could be added)
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({ embeds: [errorEmbed('Từ chối', 'Bạn cần quyền `Manage Messages` để xóa tài liệu.')], flags: 64 });
            }

            const id = interaction.options.getString('id');
            await interaction.deferReply();

            const result = await deleteDocument(id);

            if (result) {
                await interaction.editReply({ embeds: [successEmbed('Thành công', `Đã xóa tài liệu có ID: \`${id}\``)] });
            } else {
                await interaction.editReply({ embeds: [errorEmbed('Lỗi', 'Không thể xóa tài liệu. ID có thể không tồn tại.')] });
            }
        }
    }
};
