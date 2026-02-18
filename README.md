# 🤖 Discord Bot Quản Lý Lớp Học

Bot Discord tinh gọn, tập trung vào quản lý dự án và các tiện ích lớp học.

## ✨ Tính Năng

### 📁 Project Management Commands

| Lệnh | Mô tả | Quyền yêu cầu |
|------|-------|---------------|
| `/project create` | Tạo project với category và channels riêng | MANAGE_CHANNELS |
| `/project list` | Xem danh sách tất cả projects | Không |
| `/project info` | Xem thông tin chi tiết project | Không |
| `/project add` | Thêm thành viên vào project | Leader hoặc MANAGE_CHANNELS |
| `/project remove` | Xóa thành viên khỏi project | Leader hoặc MANAGE_CHANNELS |
| `/project leave` | Rời khỏi project | Không (phải là member) |
| `/project delete` | Xóa project hoàn toàn | Leader hoặc MANAGE_CHANNELS |

### 📊 Utility Commands

| Lệnh | Mô tả |
|------|-------|
| `/poll` | Tạo cuộc bình chọn chuyên nghiệp (có thời hạn, hiển thị % trực quan) |
| `/ping` | Kiểm tra độ trễ của Bot |
| `/help` | Hiển thị danh sách lệnh và hướng dẫn |
| `/clear` | Xóa tin nhắn hàng loạt (1-100) |

## 🚀 Cài Đặt

### 1. Yêu Cầu

- Node.js 16.9.0 trở lên
- Discord Bot Token
- Discord Application ID

### 2. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** và đặt tên cho bot
3. Vào tab **"Bot"** và click **"Add Bot"**
4. Bật các **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy **Token** của bot

### 3. Cài Đặt Dự Án

```bash
# Clone hoặc tải project về
cd BotDiscord

# Cài đặt dependencies
npm install

# Tạo file .env (nếu chưa có)
# Thêm thông tin sau vào file .env:
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 4. Deploy Commands

```bash
# Deploy slash commands
node deploy-commands.js
```

### 5. Chạy Bot

```bash
# Chạy bot
node index.js
```

## 📖 Hướng Dẫn Sử Dụng

### `/project create`
Tạo project mới với category, text channel, voice channel và role riêng.

**Cú pháp:**
```
/project create name:"Tên project" leader:@user [max_members:10]
```

### `/poll`
Tạo cuộc bình chọn với nhiều tùy chọn và thời gian kết thúc.

**Cú pháp:**
```
/poll question:"Câu hỏi" options:"Lựa chọn 1, Lựa chọn 2,..." duration:"24h"
```

### `/clear`
Xóa tin nhắn hàng loạt trong kênh.

**Cú pháp:**
```
/clear amount:10 [user:@user]
```

## 🛠️ Cấu Trúc Dự Án

```
BotDiscord/
├── commands/
│   ├── moderation/
│   │   └── clear.js
│   ├── project/
│   │   └── project.js
│   └── utility/
│       ├── help.js
│       ├── ping.js
│       └── poll.js
├── utils/
│   ├── embedBuilder.js
│   ├── permissions.js
│   ├── database.js
│   └── projectPermissions.js
├── index.js
├── deploy-commands.js
├── package.json
└── README.md
```

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

---

**Chúc bạn quản lý server thành công! 🎓✨**
| Lệnh | Mô tả | Quyền yêu cầu |
|------|-------|---------------|
| `/project create` | Tạo project với category và channels riêng | MANAGE_CHANNELS |
| `/project list` | Xem danh sách tất cả projects | Không |
| `/project info` | Xem thông tin chi tiết project | Không |
| `/project add` | Thêm thành viên vào project | Leader hoặc MANAGE_CHANNELS |
| `/project remove` | Xóa thành viên khỏi project | Leader hoặc MANAGE_CHANNELS |
| `/project leave` | Rời khỏi project | Không (phải là member) |
| `/project delete` | Xóa project hoàn toàn | Leader hoặc MANAGE_CHANNELS |

### 🔧 Utility Commands

| Lệnh | Mô tả |
|------|-------|
| `/help` | Hiển thị danh sách lệnh và hướng dẫn |


## 🚀 Cài Đặt

### 1. Yêu Cầu

- Node.js 16.9.0 trở lên
- Discord Bot Token
- Discord Application ID

### 2. Tạo Discord Bot

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** và đặt tên cho bot
3. Vào tab **"Bot"** và click **"Add Bot"**
4. Bật các **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent (nếu cần)
5. Copy **Token** của bot

### 3. Invite Bot Vào Server

1. Vào tab **"OAuth2"** → **"URL Generator"**
2. Chọn **Scopes**:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Chọn **Bot Permissions**:
   - ✅ Ban Members
   - ✅ Kick Members
   - ✅ Moderate Members
   - ✅ Manage Channels
   - ✅ Manage Roles
   - ✅ Manage Messages
   - ✅ Read Messages/View Channels
   - ✅ Send Messages
4. Copy URL và mở trong trình duyệt để invite bot

### 4. Cài Đặt Dự Án

```bash
# Clone hoặc tải project về
cd BotDiscord

