import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/video/VideoCard';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { Button } from '../components/ui/Button';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function WatchHistoryPage() {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'watchHistory'),
          where('userId', '==', currentUser.uid),
        );
        const snap = await getDocs(q);
        
        // Manual sorting since we might not have composite index
        const historyItems = snap.docs.map(d => ({ docId: d.id, ...(d.data() as any) }));
        historyItems.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const videoIds = historyItems.map(item => item.videoId);
        
        if (videoIds.length === 0) {
          setVideos([]);
          setLoading(false);
          return;
        }

        // Fetch videos
        const videosData: Video[] = [];
        // Firestore 'in' query supports up to 10 items.
        // We can chunk it or just fetch all videos and filter (safer for small apps, but let's fetch individually or chunk)
        for (let i = 0; i < videoIds.length; i += 10) {
          const chunk = videoIds.slice(i, i + 10);
          const vq = query(collection(db, 'videos'), where('__name__', 'in', chunk));
          const vSnap = await getDocs(vq);
          vSnap.docs.forEach(d => {
            videosData.push(parseVideoData(d.id, d.data()));
          });
        }

        // Sort videos according to history order
        const sortedVideos = historyItems.map(hi => videosData.find(v => v.id === hi.videoId)).filter(Boolean) as Video[];
        
        setVideos(sortedVideos);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentUser]);

  const clearHistory = async () => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to clear your entire watch history?")) return;
    
    try {
      const q = query(collection(db, 'watchHistory'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      if (count > 0) {
        await batch.commit();
      }
      
      setVideos([]);
      toast.success("Watch history cleared successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to clear watch history.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Watch History</h1>
        {videos.length > 0 && (
          <Button variant="outline" className="gap-2 rounded-full" onClick={clearHistory}>
            <Trash2 className="h-4 w-4" /> Clear all history
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading history...</p>
      ) : videos.length > 0 ? (
        <div className="flex flex-col gap-4">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} layout="list" />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-xl font-bold mb-2">This list has no videos.</h2>
          <p className="text-muted-foreground">Videos you watch will show up here.</p>
        </div>
      )}
    </div>
  );
}
