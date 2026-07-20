import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { VideoCard } from '../components/video/VideoCard';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Video, User } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { useAuth } from '../context/AuthContext';
import { SubscribeButton } from '../components/video/SubscribeButton';
import { SubscriberCount } from '../components/video/SubscriberCount';

export function Channel() {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const [channel, setChannel] = useState<User | null>(null);
  const [channelVideos, setChannelVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch Channel Profile
    const fetchChannel = async () => {
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChannel({
            id: data.id || docSnap.id,
            username: data.username || data.displayName?.toLowerCase()?.replace(/\s+/g, '') || 'user',
            displayName: data.displayName,
            avatarUrl: data.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
            subscribers: data.subscribers || 0,
            verified: data.verified || false
          });
        }
      } catch (err) {
        console.error("Error fetching channel:", err);
      }
    };

    fetchChannel();

    // Fetch Channel Videos Real-time
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', id),
    ); // orderBy('createdAt', 'desc') needs composite index, let's just sort in JS for now if needed

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let vids = snapshot.docs.map(d => parseVideoData(d.id, d.data()));
      // Filter out private and unlisted if not the owner
      if (!currentUser || currentUser.uid !== id) {
        vids = vids.filter(v => !v.visibility || v.visibility === 'public');
      }
      // Sort by createdAt desc
      vids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setChannelVideos(vids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading channel...</div>;
  }

  if (!channel) {
    return <div className="p-8 text-center text-muted-foreground">Channel not found.</div>;
  }

  return (
    <div className="pb-12">
      {/* Banner */}
      <div className="w-full h-40 md:h-56 bg-zinc-900 border-b border-border">
        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80" alt="Banner" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center -mt-10 md:-mt-14 mb-8 relative z-10">
          <img src={channel.avatarUrl} alt={channel.displayName} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover bg-background shadow-lg" />
          
          <div className="flex-1 mt-2 md:mt-12 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-1">
              {channel.displayName}
              {channel.verified && <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400 mb-4">
              <span>@{channel.username}</span>
              <span><SubscriberCount channelId={channel.id} /> subscribers</span>
              <span>{channelVideos.length} videos</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <SubscribeButton channelId={channel.id} channelName={channel.displayName} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 border-b border-border mb-6 overflow-x-auto hide-scrollbar text-sm">
          <button className="py-3 border-b-2 border-primary font-medium text-foreground whitespace-nowrap">Home</button>
          <button className="py-3 border-b-2 border-transparent font-medium text-zinc-500 hover:text-foreground transition-colors whitespace-nowrap">Videos</button>
          <button className="py-3 border-b-2 border-transparent font-medium text-zinc-500 hover:text-foreground transition-colors whitespace-nowrap">Shorts</button>
          <button className="py-3 border-b-2 border-transparent font-medium text-zinc-500 hover:text-foreground transition-colors whitespace-nowrap">Playlists</button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">Videos <ChevronRight className="h-5 w-5 text-zinc-500" /></h2>
            <Button variant="ghost" size="sm" className="rounded-full">Play all</Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {channelVideos.length > 0 ? channelVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            )) : (
              <p className="text-zinc-500 col-span-full">This channel has no videos yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
