import { type Sighting } from './csvParser';

export function exportToCSV(sightings: Sighting[], filename: string = 'wraithwatchers_sightings.csv') {
  // CSV headers
  const headers = [
    'Date of Sighting',
    'Time of Day',
    'Tag of Apparition',
    'Nearest Approximate City',
    'US State',
    'Notes about the sighting',
    'Latitude of Sighting',
    'Longitude of Sighting',
    'Image Link'
  ];

  // Convert sightings to CSV format
  const csvContent = [
    headers.join(','),
    ...sightings.map(sighting => [
      `"${sighting.date}"`,
      `"${sighting.time}"`,
      `"${sighting.type}"`,
      `"${sighting.location.split(',')[0].trim()}"`,
      `"${sighting.state}"`,
      `"${sighting.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
      sighting.lat.toString(),
      sighting.lng.toString(),
      `"${sighting.image || ''}"`
    ].join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generateExportFilename(filters: {
  dateRange: string;
  sightingType: string;
  location: string;
}, searchQuery: string, totalCount: number): string {
  const timestamp = new Date().toISOString().split('T')[0];
  let filename = `wraithwatchers_sightings_${timestamp}`;
  
  // Add filter information to filename
  const filterParts = [];
  
  if (filters.dateRange !== 'All Time') {
    filterParts.push(filters.dateRange.replace(/\s+/g, '_'));
  }
  
  if (filters.sightingType !== 'All Types') {
    filterParts.push(filters.sightingType.replace(/\s+/g, '_'));
  }
  
  if (filters.location.trim()) {
    filterParts.push(filters.location.replace(/\s+/g, '_'));
  }
  
  if (searchQuery.trim()) {
    filterParts.push('search');
  }
  
  if (filterParts.length > 0) {
    filename += `_${filterParts.join('_')}`;
  }
  
  filename += `_${totalCount}_records.csv`;
  
  return filename;
}
