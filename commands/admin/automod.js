import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { customEmbed, successEmbed, errorEmbed, infoEmbed, COLORS, ICONS } from '../../utils/embedBuilder.js';
import { hasPermission } from '../../utils/permissions.js';
import { 
    getConfig, 
    updateConfig,
    getWhitelist,
    getBlacklist 
} from '../../utils/automod/automodHandler.js';
import { getWarnings, resetWarnings } from '../../utils/automod/warningSystem.js';

export default {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Quản lý hệ thống auto-moderation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Xem Dashboard trạng thái auto-moderation')
        )
        // ... (Other subcommands remain same)
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Bật/tắt module auto-moderation')
                .addStringOption(option =>
                    option
                        .setName('module')
                        .setDescription('Module cần bật/tắt')
                        .setRequired(true)
                        .addChoices(
                            { name: '🚫 Spam Detection', value: 'spam' },
                            { name: '🔗 Link Filter', value: 'links' },
                            { name: '🤬 Profanity Filter', value: 'profanity' },
                            { name: '⚠️ Warning System', value: 'warnings' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('Xem warnings của user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User cần xem')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset warnings của user')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User cần reset')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('link_settings')
                .setDescription('Cấu hình bộ lọc link')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Chế độ chặn')
                        .setRequired(true)
                        .addChoices(
                            { name: '🔒 Chặn tất cả (Chỉ cho phép Whitelist)', value: 'strict' },
                            { name: '🔓 Chỉ chặn Blacklist (Mặc định)', value: 'basic' }
                        )
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Kiểm tra quyền
        if (!hasPermission(interaction.member, PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [errorEmbed('Không có quyền', 'Bạn cần quyền Administrator để sử dụng lệnh này!')],
                flags: 64
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            await handleStatus(interaction);
        } else if (subcommand === 'toggle') {
            await handleToggle(interaction);
        } else if (subcommand === 'warnings') {
            await handleWarnings(interaction);
        } else if (subcommand === 'reset') {
            await handleReset(interaction);
        } else if (subcommand === 'whitelist') {
            await handleWhitelist(interaction);
        } else if (subcommand === 'link_settings') {
            await handleLinkSettings(interaction);
        }
    }
};

// ... (Other handlers remain same)

async function handleLinkSettings(interaction) {
    const mode = interaction.options.getString('mode');
    const config = await getConfig(interaction.guild.id);

    // Update config
    config.links.blockAll = (mode === 'strict');
    
    // Ensure allowWhitelist is true if strict mode
    if (mode === 'strict') {
        config.links.allowWhitelist = true;
    }

    await updateConfig(interaction.guild.id, config);

    const statusText = mode === 'strict' 
        ? '🔒 **Strict Mode** (Chặn tất cả link ngoài Whitelist)' 
        : '🔓 **Basic Mode** (Chỉ chặn link trong Blacklist)';

    await interaction.reply({
        embeds: [successEmbed(
            'Cập nhật cấu hình Link',
            `Đã chuyển sang chế độ: ${statusText}`
        )]
    });
}

async function handleStatus(interaction) {
    const config = await getConfig(interaction.guild.id);

    const statusEmbed = customEmbed({
        title: `${ICONS.SETTINGS} Auto-Moderation Dashboard`,
        description: 'Tổng quan trạng thái hệ thống bảo vệ server.',
        color: COLORS.PRIMARY,
        thumbnail: 'https://cdn-icons-png.flaticon.com/512/9350/9350318.png', // Shield Icon
        fields: [
            {
                name: '🛡️ Modules Status',
                value: `> **Spam:** ${config.spam.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
                       `> **Links:** ${config.links.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
                       `> **Bad Words:** ${config.profanity.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
                       `> **Warns:** ${config.warnings.enabled ? '🟢 ON' : '🔴 OFF'}`,
                inline: true
            },
            {
                name: '⚙️ Configurations',
                value: `> **Spam:** \`${config.spam.maxMessages} msg / ${config.spam.timeWindow/1000}s\`\n` +
                       `> **Bad Words Level:** \`${config.profanity.filterLevel}\`\n` +
                       `> **Logging:** ${config.logging.enabled ? '✅' : '❌'}`,
                inline: true
            }
        ],
        footer: { text: `Security Level: High • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() }
    });

    await interaction.reply({ embeds: [statusEmbed] });
}

async function handleToggle(interaction) {
    const module = interaction.options.getString('module');
    const config = await getConfig(interaction.guild.id);

    // Toggle module
    config[module].enabled = !config[module].enabled;
    await updateConfig(interaction.guild.id, config);

    const isEnabled = config[module].enabled;
    const statusText = isEnabled ? 'Đã BẬT 🟢' : 'Đã TẮT 🔴';
    const moduleName = {
        'spam': '🚫 Spam Detection',
        'links': '🔗 Link Filter',
        'profanity': '🤬 Profanity Filter',
        'warnings': '⚠️ Warning System'
    }[module];

    await interaction.reply({
        embeds: [customEmbed({
            title: `${ICONS.SETTINGS} Cập nhật cấu hình`,
            description: `Module **${moduleName}** hiện tại: **${statusText}**`,
            color: isEnabled ? COLORS.SUCCESS : COLORS.ERROR,
            footer: { text: `Admin: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }
        })]
    });
}

