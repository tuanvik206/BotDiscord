import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { successEmbed, errorEmbed, infoEmbed, warningEmbed } from '../../utils/embedBuilder.js';
import { hasPermission } from '../../utils/permissions.js';
import { createProject, getProjectByName } from '../../utils/database.js';
import { setupProjectPermissions } from '../../utils/projectPermissions.js';
import { checkCooldown } from '../../utils/rateLimit.js';
import { validateProjectName, validateMaxMembers } from '../../utils/validation.js';

export default {
    data: new SlashCommandBuilder()
        .setName('project')
        .setDescription('Quản lý projects/nhóm')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Tạo project mới với category và channels riêng')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Tên project')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('leader')
                        .setDescription('Trưởng nhóm')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('max_members')
                        .setDescription('Số thành viên tối đa (mặc định: 10)')
                        .setMinValue(2)
                        .setMaxValue(50)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Xem danh sách tất cả projects')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Xem thông tin chi tiết của project')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Tên project')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Thêm thành viên vào project')
                .addStringOption(option =>
                    option
                        .setName('project')
                        .setDescription('Tên project')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Người dùng cần thêm')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Xóa thành viên khỏi project')
                .addStringOption(option =>
                    option
                        .setName('project')
                        .setDescription('Tên project')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Người dùng cần xóa')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Rời khỏi project')
                .addStringOption(option =>
                    option
                        .setName('project')
                        .setDescription('Tên project')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Xóa project')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Tên project cần xóa')
                        .setRequired(true)
                        .setAutocomplete(true) // Enable autocomplete
                )
        ),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            
            if (focusedOption.name === 'name') {
                // Get all projects for this guild
                const { getAllProjects } = await import('../../utils/database.js');
                const projects = await getAllProjects(interaction.guild.id);
                
                // Handle empty projects
                if (!projects || projects.length === 0) {
                    return await interaction.respond([
                        { name: 'Chưa có project nào', value: 'none' }
                    ]);
                }
                
                // Filter based on user input
                const filtered = projects
                    .filter(p => p.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25); // Discord limit is 25 choices
                
                // Handle no matches
                if (filtered.length === 0) {
                    return await interaction.respond([
                        { name: 'Không tìm thấy project nào', value: 'none' }
                    ]);
                }
                
                // Return choices
                await interaction.respond(
                    filtered.map(p => ({ name: p.name, value: p.name }))
                );
            }
        } catch (error) {
            console.error('Autocomplete error:', error);
            // Return empty array on error
            try {
                await interaction.respond([]);
            } catch (e) {
                // Ignore if already responded
            }
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            await handleCreate(interaction);
        } else if (subcommand === 'list') {
            await handleList(interaction);
        } else if (subcommand === 'info') {
            await handleInfo(interaction);
        } else if (subcommand === 'add') {
            await handleAdd(interaction);
        } else if (subcommand === 'remove') {
            await handleRemove(interaction);
        } else if (subcommand === 'leave') {
            await handleLeave(interaction);
        } else if (subcommand === 'delete') {
            await handleDelete(interaction);
        }
    }
};

