import { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } from 'discord.js';
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
                .setDescription('Xem danh sách tài liệu theo môn (Chọn từ Menu)')
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
             // ... (Keep existing add logic)
            const title = interaction.options.getString('title');
            const url = interaction.options.getString('url');
            const subject = interaction.options.getString('subject');
            const description = interaction.options.getString('description') || '';

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
            // ... (Keep existing search logic)
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

            // Lấy tối đa 25 tài liệu (giới hạn của Select Menu)
            const docs = await getDocumentsBySubject(guildId, subject);

            if (docs.length === 0) {
                return interaction.editReply({ embeds: [infoEmbed('Trống', `Chưa có tài liệu nào cho môn: \`${subject}\``)] });
            }

            // Tạo Select Menu
            const selectOptions = docs.slice(0, 25).map(doc => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(doc.title.substring(0, 100)) // Giới hạn 100 ký tự
                    .setDescription(doc.url.substring(0, 100)) // Description là link (tạm)
                    .setValue(doc.id)
                    .setEmoji('📚')
            );

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select_doc')
                .setPlaceholder('Chọn tài liệu để xem chi tiết...')
                .addOptions(selectOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const response = await interaction.editReply({
                embeds: [infoEmbed(`Danh sách tài liệu: ${subject}`, 'Vui lòng chọn tài liệu từ menu bên dưới để xem chi tiết 👇')],
                components: [row]
            });

            // Collector xử lý sự kiện chọn menu
            const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Chỉ người dùng lệnh mới được chọn!', flags: 64 });
                }

                const selectedDocId = i.values[0];
                const doc = docs.find(d => d.id === selectedDocId);

                if (doc) {
                    const embed = customEmbed({
                        title: `📚 ${doc.title}`,
                        description: doc.description || 'Không có mô tả.',
                        color: COLORS.PRIMARY,
                        thumbnail: 'https://cdn-icons-png.flaticon.com/512/3389/3389081.png',
                        fields: [
                            { name: '📂 Môn học', value: `\`${doc.subject}\``, inline: true },
                            { name: '🔗 Link tải', value: `[Bấm vào đây để truy cập](${doc.url})`, inline: true },
                            { name: '👤 Người đăng', value: `<@${doc.added_by}>`, inline: true },
                            { name: '🆔 ID', value: `\`${doc.id}\``, inline: true }
                        ],
                        timestamp: true
                    });

                    await i.update({ embeds: [embed], components: [row] }); // Giữ lại menu để chọn cái khác
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {}); // Xóa menu khi hết giờ
            });
        }

        else if (subcommand === 'delete') {
            // ... (Keep existing delete logic)
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
