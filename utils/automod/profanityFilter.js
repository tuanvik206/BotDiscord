/**
 * Profanity Filter - Lọc từ ngữ không phù hợp
 */

/**
 * Danh sách từ cấm (ví dụ - cần bổ sung thêm)
 * Lưu ý: Đây chỉ là ví dụ, cần có danh sách đầy đủ hơn
 */
const BADWORDS = {
    severe: [
        // Từ nghiêm trọng (ví dụ)
        'dmm', 'dm', 'vl', 'vcl', 'cc', 'lol'
    ],
    moderate: [
        // Từ trung bình
        'ngu', 'đần', 'khùng', 'điên'
    ],
    mild: [
        // Từ nhẹ
        'stupid', 'idiot', 'dumb'
    ]
};

/**
 * Các ký tự thay thế phổ biến
 */
const CHAR_REPLACEMENTS = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '4': 'a',
    '5': 's',
    '7': 't',
    '8': 'b',
    '@': 'a',
    '$': 's',
    '!': 'i',
    '|': 'i',
    '()': 'o'
};

/**
 * Normalize text để phát hiện bypass
 */
function normalizeText(text) {
    let normalized = text.toLowerCase();

    // Xóa spaces, dots, dashes
    normalized = normalized.replace(/[\s\.\-_]/g, '');

    // Thay thế ký tự đặc biệt
    for (const [char, replacement] of Object.entries(CHAR_REPLACEMENTS)) {
        normalized = normalized.replace(new RegExp(char, 'g'), replacement);
    }

    // Xóa dấu tiếng Việt (optional)
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return normalized;
}

/**
 * Kiểm tra profanity
 */
export function checkProfanity(message, config) {
    const content = message.content;
    const normalized = normalizeText(content);

    // Lấy danh sách từ cấm dựa trên filter level
    let wordsToCheck = [];
    
    if (config.profanity.filterLevel === 'severe') {
        wordsToCheck = BADWORDS.severe;
    } else if (config.profanity.filterLevel === 'moderate') {
        wordsToCheck = [...BADWORDS.severe, ...BADWORDS.moderate];
    } else if (config.profanity.filterLevel === 'mild') {
        wordsToCheck = [...BADWORDS.severe, ...BADWORDS.moderate, ...BADWORDS.mild];
    }

    // Kiểm tra từng từ cấm
    for (const badword of wordsToCheck) {
        const normalizedBadword = normalizeText(badword);

        // Kiểm tra exact match
        if (normalized.includes(normalizedBadword)) {
            return {
                hasProfanity: true,
                word: badword,
                reason: 'Sử dụng từ ngữ không phù hợp'
            };
        }

        // Kiểm tra với bypass detection
        if (config.profanity.detectBypass) {
            // Tạo regex để match với spaces/dots giữa các ký tự
            const regexPattern = normalizedBadword.split('').join('[\\s\\.\\-_]*');
            const regex = new RegExp(regexPattern, 'i');

            if (regex.test(content)) {
                return {
                    hasProfanity: true,
                    word: badword,
                    reason: 'Sử dụng từ ngữ không phù hợp (bypass detected)'
                };
            }
        }
    }

    return { hasProfanity: false };
}

/**
 * Thêm từ vào blacklist
 */
export function addBadword(word, severity = 'moderate') {
    if (!BADWORDS[severity].includes(word.toLowerCase())) {
        BADWORDS[severity].push(word.toLowerCase());
        return true;
    }
    return false;
}

/**
 * Xóa từ khỏi blacklist
 */
export function removeBadword(word) {
    for (const severity in BADWORDS) {
        const index = BADWORDS[severity].indexOf(word.toLowerCase());
        if (index > -1) {
            BADWORDS[severity].splice(index, 1);
            return true;
        }
    }
    return false;
}

/**
 * Lấy danh sách từ cấm
 */
export function getBadwords(severity = null) {
    if (severity) {
        return BADWORDS[severity] || [];
    }
    return BADWORDS;
}
