-- Create calendar_subscriptions table for managing team member calendar subscriptions
-- This allows users to subscribe to specific team members' calendars

-- Drop table if it exists
DROP TABLE IF EXISTS calendar_subscriptions;

-- Create the calendar_subscriptions table
CREATE TABLE calendar_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't subscribe to the same person multiple times
  UNIQUE(user_id, subscribed_to_user_id),
  
  -- Ensure a user can't subscribe to themselves
  CHECK (user_id != subscribed_to_user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE calendar_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own subscriptions
CREATE POLICY "Users can view their own calendar subscriptions" 
  ON calendar_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own subscriptions
CREATE POLICY "Users can create their own calendar subscriptions" 
  ON calendar_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own subscriptions
CREATE POLICY "Users can update their own calendar subscriptions" 
  ON calendar_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own subscriptions
CREATE POLICY "Users can delete their own calendar subscriptions" 
  ON calendar_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_calendar_subscriptions_user_id ON calendar_subscriptions(user_id);
CREATE INDEX idx_calendar_subscriptions_subscribed_to_user_id ON calendar_subscriptions(subscribed_to_user_id);
CREATE INDEX idx_calendar_subscriptions_created_at ON calendar_subscriptions(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_calendar_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at field
CREATE TRIGGER update_calendar_subscriptions_updated_at
  BEFORE UPDATE ON calendar_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_subscriptions_updated_at();

-- Grant necessary permissions
GRANT ALL ON calendar_subscriptions TO authenticated;
GRANT ALL ON calendar_subscriptions TO service_role;