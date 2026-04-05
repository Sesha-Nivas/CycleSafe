import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Signup from './components/Signup';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Navigate from './components/Navigate';
import Safety from './components/Safety';
import Profile from './components/Profile';
import { db } from '../utils/database';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      
      // DEVELOPMENT MODE: Always clear login on page refresh
      // Change VITE_DEV_MODE=true to 'false' in .env.local when deploying
      const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
      
      if (isDevelopment) {
        // During development: Always show login page
        db.clearCurrentUser();
        setIsAuthenticated(false);
      } else {
        // After deployment: Remember user login
        const currentUser = db.getCurrentUser();
        if (currentUser) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleSignup = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    db.clearCurrentUser();
    // Force complete logout - refresh page to clear all state
    setIsAuthenticated(false);
    setShowSignup(false);
    setActiveTab('home');
    // Optional: Clear browser cache on logout
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    if (showSignup) {
      return <Signup onSignup={handleSignup} onSwitchToLogin={() => setShowSignup(false)} />;
    }
    return <Login onLogin={handleLogin} onSwitchToSignup={() => setShowSignup(true)} />;
  }

  return (
    <div className="flex size-full bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
        {activeTab === 'navigate' && <Navigate />}
        {activeTab === 'safety' && <Safety />}
        {activeTab === 'profile' && <Profile />}
      </div>
    </div>
  );
}