const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure .env.local contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CSV data
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].replace(/^"|"$/g, '');
      });
      data.push(row);
    }
  }

  return data;
}

// Convert CSV row to database format
function csvToDbFormat(row) {
  return {
    date: row['Date of Sighting'],
    time: row['Time of Day'],
    type: row['Tag of Apparition'],
    location: row['Nearest Approximate City'],
    state: row['US State'],
    notes: row['Notes about the sighting'],
    lat: parseFloat(row['Latitude of Sighting']),
    lng: parseFloat(row['Longitude of Sighting']),
    image_url: row['Image Link'] || null
  };
}

async function uploadCSV() {
  try {
    console.log('🚀 Starting CSV upload to Supabase...');
    
    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'public', 'data', 'ghost_sightings_12000_with_images.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found at:', csvPath);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf8');
    const csvData = parseCSV(csvText);
    
    console.log(`📊 Found ${csvData.length} records in CSV`);

    // Clear existing data
    console.log('🗑️  Clearing existing sightings...');
    const { error: deleteError } = await supabase
      .from('sightings')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('❌ Error clearing existing data:', deleteError);
      process.exit(1);
    }

    // Upload in batches
    const batchSize = 100;
    let uploaded = 0;
    let errors = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      const dbBatch = batch.map(csvToDbFormat).filter(row => 
        row.lat && row.lng && row.date && row.type
      );

      console.log(`📤 Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(csvData.length / batchSize)} (${dbBatch.length} records)...`);

      const { error } = await supabase
        .from('sightings')
        .insert(dbBatch);

      if (error) {
        console.error('❌ Error uploading batch:', error);
        errors += dbBatch.length;
      } else {
        uploaded += dbBatch.length;
      }
    }

    console.log('\n✅ Upload complete!');
    console.log(`📊 Successfully uploaded: ${uploaded} records`);
    console.log(`❌ Errors: ${errors} records`);
    
    // Verify upload
    const { count, error: countError } = await supabase
      .from('sightings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error verifying upload:', countError);
    } else {
      console.log(`🔍 Total records in database: ${count}`);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

// Run the upload
uploadCSV();
