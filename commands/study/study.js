import { SlashCommandBuilder } from 'discord.js';
import { customEmbed, COLORS } from '../../utils/embedBuilder.js';

// Danh sách câu nói động lực
const MOTIVATIONAL_QUOTES = [
    "Học đi, đừng để tương lai phải hối hận! 📚",
    "Không có áp lực, không có kim cương. 💎",
    "Thức khuya dậy sớm vì tương lai. ☀️",
    "Hôm nay học, ngày mai thành công. 🚀",
    "Kiến thức là sức mạnh! 💪",
    "Đừng để sự lười biếng đánh bại ước mơ của bạn. ✨",
    "Mỗi trang sách là một bước đi đến thành công. 📖"
];

const STUDY_IMAGES = [
    "https://i.pinimg.com/originals/67/f6/cb/67f6cb14f862297e3c145009e6f36539.gif", // Lofi Girl
    "https://media.tenor.com/tEBoZ1aACjgAAAAM/anime-study.gif", 
    "https://media.tenor.com/bCKBcnw-9r4AAAAM/study-anime.gif"
];

export default {
    data: new SlashCommandBuilder()
        .setName('study')
        .setDescription('Nhắc nhở học tập')
        .addSubcommand(subcommand =>
            subcommand
                .setName('now')
                .setDescription('Gửi thông báo nhắc mọi người học bài ngay!'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('timer')
                .setDescription('Đặt hẹn giờ học (Pomodoro)')
                .addIntegerOption(option => 
                    option.setName('minutes')
                        .setDescription('Số phút học (Mặc định 25)')
                        .setMinValue(1)
                        .setMaxValue(120))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'now') {
            const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
            const image = STUDY_IMAGES[Math.floor(Math.random() * STUDY_IMAGES.length)];

            const embed = customEmbed({
                title: '🔔 GIỜ HỌC ĐẾN RỒI!',
                description: `📢 <@&${interaction.guild.roles.everyone.id}> **MỌI NGƯỜI ƠI, VÀO BÀI THÔI!**\n\n> *"${quote}"*`,
                color: COLORS.PREMIUM,
                image: image,
                footer: { text: `Lời nhắc từ ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }
            });

            await interaction.reply({ embeds: [embed] });
        }

        else if (subcommand === 'timer') {
            const minutes = interaction.options.getInteger('minutes') || 25;
            const ms = minutes * 60 * 1000;
            const endTime = Math.floor((Date.now() + ms) / 1000);

            const embed = customEmbed({
                title: '🍅 POMODORO TIMER',
                description: `⏰ **Bắt đầu phiên học ${minutes} phút!**\n\nKết thúc lúc: <t:${endTime}:R>\n\n> Hãy tập trung cao độ nhé! 📵`,
                color: COLORS.SUCCESS,
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/3209/3209965.png'
            });

            await interaction.reply({ embeds: [embed] });

            // Set timeout để nhắc khi hết giờ
            setTimeout(async () => {
                const endEmbed = customEmbed({
                    title: '🎉 HẾT GIỜ!',
                    description: `⏰ Đã xong phiên học **${minutes} phút**.\nHãy nghỉ ngơi một chút nhé! ☕`,
                    color: COLORS.WARNING // Màu vàng cho nghỉ ngơi
                });
                
                // Gửi follow-up message (cần fetch lại reply nếu interaction đã cũ, 
                // nhưng followUp thường hoạt động trong 15p. 
                // Với thời gian dài > 15p, token có thể hết hạn. 
                // Tuy nhiên đây là demo đơn giản.)
                try {
                    await interaction.followUp({ content: `<@${interaction.user.id}>`, embeds: [endEmbed] });
                } catch (e) {
                    // Nếu token hết hạn, fallback gửi tin nhắn thường vào kênh (nếu bot có quyền)
                    // Ở đây tạm thời bắt lỗi, thực tế nên dùng database để queue timer.
                    console.log('Timer ended but interaction token expired.');
                    interaction.channel.send({ content: `🔔 <@${interaction.user.id}> Hết giờ học rồi! Nghỉ ngơi thôi! ☕`, embeds: [endEmbed] }).catch(() => {});
                }
            }, ms);
        }
    }
};
