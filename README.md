# 🖋️ ZenStory Elite - Nền tảng Light Novel Tự Thân (Self-hosted)

ZenStory Elite là giải pháp mã nguồn mở hoàn chỉnh giúp các tác giả và nhóm dịch Light Novel tự xây dựng nền tảng đọc truyện riêng biệt, bảo mật và thẩm mỹ cao mà không cần biết lập trình chuyên sâu.

## ✨ Tính năng nổi bật
- **Giao diện Reader Premium**: Tùy chỉnh Font chữ (Google Fonts), màu nền (Sepia, Dark, Night), khoảng cách dòng...
- **Bảo mật nội dung**: Chống copy, mã hóa nội dung bằng Glyph Mapping (Canvas Rendering).
- **Quản lý tác phẩm**: Hệ thống Admin chuyên nghiệp, quản lý tập (Volume), chương (Chapter), hẹn giờ đăng truyện.
- **Tối ưu SEO**: Tự động tạo Sitemap, Robots.txt, Meta Tags cho từng bộ truyện.
- **Tốc độ cực nhanh**: Xây dựng trên Next.js 15 và Supabase, mang lại trải nghiệm mượt mà nhất.

---

## 🚀 Hướng dẫn cài đặt nhanh (5 phút)

Dành cho các tác giả muốn sở hữu website ngay lập tức.

### Bước 1: Triển khai Website
Nhấn vào nút dưới đây để sao chép mã nguồn và đưa lên máy chủ Vercel (Miễn phí):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/namnguyen1409/lightnovel&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,NEXT_PUBLIC_SITE_URL&project-name=my-zenstory&repository-name=my-zenstory)

### Bước 2: Khởi tạo Cơ sở dữ liệu (Supabase)
1. Truy cập [Supabase.com](https://supabase.com/) và tạo một dự án mới.
2. Tại thanh bên trái, chọn **SQL Editor**.
3. Mở tệp [init_database.sql](./init_database.sql) trong dự án này, copy toàn bộ nội dung và dán vào SQL Editor của Supabase.
4. Nhấn **Run** để khởi tạo các bảng và chính sách bảo mật.

### Bước 3: Cấu hình Redis (Upstash)
Dự án sử dụng Redis để lưu trữ lượt xem và giới hạn tốc độ truy cập nhằm tối ưu hiệu năng:
1. Truy cập [Upstash.com](https://upstash.com/) và đăng nhập.
2. Nhấn **Create Database**, đặt tên và chọn khu vực gần bạn nhất (ví dụ: Singapore).
3. Tại mục **REST API**, bạn sẽ thấy các thông tin cần thiết:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 🔑 Cấu hình Biến môi trường

Bạn cần điền các thông tin sau vào tệp `.env` hoặc cấu hình trên Dashboard của Vercel:

### 1. Supabase (Lấy tại Project Settings > API)
- `NEXT_PUBLIC_SUPABASE_URL`: Đường dẫn URL của dự án.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Khóa công khai dành cho client.

### 2. Redis (Lấy tại Upstash Dashboard)
- `UPSTASH_REDIS_REST_URL`: Đường dẫn REST của Redis.
- `UPSTASH_REDIS_REST_TOKEN`: Mã truy cập REST.

### 3. Website Metadata
- `NEXT_PUBLIC_SITE_URL`: Địa chỉ trang web của bạn (ví dụ: `https://my-story.vercel.app`).

---

## 🛠️ Tùy chỉnh & Quản trị
Sau khi cài đặt thành công, hãy truy cập vào đường dẫn `/login` trên trang web của bạn để đăng ký tài khoản. 

**Lưu ý về quyền Quản trị (Admin):**
- Hệ thống sẽ **tự động gán quyền Admin** cho người đầu tiên đăng ký thành công.
- Từ người thứ 2 trở đi, tài khoản sẽ mặc định là `reader` (độc giả).
- Bạn có thể quản lý, cấp quyền cho các thành viên khác ngay trong giao diện Admin sau khi đăng nhập.

Bây giờ bạn có thể truy cập `/admin` để thay đổi màu sắc, phông chữ, logo và bắt đầu đăng những chương truyện đầu tiên!

## 🤝 Đóng góp
Nếu bạn gặp lỗi hoặc có ý tưởng mới, hãy mở một Issue hoặc Pull Request. Chúng tôi luôn chào đón sự đóng góp từ cộng đồng.

## 📄 Giấy phép
Dự án được phát hành dưới giấy phép MIT. Miễn phí cho mục đích cá nhân và thương mại.
