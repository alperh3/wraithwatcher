import Papa from 'papaparse';

export interface Sighting {
  id: number;
  date: string;
  time: string;
  type: string;
  location: string;
  notes: string;
  image?: string;
  lat: number;
  lng: number;
  state: string;
}

export interface RawSighting {
  'Date of Sighting': string;
  'Latitude of Sighting': string;
  'Longitude of Sighting': string;
  'Nearest Approximate City': string;
  'US State': string;
  'Notes about the sighting': string;
  'Time of Day': string;
  'Tag of Apparition': string;
  'Image Link': string;
}

export function parseSightingsData(csvData: string): Sighting[] {
  const results = Papa.parse<RawSighting>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  return results.data.map((row, index) => ({
    id: index + 1,
    date: row['Date of Sighting'] || '',
    time: row['Time of Day'] || '',
    type: row['Tag of Apparition'] || '',
    location: `${row['Nearest Approximate City']}, ${row['US State']}`,
    notes: row['Notes about the sighting'] || '',
    image: row['Image Link'] || undefined,
    lat: parseFloat(row['Latitude of Sighting']) || 0,
    lng: parseFloat(row['Longitude of Sighting']) || 0,
    state: row['US State'] || '',
  })).filter(sighting => 
    sighting.lat !== 0 && 
    sighting.lng !== 0 && 
    sighting.date && 
    sighting.type
  );
}

export function calculateStats(sightings: Sighting[]) {
  const totalSightings = sightings.length;
  
  // Find most recent sighting
  const sortedByDate = sightings
    .filter(s => s.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const mostRecent = sortedByDate.length > 0 ? sortedByDate[0] : null;
  const mostRecentText = mostRecent 
    ? getTimeAgo(new Date(mostRecent.date))
    : 'No recent sightings';

  // Find most ghostly city
  const cityCounts = sightings.reduce((acc, sighting) => {
    const city = sighting.location.split(',')[0].trim();
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostGhostlyCity = Object.entries(cityCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    totalSightings,
    mostRecent: mostRecentText,
    mostGhostlyCity: mostGhostlyCity 
      ? `${mostGhostlyCity[0]}, ${sightings.find(s => s.location.startsWith(mostGhostlyCity[0]))?.state || ''}`
      : 'Unknown',
  };
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return '1 Day Ago';
  if (diffInDays < 7) return `${diffInDays} Days Ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} Weeks Ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} Months Ago`;
  return `${Math.floor(diffInDays / 365)} Years Ago`;
}
