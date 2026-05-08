


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (p_user_id, p_type, p_title, p_content, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, content, link)
    VALUES (p_user_id, p_type, p_title, p_content, p_link);
END;
$$;


ALTER FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_global_analytics"("days_back" integer DEFAULT 30) RETURNS TABLE("view_date" "date", "total_views" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT vd.view_date, SUM(vd.view_count)::BIGINT
  FROM story_views_daily vd
  WHERE vd.view_date > CURRENT_DATE - days_back
  GROUP BY vd.view_date
  ORDER BY vd.view_date ASC;
END;
$$;


ALTER FUNCTION "public"."get_global_analytics"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_chapter_version"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO chapter_versions (chapter_id, content_json, edited_by)
  VALUES (OLD.id, OLD.content_json, auth.uid());
  
  -- Keep only 10 most recent versions
  DELETE FROM chapter_versions
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY chapter_id ORDER BY created_at DESC) as rn
      FROM chapter_versions
      WHERE chapter_id = OLD.id
    ) t
    WHERE t.rn > 10
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_chapter_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  default_avatar text;
  user_count int;
  user_role text;
  safe_username text;
BEGIN
  -- 1. Kiểm tra số lượng người dùng để gán quyền Admin cho người đầu tiên
  SELECT count(*) INTO user_count FROM public.profiles;
  
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'reader';
  END IF;

  -- 2. Xử lý username an toàn
  safe_username := COALESCE(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );

  -- 3. Tạo avatar mặc định
  default_avatar := 'https://api.dicebear.com/7.x/pixel-art/svg?seed=' || safe_username;

  -- 4. Chèn dữ liệu vào bảng profiles
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name, 
    avatar_url, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    safe_username,
    COALESCE(new.raw_user_meta_data->>'display_name', safe_username),
    COALESCE(new.raw_user_meta_data->>'avatar_url', default_avatar),
    user_role,
    now(),
    now()
  );

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log lỗi thầm lặng (có thể xem trong Postgres Logs của Supabase)
  -- Vẫn trả về new để không chặn tiến trình đăng ký của auth.users
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count existing profiles
  SELECT count(*) INTO user_count FROM profiles;
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    NEW.role := 'admin';
  ELSE
    NEW.role := 'reader';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_story_view"("target_story_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Increment total view count in stories table
  UPDATE stories 
  SET views_count_total = COALESCE(views_count_total, 0) + 1 
  WHERE id = target_story_id;

  -- Log to daily views
  INSERT INTO story_views_daily (story_id, view_date, view_count)
  VALUES (target_story_id, CURRENT_DATE, 1)
  ON CONFLICT (story_id, view_date) 
  DO UPDATE SET view_count = story_views_daily.view_count + 1;
END;
$$;


