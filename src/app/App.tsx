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
      
      // Check development mode setting
      // IMPORTANT: On Vercel, set VITE_DEV_MODE=false to persist user login
      const isDevelopment = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;
      
      if (isDevelopment) {
        // During development: Always show login page on refresh
        db.clearCurrentUser();
        setIsAuthenticated(false);
        console.log('Development mode: User data cleared on page load');
      } else {
        // Production (Vercel): Remember user login
        const currentUser = db.getCurrentUser();
        if (currentUser) {
          setIsAuthenticated(true);
          console.log('Production mode: User logged in -', currentUser.email);
        } else {
          setIsAuthenticated(false);
          console.log('Production mode: No user found - showing login');
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