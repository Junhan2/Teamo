-- Simple team memos table creation (execute this in Supabase SQL Editor)

CREATE TABLE team_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT 'yellow',
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE team_memos ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view, insert, update their own memos
CREATE POLICY "team_memos_select" ON team_memos FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_memos_insert" ON team_memos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_memos_update" ON team_memos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "team_memos_delete" ON team_memos FOR DELETE TO authenticated USING (auth.uid() = user_id);