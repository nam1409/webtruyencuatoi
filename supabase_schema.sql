-- ZENSTORY ELITE DATABASE SCHEMA (Version 2.0)
-- Production-ready implementation with optimized indexing and security

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. SHARED FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORIES
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  is_protected BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}', -- Optimized for PG array queries
  genres TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VOLUMES
CREATE TABLE IF NOT EXISTS volumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAPTERS
CREATE TABLE IF NOT EXISTS chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  volume_id UUID REFERENCES volumes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_json JSONB NOT NULL, -- Tiptap JSON is the single source of truth
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  password_hash TEXT, -- Security first
  password_hint TEXT,
  published_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, slug)
);

-- 5. CHAPTER VERSIONS
CREATE TABLE IF NOT EXISTS chapter_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  edited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_json JSONB NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  paragraph_id TEXT, -- Note: Tiptap should use unique IDs for blocks
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHARACTERS
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. STORY COLLABORATORS (Multi-author support)
CREATE TABLE IF NOT EXISTS story_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('editor', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- 9. USER READING PROGRESS & RATINGS
CREATE TABLE IF NOT EXISTS user_reading_progress (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  scroll_position INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_stories_author ON stories(author_id);
CREATE INDEX idx_stories_tags ON stories USING GIN (tags);
CREATE INDEX idx_stories_genres ON stories USING GIN (genres);
CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_chapters_status_published ON chapters(status, published_at) WHERE status = 'published';
CREATE INDEX idx_comments_chapter ON comments(chapter_id);
CREATE INDEX idx_comments_paragraph ON comments(paragraph_id) WHERE paragraph_id IS NOT NULL;
CREATE INDEX idx_reading_progress_user ON user_reading_progress(user_id);

-- AUTOMATIC UPDATED_AT TRIGGERS
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_volumes_updated_at BEFORE UPDATE ON volumes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- VIEW COUNT FUNCTION (Atomicity)
CREATE OR REPLACE FUNCTION increment_view_count(target_chapter_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE chapters
    SET view_count = view_count + 1
    WHERE id = target_chapter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CHAPTER VERSIONING TRIGGER
CREATE OR REPLACE FUNCTION handle_chapter_version()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER chapter_version_trigger
BEFORE UPDATE OF content_json ON chapters
FOR EACH ROW EXECUTE FUNCTION handle_chapter_version();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Examples of stricter policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Stories are viewable by everyone" ON stories FOR SELECT USING (true);

-- Authors and Collaborators can manage stories
CREATE POLICY "Authors and collaborators can manage stories" ON stories
  FOR ALL
  USING (
    auth.uid() = author_id OR 
    EXISTS (
      SELECT 1 FROM story_collaborators 
      WHERE story_id = stories.id AND user_id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Published chapters are public
CREATE POLICY "Published chapters are public" ON chapters 
  FOR SELECT 
  USING (status = 'published' AND (published_at IS NULL OR published_at <= NOW()));

-- Authors and Collaborators can manage chapters
CREATE POLICY "Authors and collaborators can manage chapters" ON chapters
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stories 
      WHERE stories.id = chapters.story_id AND (
        stories.author_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM story_collaborators 
          WHERE story_id = stories.id AND user_id = auth.uid() AND role IN ('admin', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can manage own reading progress" ON user_reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own ratings" ON ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (is_approved = true);
-- 10. AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', new.email), 
    COALESCE(new.raw_user_meta_data->>'display_name', new.email), 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
