import { SlashCommandBuilder } from 'discord.js';
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
                .setDescription('Các lựa chọn (phân cách bằng dấu phẩy, tối đa 10)')
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const question = interaction.options.getString('question');
        const optionsString = interaction.options.getString('options');
        
        // Tách options bằng dấu phẩy hoặc |
        const options = optionsString.split(/[,|]/).map(opt => opt.trim()).filter(opt => opt.length > 0);

        // Validate số lượng options
        if (options.length < 2) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Cần ít nhất 2 lựa chọn để tạo bình chọn!')]
            });
        }

        if (options.length > 10) {
            return interaction.editReply({
                embeds: [errorEmbed('Lỗi', 'Tối đa chỉ được 10 lựa chọn!')]
            });
        }

        // Emoji số hiển thị
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

        // Tạo nội dung hiển thị options
        let description = '';
        for (let i = 0; i < options.length; i++) {
            description += `${emojis[i]} **${options[i]}**\n\n`;
        }

        // Tạo embed
        const embed = infoEmbed(`📊 ${question}`, description)
            .setFooter({ text: `Tạo bởi ${interaction.user.tag} • React để bình chọn!` })
            .setTimestamp();

        // Gửi poll message
        const pollMessage = await interaction.editReply({ embeds: [embed], fetchReply: true });

        // React với các emoji tương ứng
        try {
            for (let i = 0; i < options.length; i++) {
                await pollMessage.react(emojis[i]);
            }
        } catch (error) {
            console.error('Failed to react to poll message:', error);
        }
    }
};
