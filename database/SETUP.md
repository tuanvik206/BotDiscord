# 📊 Supabase Database Setup

## Bước 1: Chạy SQL Schema

1. Mở Supabase Dashboard: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (icon database bên trái)
4. Click **New Query**
5. Copy toàn bộ nội dung file `database/schema.sql`
6. Paste vào editor
7. Click **Run** (hoặc Ctrl+Enter)

## Bước 2: Verify Tables

Sau khi chạy SQL, verify trong **Table Editor**:

✅ **projects** - 8 columns
✅ **project_members** - 3 columns  
✅ **project_channels** - 4 columns
✅ **warnings** - 6 columns
✅ **automod_config** - 4 columns

## Bước 3: Test Connection

Chạy lệnh sau để test connection:

```bash
node -e "import('./utils/supabase.js').then(m => m.testConnection())"
```

Nếu thấy "✅ Supabase connected successfully!" là OK!

## Bước 4: Ready to Migrate

Sau khi setup xong, bot sẽ tự động sử dụng Supabase thay vì JSON files.

---

**Lưu ý:** Nếu gặp lỗi, check lại:
- SUPABASE_URL trong .env
- SUPABASE_KEY trong .env (phải là anon/public key)
- Tables đã được tạo trong Supabase
