import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Honors from './pages/Honors';
import Profile from './pages/Profile';
import Login from './pages/Login';
import * as Storage from './services/storage';

// Protected Route Component
const PrivateRoute = ({ children }: React.PropsWithChildren<{}>) => {
  const isAuthenticated = !!Storage.getAuthToken();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  // Simple auth state to trigger re-render on login/logout
  const [isAuthenticated, setIsAuthenticated] = useState(!!Storage.getAuthToken());

  useEffect(() => {
     const handleAuthChange = () => {
         setIsAuthenticated(!!Storage.getAuthToken());
     };

     window.addEventListener(Storage.AUTH_EVENT, handleAuthChange);
     return () => {
         window.removeEventListener(Storage.AUTH_EVENT, handleAuthChange);
     };
  }, []);

  return (
    <div className="max-w-[480px] mx-auto bg-gray-50 min-h-screen shadow-2xl relative">
      <HashRouter>
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            
            <Route path="/" element={
                <PrivateRoute>
                    <Home />
                </PrivateRoute>
            } />
            <Route path="/stats" element={
                <PrivateRoute>
                    <Stats />
                </PrivateRoute>
            } />
            <Route path="/honors" element={
                <PrivateRoute>
                    <Honors />
                </PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute>
                    <Profile />
                </PrivateRoute>
            } />
        </Routes>
        
        {/* Only show Nav if authenticated */}
        {isAuthenticated && (
             <BottomNav />
        )}
      </HashRouter>
    </div>
  );
};

export default App;