async function handleCreate(interaction) {
    // Rate limiting - 30 second cooldown for project creation
    const cooldown = checkCooldown(interaction.user.id, 'project-create', 30);
    if (!cooldown.allowed) {
        return interaction.reply({
            embeds: [errorEmbed('Cooldown', cooldown.reason)],
            flags: 64
        });
    }

    // Kiểm tra quyền - CHỈ ADMIN
    if (!hasPermission(interaction.member, PermissionFlagsBits.Administrator)) {
        return interaction.reply({
            embeds: [errorEmbed('Không có quyền', 'Chỉ Admin mới có thể tạo project!')],
            flags: 64
        });
    }

    const projectName = interaction.options.getString('name');
    const leader = interaction.options.getUser('leader');
    const maxMembers = interaction.options.getInteger('max_members') || 10;

    // Validate project name
    const nameValidation = validateProjectName(projectName);
    if (!nameValidation.valid) {
        return interaction.reply({
            embeds: [errorEmbed('Tên không hợp lệ', nameValidation.reason)],
            flags: 64
        });
    }

    // Validate max members
    const membersValidation = validateMaxMembers(maxMembers);
    if (!membersValidation.valid) {
        return interaction.reply({
            embeds: [errorEmbed('Số thành viên không hợp lệ', membersValidation.reason)],
            flags: 64
        });
    }

    // Defer reply immediately to prevent timeout during async operations
    await interaction.deferReply();

    // Kiểm tra project đã tồn tại chưa
    const { getProjectByName } = await import('../../utils/database.js');
    const existingProject = await getProjectByName(projectName, interaction.guild.id);
    
    if (existingProject) {
        return interaction.editReply({
            embeds: [errorEmbed('Tên đã tồn tại', `Project "${projectName}" đã tồn tại!`)]
        });
    }

    // Kiểm tra leader có trong server không
    let leaderMember;
    try {
        leaderMember = await interaction.guild.members.fetch(leader.id);
    } catch (error) {
        return interaction.editReply({
            embeds: [errorEmbed('Lỗi', 'Không thể tìm thấy leader trong server!')]
        });
    }



    try {
        // 1. Tạo role cho project
        const role = await interaction.guild.roles.create({
            name: `📁 ${projectName}`,
            color: Math.floor(Math.random() * 16777215), // Random color
            reason: `Project role cho ${projectName}`
        });

        // 2. Tạo category
        const category = await interaction.guild.channels.create({
            name: `📁 【${projectName}】`,
            type: ChannelType.GuildCategory,
            reason: `Category cho project ${projectName}`
        });

        // 3. Thiết lập permissions cho category
        await setupProjectPermissions(category, role, leader.id, interaction.guild);

        // 4. Tạo text channels
        const announcementsChannel = await interaction.guild.channels.create({
            name: '📢┃thông-báo',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Thông báo quan trọng từ leader`,
            reason: `Announcements channel cho project ${projectName}`
        });

        const generalChannel = await interaction.guild.channels.create({
            name: '💬┃trò-chuyện',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Kênh chat chung cho project ${projectName}`,
            reason: `General channel cho project ${projectName}`
        });

        const tasksChannel = await interaction.guild.channels.create({
            name: '📝┃nhiệm-vụ',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Quản lý nhiệm vụ và công việc`,
            reason: `Tasks channel cho project ${projectName}`
        });

        const resourcesChannel = await interaction.guild.channels.create({
            name: '🔗┃tài-liệu',
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Tài liệu, links và resources`,
            reason: `Resources channel cho project ${projectName}`
        });

        // 5. Tạo voice channels
        const meetingRoom = await interaction.guild.channels.create({
            name: '🔊┃phòng-họp',
            type: ChannelType.GuildVoice,
            parent: category.id,
            reason: `Meeting voice channel cho project ${projectName}`
        });

        const studyRoom = await interaction.guild.channels.create({
            name: '📚┃học-cùng-nhau',
            type: ChannelType.GuildVoice,
            parent: category.id,
            reason: `Study voice channel cho project ${projectName}`
        });

        // 6. Gán role cho leader
        await leaderMember.roles.add(role);

        // 7. Lưu vào database
        const project = createProject({
            guildId: interaction.guild.id,
            name: projectName,
            leaderId: leader.id,
            categoryId: category.id,
            channels: {
                announcements: announcementsChannel.id,
                general: generalChannel.id,
                tasks: tasksChannel.id,
                resources: resourcesChannel.id,
                meeting: meetingRoom.id,
                study: studyRoom.id
            },
            roleId: role.id,
            maxMembers: maxMembers
        });

        // 8. Gửi tin nhắn chào mừng trong general channel
        await generalChannel.send({
            embeds: [successEmbed(
                `Chào mừng đến với ${projectName}! 🎉`,
                `**Trưởng nhóm:** ${leader}\n**Số thành viên tối đa:** ${maxMembers}\n\n` +
                `**📢 Announcements** - Thông báo từ leader\n` +
                `**💬 General** - Chat chung\n` +
                `**📝 Tasks** - Nhiệm vụ và công việc\n` +
                `**🔗 Resources** - Tài liệu và links\n` +
                `**🔊 Meeting Room** - Họp nhóm\n` +
                `**📚 Study Together** - Học cùng nhau\n\n` +
                `Chỉ thành viên trong nhóm mới có thể truy cập!`
            )]
        });

        // 9. Phản hồi thành công
        await interaction.editReply({
            embeds: [successEmbed(
                'Đã tạo project thành công! 🎉',
                `**Tên project:** ${projectName}\n` +
                `**Trưởng nhóm:** ${leader}\n` +
                `**Số thành viên tối đa:** ${maxMembers}\n` +
                `**Category:** ${category}\n\n` +
                `**Text Channels:**\n` +
                `├ ${announcementsChannel}\n` +
                `├ ${generalChannel}\n` +
                `├ ${tasksChannel}\n` +
                `└ ${resourcesChannel}\n\n` +
                `**Voice Channels:**\n` +
                `├ ${meetingRoom}\n` +
                `└ ${studyRoom}\n\n` +
                `**Role:** ${role}\n\n` +
                `Leader có quyền quản lý channels và messages trong project.`
            )]
        });

    } catch (error) {
        console.error('Lỗi khi tạo project:', error);
        await interaction.editReply({
            embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi tạo project! Vui lòng thử lại.')]
        });
    }
}

