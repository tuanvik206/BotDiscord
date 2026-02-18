import os from 'os';

/**
 * Lấy thông tin Memory Usage (MB)
 */
export function getMemoryUsage() {
    const memory = process.memoryUsage();
    return {
        heapUsed: (memory.heapUsed / 1024 / 1024).toFixed(2),
        heapTotal: (memory.heapTotal / 1024 / 1024).toFixed(2),
        rss: (memory.rss / 1024 / 1024).toFixed(2)
    };
}

/**
 * Lấy Uptime đã format (Ngày, Giờ, Phút, Giây)
 */
export function getUptime(uptimeSeconds) {
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}

/**
 * Lấy System Info
 */
export function getSystemInfo() {
    return {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cpuModel: os.cpus()[0].model,
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    };
}
