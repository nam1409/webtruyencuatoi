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

Để sau này có thể cập nhật phiên bản mới chỉ với 1 cú click, chúng tôi khuyên bạn nên **Fork** dự án này trước khi Deploy:

1. Nhấn nút **Fork** ở góc trên bên phải trang GitHub này để copy dự án về tài khoản của bạn.
2. Truy cập [Vercel.com](https://vercel.com/), chọn **Add New Project** và kết nối với Repository bạn vừa Fork.
3. Cấu hình các biến môi trường (Environment Variables) như hướng dẫn ở Bước 2 & 3.

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
- `NEXT_PUBLIC_SITE_URL`: Địa chỉ trang web (ví dụ: `https://my-story.vercel.app`). **Bắt buộc** để tính năng Đăng nhập Google/Github hoạt động chính xác.

---

## 🔐 Cấu hình Social Login (Tùy chọn)

Để tránh giới hạn gửi Email (Rate Limit) của Supabase, bạn nên cấu hình đăng nhập qua Google hoặc Github:

### 1. Google Login
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/), tạo dự án và lấy **Client ID**, **Client Secret**.
2. Thêm Redirect URI: `https://[PROJECT_ID].supabase.co/auth/v1/callback`.
3. Trong Supabase Dashboard, vào **Authentication > Providers > Google**, bật và điền thông tin Client.

### 2. Github Login
1. Vào GitHub Settings > Developer Settings > OAuth Apps > **New OAuth App**.
2. Homepage URL: Địa chỉ website của bạn.
3. Authorization callback URL: `https://[PROJECT_ID].supabase.co/auth/v1/callback`.
4. Điền Client ID/Secret vào Supabase tương tự như Google.

---

## 🛠️ Tùy chỉnh & Quản trị
Sau khi cài đặt thành công, hãy truy cập vào đường dẫn `/login` trên trang web của bạn để đăng ký tài khoản. 

**Lưu ý về quyền Quản trị (Admin):**
- Hệ thống sẽ **tự động gán quyền Admin** cho người đầu tiên đăng ký thành công.
- Từ người thứ 2 trở đi, tài khoản sẽ mặc định là `reader` (độc giả).
- Bạn có thể quản lý, cấp quyền cho các thành viên khác ngay trong giao diện Admin sau khi đăng nhập.

Bây giờ bạn có thể truy cập `/admin` để thay đổi màu sắc, phông chữ, logo và bắt đầu đăng những chương truyện đầu tiên!

---

## 🔄 Hướng dẫn Cập nhật

Khi ZenStory có phiên bản mới, hãy làm theo các bước sau để cập nhật website của bạn:

### 1. Cập nhật Mã nguồn (Code)
- **Nếu bạn đã Fork dự án**: Truy cập vào Repo của bạn trên GitHub, nhấn **Sync fork** -> **Update branch**. Vercel sẽ tự động triển khai bản mới.
- **Nếu bạn dùng nút Deploy nhanh**: Bạn cần tải bản mới về và upload thủ công lên Repo của mình, hoặc cấu hình Git remote để pull bản mới nhất từ `upstream`.

### 2. Cập nhật Cơ sở dữ liệu (Database)
Khi có tính năng mới (ví dụ: Shoutbox, Anti-copy), bạn cần cập nhật cấu trúc DB:
1. Truy cập vào **SQL Editor** trên Supabase.
2. Copy toàn bộ nội dung file [init_database.sql](./init_database.sql) mới nhất và nhấn **Run**. Lệnh đã được thiết kế an toàn để không ghi đè dữ liệu cũ của bạn.

---

## 🤝 Đóng góp
Nếu bạn gặp lỗi hoặc có ý tưởng mới, hãy mở một Issue hoặc Pull Request. Chúng tôi luôn chào đón sự đóng góp từ cộng đồng.

## 📄 Giấy phép
Dự án được phát hành dưới giấy phép MIT. Miễn phí cho mục đích cá nhân và thương mại.