async function handleList(interaction) {
    const { getAllProjects } = await import('../../utils/database.js');
    const projects = await getAllProjects(interaction.guild.id);

    if (projects.length === 0) {
        return interaction.reply({
            embeds: [infoEmbed('Danh sách projects', 'Chưa có project nào được tạo.')],
            ephemeral: true
        });
    }

    const projectList = projects.map((p, index) => {
        const createdDate = new Date(p.createdAt).toLocaleDateString('vi-VN');
        return `**${index + 1}. ${p.name}**\n` +
               `├ Trưởng nhóm: <@${p.leaderId}>\n` +
               `├ Thành viên: ${p.members.length}/${p.maxMembers}\n` +
               `└ Ngày tạo: ${createdDate}`;
    }).join('\n\n');

    await interaction.reply({
        embeds: [infoEmbed(
            `📋 Danh sách Projects (${projects.length})`,
            projectList
        )]
    });
}

async function handleInfo(interaction) {
    const projectName = interaction.options.getString('name');
    const { getProjectByName } = await import('../../utils/database.js');
    const project = await getProjectByName(projectName, interaction.guild.id);

    if (!project) {
        return interaction.reply({
            embeds: [errorEmbed('Không tìm thấy', `Project "${projectName}" không tồn tại!`)],
            ephemeral: true
        });
    }

    const memberList = project.members.map(id => `<@${id}>`).join(', ');
    const createdDate = new Date(project.createdAt).toLocaleDateString('vi-VN');

    // Build channels list
    let channelsInfo = `**Channels:**\n`;
    if (project.channels) {
        if (project.channels.announcements) channelsInfo += `├ 📢 <#${project.channels.announcements}>\n`;
        if (project.channels.general) channelsInfo += `├ 💬 <#${project.channels.general}>\n`;
        if (project.channels.tasks) channelsInfo += `├ 📝 <#${project.channels.tasks}>\n`;
        if (project.channels.resources) channelsInfo += `├ 🔗 <#${project.channels.resources}>\n`;
        if (project.channels.meeting) channelsInfo += `├ 🔊 <#${project.channels.meeting}>\n`;
        if (project.channels.study) channelsInfo += `└ 📚 <#${project.channels.study}>\n`;
    } else {
        // Fallback cho old structure
        if (project.textChannelId) channelsInfo += `├ Text: <#${project.textChannelId}>\n`;
        if (project.voiceChannelId) channelsInfo += `└ Voice: <#${project.voiceChannelId}>\n`;
    }

    await interaction.reply({
        embeds: [infoEmbed(
            `📁 ${project.name}`,
            `**Trưởng nhóm:** <@${project.leaderId}>\n` +
            `**Thành viên (${project.members.length}/${project.maxMembers}):**\n${memberList}\n\n` +
            channelsInfo + `\n` +
            `**Role:** <@&${project.roleId}>\n` +
            `**Ngày tạo:** ${createdDate}`
        )]
    });
}

