/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Pages
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Search } from './pages/Search';
import { Watch } from './pages/Watch';
import { Profile } from './pages/Profile';
import { Channel } from './pages/Channel';
import { Upload } from './pages/Upload';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { NotFound } from './pages/NotFound';
import { WatchHistoryPage } from './pages/WatchHistory';
import { WatchLaterPage } from './pages/WatchLater';
import { PlaylistsPage } from './pages/Playlists';
import { PlaylistDetail } from './pages/PlaylistDetail';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Toaster position="bottom-center" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Main App Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/trending" element={<Navigate to="/explore" replace />} />
              <Route path="/search" element={<Search />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/channel/:id" element={<Channel />} />
              
              {/* User & Creator Actions (Protected) */}
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><WatchHistoryPage /></ProtectedRoute>} />
              <Route path="/watch-later" element={<ProtectedRoute><WatchLaterPage /></ProtectedRoute>} />
              <Route path="/playlists" element={<ProtectedRoute><PlaylistsPage /></ProtectedRoute>} />
              <Route path="/playlists/:id" element={<PlaylistDetail />} />
              
              {/* 404 Catch All in Main Layout */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Authentication Layout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
