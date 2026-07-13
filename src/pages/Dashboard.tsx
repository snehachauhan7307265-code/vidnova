import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSubscriberCount } from "../hooks/useSubscriberCount";
import { VideoCard } from '../components/video/VideoCard';
import { Video, Notification } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { Bell, MessageSquare, ThumbsUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const subscriberCount = useSubscriberCount(currentUser?.uid);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Notification[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentUser) return;
      
      // Fetch videos
      const q = query(collection(db, 'videos'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const vids = snap.docs.map(d => parseVideoData(d.id, d.data()));
      // Sort latest first
      vids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVideos(vids);
      
      // Fetch total comments (from all videos of this user)
      let commentsCount = 0;
      for (const v of vids) {
         const cQ = query(collection(db, 'videos', v.id, 'comments'));
         const cSnap = await getDocs(cQ);
         commentsCount += cSnap.size;
      }
      setTotalComments(commentsCount);
      
      setLoading(false);
    }
    fetchDashboardData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    // Fetch recent activity (notifications)
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentActivity(notifs.slice(0, 10));
    });
    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view your dashboard.</div>;
  }

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <ThumbsUp className="h-4 w-4 text-primary" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'subscribe': return <UserPlus className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-secondary/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-muted-foreground mb-2 text-sm sm:text-base">Total Views</h3>
          <p className="text-2xl sm:text-3xl font-bold">{totalViews}</p>
        </div>
        <div className="bg-secondary/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-muted-foreground mb-2 text-sm sm:text-base">Total Videos</h3>
          <p className="text-2xl sm:text-3xl font-bold">{videos.length}</p>
        </div>
        <div className="bg-secondary/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-muted-foreground mb-2 text-sm sm:text-base">Total Likes</h3>
          <p className="text-2xl sm:text-3xl font-bold">{totalLikes}</p>
        </div>
        <div className="bg-secondary/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-muted-foreground mb-2 text-sm sm:text-base">Total Comments</h3>
          <p className="text-2xl sm:text-3xl font-bold">{totalComments}</p>
        </div>
        <div className="bg-secondary/50 p-6 rounded-2xl border border-white/5">
          <h3 className="text-muted-foreground mb-2 text-sm sm:text-base">Subscribers</h3>
          <p className="text-2xl sm:text-3xl font-bold">{subscriberCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Latest Uploads</h2>
          {loading ? (
            <p className="text-zinc-500">Loading videos...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {videos.length > 0 ? videos.slice(0, 6).map(video => (
                <VideoCard key={video.id} video={video} />
              )) : (
                <p className="text-zinc-500 col-span-full">You have not uploaded any videos yet.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="bg-secondary/20 rounded-2xl border border-white/5 p-4 flex flex-col gap-4">
            {recentActivity.length > 0 ? recentActivity.map(n => (
              <div key={n.id} className="flex items-start gap-3">
                <Link to={`/channel/${n.actorId}`} className="shrink-0 relative mt-1">
                  <img src={n.actorAvatar} alt={n.actorName} className="w-8 h-8 rounded-full object-cover bg-zinc-800" />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[1px]">
                    {getIcon(n.type)}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link to={`/channel/${n.actorId}`} className="font-semibold hover:underline">
                      {n.actorName}
                    </Link>{' '}
                    {n.type === 'subscribe' ? (
                      <span className="text-zinc-300">subscribed to your channel</span>
                    ) : (
                      <Link to={`/watch/${n.videoId}`} className="text-zinc-300 hover:text-white transition-colors">
                        {n.type === 'like' ? `liked your video "${n.videoTitle}"` : `commented on "${n.videoTitle}"`}
                      </Link>
                    )}
                  </p>
                  <span className="text-xs text-zinc-500 mt-0.5 block">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-zinc-500 text-sm text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
