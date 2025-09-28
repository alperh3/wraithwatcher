import { supabase, type DatabaseSighting } from '../lib/supabase';
import { type Sighting } from './csvParser';

// Convert database sighting to app sighting format
export function dbSightingToAppSighting(dbSighting: DatabaseSighting): Sighting {
  return {
    id: dbSighting.id || 0,
    date: dbSighting.date,
    time: dbSighting.time,
    type: dbSighting.type,
    location: `${dbSighting.location}, ${dbSighting.state}`,
    notes: dbSighting.notes,
    image: dbSighting.image_url,
    lat: dbSighting.lat,
    lng: dbSighting.lng,
    state: dbSighting.state,
  };
}

// Convert app sighting to database format
export function appSightingToDbSighting(sighting: Partial<Sighting>): Partial<DatabaseSighting> {
  const locationParts = sighting.location?.split(', ') || ['', ''];
  return {
    date: sighting.date,
    time: sighting.time,
    type: sighting.type,
    location: locationParts[0] || '',
    state: locationParts[1] || sighting.state || '',
    notes: sighting.notes,
    lat: sighting.lat,
    lng: sighting.lng,
    image_url: sighting.image,
  };
}

// Database operations
export async function getAllSightings(): Promise<Sighting[]> {
  if (!supabase) {
    console.log('Supabase not configured, returning empty array');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sightings:', error);
      return [];
    }

    return data?.map(dbSightingToAppSighting) || [];
  } catch (error) {
    console.error('Error fetching sightings:', error);
    return [];
  }
}

export async function createSighting(sighting: Partial<Sighting>): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const dbSighting = appSightingToDbSighting(sighting);
    
    const { error } = await supabase
      .from('sightings')
      .insert([dbSighting]);

    if (error) {
      console.error('Error creating sighting:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating sighting:', error);
    return { success: false, error: 'Failed to create sighting' };
  }
}

export async function uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `sightings/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sighting-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data } = supabase.storage
      .from('sighting-images')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}
