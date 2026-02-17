import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';

// Load environment variables
config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load tất cả commands
const commandsPath = join(__dirname, 'commands');
const commandFolders = readdirSync(commandsPath);

console.log('📝 Đang load commands...\n');

for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = await import(`file://${filePath}`);
        
        if ('data' in command.default && 'execute' in command.default) {
            commands.push(command.default.data.toJSON());
            console.log(`✅ Loaded: /${command.default.data.name}`);
        } else {
            console.log(`⚠️ Warning: ${file} is missing required "data" or "execute" property.`);
        }
    }
}

console.log(`\n📊 Tổng cộng: ${commands.length} commands\n`);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`🚀 Bắt đầu deploy ${commands.length} slash commands...`);

        // Deploy to specific guild (for testing - faster)
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands },
            );
            console.log(`✅ Đã deploy ${data.length} commands cho guild ${process.env.GUILD_ID}`);
        } else {
            // Deploy globally (takes up to 1 hour to propagate)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );
            console.log(`✅ Đã deploy ${data.length} commands globally`);
            console.log('⏰ Lưu ý: Global commands có thể mất đến 1 giờ để cập nhật');
        }

        console.log('\n🎉 Deploy thành công!');
    } catch (error) {
        console.error('❌ Lỗi khi deploy commands:', error);
    }
})();
