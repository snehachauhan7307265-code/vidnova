import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlaySquare, PlusCircle, LayoutGrid, Library } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function MobileNav() {
  const { currentUser } = useAuth();
  
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-background border-t border-white/10 flex items-center justify-around px-2 z-50">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center justify-center py-2 px-3 w-16 gap-1 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
      >
        <Home className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Home</span>
      </NavLink>
      
      <NavLink 
        to="/shorts" 
        className={({ isActive }) => `flex flex-col items-center justify-center py-2 px-3 w-16 gap-1 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
      >
        <PlaySquare className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Shorts</span>
      </NavLink>
      
      <NavLink 
        to="/upload" 
        className="flex items-center justify-center -mt-4 relative z-10"
      >
        <div className="bg-primary/90 rounded-full p-3 shadow-lg shadow-black/50 text-white">
          <PlusCircle className="h-7 w-7" strokeWidth={2} />
        </div>
      </NavLink>
      
      <NavLink 
        to={currentUser ? "/subscriptions" : "/login"} 
        className={({ isActive }) => `flex flex-col items-center justify-center py-2 px-3 w-16 gap-1 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
      >
        <LayoutGrid className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Subscriptions</span>
      </NavLink>
      
      <NavLink 
        to={currentUser ? "/profile" : "/login"} 
        className={({ isActive }) => `flex flex-col items-center justify-center py-2 px-3 w-16 gap-1 ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
      >
        <Library className="h-6 w-6" strokeWidth={1.5} />
        <span className="text-[10px] font-medium">Library</span>
      </NavLink>
    </div>
  );
}
