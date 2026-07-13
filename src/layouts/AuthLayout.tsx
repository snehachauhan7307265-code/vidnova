import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { motion } from 'motion/react';

export function AuthLayout() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Decorative abstract background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
            <Video className="h-6 w-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold tracking-tight uppercase">Vid<span className="text-indigo-500">Nova</span></span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md mx-auto z-10 p-6 sm:p-0"
      >
        <div className="glass-card shadow-2xl rounded-3xl p-8 sm:p-10 border border-white/5">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
