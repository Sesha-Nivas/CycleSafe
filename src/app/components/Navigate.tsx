/// <reference types="vite/client" />

import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Clock, TrendingUp, Play, Square
} from 'lucide-react';

import {
  calculateCalories, calculateElevation,
  getSafetyRating
} from '../../utils/rideTracking';
import { db as localDb } from "../../utils/database";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// Fix default marker icons by setting proper paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// 🎯 Current Location Marker
const currentLocationIcon = L.divIcon({
  html: `<span style="font-size: 32px; line-height: 1; display: block;">🚴</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
  className: 'leaf-marker',
});

// 🔴 Destination Marker
const destinationIcon = L.divIcon({
  html: `<span style="font-size: 36px; line-height: 1; display: block;">📍</span>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
  className: 'leaf-marker',
});


// 🔁 Auto recenter map
function RecenterMap({ location }: { location: any }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.lat, location.lng], 15);
    }
  }, [location]);

  return null;
}


// 🧭 Routing with real data
function Routing({ start, end, setRouteDetails, setIsLoadingRoute }: { start: any; end: any; setRouteDetails: any; setIsLoadingRoute: any }) {
  const map = useMap();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    if (!start || !end || !map) return;

    try {
      // Remove existing routing control
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (e) {
          console.error("Error removing routing control:", e);
        }
        routingRef.current = null;
      }

      console.log("Starting route calculation...");

      const routing = (L as any).Routing.control({
        waypoints: [
          L.latLng(start.lat, start.lng),
          L.latLng(end.lat, end.lng),
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        lineOptions: {
          styles: [{ color: '#ef4444', opacity: 0.8, weight: 5 }],
        },
        show: true,
        createMarker: function(i: number, wp: any) {
          const marker = L.marker(wp.latLng, {
            draggable: false,
            icon: L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          });
          return marker;
        }
      }).addTo(map);

      routingRef.current = routing;

      routing.on("routesfound", (e: any) => {
        if (e.routes && e.routes.length > 0) {
          const route = e.routes[0];
          const distance = route.summary.totalDistance / 1000;
          const time = route.summary.totalTime / 60;

          console.log("Route found:", { distance, time });

          setRouteDetails({
            estimatedTime: Math.round(time),
            totalDistance: Number(distance.toFixed(2)),
            elevation: calculateElevation(distance),
            safetyRating: getSafetyRating(2, "Low"),
            bikeLanes: 2,
            traffic: "Low",
          });
          setIsLoadingRoute(false);

          // Auto fit bounds
          try {
            if (map && e.routes[0] && routing.getBounds) {
              map.fitBounds(routing.getBounds());
            }
          } catch (e) {
            console.log("Error fitting bounds:", e);
          }
        }
      });

      routing.on("routeserror", (err: any) => {
        console.error("Routing error:", err);
        setIsLoadingRoute(false);
      });
    } catch (error) {
      console.error("Routing control error:", error);
      setIsLoadingRoute(false);
    }

    return () => {
      if (routingRef.current && map) {
        try {
          map.removeControl(routingRef.current);
          routingRef.current = null;
        } catch (e) {
          console.log("Error removing routing control on cleanup:", e);
        }
      }
    };
  }, [start, end, map, setRouteDetails, setIsLoadingRoute]);

  return null;
}


