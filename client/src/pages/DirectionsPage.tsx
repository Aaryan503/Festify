import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nodes, findShortestPath } from '../utils/navigationGraph';
import { MapPin, ArrowLeft, Footprints, Target } from 'lucide-react';

// Custom Map node marker
const createCustomIcon = (isVenue: boolean) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: ${isVenue ? '#c084fc' : '#9ca3af'}; 
    width: 14px; 
    height: 14px; 
    border-radius: 50%; 
    border: 2px solid #fff;
    box-shadow: 0 0 4px rgba(0,0,0,0.5);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Arrow marker func
const createArrowIcon = (angle: number) => L.divIcon({
  className: 'custom-arrow-icon',
  html: `<div style="
    transform: rotate(${angle}deg);
    font-size: 14px;
    color: #d946ef;
    text-shadow: 0 0 2px #fff, 0 0 2px #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 16px;
    height: 16px;
  ">▲</div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// User location marker with heading cone
const createUserIcon = (heading: number | null) => L.divIcon({
  className: 'user-location-icon',
  html: `<div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
    ${heading !== null ? `
      <div style="position: absolute; width: 0; height: 0; 
        border-left: 12px solid transparent; 
        border-right: 12px solid transparent; 
        border-bottom: 30px solid rgba(59, 130, 246, 0.4); 
        transform-origin: 50% 100%; 
        transform: translateY(-50%) rotate(${heading}deg); 
        z-index: 1;">
      </div>
    ` : ''}
    <div style="
      background-color: #3b82f6; 
      width: 16px; 
      height: 16px; 
      border-radius: 50%; 
      border: 3px solid #fff;
      box-shadow: 0 0 8px rgba(59,130,246,0.8);
      z-index: 2;
    "></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

export default function DirectionsPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  
  const [startPoint, setStartPoint] = useState<string>('');
  
  const [endPoint, setEndPoint] = useState<string>(
    Object.values(nodes).find(n => n.name.toLowerCase().includes(venueId?.toLowerCase() || '') || n.id === venueId)?.id || ''
  );

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, heading: number | null} | null>(null);
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const userAutoLocated = useRef(false);

  // Geo-location watching
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading // Available when moving on GPS
        });

        // Auto-detect closest node if we haven't yet
        if (!userAutoLocated.current && startPoint === '') {
           let closestId = '';
           let minDistance = Infinity;
           
           Object.values(nodes).forEach(node => {
               // Flat euclidean distance is fine for small areas like a campus
               const dist = Math.hypot(node.lat - pos.coords.latitude, node.lng - pos.coords.longitude);
               if (dist < minDistance) {
                   minDistance = dist;
                   closestId = node.id;
               }
           });

           if (closestId) {
               setStartPoint(closestId);
               userAutoLocated.current = true;
           }
        }
      },
      (err) => console.log("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [startPoint]);

  // Fallback Device orientation for stationary compass heading (mainly mobile)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
       const webkitHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
       if (webkitHeading != null) {
         // iOS
         setCompassHeading(webkitHeading);
       } else if (e.alpha) {
         // Android (absolute orientation needed)
         // Note: e.alpha is mathematically opposite to compass heading, but varies wildly on android implementations. 
         // For a basic fallback we invert alpha:
         setCompassHeading(360 - e.alpha);
       }
    };
    
    // Some browsers require requesting device orientation permission first
    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
       window.removeEventListener('deviceorientationabsolute', handleOrientation);
       window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const route = useMemo(() => {
    if (!startPoint || !endPoint || startPoint === endPoint) {
      console.log("No distinct start/end selected yet, or same start/end.");
      return null;
    }
    const result = findShortestPath(startPoint, endPoint);
    if (result) {
      console.log("Path successfully found:", result);
    } else {
      console.log("No valid path could be found from", startPoint, "to", endPoint);
    }
    return result;
  }, [startPoint, endPoint]);

  const polylinePositions = useMemo(() => {
    if (!route) return [];
    return route.path.map(nodeId => {
      const node = nodes[nodeId];
      return [node.lat, node.lng] as [number, number];
    });
  }, [route]);

  const arrowMarkers = useMemo(() => {
    if (polylinePositions.length < 2) return [];
    const markers = [];
    
    for (let i = 0; i < polylinePositions.length - 1; i++) {
      const start = polylinePositions[i];
      const end = polylinePositions[i + 1];
      
      const midLat = (start[0] + end[0]) / 2;
      const midLng = (start[1] + end[1]) / 2;
      
      const dy = end[0] - start[0];
      const dx = end[1] - start[1];
      
      const angle = Math.atan2(dx, dy) * 180 / Math.PI;
      
      markers.push({
        position: [midLat, midLng] as [number, number],
        angle: angle
      });
    }
    return markers;
  }, [polylinePositions]);

  const defaultCenter = [17.545, 78.571] as [number, number]; 
  const displayHeading = userLocation?.heading ?? compassHeading;

  return (
    <div className="p-5 lg:p-8">
      {/* 
        Inject a CSS block to style the standard OpenStreetMap 
        into a bright, visible Dark Mode using CSS filters 
      */}
      <style>{`
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 glass rounded-full hover:bg-dark-accent/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Campus Navigation
        </h1>
      </div>

      {/* Selectors */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 shrink-0 flex justify-center relative">
            <Footprints className="text-gray-400" size={20} />
            {userLocation && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-dark-bg animate-pulse"></span>
            )}
          </div>
          <select 
            value={startPoint} 
            onChange={(e) => setStartPoint(e.target.value)}
            className="flex-1 bg-dark-card border border-dark-accent/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-white"
          >
            <option value="" disabled>Select Starting Point</option>
            {Object.values(nodes).map(node => (
              <option key={`start-${node.id}`} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 shrink-0 flex justify-center">
            <MapPin className="text-red-400" size={20} />
          </div>
          <select 
            value={endPoint} 
            onChange={(e) => setEndPoint(e.target.value)}
            className="flex-1 bg-dark-card border border-dark-accent/20 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors text-white"
          >
            <option value="" disabled>Select Destination</option>
            {Object.values(nodes).map(node => (
              <option key={`end-${node.id}`} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Content */}
      <div className="rounded-3xl overflow-hidden glass border border-dark-accent/20 relative shadow-xl shadow-black/50 mb-6 h-[400px]">
        <MapContainer 
          center={defaultCenter}
          zoom={18}
          maxZoom={22}
          style={{ height: '100%', width: '100%', backgroundColor: '#000' }} 
        >
          {/* Use standard vivid OpenStreetMap tiles, combined with our dark-map-tiles filter CSS class. This preserves colors! */}
          <TileLayer
            className="dark-map-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxNativeZoom={19}
            maxZoom={22}
          />
          
          {Object.values(nodes).map(node => {
            const isEnroute = route?.path.includes(node.id);
            return (
              <Marker 
                 key={node.id} 
                 position={[node.lat, node.lng]}
                 icon={createCustomIcon(node.isVenue)}
              >
                {isEnroute ? (
                  <Tooltip direction="bottom" offset={[0, 10]} permanent opacity={0.85}>
                    <span className="font-bold text-gray-800 text-xs whitespace-nowrap">{node.name}</span>
                  </Tooltip>
                ) : (
                  <Popup>{node.name}</Popup>
                )}
              </Marker>
            );
          })}

          {polylinePositions.length > 0 && (
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ color: '#d946ef', weight: 6, opacity: 0.8 }} 
            />
          )}

          {arrowMarkers.map((arrow, idx) => (
             <Marker 
               key={`arrow-${idx}`}
               position={arrow.position}
               icon={createArrowIcon(arrow.angle)}
               interactive={false} 
             />
          ))}

          {/* User Live Location Marker with Direction Cone */}
          {userLocation && (
             <Marker 
               position={[userLocation.lat, userLocation.lng]}
               icon={createUserIcon(displayHeading)}
               interactive={false}
             />
          )}

           <MapEffect polylinePositions={polylinePositions} userLocation={userLocation} />
        </MapContainer>
        
        {!startPoint && !userLocation && (
           <div className="absolute inset-0 bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-sm pointer-events-none">
             <div className="text-center p-6 glass rounded-2xl mx-4 border border-dark-accent/30 shadow-2xl pointer-events-auto">
                <Target className="mx-auto mb-4 text-blue-400 animate-pulse" size={32} />
                <h3 className="text-xl font-bold mb-2 text-white">Locating You...</h3>
                <p className="text-gray-300 text-sm">Please allow location permissions, or select a starting point manually.</p>
             </div>
           </div>
        )}
      </div>

      {/* Text Directions */}
      <div className="glass rounded-3xl p-6 border border-dark-accent/20 mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
          <Footprints size={18} className="text-purple-400" />
          Step-by-Step Directions
        </h3>
        {!route ? (
          <p className="text-dark-muted text-sm italic py-4">
            {startPoint && endPoint && startPoint === endPoint 
              ? "You are already at your destination!" 
              : "Select a start and destination to get directions."}
          </p>
        ) : (
          <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-dark-accent/30">
            {route.instructions.map((instruction, idx) => (
              <div key={idx} className="flex gap-4 relative items-start">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10 text-white">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-200 bg-dark-accent/10 px-4 py-3 rounded-xl flex-1 leading-relaxed border border-dark-accent/10 text-white">
                  {instruction}
                </p>
              </div>
            ))}
            <div className="flex gap-4 relative items-center pt-2">
                 <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                  <MapPin size={14} className="text-white" />
                </div>
                <p className="text-sm font-bold text-green-400">
                  Arrive at {nodes[endPoint]?.name}
                </p>
            </div>
            <div className="pt-4 text-xs text-dark-muted font-mono flex gap-4 ml-2">
               <p>Total Estimated Distance Unit: {route.totalDistance.toFixed(0)}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

type UserLocationSnapshot = { lat: number; lng: number; heading: number | null };

function MapEffect({ polylinePositions, userLocation }: { polylinePositions: [number, number][], userLocation: UserLocationSnapshot | null }) {
  const map = useMap();
  useEffect(() => {
    if (polylinePositions.length > 0) {
      setTimeout(() => {
         const bounds = L.latLngBounds(polylinePositions);
         map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }, 100);
    } else if (userLocation) {
      setTimeout(() => {
         map.flyTo([userLocation.lat, userLocation.lng], 18, { duration: 1.5 });
      }, 100);
    }
  }, [map, polylinePositions, userLocation]);
  return null;
}