async function handleAdd(interaction) {
    const projectName = interaction.options.getString('project');
    const user = interaction.options.getUser('user');
    const { getProjectByName } = await import('../../utils/database.js');
    const project = await getProjectByName(projectName, interaction.guild.id);

    if (!project) {
        return interaction.reply({
            embeds: [errorEmbed('Không tìm thấy', `Project "${projectName}" không tồn tại!`)],
            ephemeral: true
        });
    }

    // Kiểm tra quyền
    const { canManageProject } = await import('../../utils/projectPermissions.js');
    const permCheck = canManageProject(interaction.member, project.id);
    if (!permCheck.success) {
        return interaction.reply({
            embeds: [errorEmbed('Không có quyền', permCheck.reason)],
            ephemeral: true
        });
    }

    // Thêm member
    const { addMember } = await import('../../utils/database.js');
    const result = await addMember(project.id, user.id);

    if (!result.success) {
        return interaction.reply({
            embeds: [errorEmbed('Không thể thêm', result.reason)],
            ephemeral: true
        });
    }

    // Gán role
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.add(project.roleId);

        // Gửi tin nhắn trong project channel
        const generalChannelId = project.channels?.general || project.textChannelId;
        const textChannel = await interaction.guild.channels.fetch(generalChannelId);
        await textChannel.send({
            embeds: [successEmbed(
                'Thành viên mới! 🎉',
                `${user} đã được thêm vào project bởi ${interaction.user}`
            )]
        });

        await interaction.reply({
            embeds: [successEmbed(
                'Đã thêm thành viên',
                `${user} đã được thêm vào project "${project.name}"`
            )]
        });
    } catch (error) {
        console.error('Lỗi khi thêm member:', error);
        await interaction.reply({
            embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi thêm thành viên!')],
            ephemeral: true
        });
    }
}

async function handleRemove(interaction) {
    const projectName = interaction.options.getString('project');
    const user = interaction.options.getUser('user');
    const { getProjectByName } = await import('../../utils/database.js');
    const project = await getProjectByName(projectName, interaction.guild.id);

    if (!project) {
        return interaction.reply({
            embeds: [errorEmbed('Không tìm thấy', `Project "${projectName}" không tồn tại!`)],
            ephemeral: true
        });
    }

    // Kiểm tra quyền
    const { canManageProject } = await import('../../utils/projectPermissions.js');
    const permCheck = canManageProject(interaction.member, project.id);
    if (!permCheck.success) {
        return interaction.reply({
            embeds: [errorEmbed('Không có quyền', permCheck.reason)],
            ephemeral: true
        });
    }

    // Xóa member
    const { removeMember } = await import('../../utils/database.js');
    const result = await removeMember(project.id, user.id);

    if (!result.success) {
        return interaction.reply({
            embeds: [errorEmbed('Không thể xóa', result.reason)],
            ephemeral: true
        });
    }

    // Gỡ role
    try {
        const member = await interaction.guild.members.fetch(user.id);
        await member.roles.remove(project.roleId);

        // Gửi tin nhắn trong project channel
        const generalChannelId = project.channels?.general || project.textChannelId;
        const textChannel = await interaction.guild.channels.fetch(generalChannelId);
        await textChannel.send({
            embeds: [warningEmbed(
                'Thành viên rời đi',
                `${user} đã bị xóa khỏi project bởi ${interaction.user}`
            )]
        });

        await interaction.reply({
            embeds: [successEmbed(
                'Đã xóa thành viên',
                `${user} đã bị xóa khỏi project "${project.name}"`
            )]
        });
    } catch (error) {
        console.error('Lỗi khi xóa member:', error);
        await interaction.reply({
            embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi xóa thành viên!')],
            ephemeral: true
        });
    }
}

