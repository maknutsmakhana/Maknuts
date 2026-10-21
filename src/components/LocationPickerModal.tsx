import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Search, Check, AlertCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Link as LinkIcon, Compass, Sparkles } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useStore } from '../context/StoreContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (data: {
    googleMapsUrl: string;
    lat: number;
    lng: number;
    address?: string;
    pincode?: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

const INDIAN_CITIES = [
  { name: 'Patna', lat: 25.5941, lng: 85.1376 },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];

// Inner component for Google Maps Platform rendering
const GoogleMapsRenderer: React.FC<{
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}> = ({ lat, lng, onLocationChange }) => {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '280px', height: '100%' }}>
      <Map
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        center={{ lat, lng }}
        defaultCenter={{ lat, lng }}
        zoom={16}
        defaultZoom={16}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={(e) => {
          if (e.detail?.latLng) {
            onLocationChange(
              Number(e.detail.latLng.lat.toFixed(6)),
              Number(e.detail.latLng.lng.toFixed(6))
            );
          }
        }}
        style={{ width: '100%', height: '100%', minHeight: '280px' }}
      >
        <AdvancedMarker
          position={{ lat, lng }}
          draggable={true}
          onDragEnd={(e) => {
            if (e.latLng) {
              onLocationChange(
                Number(e.latLng.lat().toFixed(6)),
                Number(e.latLng.lng().toFixed(6))
              );
            }
          }}
        >
          <Pin
            background="#064e3b"
            glyphColor="#f59e0b"
            borderColor="#ffffff"
            scale={1.2}
          />
        </AdvancedMarker>
      </Map>
    </div>
  );
};

