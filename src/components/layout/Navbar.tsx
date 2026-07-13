import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, Bell, Video, User, Moon, Sun, Monitor, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { SearchBox } from './SearchBox';
import { NotificationDropdown } from './NotificationDropdown';

interface NavbarProps {
  toggleSidebar: () => void;
}

export function Navbar({ toggleSidebar }: NavbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { currentUser, userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass h-16 flex items-center justify-between px-4">
      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-sidebar z-50 flex items-center px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setShowMobileSearch(false)} aria-label="Close search" className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <SearchBox mobile onClose={() => setShowMobileSearch(false)} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0" aria-label="Toggle Sidebar">
          <Menu className="h-6 w-6" />
        </Button>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-lg flex items-center justify-center">
            <Video className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase hidden sm:block">Vid<span className="text-indigo-500">Nova</span></span>
        </Link>
      </div>

      <div className="flex-1 max-w-2xl px-4 hidden md:flex items-center justify-center">
        <SearchBox />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileSearch(true)} aria-label="Open search">
          <Search className="h-5 w-5" />
        </Button>
        
        {currentUser ? (
          <>
            <Link to="/upload" className="hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="Upload Video">
                <Video className="h-5 w-5" />
              </Button>
            </Link>
            
            <NotificationDropdown />
            
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Profile menu"
                aria-expanded={showProfileMenu}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 p-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all flex items-center justify-center overflow-hidden"
              >
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Profile" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 glass-card rounded-2xl shadow-xl py-2 flex flex-col z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                        {userProfile?.avatarUrl ? (
                          <img src={userProfile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm truncate">{userProfile?.displayName || currentUser.email}</span>
                        <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
                      </div>
                    </div>
                    
                    <div className="py-1 flex flex-col">
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="px-4 py-2 text-sm hover:bg-accent flex items-center gap-3">
                        <User className="h-4 w-4" /> Your channel
                      </Link>
                      <Link to="/dashboard" onClick={() => setShowProfileMenu(false)} className="px-4 py-2 text-sm hover:bg-accent flex items-center gap-3">
                        <Video className="h-4 w-4" /> Creator Dashboard
                      </Link>
                    </div>
                    
                    <div className="py-1 border-t border-border flex flex-col">
                      <div className="px-4 py-2 text-sm flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />} 
                          Appearance
                        </span>
                        <div className="flex bg-secondary rounded-full p-0.5">
                          <button onClick={() => setTheme('light')} className={cn("p-1.5 rounded-full transition-colors", theme === 'light' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                            <Sun className="h-3 w-3" />
                          </button>
                          <button onClick={() => setTheme('system')} className={cn("p-1.5 rounded-full transition-colors", theme === 'system' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                            <Monitor className="h-3 w-3" />
                          </button>
                          <button onClick={() => setTheme('dark')} className={cn("p-1.5 rounded-full transition-colors", theme === 'dark' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                            <Moon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1 border-t border-border flex flex-col">
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-3 text-primary font-medium">
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-secondary rounded-full p-0.5 mr-2">
              <button onClick={() => setTheme('light')} className={cn("p-1.5 rounded-full transition-colors", theme === 'light' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                <Sun className="h-4 w-4" />
              </button>
              <button onClick={() => setTheme('system')} className={cn("p-1.5 rounded-full transition-colors", theme === 'system' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                <Monitor className="h-4 w-4" />
              </button>
              <button onClick={() => setTheme('dark')} className={cn("p-1.5 rounded-full transition-colors", theme === 'dark' ? "bg-background shadow-sm" : "text-muted-foreground")}>
                <Moon className="h-4 w-4" />
              </button>
            </div>
            <Link to="/login">
              <Button variant="outline" className="gap-2 rounded-full hidden sm:flex">
                <LogIn className="h-4 w-4" /> Sign In
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
