import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { infoEmbed, errorEmbed } from '../../utils/embedBuilder.js';

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
        await interaction.deferReply();

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

        // Data structure cho vote (Map<UserId, OptionIndex>)
        // Lưu ý: Map này chỉ sống khi bot chạy. Nếu restart bot, vote cũ sẽ không tương tác được.
        // Để persist cần database. Với scope hiện tại dùng In-Memory Map.
        const userVotes = new Map();

        // Hàm tạo nội dung hiển thị
        const generateDescription = () => {
            let desc = '';
            const totalVotes = userVotes.size;

            options.forEach((opt, index) => {
                const votesForOption = Array.from(userVotes.values()).filter(v => v === index).length;
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
                .setLabel(`${index + 1}. ${opt.substring(0, 75)}`) // Giới hạn độ dài label
                .setStyle(ButtonStyle.Primary);
        });

        // Nút xem info và kết thúc
        const infoBtn = new ButtonBuilder()
            .setCustomId('poll_info')
            .setLabel('Ai đã vote?')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❔');

        const endBtn = new ButtonBuilder()
            .setCustomId('poll_end')
            .setLabel('Kết thúc')
            .setStyle(ButtonStyle.Danger);

        // Rows
        const row1 = new ActionRowBuilder().addComponents(buttons);
        const row2 = new ActionRowBuilder().addComponents(infoBtn, endBtn);

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
            // Xử lý nút Kết thúc (chỉ người tạo poll)
            if (i.customId === 'poll_end') {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Chỉ người tạo poll mới được kết thúc!', flags: 64 });
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

            // Xử lý nút xem info
            if (i.customId === 'poll_info') {
                let info = '**Danh sách vote:**\n';
                options.forEach((opt, index) => {
                    const voters = Array.from(userVotes.entries())
                        .filter(([uid, choice]) => choice === index)
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

            // Check if voted same option (Toggle off)
            if (userVotes.has(userId) && userVotes.get(userId) === selection) {
                userVotes.delete(userId); // Remove vote
                await i.reply({ content: 'Bạn đã hủy vote.', flags: 64 });
            } else {
                userVotes.set(userId, selection); // Set/Change vote
                await i.reply({ content: `Bạn đã vote cho: **${options[selection]}**`, flags: 64 });
            }

            // Update Embed (không cần reply lại i, vì đã reply ephemeral ở trên)
            // Cần update message gốc
            try {
                const newEmbed = infoEmbed(`📊 ${question}`, generateDescription())
                    .setFooter({ text: `Tạo bởi ${interaction.user.tag} • Bấm nút để bình chọn!` })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [newEmbed] });
            } catch (err) {
                console.error('Error updating poll embed:', err);
            }
        });

        collector.on('end', () => {
            // Cleanup nếu cần
            console.log('Poll collector ended');
        });
    }
};