ALTER FUNCTION "public"."increment_story_view"("target_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("target_chapter_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE chapters SET view_count = COALESCE(view_count, 0) + 1 WHERE id = target_chapter_id;
END;
$$;


ALTER FUNCTION "public"."increment_view_count"("target_chapter_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_story_collaborator"("check_story_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.story_collaborators WHERE story_id = check_story_id AND user_id = auth.uid());
END; $$;


ALTER FUNCTION "public"."is_story_collaborator"("check_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_story_owner"("check_story_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.stories WHERE id = check_story_id AND author_id = auth.uid());
END; $$;


ALTER FUNCTION "public"."is_story_owner"("check_story_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_activity"("p_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, target_type, target_id, details, metadata)
  VALUES (p_user_id, p_action, p_target_type, p_target_id, p_details, p_metadata);
END;
$$;


ALTER FUNCTION "public"."log_admin_activity"("p_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "details" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapter_version_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "version_id" "uuid" NOT NULL,
    "content_json" "jsonb" NOT NULL,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chapter_version_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapter_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "created_by" "uuid",
    "content_json" "jsonb" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" DEFAULT 'Draft'::"text",
    "version_number" integer DEFAULT 1,
    "content_draft" "jsonb",
    "is_primary" boolean DEFAULT false,
    "status" "text" DEFAULT 'draft'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "edited_by" "uuid"
);


ALTER TABLE "public"."chapter_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "volume_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "content_json" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "password_hash" "text",
    "password_hint" "text",
    "published_at" timestamp with time zone,
    "order_index" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "content_draft" "jsonb" DEFAULT '{"type": "doc", "content": []}'::"jsonb",
    "scheduled_at" timestamp with time zone,
    CONSTRAINT "chapters_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'scheduled'::"text"])))
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "paragraph_id" "text",
    "parent_id" "uuid",
    "is_approved" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'Thông báo'::"text",
    "is_pinned" boolean DEFAULT false,
    "author_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "website" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'reader'::"text",
    "banner_url" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "location" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'reader'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "story_id" "uuid" NOT NULL,
    "rating" integer,
    "review" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reading_progress" (
    "user_id" "uuid" NOT NULL,
    "story_id" "uuid" NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "site_name" "text" DEFAULT 'ZenStory'::"text",
    "site_description" "text" DEFAULT 'Nền tảng sáng tác và đọc truyện Light Novel cao cấp'::"text",
    "hero_title" "text" DEFAULT 'Khám phá thế giới qua từng trang sách'::"text",
    "hero_subtitle" "text" DEFAULT 'Nơi những câu chuyện huyền thoại bắt đầu. Trải nghiệm đọc truyện đỉnh cao với ZenStory Elite.'::"text",
    "hero_image_url" "text",
    "primary_color" "text" DEFAULT '#8b5cf6'::"text",
    "featured_story_id" "uuid",
    "show_stats" boolean DEFAULT true,
    "show_new_releases" boolean DEFAULT true,
    "show_popular" boolean DEFAULT true,
    "custom_css" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "homepage_layout" "jsonb",
    "force_https" boolean DEFAULT true,
    "site_language" "text" DEFAULT 'vi'::"text",
    "site_genres" "text"[] DEFAULT '{}'::"text"[],
    "maintenance_mode" boolean DEFAULT false,
    "allow_registration" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "primary_font" "text" DEFAULT 'font-serif'::"text",
    "default_theme" "text" DEFAULT 'light'::"text",
    "google_font" "text" DEFAULT ''::"text",
    "enable_canvas" boolean DEFAULT true,
    "custom_themes" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_fonts" "jsonb" DEFAULT '[]'::"jsonb",
    "favicon_url" "text",
    "apple_icon_url" "text",
    "logo_url" "text"
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "cover_url" "text",
    "status" "text" DEFAULT 'ongoing'::"text",
    "is_protected" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "genres" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "views_count_total" integer DEFAULT 0,
    "featured" boolean DEFAULT false,
    "author_name" "text",
    "source" "text",
    "translator_name" "text",
    "owner_role" "text" DEFAULT 'author'::"text",
    "is_private" boolean DEFAULT false,
    "scheduled_at" timestamp with time zone,
    "allow_offline" boolean DEFAULT false,
    CONSTRAINT "stories_status_check" CHECK (("status" = ANY (ARRAY['ongoing'::"text", 'completed'::"text", 'hiatus'::"text"])))
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_access_list" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_access_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_collaborators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'editor'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "story_collaborators_role_check" CHECK (("role" = ANY (ARRAY['editor'::"text", 'moderator'::"text", 'admin'::"text", 'translator'::"text", 'proofreader'::"text", 'uploader'::"text"])))
);


ALTER TABLE "public"."story_collaborators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_follows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "story_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_views_daily" (
    "story_id" "uuid" NOT NULL,
    "view_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "view_count" integer DEFAULT 1
);


ALTER TABLE "public"."story_views_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reading_progress" (
    "user_id" "uuid" NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "story_id" "uuid" NOT NULL,
    "scroll_position" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."volumes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."volumes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_version_history"
    ADD CONSTRAINT "chapter_version_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapter_versions"
    ADD CONSTRAINT "chapter_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_story_id_slug_key" UNIQUE ("story_id", "slug");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_story_id_key" UNIQUE ("user_id", "story_id");



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("user_id", "story_id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."story_access_list"
    ADD CONSTRAINT "story_access_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_access_list"
    ADD CONSTRAINT "story_access_list_story_id_user_id_key" UNIQUE ("story_id", "user_id");



ALTER TABLE ONLY "public"."story_collaborators"
    ADD CONSTRAINT "story_collaborators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_collaborators"
    ADD CONSTRAINT "story_collaborators_story_id_user_id_key" UNIQUE ("story_id", "user_id");



ALTER TABLE ONLY "public"."story_follows"
    ADD CONSTRAINT "story_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_follows"
    ADD CONSTRAINT "story_follows_user_id_story_id_key" UNIQUE ("user_id", "story_id");



ALTER TABLE ONLY "public"."story_views_daily"
    ADD CONSTRAINT "story_views_daily_pkey" PRIMARY KEY ("story_id", "view_date");



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("user_id", "story_id");



ALTER TABLE ONLY "public"."volumes"
    ADD CONSTRAINT "volumes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chapters_status_published" ON "public"."chapters" USING "btree" ("status", "published_at") WHERE ("status" = 'published'::"text");



CREATE INDEX "idx_chapters_story" ON "public"."chapters" USING "btree" ("story_id");



CREATE INDEX "idx_reading_progress_user" ON "public"."user_reading_progress" USING "btree" ("user_id");



CREATE INDEX "idx_stories_author" ON "public"."stories" USING "btree" ("author_id");



CREATE INDEX "idx_stories_genres" ON "public"."stories" USING "gin" ("genres");



CREATE INDEX "idx_stories_tags" ON "public"."stories" USING "gin" ("tags");



CREATE OR REPLACE TRIGGER "chapter_version_trigger" BEFORE UPDATE OF "content_json" ON "public"."chapters" FOR EACH ROW EXECUTE FUNCTION "public"."handle_chapter_version"();



CREATE OR REPLACE TRIGGER "on_profile_created_assign_role" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user_role"();



CREATE OR REPLACE TRIGGER "update_chapters_updated_at" BEFORE UPDATE ON "public"."chapters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_stories_updated_at" BEFORE UPDATE ON "public"."stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_volumes_updated_at" BEFORE UPDATE ON "public"."volumes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chapter_version_history"
    ADD CONSTRAINT "chapter_version_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chapter_version_history"
    ADD CONSTRAINT "chapter_version_history_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."chapter_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_versions"
    ADD CONSTRAINT "chapter_versions_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapter_versions"
    ADD CONSTRAINT "chapter_versions_edited_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chapter_versions"
    ADD CONSTRAINT "chapter_versions_edited_by_fkey1" FOREIGN KEY ("edited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "public"."volumes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ratings"
    ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reading_progress"
    ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_featured_story_id_fkey" FOREIGN KEY ("featured_story_id") REFERENCES "public"."stories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_access_list"
    ADD CONSTRAINT "story_access_list_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_access_list"
    ADD CONSTRAINT "story_access_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_collaborators"
    ADD CONSTRAINT "story_collaborators_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_collaborators"
    ADD CONSTRAINT "story_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_follows"
    ADD CONSTRAINT "story_follows_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_follows"
    ADD CONSTRAINT "story_follows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_views_daily"
    ADD CONSTRAINT "story_views_daily_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."volumes"
    ADD CONSTRAINT "volumes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage news" ON "public"."news" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."role" = 'admin'::"text"))));



CREATE POLICY "Admins can update settings" ON "public"."site_settings" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public insert/update for views via RPC" ON "public"."story_views_daily" USING (true) WITH CHECK (true);



CREATE POLICY "Anyone can view collaborators" ON "public"."story_collaborators" FOR SELECT USING (true);



CREATE POLICY "Anyone can view news" ON "public"."news" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can post comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authors and collaborators can manage chapters" ON "public"."chapters" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND (("stories"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators"
          WHERE (("story_collaborators"."story_id" = "stories"."id") AND ("story_collaborators"."user_id" = "auth"."uid"()) AND ("story_collaborators"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))))))));



