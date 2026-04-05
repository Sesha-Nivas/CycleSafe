import { useState, useEffect } from 'react';
import { Navigation, TrendingUp, Clock, Wind, Flame, MapPin, Shield } from 'lucide-react';
import { db } from '../../utils/database';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [user, setUser] = useState(db.getCurrentUser());
  const [todayStats, setTodayStats] = useState({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    calories: 0,
  });

  useEffect(() => {
    loadTodayStats();
    // Refresh stats every minute to handle midnight reset
    const interval = setInterval(loadTodayStats, 10000); // Refresh every 10 seconds to see new rides
    return () => clearInterval(interval);
  }, []);

  const loadTodayStats = () => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const rides = db.getUserRides(currentUser.id);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRides = rides.filter(ride => {
        const rideDate = new Date(ride.timestamp);
        rideDate.setHours(0, 0, 0, 0);
        return rideDate.getTime() === today.getTime();
      });

      const distance = todayRides.reduce((sum, ride) => sum + ride.distance, 0);
      const duration = todayRides.reduce((sum, ride) => sum + ride.duration, 0);
      const avgSpeed =
        todayRides.length > 0
          ? todayRides.reduce((sum, ride) => sum + ride.avgSpeed, 0) / todayRides.length
          : 0;
      const calories = todayRides.reduce((sum, ride) => sum + ride.calories, 0);

      setTodayStats({
        distance: Number(distance.toFixed(1)),
        duration,
        avgSpeed: Number(avgSpeed.toFixed(1)),
        calories,
      });
    }
  };

  return (
    <div className="p-8 overflow-y-auto h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Hello, Cyclist</h1>
              <p className="text-xl text-emerald-100">Ready for a safe ride?</p>
            </div>
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <Shield className="w-12 h-12" />
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('navigate')}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-8 shadow-xl mb-8 transition-all duration-200 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Navigation className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">Start Riding</h2>
              <p className="text-emerald-100">Find safest route</p>
            </div>
          </div>
          <div className="transform group-hover:translate-x-2 transition-transform">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Today's Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-blue-500" />
              </div>
              <p className="text-gray-500 mb-2">Distance</p>
              <p className="text-3xl font-bold text-gray-800">{todayStats.distance}</p>
              <p className="text-gray-400">km</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-pink-50 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-pink-500" />
              </div>
              <p className="text-gray-500 mb-2">Duration</p>
              <p className="text-3xl font-bold text-gray-800">{todayStats.duration}</p>
              <p className="text-gray-400">min</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-purple-50 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Wind className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-gray-500 mb-2">Avg Speed</p>
              <p className="text-3xl font-bold text-gray-800">{todayStats.avgSpeed}</p>
              <p className="text-gray-400">km/h</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <Flame className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-gray-500 mb-2">Calories</p>
              <p className="text-3xl font-bold text-gray-800">{todayStats.calories}</p>
              <p className="text-gray-400">kcal</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => onNavigate('navigate')}
              className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group"
            >
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Plan Route</h4>
              <p className="text-gray-500">Find the safest path to your destination</p>
            </button>

            <button
              onClick={() => onNavigate('safety')}
              className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group"
            >
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Safety Tips</h4>
              <p className="text-gray-500">Learn essential cycling safety guidelines</p>
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-1">Safety Score</h4>
                <p className="text-gray-600">Excellent riding behavior</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-6xl font-bold text-emerald-500">{user ? user.safetyScore : 100}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}