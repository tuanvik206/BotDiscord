import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { infoEmbed, errorEmbed } from '../../utils/embedBuilder.js';
import ExcelJS from 'exceljs';

export default {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Tạo cuộc bình chọn (Poll)')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Câu hỏi bình chọn')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('options')
                .setDescription('Các lựa chọn (phân cách bằng dấu phẩy, tối đa 5)')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
        } catch (error) {
            // Error 10062: Unknown interaction (Took too long > 3s or network issue)
            // Error 40060: Interaction already acknowledged
            if (error.code === 10062 || error.code === 40060) {
                console.warn(`⚠️ Interaction failed for /poll: ${error.message} (Network lag or timeout)`);
                return; // Stop execution, cannot reply anymore
            }
            throw error; // Rethrow other errors
        }

        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        
        // Tách options
        const options = optionsString.split(/[,|]/).map(opt => opt.trim()).filter(opt => opt.length > 0);

        // Validate
        if (options.length < 2) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Cần ít nhất 2 lựa chọn!')]
            });
        }

        if (options.length > 5) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Với Button Poll, tối đa chỉ được 5 lựa chọn! (Discord giới hạn 1 hàng)')]
            });
        }

        // Data structure cho vote (Map<UserId, {optionIndex, timestamp}>)
        const userVotes = new Map();

        // Hàm tạo nội dung hiển thị
        const generateDescription = () => {
            let desc = '';
            const totalVotes = userVotes.size;

            options.forEach((opt, index) => {
                const votesForOption = Array.from(userVotes.values()).filter(v => v.optionIndex === index).length;
                const percentage = totalVotes === 0 ? 0 : Math.round((votesForOption / totalVotes) * 100);
                
                // Tạo progress bar: ▓▓▓▓▓░░░░░
                const barLength = 10;
                const filledChars = Math.round((percentage / 100) * barLength);
                const emptyChars = barLength - filledChars;
                const progressBar = '▓'.repeat(filledChars) + '░'.repeat(emptyChars);

                desc += `${index + 1}️⃣ **${opt}**\n`;
                desc += `${progressBar} **${percentage}%** (${votesForOption} phiếu)\n\n`;
            });

            desc += `\n*Tổng cộng: ${totalVotes} phiếu*`;
            return desc;
        };

        // Tạo Buttons
        const buttons = options.map((opt, index) => {
            return new ButtonBuilder()
                .setCustomId(`poll_opt_${index}`)
                .setLabel(`${index + 1}. ${opt.substring(0, 75)}`)
                .setStyle(ButtonStyle.Primary);
        });

        // Nút chức năng
        const infoBtn = new ButtonBuilder()
            .setCustomId('poll_info')
            .setLabel('Ai đã vote?')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❔');

        const exportBtn = new ButtonBuilder()
            .setCustomId('poll_export')
            .setLabel('Xuất Excel')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📊');

        const endBtn = new ButtonBuilder()
            .setCustomId('poll_end')
            .setLabel('Kết thúc')
            .setStyle(ButtonStyle.Danger);

        // Rows
        const row1 = new ActionRowBuilder().addComponents(buttons);
        const row2 = new ActionRowBuilder().addComponents(infoBtn, exportBtn, endBtn);

        // Embed ban đầu
        const embed = infoEmbed(`📊 ${question}`, generateDescription())
            .setFooter({ text: `Tạo bởi ${interaction.user.tag} • Bấm nút để bình chọn!` })
            .setTimestamp();

        // Gửi tin nhắn
        const message = await interaction.editReply({
            embeds: [embed],
            components: [row1, row2]
        });

        // Collector
        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 24 * 60 * 60 * 1000 // 24 giờ
        });

        collector.on('collect', async i => {
            try {
                // Xử lý nút Kết thúc (chủ poll hoặc Admin)
                if (i.customId === 'poll_end') {
                    const isAdmin = i.member.permissions.has(PermissionFlagsBits.Administrator);
                    if (i.user.id !== interaction.user.id && !isAdmin) {
                        return i.reply({ content: 'Chỉ người tạo poll hoặc Admin mới được kết thúc!', flags: 64 });
                    }
                    
                    // Disable components
                    const disabledRow1 = ActionRowBuilder.from(row1);
                    disabledRow1.components.forEach(btn => btn.setDisabled(true));
                    
                    const disabledRow2 = ActionRowBuilder.from(row2);
                    disabledRow2.components.forEach(btn => btn.setDisabled(true));

                    await i.update({
                        content: '🛑 **Cuộc bình chọn đã kết thúc!**',
                        components: [disabledRow1, disabledRow2]
                    });
                    collector.stop();
                    return;
                }

                // Xử lý xuất Excel
                if (i.customId === 'poll_export') {
                    const isAdmin = i.member.permissions.has(PermissionFlagsBits.Administrator);
                    if (i.user.id !== interaction.user.id && !isAdmin) {
                        return i.reply({ content: 'Chỉ người tạo poll hoặc Admin mới được xuất file!', flags: 64 });
                    }

                    if (userVotes.size === 0) {
                        return i.reply({ content: 'Chưa có ai vote nên không thể xuất file!', flags: 64 });
                    }

                    await i.deferReply({ flags: 64 });

                    // Tạo file Excel
                    const workbook = new ExcelJS.Workbook();
                    
                    // Sheet 1: Tổng hợp (Summary)
                    const locationSheet = workbook.addWorksheet('Thống kê');
                    locationSheet.columns = [
                        { header: 'Lựa chọn', key: 'option', width: 40 },
                        { header: 'Số lượng vote', key: 'count', width: 15 },
                        { header: 'Tỷ lệ', key: 'percent', width: 15 }
                    ];

                    const totalVotes = userVotes.size;
                    options.forEach((opt, index) => {
                        const count = Array.from(userVotes.values()).filter(v => v.optionIndex === index).length;
                        const percent = totalVotes === 0 ? 0 : ((count / totalVotes) * 100).toFixed(1) + '%';
                        
                        locationSheet.addRow({
                            option: opt,
                            count: count,
                            percent: percent
                        });
                    });

                    locationSheet.addRow({}); // Dòng trống
                    locationSheet.addRow({ option: 'Tổng cộng', count: totalVotes });

                    // Sheet 2: Chi tiết (Details)
                    const worksheet = workbook.addWorksheet('Chi tiết người vote');
                    worksheet.columns = [
                        { header: 'User ID', key: 'id', width: 20 },
                        { header: 'User Tag', key: 'tag', width: 30 },
                        { header: 'Lựa chọn', key: 'choice', width: 40 },
                        { header: 'Thời gian', key: 'time', width: 20 }
                    ];

                    // Cache user info để lấy tag
                    for (const [userId, data] of userVotes.entries()) {
                        let userTag = 'Unknown';
                        try {
                            const user = await interaction.client.users.fetch(userId);
                            userTag = user.tag;
                        } catch (e) {}

                        worksheet.addRow({
                            id: userId,
                            tag: userTag,
                            choice: options[data.optionIndex],
                            time: new Date(data.timestamp).toLocaleString('vi-VN')
                        });
                    }

                    const buffer = await workbook.xlsx.writeBuffer();
                    const attachment = new AttachmentBuilder(buffer, { name: 'poll_results.xlsx' });

                    await i.editReply({ files: [attachment] });
                    return;
                }

                // Xử lý nút xem info
                if (i.customId === 'poll_info') {
                    let info = '**Danh sách vote:**\n';
                    options.forEach((opt, index) => {
                        const voters = Array.from(userVotes.entries())
                            .filter(([uid, data]) => data.optionIndex === index)
                            .map(([uid]) => `<@${uid}>`);
                        
                        if (voters.length > 0) {
                            info += `\n**${opt}:** ${voters.join(', ')}`;
                        }
                    });

                    if (userVotes.size === 0) info = 'Chưa có ai vote cả!';

                    return i.reply({ content: info, flags: 64 });
                }

                // Xử lý Vote
                const selection = parseInt(i.customId.replace('poll_opt_', ''));
                const userId = i.user.id;
                const timestamp = Date.now();

                 // Check if voted same option (Toggle off)
                const currentVote = userVotes.get(userId);
                if (currentVote && currentVote.optionIndex === selection) {
                    userVotes.delete(userId); // Remove vote
                    await i.reply({ content: 'Bạn đã hủy vote.', flags: 64 });
                } else {
                    userVotes.set(userId, { optionIndex: selection, timestamp }); // Set/Change vote
                    await i.reply({ content: `Bạn đã vote cho: **${options[selection]}**`, flags: 64 });
                }

                // Update Embed
                try {
                    const newEmbed = infoEmbed(`📊 ${question}`, generateDescription())
                        .setFooter({ text: `Tạo bởi ${interaction.user.tag} • Bấm nút để bình chọn!` })
                        .setTimestamp();
                    
                    await interaction.editReply({ embeds: [newEmbed] });
                } catch (err) {
                    console.error('Error updating poll embed:', err);
                }

            } catch (error) {
                console.error('Error in poll collector:', error);
                if (!i.replied && !i.deferred) {
                    await i.reply({ content: 'Đã xảy ra lỗi khi xử lý vote!', flags: 64 });
                }
            }
        });

        collector.on('end', () => {
             console.log('Poll collector ended');
        });
    }
};
