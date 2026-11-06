import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, Search, Loader2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { DEFAULT_COORDINATES } from '../../utils/constants';
import { geoApi } from '../../api/geoApi';

// Custom SVG Markers
const createDivIcon = (color = '#2E7D32', label = '', isHovered = false) => {
  const scale = isHovered ? 'scale(1.25)' : 'scale(1)';
  const border = isHovered ? '3px solid #FFD54F' : '3px solid white';
  const shadow = isHovered
    ? '0 10px 15px -3px rgba(0,0,0,0.4), 0 0 12px rgba(232, 159, 24, 0.8)'
    : '0 4px 6px -1px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; transform: translate(-50%, -100%) ${scale}; transition: transform 0.2s ease; display: flex; flex-direction: column; align-items: center; z-index: ${isHovered ? 999 : 100};">
        <div style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); white-space: nowrap; margin-bottom: 2px;">
          ${label || 'Pin'}
        </div>
        <div style="width: 24px; height: 24px; background-color: ${color}; border: ${border}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: ${shadow};"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [0, 0]
  });
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom(), { animate: true });
    }
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
};

const LocationPickerEvents = ({ onLocationChange }) => {
  useMapEvents({
    click(e) {
      if (onLocationChange) {
        onLocationChange([e.latlng.lng, e.latlng.lat], 'pin');
      }
    }
  });
  return null;
};

export const MapPicker = ({
  initialCoordinates = DEFAULT_COORDINATES, // [lng, lat]
  onCoordinatesChange,
  onAddressSelected,
  chefs = [],
  hoveredChefId = null,
  onChefSelect,
  readOnly = false,
  showRadius = true,
  showSearch = true,
  height = '350px'
}) => {
  // Coordinates are [lng, lat]
  const [coords, setCoords] = useState(initialCoordinates || DEFAULT_COORDINATES);
  const [isLocating, setIsLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialCoordinates && initialCoordinates.length === 2) {
      setCoords(initialCoordinates);
    }
  }, [initialCoordinates]);

  const handleManualMove = (newCoords, source = 'pin') => {
    setCoords(newCoords);
    if (onCoordinatesChange) {
      onCoordinatesChange(newCoords, source);
    }
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newCoords = [pos.coords.longitude, pos.coords.latitude];
        handleManualMove(newCoords, 'gps');
      },
      (err) => {
        setIsLocating(false);
        alert(err.message || 'Unable to fetch current GPS location. Please select on map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await geoApi.searchPlaces(val.trim());
        const places = res.data?.results || res.results || [];
        setSearchResults(places);
        setShowDropdown(places.length > 0);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectPlace = (place) => {
    const newCoords = [place.lng, place.lat];
    handleManualMove(newCoords, 'search');
    if (onAddressSelected) {
      onAddressSelected(place.displayName);
    }
    setSearchQuery(place.displayName.split(',')[0]);
    setShowDropdown(false);
  };

  const centerLat = coords[1] || DEFAULT_COORDINATES[1];
  const centerLng = coords[0] || DEFAULT_COORDINATES[0];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-cream-300 shadow-sm bg-cream-50">
      {/* Top Search bar */}
      {showSearch && !readOnly && (
        <div className="p-2.5 bg-white border-b border-cream-200 relative z-20 flex items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search address, neighborhood or landmark..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-cream-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-cream-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown suggestions */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-cream-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-cream-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPlace(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-cream-100 flex items-start gap-2 transition"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="truncate text-neutral-800 font-medium">
                      {item.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseGPS}
            loading={isLocating}
            icon={Crosshair}
            className="text-xs shrink-0 py-1.5 px-3 bg-white"
          >
            My GPS
          </Button>
        </div>
      )}

      {/* Map display */}
      <div style={{ height, width: '100%', position: 'relative', zIndex: 10 }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={[centerLat, centerLng]} />

          {!readOnly && <LocationPickerEvents onLocationChange={handleManualMove} />}

          {/* User Location Marker */}
          <Marker
            position={[centerLat, centerLng]}
            draggable={!readOnly}
            icon={createDivIcon('#2E7D32', 'Selected Location')}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                handleManualMove([position.lng, position.lat], 'pin');
              }
            }}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-neutral-800">Your Location</p>
                <p className="text-neutral-500 text-[10px]">
                  Drag pin or click map to reposition
                </p>
              </div>
            </Popup>
          </Marker>

          {/* 1000m (1 km) Hyperlocal pickup boundary */}
          {showRadius && (
            <Circle
              center={[centerLat, centerLng]}
              radius={1000}
              pathOptions={{
                color: '#2E7D32',
                fillColor: '#2E7D32',
                fillOpacity: 0.08,
                dashArray: '6, 6'
              }}
            />
          )}

          {/* Nearby Chef Markers */}
          {chefs.map((chef) => {
            const chefCoords = chef.location?.coordinates;
            if (!chefCoords || chefCoords.length !== 2) return null;
            const isHovered = hoveredChefId === chef._id;
            return (
              <Marker
                key={chef._id}
                position={[chefCoords[1], chefCoords[0]]}
                icon={createDivIcon(
                  isHovered ? '#D84315' : '#E89F18',
                  chef.chefProfile?.kitchenName || chef.name,
                  isHovered
                )}
                eventHandlers={{
                  click: () => onChefSelect?.(chef)
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans">
                    <p className="font-bold text-neutral-900">
                      {chef.chefProfile?.kitchenName || chef.name}
                    </p>
                    <p className="text-neutral-600 mt-0.5">
                      ⭐ {chef.ratingAverage || '5.0'} •{' '}
                      {chef.distanceInMeters ? `${chef.distanceInMeters} m` : 'Within 1 km'}
                    </p>
                    <p className="text-neutral-500 text-[10px] mt-1">{chef.address}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Footer bar */}
      {!readOnly && (
        <div className="bg-cream-100 px-3 py-2 border-t border-cream-200 text-xs text-neutral-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="text-[11px]">3 ways to choose: My GPS, Search address, or Drag the pin</span>
          </span>
          <span className="font-mono text-[11px] text-neutral-500 shrink-0">
            {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
