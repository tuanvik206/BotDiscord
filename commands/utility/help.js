import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách lệnh và hướng dẫn sử dụng')
        .addStringOption(option =>
            option
                .setName('command')
                .setDescription('Tên lệnh cần xem chi tiết')
                .setRequired(false)
                .addChoices(
                    { name: 'ban', value: 'ban' },
                    { name: 'kick', value: 'kick' },
                    { name: 'unban', value: 'unban' },
                    { name: 'warn', value: 'warn' },
                    { name: 'mute', value: 'mute' },
                    { name: 'unmute', value: 'unmute' },
                    { name: 'slowmode', value: 'slowmode' },
                    { name: 'lock', value: 'lock' }
                )
        ),

    async execute(interaction) {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            // Hiển thị chi tiết của lệnh cụ thể
            const commandDetails = getCommandDetails(commandName);
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`📖 Hướng dẫn: /${commandName}`)
                .setDescription(commandDetails.description)
                .addFields(
                    { name: '📝 Cú pháp', value: commandDetails.syntax, inline: false },
                    { name: '✨ Ví dụ', value: commandDetails.example, inline: false },
                    { name: '🔐 Quyền yêu cầu', value: commandDetails.permission, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Bot Quản Lý Lớp Học' });

            await interaction.reply({ embeds: [embed] });
        } else {
            // Hiển thị danh sách tất cả lệnh
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('📚 Danh Sách Lệnh Bot')
                .setDescription('Dưới đây là tất cả các lệnh có sẵn. Sử dụng `/help <tên lệnh>` để xem chi tiết.')
                .addFields(
                    {
                        name: '🛡️ Moderation',
                        value: '`/ban` - Ban thành viên\n' +
                               '`/kick` - Kick thành viên\n' +
                               '`/unban` - Unban người dùng\n' +
                               '`/warn` - Cảnh báo thành viên\n' +
                               '`/mute` - Timeout thành viên\n' +
                               '`/unmute` - Gỡ timeout\n' +
                               '`/slowmode` - Thiết lập slowmode\n' +
                               '`/unmute` - Gỡ timeout\n' +
                               '`/slowmode` - Thiết lập slowmode\n' +
                               '`/lock` - Khóa/mở khóa kênh',
                        inline: false
                    },
                    {
                        name: '🎓 Lớp Học',
                        value: '`/poll` - Tạo bình chọn',
                        inline: false
                    },
                    {
                        name: '🔧 Utility',
                        value: '`/help` - Hiển thị trợ giúp',
                        inline: false
                    },
                    {
                        name: '💡 Mẹo',
                        value: '• Sử dụng `/help <tên lệnh>` để xem hướng dẫn chi tiết\n' +
                               '• Tất cả lệnh moderation yêu cầu quyền tương ứng\n' +
                               '• Bot cần có quyền cao hơn người bị moderate',
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: 'Bot Quản Lý Lớp Học' });

            await interaction.reply({ embeds: [embed] });
        }
    }
};

function getCommandDetails(commandName) {
    const commands = {
        ban: {
            description: 'Ban một thành viên khỏi server. Người bị ban không thể join lại trừ khi được unban.',
            syntax: '`/ban user:<@user> [reason:"Lý do"] [delete_days:0-7]`',
            example: '`/ban user:@BadUser reason:"Spam" delete_days:7`',
            permission: 'BAN_MEMBERS'
        },
        kick: {
            description: 'Kick một thành viên khỏi server. Người bị kick có thể join lại.',
            syntax: '`/kick user:<@user> [reason:"Lý do"]`',
            example: '`/kick user:@BadUser reason:"Vi phạm quy định"`',
            permission: 'KICK_MEMBERS'
        },
        unban: {
            description: 'Unban một người dùng bằng ID của họ.',
            syntax: '`/unban user_id:<ID> [reason:"Lý do"]`',
            example: '`/unban user_id:123456789012345678 reason:"Đã xin lỗi"`',
            permission: 'BAN_MEMBERS'
        },
        warn: {
            description: 'Cảnh báo một thành viên. Bot sẽ gửi DM cho họ.',
            syntax: '`/warn user:<@user> reason:"Lý do"`',
            example: '`/warn user:@User reason:"Đăng nội dung không phù hợp"`',
            permission: 'MODERATE_MEMBERS'
        },
        mute: {
            description: 'Timeout một thành viên (họ không thể gửi tin nhắn). Tối đa 28 ngày.',
            syntax: '`/mute user:<@user> duration:<phút> [reason:"Lý do"]`',
            example: '`/mute user:@SpamUser duration:30 reason:"Spam liên tục"`',
            permission: 'MODERATE_MEMBERS'
        },
        unmute: {
            description: 'Gỡ timeout cho một thành viên.',
            syntax: '`/unmute user:<@user> [reason:"Lý do"]`',
            example: '`/unmute user:@User reason:"Đã hết thời gian phạt"`',
            permission: 'MODERATE_MEMBERS'
        },
        slowmode: {
            description: 'Thiết lập slowmode cho kênh (giới hạn tốc độ gửi tin nhắn). Tối đa 6 giờ.',
            syntax: '`/slowmode duration:<giây> [channel:<#channel>]`',
            example: '`/slowmode duration:5` hoặc `/slowmode duration:0` để tắt',
            permission: 'MANAGE_CHANNELS'
        },
        lock: {
            description: 'Khóa hoặc mở khóa kênh (toggle). Khi khóa, chỉ moderators mới gửi được tin nhắn.',
            syntax: '`/lock [channel:<#channel>] [reason:"Lý do"]`',
            example: '`/lock reason:"Đang có vấn đề"` - Chạy lại để mở khóa',
            permission: 'MANAGE_CHANNELS'
        },
        poll: {
            description: 'Tạo cuộc bình chọn với nút bấm. Hỗ trợ xem người vote, xuất file Excel và phân quyền kết thúc.',
            syntax: '`/poll question:"Câu hỏi" options:"Lựa chọn 1, Lựa chọn 2..."`',
            example: '`/poll question:"Học bù vào thứ mấy?" options:"Thứ 7, Chủ Nhật, Thứ 2"`',
            permission: 'MỌI NGƯỜI (Kết thúc/Xuất file: Chủ poll hoặc Admin)'
        }
    };

    return commands[commandName];
}