export default function Navigate() {
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [isRiding, setIsRiding] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  const [rideStats, setRideStats] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    calories: 0,
  });

  const rideStartTime = useRef(0);
  const rideInterval = useRef<any>(null);
  const routeTimeout = useRef<any>(null);
  const geoWatchId = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up intervals
      if (rideInterval.current) clearInterval(rideInterval.current);
      if (routeTimeout.current) clearTimeout(routeTimeout.current);
      // Clean up geolocation
      if (geoWatchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
    };
  }, []);


  // 📍 Live location tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    geoWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => {
      if (geoWatchId.current !== null) {
        navigator.geolocation.clearWatch(geoWatchId.current);
        geoWatchId.current = null;
      }
    };
  }, []);


  // 🔍 Search location
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a destination");
      return;
    }

    try {
      setIsLoadingRoute(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`
      );
      const data = await res.json();

      if (data.length > 0) {
        setDestination({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name,
        });
        setRouteDetails(null); // Reset route details on new search

        // Clear any previous timeout
        if (routeTimeout.current) clearTimeout(routeTimeout.current);

        // Set timeout - if route doesn't calculate within 5 seconds, use default
        routeTimeout.current = setTimeout(() => {
          console.log("Route calculation timeout - using default");
          if (currentLocation && !routeDetails) {
            const lat1 = currentLocation.lat;
            const lon1 = currentLocation.lng;
            const lat2 = parseFloat(data[0].lat);
            const lon2 = parseFloat(data[0].lon);

            // Simple distance calculation (Haversine formula)
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            setRouteDetails({
              estimatedTime: Math.max(5, Math.round(distance * 3)), // ~3 min per km
              totalDistance: Number(distance.toFixed(2)),
              elevation: calculateElevation(distance),
              safetyRating: getSafetyRating(2, "Low"),
              bikeLanes: 2,
              traffic: "Low",
            });
            setIsLoadingRoute(false);
          }
        }, 5000);
      } else {
        alert("Location not found. Please try another search.");
        setIsLoadingRoute(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching location. Please try again.");
      setIsLoadingRoute(false);
    }
  };


  // ▶️ Start ride
  const startRide = () => {
    if (!destination || !currentLocation || !routeDetails) {
      alert("Please select a destination first and ensure route is loaded");
      return;
    }

    setIsRiding(true);
    rideStartTime.current = Date.now();
    setRideStats({ distance: 0, duration: 0, avgSpeed: 0, calories: 0 });

    rideInterval.current = setInterval(() => {
      const elapsed = (Date.now() - rideStartTime.current) / 1000;
      const progress = Math.min(elapsed / (routeDetails.estimatedTime * 60), 1);
      const distance = routeDetails.totalDistance * progress;
      const avgSpeed = elapsed > 0 ? distance / (elapsed / 3600) : 0;
      const currentSpeed = Math.max(0, avgSpeed + (Math.random() * 4 - 2));

      setRideStats({
        distance: Number(distance.toFixed(2)),
        duration: Math.floor(elapsed),
        avgSpeed: Number(avgSpeed.toFixed(1)),
        calories: calculateCalories(distance, avgSpeed),
      });

      // Stop ride when route is complete
      if (progress >= 1) {
        stopRide();
      }
    }, 1000);
  };


  // ⏹ Stop ride
  const stopRide = async () => {
    try {
      if (rideInterval.current) clearInterval(rideInterval.current);
      setIsRiding(false);

      const user = localDb.getCurrentUser();

      if (!user) return alert("Login required");

      // Save ride to local database
      localDb.addRide({
        userId: user.id,
        distance: rideStats.distance,
        duration: rideStats.duration,
        avgSpeed: rideStats.avgSpeed,
        calories: rideStats.calories,
        safetyScore: 85, // Default safety score
        route: {
          start: { lat: currentLocation?.lat || 0, lng: currentLocation?.lng || 0, address: 'Start' },
          end: { lat: destination?.lat || 0, lng: destination?.lng || 0, address: destination?.name || 'Destination' },
          estimatedTime: routeDetails?.estimatedTime || 0,
          elevation: routeDetails?.elevation || 0,
          safetyRating: routeDetails?.safetyRating || 'Safe',
          totalDistance: routeDetails?.totalDistance || 0,
        },
      });

      alert("Ride saved!");
      // Reset state
      setDestination(null);
      setRouteDetails(null);
      setSearchQuery('');
    } catch (error) {
      console.error("Error saving ride:", error);
      alert("Error saving ride. Please try again.");
    }
  };


  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;


  return (
    <div className="bg-gray-50 h-screen flex flex-col overflow-hidden">
      <style>{`
        .leaf-marker {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          filter: none !important;
        }
      `}</style>

      {/* Header & Search */}
      <div className="p-4 bg-white border-b shadow-sm flex-shrink-0">
        <h2 className="text-2xl font-bold mb-3">Navigate</h2>

        {/* 🔍 SEARCH */}
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination"
            className="border p-2 flex-1 rounded"
          />
          <button onClick={handleSearch} className="bg-green-500 text-white px-6 rounded font-bold hover:bg-green-600">
            Search
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* 🗺️ MAP */}
        <div className="p-4">
          <div style={{ height: "350px" }}>
            <MapContainer
              key="navigation-map"
              center={currentLocation ? [currentLocation.lat, currentLocation.lng] : [13.0827, 80.2707]}
              zoom={13}
              style={{ height: "100%", borderRadius: "8px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {currentLocation && (
                <>
                  <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon}>
                    <Popup>🚴 Your Location</Popup>
                  </Marker>

                  <RecenterMap location={currentLocation} />
                </>
              )}

              {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
                  <Popup>📍 Destination: {destination.name}</Popup>
                </Marker>
              )}

              {destination && currentLocation && (
                <Routing
                  start={currentLocation}
                  end={destination}
                  setRouteDetails={setRouteDetails}
                  setIsLoadingRoute={setIsLoadingRoute}
                />
              )}
            </MapContainer>
          </div>
        </div>

        {/* 📊 ROUTE DETAILS - Shows before ride */}
        {routeDetails && !isRiding && (
          <div className="mx-4 mb-4 bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="font-bold mb-3 text-lg">📍 Route Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📏</span>
                <div>
                  <p className="text-xs text-gray-600">Distance</p>
                  <p className="font-bold text-lg">{routeDetails.totalDistance} km</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱</span>
                <div>
                  <p className="text-xs text-gray-600">Time</p>
                  <p className="font-bold text-lg">{routeDetails.estimatedTime} min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⛰</span>
                <div>
                  <p className="text-xs text-gray-600">Elevation</p>
                  <p className="font-bold text-lg">{routeDetails.elevation} m</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡</span>
                <div>
                  <p className="text-xs text-gray-600">Safety</p>
                  <p className="font-bold text-lg">{routeDetails.safetyRating}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚴 LIVE RIDE DATA - Shows during ride */}
        {isRiding && (
          <div className="mx-4 mb-4 bg-white p-4 rounded-lg shadow-md border-2 border-green-500">
            <h3 className="font-bold mb-3 text-lg text-green-600">🚴 Live Tracking</h3>
            <div className="space-y-2">
              <p className="flex justify-between"><span>⏱ Duration:</span> <span className="font-bold">{formatTime(rideStats.duration)}</span></p>
              <p className="flex justify-between"><span>📏 Distance:</span> <span className="font-bold">{rideStats.distance} / {routeDetails?.totalDistance} km</span></p>
              <p className="flex justify-between"><span>💨 Speed:</span> <span className="font-bold">{rideStats.avgSpeed} km/h</span></p>
              <p className="flex justify-between"><span>🔥 Calories:</span> <span className="font-bold">{rideStats.calories}</span></p>
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-1">📊 Progress</p>
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${routeDetails ? Math.round((rideStats.distance / routeDetails.totalDistance) * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-center text-sm font-bold mt-1">{routeDetails ? Math.round((rideStats.distance / routeDetails.totalDistance) * 100) : 0}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="h-4"></div>
      </div>

      {/* ▶️ ACTION BUTTON - Fixed at bottom */}
      <div className="p-4 bg-white border-t shadow-lg flex-shrink-0">
        <button
          onClick={isRiding ? () => stopRide() : startRide}
          disabled={!routeDetails && !isRiding}
          className={`w-full px-6 py-4 text-white rounded-lg font-bold text-lg transition transform ${
            isRiding
              ? "bg-red-500 hover:bg-red-600 active:scale-95"
              : routeDetails
              ? "bg-green-500 hover:bg-green-600 active:scale-95"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isRiding ? "⏹ Stop Ride" : routeDetails ? "▶️ Start Trip" : isLoadingRoute ? "⏳ Calculating Route..." : "🔒 Select Destination First"}
        </button>

        {/* Show destination name if selected */}
        {destination && !isRiding && (
          <p className="text-center text-sm text-gray-600 mt-2">📍 Going to: <span className="font-semibold">{destination.name.split(',')[0]}</span></p>
        )}

        {/* Loading indicator */}
        {isLoadingRoute && (
          <p className="text-center text-xs text-blue-600 mt-2 animate-pulse">🛣️ Finding best cycling route...</p>
        )}
      </div>

    </div>
  );
}