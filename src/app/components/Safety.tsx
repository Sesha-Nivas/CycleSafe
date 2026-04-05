import { useState } from 'react';
import { Shield, Bell, AlertTriangle, Lightbulb, Trophy, Medal, Award } from 'lucide-react';
import { db } from '../../utils/database';

export default function Safety() {
  const [leaderboard] = useState(db.getLeaderboard());
  const currentUser = db.getCurrentUser();

  const userRank = currentUser ? leaderboard.findIndex(entry => entry.user.id === currentUser.id) + 1 : 0;

  const safetyTips = [
    { icon: Shield, title: 'Always wear a helmet', color: 'emerald' },
    { icon: Bell, title: 'Use hand signals', color: 'blue' },
    { icon: Lightbulb, title: 'Stay visible at night', color: 'yellow' },
    { icon: AlertTriangle, title: 'Check your bike regularly', color: 'orange' },
    { icon: Shield, title: 'Follow traffic rules', color: 'purple' },
    { icon: Bell, title: 'Stay alert and aware', color: 'pink' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return <span className="text-gray-600 font-bold text-lg w-6 text-center">{rank}</span>;
  };

  const recentAlerts = [
    {
      title: 'Heavy Traffic Ahead',
      description: 'High vehicle density reported on Market Street',
      time: '10 mins ago',
      severity: 'high',
    },
    {
      title: 'Road Construction',
      description: 'Temporary bike lane closure on Pine Street',
      time: '1 hour ago',
      severity: 'medium',
    },
    {
      title: 'Weather Alert',
      description: 'Rain expected in the evening. Ride carefully',
      time: '2 hours ago',
      severity: 'low',
    },
  ];

  return (
    <div className="p-8 overflow-y-auto h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Safety Center</h2>
        <p className="text-gray-600 mb-8">Real-time alerts and tips</p>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <Shield className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-600 mb-2">Your Safety Score</p>
                <p className="text-5xl font-bold text-emerald-500 mb-2">
                  {currentUser ? currentUser.safetyScore : 0}/100
                </p>
                <p className="text-gray-700">
                  {currentUser && currentUser.safetyScore >= 90
                    ? 'Excellent! Keep following traffic rules'
                    : currentUser && currentUser.safetyScore >= 75
                    ? 'Good job! Stay safe on the road'
                    : 'Keep riding safely to improve your score'}
                </p>
              </div>
            </div>
            {userRank > 0 && (
              <div className="text-center bg-white px-8 py-4 rounded-xl shadow-lg">
                <p className="text-gray-600 mb-1">Rank</p>
                <p className="text-3xl font-bold text-emerald-500">#{userRank}</p>
                <p className="text-sm text-gray-500">in leaderboard</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Safety Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safetyTips.map((tip, index) => {
              const Icon = tip.icon;
              const bgColor = `bg-${tip.color}-50`;
              const iconColor = `text-${tip.color}-500`;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 cursor-pointer`}
                >
                  <div className={`w-14 h-14 ${bgColor} rounded-full flex items-center justify-center mb-4`}>
                    <Icon className={`w-7 h-7 ${iconColor}`} />
                  </div>
                  <p className="font-semibold text-gray-800">{tip.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Safety Leaderboard</h3>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cyclist</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Safety Score</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Total Rides</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Distance (km)</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <tr
                      key={entry.user.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        currentUser && entry.user.id === currentUser.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-10">
                          {getRankIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {entry.user.profilePhoto ? (
                            <img
                              src={entry.user.profilePhoto}
                              alt={entry.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-emerald-600">
                                {entry.user.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{entry.user.name}</p>
                            {currentUser && entry.user.id === currentUser.id && (
                              <span className="text-xs text-emerald-600 font-medium">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold ${
                            entry.user.safetyScore >= 90
                              ? 'bg-emerald-100 text-emerald-700'
                              : entry.user.safetyScore >= 75
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {entry.user.safetyScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{entry.user.totalRides}</td>
                      <td className="px-6 py-4 text-center text-gray-700">
                        {entry.user.totalDistance.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                          {entry.user.badges}
                          <Award className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leaderboard.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No cyclists on the leaderboard yet.</p>
                <p className="text-sm mt-2">Complete rides to appear here!</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Alerts</h3>
          <div className="space-y-4">
            {recentAlerts.map((alert, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-full ${
                      alert.severity === 'high'
                        ? 'bg-red-50'
                        : alert.severity === 'medium'
                        ? 'bg-orange-50'
                        : 'bg-yellow-50'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        alert.severity === 'high'
                          ? 'text-red-500'
                          : alert.severity === 'medium'
                          ? 'text-orange-500'
                          : 'text-yellow-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">{alert.title}</h4>
                        <p className="text-gray-600 mb-2">{alert.description}</p>
                        <p className="text-sm text-gray-400">{alert.time}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          alert.severity === 'high'
                            ? 'bg-red-100 text-red-700'
                            : alert.severity === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