CREATE POLICY "Authors and collaborators can manage characters" ON "public"."characters" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND (("stories"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators"
          WHERE (("story_collaborators"."story_id" = "stories"."id") AND ("story_collaborators"."user_id" = "auth"."uid"()) AND ("story_collaborators"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))))))));



CREATE POLICY "Authors and collaborators can manage volumes" ON "public"."volumes" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "volumes"."story_id") AND (("stories"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators"
          WHERE (("story_collaborators"."story_id" = "stories"."id") AND ("story_collaborators"."user_id" = "auth"."uid"()) AND ("story_collaborators"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))))))));



CREATE POLICY "Authors and collaborators manage stories" ON "public"."stories" TO "authenticated" USING ((("author_id" = "auth"."uid"()) OR "public"."is_story_collaborator"("id")));



CREATE POLICY "Authors can manage chapters" ON "public"."chapters" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage characters" ON "public"."characters" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "characters"."story_id") AND ("stories"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors can manage own stories" ON "public"."stories" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can manage stories" ON "public"."stories" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Authors can manage volumes" ON "public"."volumes" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "volumes"."story_id") AND ("stories"."author_id" = "auth"."uid"())))));



CREATE POLICY "Authors manage collaborators" ON "public"."story_collaborators" TO "authenticated" USING ("public"."is_story_owner"("story_id")) WITH CHECK ("public"."is_story_owner"("story_id"));