// Fallback interactive Leaflet map when no API key is provided
const LeafletFallbackMap: React.FC<{
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}> = ({ lat, lng, onLocationChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const customPinIcon = L.divIcon({
      className: 'maknuts-pin-icon',
      html: `
        <div style="transform: translate(-50%, -100%); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); cursor: pointer;">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="#064e3b" stroke="#ffffff" stroke-width="1.8">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#f59e0b"/>
          </svg>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
    });

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: customPinIcon,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onLocationChange(
        Number(pos.lat.toFixed(6)),
        Number(pos.lng.toFixed(6))
      );
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onLocationChange(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map view and marker when lat/lng change from external events
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom(), { animate: true });
      }
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-full min-h-[280px]" />;
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLat = 25.5941,
  initialLng = 85.1376,
}) => {
  const { storeSettings } = useStore();
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [pastedUrlInput, setPastedUrlInput] = useState('');
  const [detectedAddress, setDetectedAddress] = useState('');
  const [detectedPincode, setDetectedPincode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showGpsHelper, setShowGpsHelper] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');

  // Google Maps API Key from env or store settings
  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    storeSettings.googleMapsApiKey ||
    '';

  useEffect(() => {
    if (isOpen) {
      if (initialLat && initialLng) {
        setLat(initialLat);
        setLng(initialLng);
      }
      reverseGeocode(initialLat || lat, initialLng || lng);
      setShowGpsHelper(false);
      setStatusMessage('');
    }
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.display_name) {
          setDetectedAddress(data.display_name);
          if (data.address?.postcode) {
            const cleanPin = data.address.postcode.replace(/\D/g, '').slice(0, 6);
            if (cleanPin.length === 6) {
              setDetectedPincode(cleanPin);
            }
          }
        }
      }
    } catch {
      setDetectedAddress(`Delivery Pin at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    }
  };

  const handleLocationUpdate = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    reverseGeocode(newLat, newLng);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setStatusMessage('Searching area & landmarks...');
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (resp.ok) {
        const results = await resp.json();
        if (results && results.length > 0) {
          const first = results[0];
          const newLat = parseFloat(first.lat);
          const newLng = parseFloat(first.lon);
          handleLocationUpdate(newLat, newLng);
          setDetectedAddress(first.display_name);
          if (first.address?.postcode) {
            const cleanPin = first.address.postcode.replace(/\D/g, '').slice(0, 6);
            if (cleanPin.length === 6) setDetectedPincode(cleanPin);
          }
          setStatusMessage('Location found! Delivery pin placed.');
          setShowGpsHelper(false);
        } else {
          setStatusMessage('Area not found. Try entering city, colony, or landmark.');
        }
      }
    } catch {
      setStatusMessage('Search timed out. Please try another landmark or city.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser.');
      setShowGpsHelper(true);
      return;
    }
    setIsLocating(true);
    setStatusMessage('Connecting to device GPS...');
    setShowGpsHelper(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        handleLocationUpdate(newLat, newLng);
        setStatusMessage('GPS location detected successfully!');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setStatusMessage('Browser location permission was denied.');
          setShowGpsHelper(true);
        } else if (err.code === 2) {
          setStatusMessage('GPS position unavailable. Choose your city or search your colony below.');
          setShowGpsHelper(true);
        } else {
          setStatusMessage('GPS timed out. Choose your city or search your colony below.');
          setShowGpsHelper(true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const nudge = (dLat: number, dLng: number) => {
    const nextLat = Number((lat + dLat).toFixed(6));
    const nextLng = Number((lng + dLng).toFixed(6));
    handleLocationUpdate(nextLat, nextLng);
  };

  const handleParsePastedUrl = (url: string) => {
    setPastedUrlInput(url);
    if (!url.trim()) return;

    // Pattern 1: coordinates like "25.5941, 85.1376"
    const coordMatch = url.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      const pLat = parseFloat(coordMatch[1]);
      const pLng = parseFloat(coordMatch[2]);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        handleLocationUpdate(pLat, pLng);
        setStatusMessage('Coordinates extracted from link!');
        return;
      }
    }

    // Pattern 2: google maps ?q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const pLat = parseFloat(qMatch[1]);
      const pLng = parseFloat(qMatch[2]);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        handleLocationUpdate(pLat, pLng);
        setStatusMessage('Location extracted from Google Maps link!');
        return;
      }
    }

    // Pattern 3: @lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const pLat = parseFloat(atMatch[1]);
      const pLng = parseFloat(atMatch[2]);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        handleLocationUpdate(pLat, pLng);
        setStatusMessage('Location extracted from Google Maps link!');
        return;
      }
    }

    setStatusMessage('Link recognized. Tap Confirm to attach to your order.');
  };

  const handleConfirm = () => {
    const finalUrl = pastedUrlInput.trim().startsWith('http')
      ? pastedUrlInput.trim()
      : `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    onSelectLocation({
      googleMapsUrl: finalUrl,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      address: detectedAddress,
      pincode: detectedPincode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <MapPin className="w-5 h-5 text-amber-300 shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Select on Google Map</h3>
              <p className="text-[11px] text-emerald-200">
                Move pin to your delivery doorstep, then tap Select this location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-emerald-800 text-emerald-200 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Search & GPS vs Paste Google Maps Link */}
        <div className="flex border-b border-stone-200 bg-stone-100 text-xs font-bold text-stone-600">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'search' ? 'bg-white text-emerald-900 border-b-2 border-emerald-800 shadow-2xs' : 'hover:bg-stone-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Search & GPS Pin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'paste' ? 'bg-white text-emerald-900 border-b-2 border-emerald-800 shadow-2xs' : 'hover:bg-stone-50'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>Paste Google Maps Link</span>
          </button>
        </div>

        {/* Search & GPS Tab */}
        {activeTab === 'search' && (
          <div className="p-3 bg-stone-50 border-b border-stone-200 space-y-2">
            <form onSubmit={handleSearch} className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search colony, street, area, landmark, pincode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isLocating}
                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200/80 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
              >
                {isLocating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>

              <span className="font-mono text-[10px] text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded-md">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>

            {/* Browser GPS Denied Helper Banner */}
            {showGpsHelper && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[11px] block">Location permission not available in browser</span>
                    <p className="text-[11px] text-amber-900 leading-tight">
                      Pick your city below or search your colony/street above to place your delivery pin.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {INDIAN_CITIES.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        handleLocationUpdate(c.lat, c.lng);
                        setShowGpsHelper(false);
                        setStatusMessage(`Centered on ${c.name}`);
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[10px] font-semibold text-stone-800 cursor-pointer shadow-2xs transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paste Link Tab */}
        {activeTab === 'paste' && (
          <div className="p-3 bg-stone-50 border-b border-stone-200 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/...)"
                value={pastedUrlInput}
                onChange={e => handleParsePastedUrl(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 font-mono"
              />
              <LinkIcon className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
            <p className="text-[11px] text-stone-500">
              Open Google Maps on your phone or browser, tap <strong>Share → Copy Link</strong>, and paste it here. We will automatically parse the doorstep coordinates!
            </p>
          </div>
        )}

        {statusMessage && (
          <div className="px-3 py-1.5 bg-emerald-50 text-[11px] text-emerald-900 border-b border-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Map Canvas: Google Maps Platform or Leaflet Fallback */}
        <div className="relative flex-1 min-h-[280px] bg-stone-100 overflow-hidden">
          {googleMapsApiKey ? (
            <APIProvider apiKey={googleMapsApiKey}>
              <GoogleMapsRenderer
                lat={lat}
                lng={lng}
                onLocationChange={handleLocationUpdate}
              />
            </APIProvider>
          ) : (
            <LeafletFallbackMap
              lat={lat}
              lng={lng}
              onLocationChange={handleLocationUpdate}
            />
          )}

          {/* Doorstep Badge */}
          <div className="absolute top-2 right-2 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200 text-[10px] font-bold text-stone-800 shadow-sm flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-700" />
            <span>Delivery Doorstep Pin</span>
          </div>

          {/* Directional Nudge Controller */}
          <div className="absolute bottom-2 right-2 z-20 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-stone-200 shadow-md flex items-center gap-0.5">
            <span className="text-[9px] font-bold text-stone-400 px-1">Nudge:</span>
            <button
              type="button"
              onClick={() => nudge(0.0003, 0)}
              className="p-1 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
              title="Move Pin North"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => nudge(-0.0003, 0)}
              className="p-1 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
              title="Move Pin South"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => nudge(0, -0.0003)}
              className="p-1 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
              title="Move Pin West"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => nudge(0, 0.0003)}
              className="p-1 hover:bg-stone-100 rounded text-stone-700 cursor-pointer"
              title="Move Pin East"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Footer with detected address and confirm button */}
        <div className="p-4 bg-white border-t border-stone-200 space-y-3">
          <div className="text-xs space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Selected Address Location:</span>
            <p className="font-semibold text-stone-900 text-xs line-clamp-2">
              {detectedAddress || 'Tap on map or search to place delivery pin...'}
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-full">
                https://www.google.com/maps?q={lat.toFixed(5)},{lng.toFixed(5)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>Select this location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
