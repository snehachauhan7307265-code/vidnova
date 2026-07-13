import React, { useState, useEffect } from 'react';
import { categories } from '../data/mock';
import { VideoCard } from '../components/video/VideoCard';
import { Flame, Music2, Gamepad2, Trophy, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';

const exploreCards = [
  { icon: Flame, title: 'Trending', color: 'bg-red-500/10 text-red-500' },
  { icon: Music2, title: 'Music', color: 'bg-blue-500/10 text-blue-500' },
  { icon: Gamepad2, title: 'Gaming', color: 'bg-purple-500/10 text-purple-500' },
  { icon: Trophy, title: 'Sports', color: 'bg-emerald-500/10 text-emerald-500' },
  { icon: Lightbulb, title: 'Learning', color: 'bg-yellow-500/10 text-yellow-500' },
];

export function Explore() {
  const [trending, setTrending] = useState<Video[]>([]);

  useEffect(() => {
    async function fetchTrending() {
      const q = query(collection(db, 'videos'), orderBy('views', 'desc'), limit(10));
      const snap = await getDocs(q);
      setTrending(snap.docs.map(d => parseVideoData(d.id, d.data())));
    }
    fetchTrending();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Explore</h1>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
        {exploreCards.map((card, idx) => (
          <motion.div 
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-2xl cursor-pointer hover:bg-secondary transition-colors"
          >
            <div className={`p-4 rounded-full mb-3 ${card.color}`}>
              <card.icon className="h-8 w-8" />
            </div>
            <span className="font-semibold">{card.title}</span>
          </motion.div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Flame className="text-red-500 h-6 w-6" /> Trending Videos
        </h2>
        <div className="flex flex-col gap-4">
          {trending.length > 0 ? trending.map((video) => (
            <VideoCard key={video.id} video={video} layout="list" />
          )) : (
            <p className="text-zinc-500">No trending videos found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
