-- ZENSTORY ELITE - FULL DATABASE INITIALIZATION SCRIPT
-- Phiên bản đầy đủ nhất để Self-host (Sao chép và dán vào Supabase SQL Editor)

-- 1. CẤU HÌNH BAN ĐẦU
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ĐỊNH NGHĨA CÁC BẢNG (TABLES)

-- Hồ sơ người dùng (Profiles)
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  role text DEFAULT 'reader'::text CHECK (role = ANY (ARRAY['admin'::text, 'reader'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tác phẩm (Stories)
CREATE TABLE public.stories (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_url text,
  status text DEFAULT 'ongoing'::text CHECK (status = ANY (ARRAY['ongoing'::text, 'completed'::text, 'hiatus'::text])),
  is_protected boolean DEFAULT false,
  is_private boolean DEFAULT false,
  featured boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  genres text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  author_name text,
  source text,
  translator_name text,
  owner_role text DEFAULT 'author'::text,
  views_count_total integer DEFAULT 0,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tập truyện (Volumes)
CREATE TABLE public.volumes (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  title text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Chương truyện (Chapters)
CREATE TABLE public.chapters (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  volume_id uuid REFERENCES public.volumes(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content_json jsonb NOT NULL,
  content_draft jsonb DEFAULT '{"type": "doc", "content": []}'::jsonb,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'scheduled'::text])),
  password_hash text,
  password_hint text,
  order_index integer DEFAULT 0,
  view_count integer DEFAULT 0,
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Bình luận (Comments)
CREATE TABLE public.comments (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  paragraph_id text,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_approved boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Đánh giá (Ratings)
CREATE TABLE public.ratings (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- Tiến trình đọc (User Reading Progress)
CREATE TABLE public.user_reading_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  scroll_position integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, story_id)
);

-- Cài đặt hệ thống (Site Settings)
CREATE TABLE public.site_settings (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name text DEFAULT 'ZenStory'::text,
  site_description text DEFAULT 'Nền tảng sáng tác và đọc truyện Light Novel cao cấp'::text,
  hero_title text DEFAULT 'Khám phá thế giới qua từng trang sách'::text,
  hero_subtitle text DEFAULT 'Nơi những câu chuyện huyền thoại bắt đầu.'::text,
  hero_image_url text,
  primary_color text DEFAULT '#8b5cf6'::text,
  primary_font text DEFAULT 'font-serif'::text,
  default_theme text DEFAULT 'light'::text,
  google_font text DEFAULT ''::text,
  enable_canvas boolean DEFAULT true,
  custom_themes jsonb DEFAULT '[]'::jsonb,
  custom_fonts jsonb DEFAULT '[]'::jsonb,
  site_genres text[] DEFAULT '{}'::text[],
  homepage_layout jsonb DEFAULT '[{"id": "h1", "type": "hero", "enabled": true}, {"id": "l1", "limit": 12, "type": "latest", "title": "Mới Cập Nhật", "enabled": true}]'::jsonb,
  featured_story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  show_stats boolean DEFAULT true,
  show_new_releases boolean DEFAULT true,
  show_popular boolean DEFAULT true,
  custom_css text,
  force_https boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  allow_registration boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Nhật ký hoạt động (Activity Logs)
CREATE TABLE public.activity_logs (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Phiên bản chương truyện (Chapter Versions)
CREATE TABLE public.chapter_versions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  edited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_json jsonb NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- Nhân vật (Characters)
CREATE TABLE public.characters (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  avatar_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Thông báo (Notifications)
CREATE TABLE public.notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Cộng tác viên (Story Collaborators)
CREATE TABLE public.story_collaborators (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'editor'::text CHECK (role = ANY (ARRAY['editor'::text, 'moderator'::text, 'admin'::text, 'translator'::text, 'proofreader'::text, 'uploader'::text])),
  created_at timestamp with time zone DEFAULT now()
);

-- Lượt xem hàng ngày (Story Views Daily)
CREATE TABLE public.story_views_daily (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer DEFAULT 1,
  PRIMARY KEY (story_id, view_date)
);

-- 3. CHÍNH SÁCH BẢO MẬT (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Stories
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (is_private = false OR auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authors can manage own stories" ON public.stories FOR ALL USING (auth.uid() = author_id);

-- Chapters
CREATE POLICY "Published chapters viewable by everyone" ON public.chapters FOR SELECT USING (status = 'published' OR EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid()));
CREATE POLICY "Authors manage own chapters" ON public.chapters FOR ALL USING (EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND author_id = auth.uid()));

-- Settings
CREATE POLICY "Settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Only admins can manage settings" ON public.site_settings FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. TỰ ĐỘNG TẠO PROFILE KHI ĐĂNG KÝ (TRIGGER)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_avatar text;
BEGIN
  -- Tự động sinh avatar từ DiceBear dựa trên username
  default_avatar := 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' || COALESCE(new.raw_user_meta_data->>'username', new.id::text);

  INSERT INTO public.profiles (id, username, display_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    COALESCE(new.raw_user_meta_data->>'avatar_url', default_avatar),
    COALESCE(new.raw_user_meta_data->>'role', 'reader')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. DỮ LIỆU KHỞI TẠO
INSERT INTO public.site_settings (id, site_name) VALUES ('00000000-0000-0000-0000-000000000000', 'ZenStory') ON CONFLICT DO NOTHING;