# Cài đặt dependencies
npm install

# Tạo file .env (nếu chưa có)
# Thêm thông tin sau vào file .env:
TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here
```

### 5. Deploy Commands

```bash
# Deploy slash commands (chỉ cần chạy 1 lần hoặc khi có thay đổi commands)
npm run deploy
```

### 6. Chạy Bot

```bash
# Chạy bot
npm start

# Hoặc chạy với auto-reload (development)
npm run dev
```

## 📖 Hướng Dẫn Sử Dụng

### `/ban`
Ban một thành viên khỏi server.

**Cú pháp:**
```
/ban user:@user [reason:"Lý do"] [delete_days:7]
```

**Ví dụ:**
```
/ban user:@BadUser reason:"Spam" delete_days:7
```

---

### `/kick`
Kick một thành viên khỏi server (họ có thể join lại).

**Cú pháp:**
```
/kick user:@user [reason:"Lý do"]
```

**Ví dụ:**
```
/kick user:@BadUser reason:"Vi phạm quy định"
```

---

### `/unban`
Unban một người dùng bằng ID.

**Cú pháp:**
```
/unban user_id:123456789 [reason:"Lý do"]
```

**Ví dụ:**
```
/unban user_id:123456789012345678 reason:"Đã xin lỗi"
```

---

### `/warn`
Cảnh báo một thành viên (gửi DM).

**Cú pháp:**
```
/warn user:@user reason:"Lý do"
```

**Ví dụ:**
```
/warn user:@User reason:"Đăng nội dung không phù hợp"
```

---

### `/mute`
Timeout một thành viên (họ không thể gửi tin nhắn).

**Cú pháp:**
```
/mute user:@user duration:60 [reason:"Lý do"]
```

**Ví dụ:**
```
/mute user:@SpamUser duration:30 reason:"Spam liên tục"
```

**Lưu ý:** Duration tính bằng phút, tối đa 40320 phút (28 ngày).

---

### `/unmute`
Gỡ timeout cho một thành viên.

**Cú pháp:**
```
/unmute user:@user [reason:"Lý do"]
```

**Ví dụ:**
```
/unmute user:@User reason:"Đã hết thời gian phạt"
```

---

### `/slowmode`
Thiết lập slowmode cho kênh (giới hạn tốc độ gửi tin nhắn).

**Cú pháp:**
```
/slowmode duration:10 [channel:#channel]
```

**Ví dụ:**
```
/slowmode duration:5
/slowmode duration:0  # Tắt slowmode
```

**Lưu ý:** Duration tính bằng giây, tối đa 21600 giây (6 giờ).

---

### `/lock`
Khóa/mở khóa kênh (toggle).

**Cú pháp:**
```
/lock [channel:#channel] [reason:"Lý do"]
```

**Ví dụ:**
```
/lock reason:"Đang có vấn đề"
/lock  # Chạy lại để mở khóa
```

---

### `/clear`
Xóa tin nhắn hàng loạt trong kênh.

**Cú pháp:**
```
/clear amount:10 [user:@user]
```

**Ví dụ:**
```
/clear amount:50
/clear amount:20 user:@SpamUser  # Chỉ xóa tin nhắn của user này
```

**Lưu ý:** 
- Chỉ xóa được tin nhắn trong vòng 14 ngày (giới hạn của Discord)
- Tối đa 100 tin nhắn mỗi lần
- Thông báo xóa sẽ tự động biến mất sau 5 giây


---

### `/project create`
Tạo project mới với category, text channel, voice channel và role riêng.

**Cú pháp:**
```
/project create name:"Tên project" leader:@user [max_members:10]
```

**Ví dụ:**
```
/project create name:"Web Development" leader:@John max_members:5
```

**Chức năng:**
- Tạo category riêng cho project
- Tạo text channel và voice channel
- Tạo role riêng cho project
- Gán quyền quản lý cho leader
- Chỉ members mới thấy được channels

---

### `/project list`
Xem danh sách tất cả projects trong server.

**Cú pháp:**
```
/project list
```

**Hiển thị:**
- Tên project
- Trưởng nhóm
- Số thành viên
- Ngày tạo

---

### `/project info`
Xem thông tin chi tiết của một project.

**Cú pháp:**
```
/project info name:"Tên project"
```

**Ví dụ:**
```
/project info name:"Web Development"
```

**Hiển thị:**
- Danh sách tất cả thành viên
- Channels của project
- Role
- Thông tin chi tiết

---

### `/project add`
Thêm thành viên vào project (chỉ leader hoặc admin).

**Cú pháp:**
```
/project add project:"Tên project" user:@user
```

**Ví dụ:**
```
/project add project:"Web Development" user:@Alice
```

---

### `/project remove`
Xóa thành viên khỏi project (chỉ leader hoặc admin).

**Cú pháp:**
```
/project remove project:"Tên project" user:@user
```

**Ví dụ:**
```
/project remove project:"Web Development" user:@Alice
```

**Lưu ý:** Không thể xóa leader khỏi project.

---

### `/project leave`
Rời khỏi project (dành cho members).

**Cú pháp:**
```
/project leave project:"Tên project"
```

**Ví dụ:**
```
/project leave project:"Web Development"
```

**Lưu ý:** Leader không thể rời project.

---

### `/project delete`
Xóa project hoàn toàn (chỉ leader hoặc admin).

**Cú pháp:**
```
/project delete name:"Tên project"
```

**Ví dụ:**
```
/project delete name:"Web Development"
```

**Cảnh báo:** Lệnh này sẽ xóa tất cả channels, role và dữ liệu của project!

---

### `/help`
Hiển thị danh sách lệnh hoặc hướng dẫn chi tiết.

**Cú pháp:**
```
/help [command:tên_lệnh]
```

**Ví dụ:**
```
/help
/help command:ban
```


## 🛠️ Cấu Trúc Dự Án

```
BotDiscord/
├── commands/
│   ├── moderation/
│   │   ├── ban.js
│   │   ├── kick.js
│   │   ├── unban.js
│   │   ├── warn.js
│   │   ├── mute.js
│   │   ├── unmute.js
│   │   ├── slowmode.js
│   │   └── lock.js
│   ├── project/
│   │   └── project.js
│   └── utility/
│       └── help.js
├── utils/
│   ├── embedBuilder.js
│   ├── permissions.js
│   ├── database.js
│   └── projectPermissions.js
├── data/
│   └── projects.json
├── .env
├── .gitignore
├── index.js
├── deploy-commands.js
├── package.json
└── README.md
```

## 🔧 Troubleshooting

### Bot không online
- Kiểm tra TOKEN trong file `.env` có đúng không
- Kiểm tra internet connection
- Xem logs trong console để biết lỗi cụ thể

### Slash commands không hiện
- Chạy lại `npm run deploy`
- Đợi vài phút để Discord cập nhật
- Kiểm tra CLIENT_ID và GUILD_ID trong `.env`
- Đảm bảo bot đã được invite với scope `applications.commands`

### Bot không thể ban/kick/mute
- Kiểm tra bot có đủ quyền trong server không
- Đảm bảo role của bot cao hơn role của người bị moderate
- Kiểm tra bot permissions trong server settings

### Commands báo lỗi permission
- Kiểm tra bạn có role với quyền tương ứng không
- Đảm bảo bot có quyền cần thiết
- Kiểm tra role hierarchy (role của bạn phải cao hơn target)

## 📝 Lưu Ý

- Bot sử dụng Discord.js v14
- Mute command sử dụng timeout feature của Discord (native)
- Tất cả commands đều có permission checks và role hierarchy validation
- Bot sẽ gửi DM cho user trước khi ban/kick/mute (nếu có thể)
- Project data được lưu trong file JSON (`data/projects.json`)
- Mỗi project tạo 3 channels (category + text + voice) và 1 role
- Leader có quyền quản lý channels và messages trong project của mình


## 🔐 Bảo Mật

- **KHÔNG** commit file `.env` lên Git
- **KHÔNG** chia sẻ bot token với ai
- Nếu token bị lộ, reset ngay tại Discord Developer Portal

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

---

**Chúc bạn quản lý server thành công! 🎓✨**