async function handleWarnings(interaction) {
    const user = interaction.options.getUser('user');
    const warnings = await getWarnings(user.id, interaction.guild.id);

    if (!warnings || warnings.totalWarnings === 0) {
        return interaction.reply({
            embeds: [successEmbed(
                'Hồ sơ sạch',
                `User ${user} chưa có cảnh báo nào! 🎉`
            )],
            flags: 64
        });
    }

    const warningList = warnings.warnings
        .slice(-5) // Lấy 5 warnings gần nhất
        .map((w, i) => {
            const date = Math.floor(new Date(w.timestamp).getTime() / 1000);
            return `**${i + 1}.** \`${w.type}\` • ${w.reason}\n🕒 <t:${date}:R>`;
        })
        .join('\n\n');

    const embed = customEmbed({
        title: `⚠️ Lịch sử cảnh báo: ${user.tag}`,
        color: COLORS.WARNING,
        thumbnail: user.displayAvatarURL(),
        fields: [
            { name: '📊 Tổng số lần bị warn', value: `\`${warnings.totalWarnings}/5\``, inline: true },
            { name: '📝 Danh sách gần nhất', value: warningList || 'Không có dữ liệu', inline: false }
        ],
        footer: { text: 'Auto-Moderation System' }
    });

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleReset(interaction) {
    const user = interaction.options.getUser('user');
    const result = await resetWarnings(user.id, interaction.guild.id);

    if (result) {
        await interaction.reply({
            embeds: [successEmbed(
                'Reset thành công',
                `Đã xóa toàn bộ cảnh báo của ${user}. Hồ sơ đã sạch!`
            )]
        });
    } else {
        await interaction.reply({
            embeds: [errorEmbed(
                'Không thể reset',
                `${user} không có cảnh báo nào để xóa.`
            )],
            flags: 64
        });
    }
}

async function handleWhitelist(interaction) {
    const whitelist = getWhitelist(interaction.guild.id);
    const list = whitelist.length > 0 
        ? whitelist.map((domain, i) => `**${i + 1}.** \`${domain}\``).join('\n')
        : '_Danh sách trống_';

    const embed = customEmbed({
        title: '🔗 Whitelist Domains',
        description: 'Các tên miền được phép gửi link trong server.',
        color: COLORS.INFO,
        fields: [
            { name: 'Danh sách', value: list }
        ]
    });

    await interaction.reply({ embeds: [embed], flags: 64 });
}
