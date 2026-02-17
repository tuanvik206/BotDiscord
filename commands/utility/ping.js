import { SlashCommandBuilder } from 'discord.js';
import { infoEmbed } from '../../utils/embedBuilder.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Kiểm tra độ trễ của bot'),

    async execute(interaction) {
        // Tính latency
        const sent = await interaction.reply({ 
            content: '🏓 Pinging...', 
            fetchReply: true 
        });
        
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const websocketLatency = interaction.client.ws.ping;

        // Update với embed đẹp
        await interaction.editReply({
            content: null,
            embeds: [infoEmbed(
                '🏓 Pong!',
                `**Roundtrip Latency:** ${roundtripLatency}ms\n**Websocket Latency:** ${websocketLatency}ms`
            )]
        });
    }
};