CREATE POLICY "Authors manage own chapters" ON "public"."chapters" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."author_id" = "auth"."uid"())))));



CREATE POLICY "Characters are viewable by everyone" ON "public"."characters" FOR SELECT USING (true);



CREATE POLICY "Collaborators manage chapters" ON "public"."chapters" TO "authenticated" USING (("public"."is_story_owner"("story_id") OR "public"."is_story_collaborator"("story_id")));



CREATE POLICY "Collaborators manage volumes" ON "public"."volumes" USING ((EXISTS ( SELECT 1
   FROM "public"."story_collaborators"
  WHERE (("story_collaborators"."story_id" = "volumes"."story_id") AND ("story_collaborators"."user_id" = "auth"."uid"()) AND ("story_collaborators"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text"]))))));



CREATE POLICY "Collaborators update stories" ON "public"."stories" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."story_collaborators"
  WHERE (("story_collaborators"."story_id" = "stories"."id") AND ("story_collaborators"."user_id" = "auth"."uid"()) AND ("story_collaborators"."role" = ANY (ARRAY['admin'::"text", 'editor'::"text", 'translator'::"text"]))))));



CREATE POLICY "Collaborators view stories" ON "public"."stories" FOR SELECT TO "authenticated" USING ("public"."is_story_collaborator"("id"));



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Manage access list" ON "public"."story_access_list" USING ((EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "story_access_list"."story_id") AND (("stories"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators"
          WHERE (("story_collaborators"."story_id" = "stories"."id") AND ("story_collaborators"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Manage history" ON "public"."chapter_version_history" USING ((EXISTS ( SELECT 1
   FROM (("public"."chapter_versions" "v"
     JOIN "public"."chapters" "c" ON (("v"."chapter_id" = "c"."id")))
     JOIN "public"."stories" "s" ON (("c"."story_id" = "s"."id")))
  WHERE (("v"."id" = "chapter_version_history"."version_id") AND (("s"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))))))));



CREATE POLICY "Manage versions" ON "public"."chapter_versions" USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters" "c"
     JOIN "public"."stories" "s" ON (("c"."story_id" = "s"."id")))
  WHERE (("c"."id" = "chapter_versions"."chapter_id") AND (("s"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))))))));



CREATE POLICY "Only admins can manage settings" ON "public"."site_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public can view settings" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published chapters are public" ON "public"."chapters" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Published chapters viewable by everyone" ON "public"."chapters" FOR SELECT USING ((("status" = 'published'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."stories"
  WHERE (("stories"."id" = "chapters"."story_id") AND ("stories"."author_id" = "auth"."uid"()))))));



