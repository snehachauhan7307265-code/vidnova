import React, { useState, useEffect } from 'react';
import { CategoryChips } from '../components/video/CategoryChips';
import { VideoCard } from '../components/video/VideoCard';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';

export function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVideos = snapshot.docs.map((doc) => parseVideoData(doc.id, doc.data()));
      setVideos(fetchedVideos);
      setLoading(false);
    }, (error) => {
      console.warn("Could not fetch videos from Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredVideos = activeCategory === 'All' 
    ? videos 
    : videos.filter(v => v.category === activeCategory || (activeCategory === 'Other' && !v.category));

  return (
    <div className="pb-12">
      <CategoryChips 
        activeCategory={activeCategory} 
        onSelect={setActiveCategory} 
      />
      
      <div className="px-4 sm:px-6">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading videos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
