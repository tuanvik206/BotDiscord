import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.MessageContent,  // Required for automod
    ]
});

// Collection để lưu commands
client.commands = new Collection();

// Load commands từ thư mục commands
const commandsPath = join(__dirname, 'commands');
const commandFolders = readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = await import(`file://${filePath}`);
        
        if ('data' in command.default && 'execute' in command.default) {
            client.commands.set(command.default.data.name, command.default);
            console.log(`✅ Loaded command: ${command.default.data.name}`);
        } else {
            console.log(`⚠️ Warning: ${file} is missing required "data" or "execute" property.`);
        }
    }
}

// Event: Bot ready
client.once(Events.ClientReady, (c) => {
    console.log(`🤖 Bot đã online! Logged in as ${c.user.tag}`);
    console.log(`📊 Đang phục vụ ${c.guilds.cache.size} servers`);
    
    // Rich Presence - Slogan cho lớp
    const activities = [
        { name: 'Học tập - Rèn luyện - Phát triển 📚', type: 0 }, // Playing
        { name: 'Cùng nhau tiến bộ mỗi ngày 🌟', type: 3 }, // Watching
        { name: 'Tri thức là sức mạnh 💪', type: 0 },
        { name: 'Đoàn kết - Sáng tạo - Thành công 🎯', type: 3 },
        { name: 'Không ngừng học hỏi 📖', type: 2 }, // Listening
        { name: 'Vượt qua mọi thử thách 🚀', type: 0 }
    ];
    
    let currentActivity = 0;
    
    // Set initial status
    c.user.setPresence({
        activities: [activities[0]],
        status: 'online' // online, idle, dnd, invisible
    });
    
    // Rotate status every 15 seconds
    setInterval(() => {
        currentActivity = (currentActivity + 1) % activities.length;
        c.user.setPresence({
            activities: [activities[currentActivity]],
            status: 'online'
        });
    }, 15000);
});

// Event: Interaction (slash commands + autocomplete)
client.on(Events.InteractionCreate, async (interaction) => {
    // Handle autocomplete
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        
        if (!command || !command.autocomplete) {
            return;
        }
        
        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(`❌ Autocomplete error for ${interaction.commandName}:`, error);
        }
        return;
    }
    
    // Handle chat input commands
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`❌ Command not found: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`✅ ${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild.name}`);
    } catch (error) {
        // Ignore "Interaction has already been acknowledged" error (Code 40060)
        // This happens mostly due to network lag causing Discord to retry events, or double handling.
        if (error.code === 40060 || error.message.includes('Interaction has already been acknowledged')) {
             console.warn(`⚠️ Interaction already acknowledged for /${interaction.commandName}. This is safe to ignore.`);
             return;
        }

        console.error(`❌ Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = {
            content: '❌ Đã xảy ra lỗi khi thực hiện lệnh này!',
            flags: 64 // Ephemeral
        };

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage).catch(() => {});
            } else {
                await interaction.reply(errorMessage).catch(() => {});
            }
        } catch (err) {
            // Ignore cascading errors
        }
    }
});

// Auto-moderation
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    const { handleAutomod } = await import('./utils/automod/automodHandler.js');
    await handleAutomod(message);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    client.destroy();
    console.log('✅ Bot disconnected');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    client.destroy();
    console.log('✅ Bot disconnected');
    process.exit(0);
});

// Error handling
client.on(Events.Error, (error) => {
    console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.TOKEN);
