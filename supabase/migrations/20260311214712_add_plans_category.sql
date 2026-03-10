-- Create plans_category table
CREATE TABLE plans_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to plans table
ALTER TABLE plans ADD COLUMN category_id UUID REFERENCES plans_category(id) ON DELETE SET NULL;

-- Enable RLS for plans_category
ALTER TABLE plans_category ENABLE ROW LEVEL SECURITY;

-- Set RLS policies for plans_category
CREATE POLICY "Users can view their own plan categories" ON plans_category 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan categories" ON plans_category 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan categories" ON plans_category 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan categories" ON plans_category 
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for plans_category
CREATE INDEX idx_plans_category_user_id ON plans_category(user_id);
CREATE INDEX idx_plans_category_id ON plans(category_id);
