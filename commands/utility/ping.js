import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot'),

    async execute(interaction) {
        const startTime = Date.now();
        
        // Tính latency
        await interaction.reply({ 
            content: '🏓 Đang kiểm tra...',
            withResponse: true
        });
        
        const roundtripLatency = Date.now() - startTime;
        const websocketLatency = interaction.client.ws.ping;

        // Format websocket latency (nếu -1 thì đang chờ heartbeat)
        const wsLatency = websocketLatency === -1 
            ? 'Đang đo...' 
            : `${websocketLatency}ms`;

        // Update với embed đẹp
        await interaction.editReply({
            content: null,
            embeds: [infoEmbed(
                '🏓 Pong!',
                `**Độ trễ phản hồi:** ${roundtripLatency}ms\n**Độ trễ kết nối:** ${wsLatency}`
            )]
        });
    }
};
