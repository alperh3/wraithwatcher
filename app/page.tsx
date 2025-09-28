'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { parseSightingsData, calculateStats, type Sighting } from './utils/csvParser';
import { exportToCSV, generateExportFilename } from './utils/exportUtils';
import { getAllSightings } from './utils/database';

// Dynamically import the map component to avoid SSR issues
const SightingsMap = dynamic(() => import('./components/SightingsMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
});

export default function Home() {
  const [activeTab, setActiveTab] = useState('sightings');
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [filteredSightings, setFilteredSightings] = useState<Sighting[]>([]);
  const [stats, setStats] = useState({
    totalSightings: 0,
    mostRecent: 'Loading...',
    mostGhostlyCity: 'Loading...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateRange: 'All Time',
    sightingType: 'All Types',
    location: ''
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Sighting;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadSightingsData() {
      try {
        // Try to load from database first
        const dbSightings = await getAllSightings();
        
        if (dbSightings.length > 0) {
          // Use database data
          setSightings(dbSightings);
          setFilteredSightings(dbSightings);
          setStats(calculateStats(dbSightings));
        } else {
          // Fallback to CSV data
          const response = await fetch('/data/ghost_sightings_12000_with_images.csv');
          if (!response.ok) {
            throw new Error('Failed to load sightings data');
          }
          const csvText = await response.text();
          const parsedSightings = parseSightingsData(csvText);
          setSightings(parsedSightings);
          setFilteredSightings(parsedSightings);
          setStats(calculateStats(parsedSightings));
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setLoading(false);
      }
    }

    loadSightingsData();
  }, []);

  // Filtering and search logic
  const applyFilters = () => {
    let filtered = [...sightings];

    // Date range filter
    if (filters.dateRange !== 'All Time') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'Last 30 Days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case 'Last 6 Months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
      }
      
      filtered = filtered.filter(sighting => {
        const sightingDate = new Date(sighting.date);
        return sightingDate >= cutoffDate;
      });
    }

    // Sighting type filter
    if (filters.sightingType !== 'All Types') {
      filtered = filtered.filter(sighting => 
        sighting.type === filters.sightingType
      );
    }

    // Location filter
    if (filters.location.trim()) {
      const locationQuery = filters.location.toLowerCase();
      filtered = filtered.filter(sighting =>
        sighting.location.toLowerCase().includes(locationQuery) ||
        sighting.state.toLowerCase().includes(locationQuery)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sighting =>
        sighting.notes.toLowerCase().includes(query) ||
        sighting.type.toLowerCase().includes(query) ||
        sighting.location.toLowerCase().includes(query) ||
        sighting.date.includes(query)
      );
    }

    // Sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredSightings(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Apply filters when filter values change
  useEffect(() => {
    if (sightings.length > 0) {
      applyFilters();
    }
  }, [filters, searchQuery, sortConfig, sightings]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSightings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displaySightings = filteredSightings.slice(startIndex, endIndex);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Handle sorting
  const handleSort = (key: keyof Sighting) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Get sort icon
  const getSortIcon = (key: keyof Sighting) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Handle export
  const handleExport = () => {
    const filename = generateExportFilename(filters, searchQuery, filteredSightings.length);
    exportToCSV(filteredSightings, filename);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-black text-lg">👻</span>
            </div>
            <h1 className="text-xl font-bold">WraithWatchers</h1>
          </div>
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('sightings')}
              className={`px-4 py-2 rounded ${
                activeTab === 'sightings' 
                  ? 'bg-orange-500 text-white' 
                  : 'hover:bg-gray-800'
              }`}
            >
              Sightings Map
            </button>
            <a
              href="/post"
              className={`px-4 py-2 rounded ${
                activeTab === 'post' 
                  ? 'bg-orange-500 text-white' 
                  : 'hover:bg-gray-800'
              }`}
            >
              Post a Sighting
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-300">Loading sightings data...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Sightings Stats */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Sightings Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-300">Total Sightings</h3>
                    <p className="text-2xl font-bold text-white">{stats.totalSightings.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-300">Most Recent Sighting</h3>
                    <p className="text-2xl font-bold text-white">{stats.mostRecent}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-300">Most Ghostly City</h3>
                    <p className="text-2xl font-bold text-white">{stats.mostGhostlyCity}</p>
                  </div>
                </div>
              </section>

              {/* Sightings Map */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  Sightings Map 
                  <span className="text-sm font-normal text-gray-300 ml-2">
                    ({filteredSightings.length} sightings)
                  </span>
                </h2>
                <SightingsMap sightings={filteredSightings} />
              </section>

              {/* Search Bar */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Search Sightings</h2>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <input
                    type="text"
                    placeholder="Search by notes, type, location, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
                  />
                </div>
              </section>

              {/* Filter Control Panel */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-white">Filter Control Panel</h2>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Date Range</label>
                      <select 
                        className="w-full p-2 border border-gray-600 bg-gray-800 text-white rounded"
                        value={filters.dateRange}
                        onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      >
                        <option>All Time</option>
                        <option>Last 30 Days</option>
                        <option>Last 6 Months</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Sighting Type</label>
                      <select 
                        className="w-full p-2 border border-gray-600 bg-gray-800 text-white rounded"
                        value={filters.sightingType}
                        onChange={(e) => handleFilterChange('sightingType', e.target.value)}
                      >
                        <option>All Types</option>
                        <option>Headless Spirit</option>
                        <option>Shadow Figure</option>
                        <option>Poltergeist</option>
                        <option>White Lady</option>
                        <option>Orbs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Location</label>
                      <input 
                        type="text" 
                        placeholder="Enter city or state"
                        className="w-full p-2 border border-gray-600 bg-gray-800 text-white rounded placeholder-gray-400"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600"
                        onClick={() => {
                          setFilters({
                            dateRange: 'All Time',
                            sightingType: 'All Types',
                            location: ''
                          });
                          setSearchQuery('');
                          setSortConfig(null);
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sightings Table */}
              <section className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    Sightings Table
                    <span className="text-sm font-normal text-gray-300 ml-2">
                      (Showing {startIndex + 1}-{Math.min(endIndex, filteredSightings.length)} of {filteredSightings.length})
                    </span>
                  </h2>
                </div>
                <div className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-600">
                      <tr>
                        <th 
                          className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-500 text-white"
                          onClick={() => handleSort('date')}
                        >
                          Date {getSortIcon('date')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-500 text-white"
                          onClick={() => handleSort('time')}
                        >
                          Time {getSortIcon('time')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-500 text-white"
                          onClick={() => handleSort('type')}
                        >
                          Type {getSortIcon('type')}
                        </th>
                        <th 
                          className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-gray-500 text-white"
                          onClick={() => handleSort('location')}
                        >
                          Location {getSortIcon('location')}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-white">Notes</th>
                        <th className="px-4 py-3 text-left font-medium text-white">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySightings.map((sighting, index) => (
                        <tr key={sighting.id} className={`border-t border-gray-600 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}`}>
                          <td className="px-4 py-3 text-white">{sighting.date}</td>
                          <td className="px-4 py-3 text-white">{sighting.time}</td>
                          <td className="px-4 py-3 text-white">{sighting.type}</td>
                          <td className="px-4 py-3 text-white">{sighting.location}</td>
                          <td className="px-4 py-3 max-w-xs truncate text-white">{sighting.notes}</td>
                          <td className="px-4 py-3">
                            {sighting.image ? (
                              <img 
                                src={sighting.image} 
                                alt="Sighting" 
                                className="w-16 h-12 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-12 bg-gray-600 rounded"></div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-4 space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 border border-gray-600 rounded ${
                              currentPage === pageNum 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </section>

              {/* Export Data */}
              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Export Data</h3>
                    <p className="text-sm text-gray-300 mb-4">
                      Export {filteredSightings.length} filtered sightings to CSV
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Export CSV</span>
                  </button>
                </div>
                
                {filteredSightings.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <h4 className="font-medium mb-2 text-white">Export Details:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Total records: {filteredSightings.length}</li>
                      {filters.dateRange !== 'All Time' && (
                        <li>• Date range: {filters.dateRange}</li>
                      )}
                      {filters.sightingType !== 'All Types' && (
                        <li>• Sighting type: {filters.sightingType}</li>
                      )}
                      {filters.location.trim() && (
                        <li>• Location filter: {filters.location}</li>
                      )}
                      {searchQuery.trim() && (
                        <li>• Search query: "{searchQuery}"</li>
                      )}
                      {sortConfig && (
                        <li>• Sorted by: {sortConfig.key} ({sortConfig.direction})</li>
                      )}
                    </ul>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2024 WraithWatchers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
