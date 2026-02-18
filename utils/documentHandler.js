import { supabase } from './supabase.js';

/**
 * Thêm tài liệu mới
 */
export async function addDocument(guildId, title, url, subject, addedBy, description = '') {
    const { data, error } = await supabase
        .from('documents')
        .insert({
            guild_id: guildId,
            title: title,
            url: url,
            subject: subject,
            description: description,
            added_by: addedBy
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding document:', error);
        if (error.code === '23505') { // Unique constraint violation
            return { success: false, reason: 'Tài liệu với link này đã tồn tại!' };
        }
        return { success: false, reason: 'Lỗi Database: ' + error.message };
    }

    return { success: true, data: data };
}

/**
 * Tìm kiếm tài liệu
 */
export async function searchDocuments(guildId, query) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('guild_id', guildId)
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error searching documents:', error);
        return [];
    }

    return data;
}

/**
 * Lấy tài liệu theo môn học
 */
export async function getDocumentsBySubject(guildId, subject) {
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('guild_id', guildId)
        .ilike('subject', subject)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching documents by subject:', error);
        return [];
    }

    return data;
}

/**
 * Xóa tài liệu
 */
export async function deleteDocument(id) {
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting document:', error);
        return false;
    }

    return true;
}

/**
 * Lấy danh sách các môn học hiện có
 */
export async function getSubjects(guildId) {
    const { data, error } = await supabase
        .from('documents')
        .select('subject')
        .eq('guild_id', guildId);

    if (error) return [];
    
    // Get unique subjects
    const subjects = [...new Set(data.map(item => item.subject))];
    return subjects;
}
