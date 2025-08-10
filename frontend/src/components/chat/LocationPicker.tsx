"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Work as WorkIcon
} from '@mui/icons-material';

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  onClose: () => void;
}

interface LocationResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'search' | 'current' | 'recent' | 'saved';
}

export function LocationPicker({ onLocationSelect, onClose }: LocationPickerProps) {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [recentLocations] = useState<LocationResult[]>([
    {
      id: '1',
      name: 'Times Square',
      address: 'Times Square, New York, NY, USA',
      latitude: 40.7580,
      longitude: -73.9855,
      type: 'recent'
    },
    {
      id: '2',
      name: 'Central Park',
      address: 'Central Park, New York, NY, USA',
      latitude: 40.7851,
      longitude: -73.9683,
      type: 'recent'
    }
  ]);
  const [savedLocations] = useState<LocationResult[]>([
    {
      id: '3',
      name: 'Home',
      address: '123 Main St, New York, NY, USA',
      latitude: 40.7589,
      longitude: -73.9851,
      type: 'saved'
    },
    {
      id: '4',
      name: 'Work',
      address: '456 Business Ave, New York, NY, USA',
      latitude: 40.7614,
      longitude: -73.9776,
      type: 'saved'
    }
  ]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Mock map container
  const mapRef = useRef<HTMLDivElement>(null);

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(location);
        setLoadingLocation(false);
      },
      (error) => {
        let errorMessage = 'Failed to get current location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setLocationError(errorMessage);
        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };

  // Search for locations
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    
    try {
      // Mock search results - in a real app, you'd call a geocoding API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResults: LocationResult[] = [
        {
          id: 'search-1',
          name: `${query} Restaurant`,
          address: `${query} Restaurant, New York, NY, USA`,
          latitude: 40.7500 + Math.random() * 0.05,
          longitude: -73.9800 + Math.random() * 0.05,
          type: 'search'
        },
        {
          id: 'search-2',
          name: `${query} Store`,
          address: `${query} Store, New York, NY, USA`,
          latitude: 40.7600 + Math.random() * 0.05,
          longitude: -73.9700 + Math.random() * 0.05,
          type: 'search'
        },
        {
          id: 'search-3',
          name: `${query} Park`,
          address: `${query} Park, New York, NY, USA`,
          latitude: 40.7700 + Math.random() * 0.05,
          longitude: -73.9600 + Math.random() * 0.05,
          type: 'search'
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationResult) => {
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });
  };

  // Handle current location selection
  const handleCurrentLocationSelect = () => {
    if (currentLocation) {
      onLocationSelect({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: 'Current Location'
      });
    }
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  };

  // Get location icon
  const getLocationIcon = (type: LocationResult['type']) => {
    switch (type) {
      case 'current':
        return <MyLocationIcon className="text-blue-500" />;
      case 'recent':
        return <HistoryIcon className="text-gray-500" />;
      case 'saved':
        return <HomeIcon className="text-green-500" />;
      default:
        return <LocationIcon className="text-red-500" />;
    }
  };

  // Initialize current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <Box className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <DialogTitle className="flex items-center justify-between p-4 border-b">
        <Typography variant="h6">Share Location</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Map Container */}
      <Box className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        <div
          ref={mapRef}
          className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 flex items-center justify-center"
        >
          {/* Mock Map - In a real app, you'd integrate Google Maps or another map service */}
          <Box className="text-center">
            <LocationIcon className="text-red-500 text-6xl mb-2" />
            <Typography variant="caption" className="text-gray-600 dark:text-gray-300">
              Interactive Map
            </Typography>
            <Typography variant="caption" className="block text-gray-500 dark:text-gray-400">
              (Google Maps integration would go here)
            </Typography>
          </Box>
        </div>
        
        {/* Current Location Button */}
        <IconButton
          className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg"
          onClick={getCurrentLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <CircularProgress size={20} />
          ) : (
            <MyLocationIcon className="text-blue-500" />
          )}
        </IconButton>
      </Box>

      {/* Search */}
      <Box className="p-4 border-b">
        <TextField
          fullWidth
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={handleSearchChange}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
            endAdornment: searchLoading && <CircularProgress size={16} />
          }}
        />
      </Box>

      {/* Error Alert */}
      {locationError && (
        <Box className="p-4">
          <Alert severity="warning" onClose={() => setLocationError(null)}>
            {locationError}
          </Alert>
        </Box>
      )}

      {/* Location Results */}
      <DialogContent className="flex-1 p-0 overflow-y-auto">
        <List className="p-0">
          {/* Current Location */}
          {currentLocation && (
            <ListItemButton
              onClick={handleCurrentLocationSelect}
              className="px-4 py-3 border-b border-gray-100 dark:border-gray-700"
            >
              <ListItemIcon>
                <MyLocationIcon className="text-blue-500" />
              </ListItemIcon>
              <ListItemText
                primary="Current Location"
                secondary={`${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
              />
            </ListItemButton>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <>
              <Box className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                <Typography variant="subtitle2" className="text-gray-600 dark:text-gray-400">
                  Search Results
                </Typography>
              </Box>
              {searchResults.map((location) => (
                <ListItemButton
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className="px-4 py-3"
                >
                  <ListItemIcon>
                    {getLocationIcon(location.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={location.address}
                  />
                </ListItemButton>
              ))}
            </>
          )}

          {/* Saved Locations */}
          {savedLocations.length > 0 && !searchQuery && (
            <>
              <Box className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                <Typography variant="subtitle2" className="text-gray-600 dark:text-gray-400">
                  Saved Places
                </Typography>
              </Box>
              {savedLocations.map((location) => (
                <ListItemButton
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className="px-4 py-3"
                >
                  <ListItemIcon>
                    {location.name === 'Home' ? (
                      <HomeIcon className="text-green-500" />
                    ) : location.name === 'Work' ? (
                      <WorkIcon className="text-blue-500" />
                    ) : (
                      <LocationIcon className="text-red-500" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={location.address}
                  />
                </ListItemButton>
              ))}
            </>
          )}

          {/* Recent Locations */}
          {recentLocations.length > 0 && !searchQuery && (
            <>
              <Box className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                <Typography variant="subtitle2" className="text-gray-600 dark:text-gray-400">
                  Recent Locations
                </Typography>
              </Box>
              {recentLocations.map((location) => (
                <ListItemButton
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className="px-4 py-3"
                >
                  <ListItemIcon>
                    <HistoryIcon className="text-gray-500" />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={location.address}
                  />
                </ListItemButton>
              ))}
            </>
          )}
        </List>
      </DialogContent>

      {/* Footer */}
      <DialogActions className="p-4 border-t">
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleCurrentLocationSelect}
          variant="contained"
          disabled={!currentLocation}
          startIcon={<MyLocationIcon />}
        >
          Send Current Location
        </Button>
      </DialogActions>
    </Box>
  );
}
