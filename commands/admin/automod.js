import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed, COLORS } from '../../utils/embedBuilder.js';
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
                .setDescription('Xem trạng thái auto-moderation')
        )
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
                .setName('whitelist')
                .setDescription('Xem danh sách domains được phép')
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
        }
    }
};

async function handleStatus(interaction) {
    const config = await getConfig(interaction.guild.id);

    const statusEmbed = infoEmbed(
        '⚙️ Auto-Moderation Status',
        'Trạng thái các module auto-moderation:',
        [
            {
                name: '🚫 Spam Detection',
                value: config.spam.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '🔗 Link Filter',
                value: config.links.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '🤬 Profanity Filter',
                value: config.profanity.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '⚠️ Warning System',
                value: config.warnings.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '📊 Logging',
                value: config.logging.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
            },
            {
                name: '\u200b',
                value: '\u200b',
                inline: true
            },
            {
                name: '⚙️ Spam Config',
                value: `Max Messages: ${config.spam.maxMessages}\n` +
                       `Time Window: ${config.spam.timeWindow / 1000}s\n` +
                       `Max Duplicates: ${config.spam.maxDuplicates}`,
                inline: true
            },
            {
                name: '⚙️ Link Config',
                value: `Block Invites: ${config.links.blockInvites ? 'Yes' : 'No'}\n` +
                       `Block Shorteners: ${config.links.blockShorteners ? 'Yes' : 'No'}`,
                inline: true
            },
            {
                name: '⚙️ Profanity Config',
                value: `Filter Level: ${config.profanity.filterLevel}\n` +
                       `Detect Bypass: ${config.profanity.detectBypass ? 'Yes' : 'No'}`,
                inline: true
            }
        ]
    );

    await interaction.reply({ embeds: [statusEmbed] });
}

async function handleToggle(interaction) {
    const module = interaction.options.getString('module');
    const config = await getConfig(interaction.guild.id);

    // Toggle module
    config[module].enabled = !config[module].enabled;
    await updateConfig(interaction.guild.id, config);

    const status = config[module].enabled ? 'Enabled ✅' : 'Disabled ❌';
    const moduleName = {
        'spam': '🚫 Spam Detection',
        'links': '🔗 Link Filter',
        'profanity': '🤬 Profanity Filter',
        'warnings': '⚠️ Warning System'
    }[module];

    await interaction.reply({
        embeds: [successEmbed(
            'Module Updated',
            `${moduleName} đã được ${status}`
        )]
    });
}

async function handleWarnings(interaction) {
    const user = interaction.options.getUser('user');
    const warnings = await getWarnings(user.id, interaction.guild.id);

    if (!warnings || warnings.totalWarnings === 0) {
        return interaction.reply({
            embeds: [infoEmbed(
                'No Warnings',
                `${user} chưa có warnings nào.`
            )],
            flags: 64
        });
    }

    const warningList = warnings.warnings
        .slice(-5) // Lấy 5 warnings gần nhất
        .map((w, i) => {
            const date = new Date(w.timestamp).toLocaleString('vi-VN');
            return `**${i + 1}.** ${w.type} - ${w.reason}\n*${date}*`;
        })
        .join('\n\n');

    const embed = infoEmbed(
        `⚠️ Warnings: ${user.tag}`,
        `**Total Warnings:** ${warnings.totalWarnings}/5\n\n${warningList}`
    );

    await interaction.reply({ embeds: [embed], flags: 64 });
}

async function handleReset(interaction) {
    const user = interaction.options.getUser('user');
    const result = await resetWarnings(user.id, interaction.guild.id);

    if (result) {
        await interaction.reply({
            embeds: [successEmbed(
                'Warnings Reset',
                `Đã reset tất cả warnings của ${user}`
            )]
        });
    } else {
        await interaction.reply({
            embeds: [errorEmbed(
                'No Warnings',
                `${user} không có warnings để reset.`
            )],
            flags: 64
        });
    }
}

async function handleWhitelist(interaction) {
    const whitelist = getWhitelist(interaction.guild.id);

    const list = whitelist.map((domain, i) => `${i + 1}. \`${domain}\``).join('\n');

    const embed = infoEmbed(
        '🔗 Whitelist Domains',
        `Danh sách ${whitelist.length} domains được phép:\n\n${list}`
    );

    await interaction.reply({ embeds: [embed], flags: 64 });
}
