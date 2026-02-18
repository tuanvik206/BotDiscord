import { SlashCommandBuilder } from 'discord.js';
import { helpEmbed, ICONS } from '../../utils/embedBuilder.js';

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
                    { name: 'lock', value: 'lock' },
                    { name: 'poll', value: 'poll' },
                    { name: 'project', value: 'project' },
                    { name: 'userinfo', value: 'userinfo' },
                    { name: 'ping', value: 'ping' },
                    { name: 'clear', value: 'clear' }
                )
        ),

    async execute(interaction) {
        const commandName = interaction.options.getString('command');

        if (commandName) {
            // Hiển thị chi tiết của lệnh cụ thể
            const cmd = getCommandDetails(commandName);
            if (!cmd) {
                 return interaction.reply({ content: 'Không tìm thấy hướng dẫn cho lệnh này.', flags: 64 });
            }

            const embed = helpEmbed(
                `Hướng dẫn: /${commandName}`,
                cmd.description,
                [
                    { name: '📝 Cú pháp', value: cmd.syntax, inline: false },
                    { name: '✨ Ví dụ', value: cmd.example, inline: false },
                    { name: '🔐 Quyền yêu cầu', value: `\`${cmd.permission}\``, inline: true }
                ]
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.reply({ embeds: [embed] });
        } else {
            // Hiển thị danh sách tất cả lệnh
            const embed = helpEmbed(
                'Danh Sách Lệnh Bot',
                'Dưới đây là tất cả các lệnh có sẵn. Sử dụng `/help <tên lệnh>` để xem chi tiết.'
            )
            .addFields(
                {
                    name: `${ICONS.MODERATION} Moderation`,
                    value: '`/ban`, `/kick`, `/unban`, `/warn`, `/mute`, `/unmute`\n`/clear`, `/lock`, `/slowmode`, `/automod`',
                    inline: false
                },
                {
                    name: `${ICONS.PROJECT} Quản Lý & Tiện Ích`,
                    value: '`/project`, `/poll`, `/userinfo`, `/ping`, `/cam`',
                    inline: false
                },
                {
                    name: '💡 Mẹo',
                    value: '• Bot cần quyền **Admin** để hoạt động tốt nhất.\n• Mọi hành động đều được log lại nếu đã cấu hình.',
                    inline: false
                }
            )
            .setImage('https://media.discordapp.net/attachments/1111111111111111111/banner.png') // Placeholder banner đẹp
            .setFooter({ text: `Bot Version 1.0.0 • ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

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
            syntax: '`/poll question:"Câu hỏi" options:"Opt1, Opt2..." [duration:"24h"]`',
            example: '`/poll question:"Đi đâu?" options:"Biển, Núi" duration:"2h"`',
            permission: 'MỌI NGƯỜI'
        },
        project: {
            description: 'Hệ thống quản lý Project/Nhóm. Tạo category và channel riêng cho nhóm.',
            syntax: '`/project create name:"Tên Project"`\n`/project add_member`...',
            example: '`/project create name:"Game RPG"`',
            permission: 'ADMIN ONLY (Tạo), LEADER (Quản lý)'
        },
        userinfo: {
            description: 'Xem thông tin chi tiết (Profile) của thành viên.',
            syntax: '`/userinfo [target:<@user>]`',
            example: '`/userinfo` hoặc `/userinfo target:@Admin`',
            permission: 'MỌI NGƯỜI'
        },
        ping: {
            description: 'Xem Dashboard trạng thái hệ thống (Uptime, RAM, Ping).',
            syntax: '`/ping`',
            example: '`/ping`',
            permission: 'MỌI NGƯỜI'
        },
        clear: {
            description: 'Xóa hàng loạt tin nhắn trong kênh.',
            syntax: '`/clear amount:<số lượng> [target:<@user>]`',
            example: '`/clear amount:50`',
            permission: 'MANAGE_MESSAGES'
        }
    };

    return commands[commandName];
}