async function handleLeave(interaction) {
    const projectName = interaction.options.getString('project');
    const { getProjectByName } = await import('../../utils/database.js');
    const project = await getProjectByName(projectName, interaction.guild.id);

    if (!project) {
        return interaction.reply({
            embeds: [errorEmbed('Không tìm thấy', `Project "${projectName}" không tồn tại!`)],
            ephemeral: true
        });
    }

    // Kiểm tra xem user có phải là member không
    if (!project.members.includes(interaction.user.id)) {
        return interaction.reply({
            embeds: [errorEmbed('Không phải thành viên', 'Bạn không phải là thành viên của project này!')],
            ephemeral: true
        });
    }

    // Không cho leader rời
    if (project.leaderId === interaction.user.id) {
        return interaction.reply({
            embeds: [errorEmbed('Không thể rời', 'Trưởng nhóm không thể rời project! Vui lòng chuyển quyền leader hoặc xóa project.')],
            ephemeral: true
        });
    }

    // Xóa member
    const { removeMember } = await import('../../utils/database.js');
    const result = await removeMember(project.id, interaction.user.id);

    if (!result.success) {
        return interaction.reply({
            embeds: [errorEmbed('Lỗi', result.reason)],
            ephemeral: true
        });
    }

    // Gỡ role
    try {
        await interaction.member.roles.remove(project.roleId);

        // Gửi tin nhắn trong project channel
        const generalChannelId = project.channels?.general || project.textChannelId;
        const textChannel = await interaction.guild.channels.fetch(generalChannelId);
        await textChannel.send({
            embeds: [warningEmbed(
                'Thành viên rời đi',
                `${interaction.user} đã rời khỏi project`
            )]
        });

        await interaction.reply({
            embeds: [successEmbed(
                'Đã rời project',
                `Bạn đã rời khỏi project "${project.name}"`
            )],
            ephemeral: true
        });
    } catch (error) {
        console.error('Lỗi khi rời project:', error);
        await interaction.reply({
            embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi rời project!')],
            ephemeral: true
        });
    }
}

async function handleDelete(interaction) {
    const projectName = interaction.options.getString('name');
    const { getProjectByName } = await import('../../utils/database.js');
    const project = await getProjectByName(projectName, interaction.guild.id);

    if (!project) {
        return interaction.reply({
            embeds: [errorEmbed('Không tìm thấy', `Project "${projectName}" không tồn tại!`)],
            ephemeral: true
        });
    }

    // Kiểm tra quyền
    const { canManageProject } = await import('../../utils/projectPermissions.js');
    const permCheck = canManageProject(interaction.member, project.id);
    if (!permCheck.success) {
        return interaction.reply({
            embeds: [errorEmbed('Không có quyền', permCheck.reason)],
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Xóa tất cả channels
        const category = await interaction.guild.channels.fetch(project.categoryId);
        
        // Xóa text channels
        if (project.channels?.announcements) {
            const announcementsChannel = await interaction.guild.channels.fetch(project.channels.announcements);
            await announcementsChannel.delete();
        }
        if (project.channels?.general) {
            const generalChannel = await interaction.guild.channels.fetch(project.channels.general);
            await generalChannel.delete();
        }
        if (project.channels?.tasks) {
            const tasksChannel = await interaction.guild.channels.fetch(project.channels.tasks);
            await tasksChannel.delete();
        }
        if (project.channels?.resources) {
            const resourcesChannel = await interaction.guild.channels.fetch(project.channels.resources);
            await resourcesChannel.delete();
        }
        
        // Xóa voice channels
        if (project.channels?.meeting) {
            const meetingRoom = await interaction.guild.channels.fetch(project.channels.meeting);
            await meetingRoom.delete();
        }
        if (project.channels?.study) {
            const studyRoom = await interaction.guild.channels.fetch(project.channels.study);
            await studyRoom.delete();
        }
        
        // Fallback cho old structure
        if (project.textChannelId) {
            const textChannel = await interaction.guild.channels.fetch(project.textChannelId);
            await textChannel.delete();
        }
        if (project.voiceChannelId) {
            const voiceChannel = await interaction.guild.channels.fetch(project.voiceChannelId);
            await voiceChannel.delete();
        }

        // Xóa category
        await category.delete();

        // Xóa role
        const role = await interaction.guild.roles.fetch(project.roleId);
        await role.delete();

        // Xóa khỏi database
        const { deleteProject } = await import('../../utils/database.js');
        await deleteProject(project.id);

        await interaction.editReply({
            embeds: [successEmbed(
                'Đã xóa project',
                `Project "${project.name}" đã được xóa hoàn toàn.\n` +
                `Tất cả channels và role đã bị xóa.`
            )]
        });
    } catch (error) {
        console.error('Lỗi khi xóa project:', error);
        await interaction.editReply({
            embeds: [errorEmbed('Lỗi', 'Đã xảy ra lỗi khi xóa project!')]
        });
    }
}
