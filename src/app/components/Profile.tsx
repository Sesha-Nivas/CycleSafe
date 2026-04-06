import { useState, useEffect } from 'react';
import { User, MapPin, Award, TrendingUp, Calendar, Target, RefreshCw, Camera, AlertCircle } from 'lucide-react';
import { db } from '../../utils/database';
import { getCurrentLocation } from '../../utils/rideTracking';
import type { User as DbUser } from '../../utils/database';

export default function Profile() {
  const [user, setUser] = useState<DbUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationName, setLocationName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load fresh user data from database
    loadUserData();
    fetchCurrentLocation();

    // Listen for changes in localStorage (when data is updated in another component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyclesafe_users' || e.key === 'cyclesafe_current_user') {
        console.log('User data changed, reloading profile...');
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from other components
    const handleCustomUpdate = () => {
      console.log('Profile update event received');
      loadUserData();
    };
    
    window.addEventListener('userDataUpdated', handleCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleCustomUpdate as EventListener);
    };
  }, []);

  const loadUserData = () => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      // Get fresh data from main users array, not the cached currentUser
      const freshUser = db.getUserById(currentUser.id);
      if (freshUser) {
        setUser(freshUser);
        // Also update the currentUser cache to keep it in sync
        db.setCurrentUser(freshUser);
        setLoading(false);
        setError('');
      } else {
        setError('User data not found. Please log in again.');
        setLoading(false);
      }
    } else {
      setError('User data not found. Please log in again.');
      setLoading(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      
      if (!location || !location.lat || !location.lng) {
        setLocationName('Location unavailable');
        return;
      }

      // Use Geocoding API to get location name
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn('Google Maps API key not configured');
          setLocationName('Location unavailable');
          return;
        }
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            // Try to extract city and country from address components
            const addressComponents = data.results[0].address_components;
            let city = '';
            let country = '';
            let state = '';

            for (const component of addressComponents) {
              if (component.types.includes('locality')) {
                city = component.long_name;
              }
              if (component.types.includes('country')) {
                country = component.short_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name;
              }
            }

            // Build location name with fallback logic
            if (city && country) {
              setLocationName(`${city}, ${country}`);
            } else if (city && state) {
              setLocationName(`${city}, ${state}`);
            } else if (city) {
              setLocationName(city);
            } else if (data.results[0].formatted_address) {
              // Use formatted address if components not available
              const formatted = data.results[0].formatted_address;
              const parts = formatted.split(',').map((p: string) => p.trim());
              // Get last 2 parts (usually city/area, country)
              const lastParts = parts.slice(-2).join(', ');
              setLocationName(lastParts || formatted);
            } else {
              setLocationName('Location found');
            }
          } else {
            setLocationName('Location unavailable');
          }
        } else if (response.status === 403 || response.status === 401) {
          console.error('Geocoding API key error');
          setLocationName('Location unavailable');
        } else {
          setLocationName('Location unavailable');
        }
      } catch (geoError) {
        console.error('Error with geocoding:', geoError);
        setLocationName('Location unavailable');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocationName('Location unavailable');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserData();
    fetchCurrentLocation();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = reader.result as string;
        db.updateUser(user.id, { profilePhoto: photoData });
        const updatedUser = db.getUserById(user.id);
        if (updatedUser) {
          setUser(updatedUser);
          db.setCurrentUser(updatedUser);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!user || error) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Profile Error</h3>
          </div>
          <p className="text-red-700">{error || 'Please log in to view your profile'}</p>
        </div>
      </div>
    );
  }

  const achievements = [
    {
      icon: Award,
      title: 'Century Rider',
      description: 'Ride 100 km in total',
      progress: user.achievements.centuryRider,
      color: 'yellow',
    },
    {
      icon: Calendar,
      title: 'Week Warrior',
      description: 'Ride 5 times this week',
      progress: user.achievements.weekWarrior,
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Speed Demon',
      description: 'Reach 30 km/h avg speed',
      progress: user.achievements.speedDemon,
      color: 'purple',
    },
    {
      icon: Target,
      title: 'Distance Master',
      description: 'Complete 50 km in one ride',
      progress: user.achievements.distanceMaster,
      color: 'green',
    },
  ];

  const stats = [
    { label: 'Total Rides', value: user.totalRides.toString(), icon: MapPin },
    { label: 'Km Total', value: user.totalDistance.toFixed(1), icon: TrendingUp },
    { label: 'Badges', value: user.badges.toString(), icon: Award },
    { label: 'Avg Speed', value: user.avgSpeed.toFixed(1), unit: 'km/h', icon: TrendingUp },
  ];

  const calculateStreak = () => {
    const rides = db.getUserRides(user.id);
    if (rides.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasRide = rides.some(ride => {
        const rideDate = new Date(ride.timestamp);
        rideDate.setHours(0, 0, 0, 0);
        return rideDate.getTime() === checkDate.getTime();
      });

      if (hasRide) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const totalPoints = Math.round(user.totalDistance * 10 + user.totalRides * 50 + user.badges * 100);

  return (
    <div className="p-8 overflow-y-auto h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Profile</h2>
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all ${
              refreshing ? 'opacity-50' : ''
            }`}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center space-x-6">
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/30"
                />
              ) : (
                <div className="bg-white/20 backdrop-blur-sm p-8 rounded-full border-4 border-white/30">
                  <User className="w-16 h-16" />
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer hover:bg-gray-100 transition-colors shadow-lg">
                <Camera className="w-5 h-5 text-emerald-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-2">{user.name}</h3>
              <p className="text-emerald-100 mb-4">{user.email}</p>
              <div className="flex items-center space-x-2 text-emerald-100">
                <MapPin className="w-4 h-4" />
                <span>{locationName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-emerald-100 text-sm">{stat.label}</p>
                  {stat.unit && <p className="text-emerald-200 text-xs">{stat.unit}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-4 rounded-full ${
                        achievement.color === 'yellow'
                          ? 'bg-yellow-50'
                          : achievement.color === 'blue'
                          ? 'bg-blue-50'
                          : achievement.color === 'purple'
                          ? 'bg-purple-50'
                          : 'bg-green-50'
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 ${
                          achievement.color === 'yellow'
                            ? 'text-yellow-500'
                            : achievement.color === 'blue'
                            ? 'text-blue-500'
                            : achievement.color === 'purple'
                            ? 'text-purple-500'
                            : 'text-green-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{achievement.title}</h4>
                      <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>
                      <div className="relative">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              achievement.color === 'yellow'
                                ? 'bg-yellow-500'
                                : achievement.color === 'blue'
                                ? 'bg-blue-500'
                                : achievement.color === 'purple'
                                ? 'bg-purple-500'
                                : 'bg-green-500'
                            } transition-all duration-500`}
                            style={{ width: `${achievement.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-right text-sm font-semibold text-gray-600 mt-2">
                          {achievement.progress}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {user.badges >= 10 ? 'Gold' : user.badges >= 5 ? 'Silver' : 'Bronze'}
            </p>
            <p className="text-gray-600">Member Status</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{calculateStreak()} Days</p>
            <p className="text-gray-600">Current Streak</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{totalPoints.toLocaleString()}</p>
            <p className="text-gray-600">Total Points</p>
          </div>
        </div>
      </div>
    </div>
  );
}