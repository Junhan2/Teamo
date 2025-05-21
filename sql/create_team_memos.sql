-- Team memos table for post-it style collaborative notes
CREATE TABLE IF NOT EXISTS team_memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  color VARCHAR(20) DEFAULT 'yellow',
  position_x INTEGER DEFAULT 100,
  position_y INTEGER DEFAULT 100,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_team_memos_team_id ON team_memos(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memos_user_id ON team_memos(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memos_created_at ON team_memos(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE team_memos ENABLE ROW LEVEL SECURITY;

-- Create policy for team_memos
CREATE POLICY "Users can view team memos" ON team_memos
  FOR SELECT USING (
    team_id IS NULL OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert team memos" ON team_memos
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      team_id IS NULL OR
      team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own team memos" ON team_memos
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own team memos" ON team_memos
  FOR DELETE USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_memos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_team_memos_updated_at
    BEFORE UPDATE ON team_memos
    FOR EACH ROW
    EXECUTE FUNCTION update_team_memos_updated_at();