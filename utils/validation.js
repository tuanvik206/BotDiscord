/**
 * Input validation utilities
 */

/**
 * Validate project name
 * @param {string} name - Project name to validate
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateProjectName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, reason: 'Tên project không hợp lệ!' };
    }
    
    // Trim whitespace
    name = name.trim();
    
    // Length check
    if (name.length < 2) {
        return { valid: false, reason: 'Tên project phải có ít nhất 2 ký tự!' };
    }
    
    if (name.length > 50) {
        return { valid: false, reason: 'Tên project không được quá 50 ký tự!' };
    }
    
    // Character whitelist (alphanumeric + Vietnamese + spaces + basic punctuation)
    const validPattern = /^[a-zA-Z0-9\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\-_]+$/;
    if (!validPattern.test(name)) {
        return { valid: false, reason: 'Tên project chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới!' };
    }
    
    // Reserved names
    const reserved = ['admin', 'administrator', 'moderator', 'mod', 'everyone', 'here', 'system', 'bot'];
    if (reserved.includes(name.toLowerCase())) {
        return { valid: false, reason: 'Tên project này đã được hệ thống sử dụng!' };
    }
    
    // Prevent Discord mention abuse
    if (name.includes('@') || name.includes('#') || name.includes('<') || name.includes('>')) {
        return { valid: false, reason: 'Tên project không được chứa ký tự đặc biệt (@, #, <, >)!' };
    }
    
    return { valid: true };
}

/**
 * Validate max members count
 */
export function validateMaxMembers(count) {
    if (!Number.isInteger(count)) {
        return { valid: false, reason: 'Số thành viên phải là số nguyên!' };
    }
    
    if (count < 2) {
        return { valid: false, reason: 'Project phải có ít nhất 2 thành viên!' };
    }
    
    if (count > 50) {
        return { valid: false, reason: 'Project không được quá 50 thành viên!' };
    }
    
    return { valid: true };
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .substring(0, 1000); // Limit length
}
