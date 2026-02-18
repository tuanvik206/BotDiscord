import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed, ICONS, COLORS } from '../../utils/embedBuilder.js';
import { getMemoryUsage, getUptime, getSystemInfo } from '../../utils/performance.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Xem trạng thái hệ thống và độ trễ (Dashboard)'),

    async execute(interaction) {
        const startTime = Date.now();
        
        // Reply placeholder
        const msg = await interaction.reply({ 
            content: '🔍 Đang phân tích hệ thống...',
            withResponse: true
        });
        
        // Calculate metrics
        const roundtripLatency = Date.now() - startTime;
        const wsLatency = interaction.client.ws.ping;
        const memory = getMemoryUsage();
        const uptime = getUptime(process.uptime());
        const sysInfo = getSystemInfo();

        const wsLatencyText = wsLatency === -1 ? 'N/A' : `${wsLatency}ms`;
        
        // Determine status indicator
        let statusColor = COLORS.SUCCESS;
        let statusText = '🟢 Ổn định';
        
        if (wsLatency > 200 || roundtripLatency > 500) {
            statusColor = COLORS.WARNING;
            statusText = '⚠️ Hơi lag';
        }
        if (wsLatency > 500 || roundtripLatency > 1000) {
            statusColor = COLORS.ERROR;
            statusText = '🔴 Mạng chậm';
        }

        // Build Dashboard Embed
        const embed = infoEmbed(`${ICONS.STATS} System Status`, `Trạng thái: **${statusText}**`)
            .setColor(statusColor)
            .addFields(
                { 
                    name: '📶 Network', 
                    value: `> **API:** \`${roundtripLatency}ms\`\n> **WebSocket:** \`${wsLatencyText}\``, 
                    inline: true 
                },
                { 
                    name: '💻 Memory', 
                    value: `> **Heap:** \`${memory.heapUsed}/${memory.heapTotal} MB\`\n> **RSS:** \`${memory.rss} MB\``, 
                    inline: true 
                },
                { 
                    name: '⏱️ Uptime', 
                    value: `> \`${uptime}\``, 
                    inline: true 
                },
                { 
                    name: '⚙️ System', 
                    value: `> Node: \`${sysInfo.nodeVersion}\`\n> OS: \`${sysInfo.platform}\``, 
                    inline: true 
                }
            )
            .setFooter({ text: `Bot Version 1.0.0 • ${sysInfo.cpuModel}` })
            .setTimestamp();

        // Update reply
        await interaction.editReply({
            content: null,
            embeds: [embed]
        });
    }
};
