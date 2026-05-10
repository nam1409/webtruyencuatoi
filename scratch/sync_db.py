import re
import os

def simplify_supabase_sql(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return

    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Patterns to KEEP (Extensions, Functions, Tables, Constraints, Indexes, Triggers, Policies)
    # Note: Using non-greedy and specific terminators to capture multi-line blocks correctly
    
    # Captures extensions
    extensions = re.findall(r'CREATE EXTENSION IF NOT EXISTS.*?;', content, re.IGNORECASE)
    
    # Captures functions (including body between $$ or $function$)
    functions = re.findall(r'CREATE OR REPLACE FUNCTION.*?AS \$(?:function)?\$.*?\$(?:function)?\$[ \t\n]*?;', content, re.DOTALL | re.IGNORECASE)
    
    # Captures tables
    tables = re.findall(r'CREATE TABLE IF NOT EXISTS.*?\);', content, re.DOTALL | re.IGNORECASE)
    tables += re.findall(r'CREATE TABLE "public"\..*?\);', content, re.DOTALL | re.IGNORECASE)
    
    # NEW: Captures column additions (CRITICAL for incremental migrations)
    column_adds = re.findall(r'ALTER TABLE "public"\..*?ADD COLUMN.*?;', content, re.IGNORECASE)
    
    # Captures constraints (Primary keys, Foreign keys, Uniques)
    constraints = re.findall(r'ALTER TABLE.*?ADD CONSTRAINT.*?;', content, re.DOTALL | re.IGNORECASE)
    
    # Captures indexes
    indexes = re.findall(r'CREATE UNIQUE INDEX.*?;', content, re.IGNORECASE)
    indexes += re.findall(r'CREATE INDEX.*?;', content, re.IGNORECASE)
    
    # Captures triggers
    triggers = re.findall(r'CREATE OR REPLACE TRIGGER.*?;', content, re.IGNORECASE)
    triggers += re.findall(r'CREATE TRIGGER.*?;', content, re.IGNORECASE)
    
    # Captures policies
    policies = re.findall(r'CREATE POLICY.*?;', content, re.DOTALL | re.IGNORECASE)
    policies += re.findall(r'create policy.*?;', content, re.DOTALL | re.IGNORECASE)
    
    # Captures data inserts
    inserts = re.findall(r'INSERT INTO.*?;', content, re.IGNORECASE)

    # 2. Cleanup and assemble
    def clean(blocks):
        cleaned = []
        for b in blocks:
            # Remove OWNER TO and GRANT noise inside blocks
            b = re.sub(r'ALTER.*?OWNER TO.*?;', '', b, flags=re.IGNORECASE)
            b = re.sub(r'GRANT ALL ON.*?TO.*?;', '', b, flags=re.IGNORECASE)
            # Remove leading/trailing whitespace
            cleaned.append(b.strip())
        return [c for c in cleaned if c]

    final_sql = "-- ZENSTORY ELITE - FULL DATABASE INITIALIZATION (AUTO-GENERATED FROM MIGRATION)\n"
    final_sql += "-- Phiên bản đầy đủ tính năng nhất để Self-host\n\n"
    
    final_sql += "\n\n-- [1] EXTENSIONS\n" + "\n".join(clean(extensions))
    final_sql += "\n\n-- [2] FUNCTIONS\n" + "\n".join(clean(functions))
    final_sql += "\n\n-- [3] TABLES & COLUMNS\n" + "\n".join(clean(tables)) + "\n" + "\n".join(clean(column_adds))
    final_sql += "\n\n-- [4] CONSTRAINTS\n" + "\n".join(clean(constraints))
    final_sql += "\n\n-- [5] INDEXES\n" + "\n".join(clean(indexes))
    final_sql += "\n\n-- [6] TRIGGERS\n" + "\n".join(clean(triggers))
    final_sql += "\n\n-- [7] POLICIES (RLS)\n" + "\n".join(clean(policies))
    
    # Custom additions for storage
    final_sql += """

-- [8] INITIAL DATA
INSERT INTO public.site_settings (id, site_name) VALUES ('00000000-0000-0000-0000-000000000000', 'ZenStory') ON CONFLICT DO NOTHING;

-- [9] STORAGE CONFIGURATION (Custom for easy self-hosting)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('covers', 'covers', true), 
  ('avatars', 'avatars', true), 
  ('illustrations', 'illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

-- Admin upload access
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_sql)
    print(f"Successfully converted to {output_path}")

# Run the conversion
simplify_supabase_sql(
    'supabase/migrations/20260510182548_remote_schema.sql', 
    'init_database.sql'
)
