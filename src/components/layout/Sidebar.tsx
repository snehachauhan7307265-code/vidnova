import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, Film, Flame, Gamepad2, Music2, Trophy, LayoutGrid, Library } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const mainLinks = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: PlaySquare, label: 'Shorts', path: '/shorts' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: LayoutGrid, label: 'Subscriptions', path: '/subscriptions' },
];

const libraryLinks = [
  { icon: History, label: 'History', path: '/history' },
  { icon: Library, label: 'Your Videos', path: '/dashboard' },
  { icon: Clock, label: 'Watch Later', path: '/watch-later' },
  { icon: PlaySquare, label: 'Playlists', path: '/playlists' },
  { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
];

const exploreLinks = [
  { icon: Flame, label: 'Trending', path: '/trending' },
  { icon: Music2, label: 'Music', path: '/music' },
  { icon: Gamepad2, label: 'Gaming', path: '/gaming' },
  { icon: Trophy, label: 'Sports', path: '/sports' },
];

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const renderLink = (link: { icon: any, label: string, path: string }) => (
    <NavLink
      key={link.path}
      to={link.path}
      onClick={() => isMobile && onClose?.()}
      className={({ isActive }) => cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors mx-2",
        isActive 
          ? "bg-white/10 text-white font-medium" 
          : "text-zinc-500 hover:text-white hover:bg-white/5"
      )}
      title={!isOpen && !isMobile ? link.label : undefined}
    >
      <link.icon className={cn("h-5 w-5 shrink-0", !isOpen && !isMobile && "mx-auto")} />
      {(isOpen || isMobile) && <span className="truncate text-sm">{link.label}</span>}
    </NavLink>
  );

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 sm:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside 
        className={cn(
          "fixed sm:sticky top-16 h-[calc(100vh-4rem)] flex-col gap-1 py-4 overflow-y-auto hide-scrollbar border-r border-border transition-all duration-300 z-50 sm:z-40 bg-sidebar flex shrink-0",
          isOpen ? "translate-x-0 w-64" : "-translate-x-full sm:translate-x-0 sm:w-20 sm:items-center"
        )}
      >
        <div className="flex flex-col gap-1 w-full">
          {mainLinks.map(renderLink)}
        </div>

        {(isOpen || isMobile) && <div className="mx-4 my-2 border-t border-border" />}
        
        {(isOpen || isMobile) && (
          <div className="px-4 py-2 font-semibold text-sm text-foreground">
            Library
          </div>
        )}
        <div className="flex flex-col gap-1 w-full mt-2">
          {libraryLinks.map(renderLink)}
        </div>

        {(isOpen || isMobile) && <div className="mx-4 my-2 border-t border-border" />}

        {(isOpen || isMobile) && (
          <div className="px-4 py-2 font-semibold text-sm text-foreground">
            Explore
          </div>
        )}
        <div className="flex flex-col gap-1 w-full mt-2">
          {exploreLinks.map(renderLink)}
        </div>
        
        {(isOpen || isMobile) && (
          <div className="mt-auto px-6 py-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
              <a href="#" className="hover:text-foreground">About</a>
              <a href="#" className="hover:text-foreground">Press</a>
              <a href="#" className="hover:text-foreground">Copyright</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
            <p>© 2026 VidNova LLC</p>
          </div>
        )}
      </aside>
    </>
  );
}
