-- WraithWatchers Database Schema
-- Run this in your Supabase SQL editor

-- Create sightings table
CREATE TABLE IF NOT EXISTS sightings (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time VARCHAR(50) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  notes TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sightings_date ON sightings(date);
CREATE INDEX IF NOT EXISTS idx_sightings_type ON sightings(type);
CREATE INDEX IF NOT EXISTS idx_sightings_state ON sightings(state);
CREATE INDEX IF NOT EXISTS idx_sightings_location ON sightings(location);
CREATE INDEX IF NOT EXISTS idx_sightings_created_at ON sightings(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON sightings
  FOR SELECT USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Allow public insert access" ON sightings
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public update access
CREATE POLICY "Allow public update access" ON sightings
  FOR UPDATE USING (true);

-- Create policy to allow public delete access
CREATE POLICY "Allow public delete access" ON sightings
  FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sightings_updated_at
  BEFORE UPDATE ON sightings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO sightings (date, time, type, location, state, notes, lat, lng, image_url) VALUES
('2024-12-13', 'Morning', 'Headless Spirit', 'San Antonio', 'Texas', 'Electronic devices malfunctioned during sighting.', 29.420517, -98.571016, NULL),
('2025-07-25', 'Afternoon', 'Poltergeist', 'New Orleans', 'Louisiana', 'Apparition seen floating near old church grounds.', 30.192881, -89.90185, NULL),
('2021-10-19', 'Night', 'Poltergeist', 'Houston', 'Texas', 'Local dog barking frantically before sighting.', 29.627906, -95.431614, 'https://cdn.midjourney.com/7f74bbd0-d240-4d74-bb2a-6330b163a3f6/0_2.png')
ON CONFLICT DO NOTHING;