CREATE POLICY "Settings are viewable by everyone" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "Stories are viewable by everyone" ON "public"."stories" FOR SELECT USING ((("is_private" = false) OR ("auth"."uid"() = "author_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Users can create versions of their stories" ON "public"."chapter_versions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."chapters" "c"
     JOIN "public"."stories" "s" ON (("c"."story_id" = "s"."id")))
  WHERE (("c"."id" = "chapter_versions"."chapter_id") AND (("s"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators" "sc"
          WHERE (("sc"."story_id" = "s"."id") AND ("sc"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Users can delete own comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow stories" ON "public"."story_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own progress" ON "public"."reading_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own ratings" ON "public"."ratings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own reading progress" ON "public"."user_reading_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unfollow stories" ON "public"."story_follows" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own activity logs" ON "public"."activity_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own follows" ON "public"."story_follows" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view versions of their stories" ON "public"."chapter_versions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters" "c"
     JOIN "public"."stories" "s" ON (("c"."story_id" = "s"."id")))
  WHERE (("c"."id" = "chapter_versions"."chapter_id") AND (("s"."author_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."story_collaborators" "sc"
          WHERE (("sc"."story_id" = "s"."id") AND ("sc"."user_id" = "auth"."uid"())))))))));



CREATE POLICY "Volumes are viewable by everyone" ON "public"."volumes" FOR SELECT USING (true);



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapter_version_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapter_versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_access_list" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_collaborators" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_views_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."volumes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_system_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_content" "text", "p_link" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_global_analytics"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_global_analytics"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_global_analytics"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_chapter_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_chapter_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_chapter_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_story_view"("target_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_story_view"("target_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_story_view"("target_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("target_chapter_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("target_chapter_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("target_chapter_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_story_collaborator"("check_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_story_collaborator"("check_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_story_collaborator"("check_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_story_owner"("check_story_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_story_owner"("check_story_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_story_owner"("check_story_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_activity"("p_user_id" "uuid", "p_action" "text", "p_target_type" "text", "p_target_id" "uuid", "p_details" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."chapter_version_history" TO "anon";
GRANT ALL ON TABLE "public"."chapter_version_history" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_version_history" TO "service_role";



GRANT ALL ON TABLE "public"."chapter_versions" TO "anon";
GRANT ALL ON TABLE "public"."chapter_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."chapter_versions" TO "service_role";



GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ratings" TO "anon";
GRANT ALL ON TABLE "public"."ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."ratings" TO "service_role";



GRANT ALL ON TABLE "public"."reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_access_list" TO "anon";
GRANT ALL ON TABLE "public"."story_access_list" TO "authenticated";
GRANT ALL ON TABLE "public"."story_access_list" TO "service_role";



GRANT ALL ON TABLE "public"."story_collaborators" TO "anon";
GRANT ALL ON TABLE "public"."story_collaborators" TO "authenticated";
GRANT ALL ON TABLE "public"."story_collaborators" TO "service_role";



GRANT ALL ON TABLE "public"."story_follows" TO "anon";
GRANT ALL ON TABLE "public"."story_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."story_follows" TO "service_role";



GRANT ALL ON TABLE "public"."story_views_daily" TO "anon";
GRANT ALL ON TABLE "public"."story_views_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."story_views_daily" TO "service_role";



GRANT ALL ON TABLE "public"."user_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."volumes" TO "anon";
GRANT ALL ON TABLE "public"."volumes" TO "authenticated";
GRANT ALL ON TABLE "public"."volumes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Assets Admin Manage"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using ((bucket_id = 'assets'::text));



  create policy "Assets Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'assets'::text));



  create policy "Authenticated users can upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Public Access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = ANY (ARRAY['covers'::text, 'illustrations'::text])));



  create policy "Users can delete own uploads"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((auth.uid() = owner));



