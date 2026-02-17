import { supabase } from './supabase.js';

/**
 * =====================================================
 * PROJECT FUNCTIONS - Using Supabase
 * =====================================================
 */

/**
 * Lấy tất cả projects của guild
 */
export async function getAllProjects(guildId) {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_members(user_id),
            project_channels(channel_type, channel_id)
        `)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    // Transform data to match old format
    return data.map(project => ({
        id: project.id,
        name: project.name,
        leaderId: project.leader_id,
        members: project.project_members.map(m => m.user_id),
        categoryId: project.category_id,
        roleId: project.role_id,
        maxMembers: project.max_members,
        createdAt: project.created_at,
        channels: project.project_channels.reduce((acc, ch) => {
            acc[ch.channel_type] = ch.channel_id;
            return acc;
        }, {})
    }));
}

/**
 * Lấy project theo ID
 */
export async function getProjectById(projectId) {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_members(user_id),
            project_channels(channel_type, channel_id)
        `)
        .eq('id', projectId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        leaderId: data.leader_id,
        members: data.project_members.map(m => m.user_id),
        categoryId: data.category_id,
        roleId: data.role_id,
        maxMembers: data.max_members,
        createdAt: data.created_at,
        channels: data.project_channels.reduce((acc, ch) => {
            acc[ch.channel_type] = ch.channel_id;
            return acc;
        }, {})
    };
}

/**
 * Lấy project theo tên (case-insensitive)
 */
export async function getProjectByName(name, guildId) {
    if (!name) return null;

    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            project_members(user_id),
            project_channels(channel_type, channel_id)
        `)
        .eq('guild_id', guildId)
        .ilike('name', name)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        leaderId: data.leader_id,
        members: data.project_members.map(m => m.user_id),
        categoryId: data.category_id,
        roleId: data.role_id,
        maxMembers: data.max_members,
        createdAt: data.created_at,
        channels: data.project_channels.reduce((acc, ch) => {
            acc[ch.channel_type] = ch.channel_id;
            return acc;
        }, {})
    };
}

/**
 * Tạo project mới
 */
export async function createProject(projectData) {
    // 1. Insert project
    const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
            guild_id: projectData.guildId,
            name: projectData.name,
            leader_id: projectData.leaderId,
            category_id: projectData.categoryId,
            role_id: projectData.roleId,
            max_members: projectData.maxMembers || 10
        })
        .select()
        .single();

    if (projectError) {
        console.error('Error creating project:', projectError);
        throw projectError;
    }

    // 2. Insert leader as first member
    const { error: memberError } = await supabase
        .from('project_members')
        .insert({
            project_id: project.id,
            user_id: projectData.leaderId
        });

    if (memberError) {
        console.error('Error adding leader as member:', memberError);
    }

    // 3. Insert channels
    if (projectData.channels) {
        const channelInserts = Object.entries(projectData.channels).map(([type, channelId]) => ({
            project_id: project.id,
            channel_type: type,
            channel_id: channelId
        }));

        const { error: channelsError } = await supabase
            .from('project_channels')
            .insert(channelInserts);

        if (channelsError) {
            console.error('Error adding channels:', channelsError);
        }
    }

    return {
        id: project.id,
        name: project.name,
        leaderId: project.leader_id,
        members: [projectData.leaderId],
        categoryId: project.category_id,
        roleId: project.role_id,
        maxMembers: project.max_members,
        createdAt: project.created_at,
        channels: projectData.channels || {}
    };
}

/**
 * Xóa project
 */
export async function deleteProject(projectId) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        console.error('Error deleting project:', error);
        return false;
    }

    return true;
}

/**
 * Thêm member vào project
 */
export async function addMember(projectId, userId) {
    // Get project first
    const project = await getProjectById(projectId);
    
    if (!project) {
        return { success: false, reason: 'Project không tồn tại!' };
    }

    // Check if already member
    if (project.members.includes(userId)) {
        return { success: false, reason: 'User đã là thành viên!' };
    }

    // Check if full
    if (project.members.length >= project.maxMembers) {
        return { success: false, reason: 'Project đã đầy!' };
    }

    // Add member
    const { error } = await supabase
        .from('project_members')
        .insert({
            project_id: projectId,
            user_id: userId
        });

    if (error) {
        console.error('Error adding member:', error);
        return { success: false, reason: 'Lỗi khi thêm member!' };
    }

    return { success: true };
}

/**
 * Xóa member khỏi project
 */
export async function removeMember(projectId, userId) {
    const project = await getProjectById(projectId);

    if (!project) {
        return { success: false, reason: 'Project không tồn tại!' };
    }

    if (!project.members.includes(userId)) {
        return { success: false, reason: 'User không phải là thành viên!' };
    }

    if (project.leaderId === userId) {
        return { success: false, reason: 'Không thể xóa leader!' };
    }

    const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error removing member:', error);
        return { success: false, reason: 'Lỗi khi xóa member!' };
    }

    return { success: true };
}
