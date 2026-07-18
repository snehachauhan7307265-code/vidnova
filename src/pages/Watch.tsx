import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VideoCard } from '../components/video/VideoCard';
import { CategoryChips } from '../components/video/CategoryChips';
import { CheckCircle2, Share2, Save, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Comments } from '../components/video/Comments';
import { LikeButton } from '../components/video/LikeButton';
import { SubscribeButton } from '../components/video/SubscribeButton';
import { SubscriberCount } from '../components/video/SubscriberCount';
import { db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, addDoc, deleteDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { useAuth } from '../context/AuthContext';
import { SaveToModal } from '../components/video/SaveToModal';
import { ShareModal } from '../components/video/ShareModal';

export function Watch() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    async function fetchVideo() {
      if (!id) return;
      setLoading(true);
      try {
        const cleanId = id.replace('-dup', '');
        const docRef = doc(db, 'videos', cleanId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const videoData = docSnap.data();
          const parsedVideo = parseVideoData(docSnap.id, videoData);
          if (parsedVideo.visibility === 'private' && (!currentUser || currentUser.uid !== parsedVideo.userId)) {
            setError('This video is private.');
            setVideo(null);
          } else {
            setVideo(parsedVideo);
            // Increment views
            const viewsRef = doc(db, 'videos', cleanId);
            const today = new Date().toISOString().split('T')[0];
            updateDoc(viewsRef, {
              views: increment(1),
              [`dailyViews.${today}`]: increment(1)
            }).catch(console.error);
          }
        } else {
          setVideo(null);
        }

        // Fetch suggested videos
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(15));
        const suggestedSnap = await getDocs(q);
        const fetchedSuggested = suggestedSnap.docs.map(d => parseVideoData(d.id, d.data()));
        
        setSuggestedVideos(fetchedSuggested.filter(v => v.id !== cleanId && (!v.visibility || v.visibility === 'public')));

        if (currentUser) {
          const historyId = `${currentUser.uid}_${cleanId}`;
          const historyRef = doc(db, 'watchHistory', historyId);
          const historySnap = await getDoc(historyRef);
          
          if (historySnap.exists()) {
            setInitialProgress(historySnap.data().progress || 0);
          }
          
          await setDoc(historyRef, {
            userId: currentUser.uid,
            videoId: cleanId,
            timestamp: new Date().toISOString()
          }, { merge: true });
        }
      } catch (error) {
        console.warn("Could not fetch video from Firestore. Check your Firestore Security Rules:", error);
        setVideo(null);
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [id, currentUser]);

  const handleTimeUpdate = async (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!currentUser || !video) return;
    const progress = (e.target as HTMLVideoElement).currentTime;
    
    // Only update every 5 seconds to reduce writes
    if (Math.floor(progress) % 5 === 0 && Math.floor(progress) !== initialProgress) {
       const historyId = `${currentUser.uid}_${video.id}`;
       const historyRef = doc(db, 'watchHistory', historyId);
       updateDoc(historyRef, {
         progress,
         timestamp: new Date().toISOString()
       }).catch(console.error);
    }
  };

  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (initialProgress > 0) {
      (e.target as HTMLVideoElement).currentTime = initialProgress;
    }
  };

  const formatViews = (views?: number) => {
    if (views === undefined || views === null || isNaN(views)) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading video...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!video) {
    return <div className="p-8 text-center text-muted-foreground">Video not found.</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1800px] mx-auto">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Video Player */}
        <div className="w-full aspect-video bg-[#111] rounded-2xl overflow-hidden relative group border border-white/5">
          {video.videoUrl ? (
            <video 
              src={video.videoUrl} 
              poster={video.thumbnailUrl}
              controls 
              autoPlay
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleVideoLoaded}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <img 
                src={video.thumbnailUrl} 
                alt={video.title} 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-600/90 to-violet-500/90 text-white rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl backdrop-blur-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1 sm:w-8 sm:h-8"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mt-4 mb-2">{video.title}</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-4">
            <Link to={`/channel/${video.channel?.id || video.userId}`} className="flex items-center gap-3 shrink-0">
              <img src={video.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${video.channel?.displayName || video.channelName || 'User'}`} alt={video.channel?.displayName || video.channelName} className="w-10 h-10 rounded-full bg-zinc-800" />
              <div className="flex flex-col">
                <span className="font-semibold text-base flex items-center gap-1">
                  {video.channel?.displayName || video.channelName || 'Unknown'}
                  {video.channel?.verified && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                </span>
                <span className="text-xs text-zinc-500">
                  <SubscriberCount channelId={video.channel?.id || video.userId} /> subscribers
                </span>
              </div>
            </Link>
            <SubscribeButton channelId={video.channel?.id || video.userId} channelName={video.channel?.displayName || video.channelName || 'Unknown'} />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 sm:pb-0">
            <LikeButton video={video} />
            
            <Button variant="secondary" className="rounded-full gap-2" onClick={() => setShowShareModal(true)}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button variant="secondary" className="rounded-full gap-2 hidden sm:flex" onClick={() => setShowSaveModal(true)}>
              <Save className="h-4 w-4" /> Save
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full shrink-0" aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-secondary rounded-xl p-4 mt-2 text-sm hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
          <div className="font-semibold mb-1">
            {formatViews(video.views)} views • {video.createdAt && (video.createdAt.includes('T') ? new Date(video.createdAt).toLocaleDateString() : video.createdAt)}
          </div>
          <p className="whitespace-pre-line text-zinc-300">{video.description}</p>
        </div>

        {/* Comments Section */}
        <Comments video={video} />
      </div>

      {/* Suggested Videos Sidebar */}
      <div className="w-full lg:w-[400px] flex flex-col gap-3 shrink-0">
        <CategoryChips activeCategory="All" onSelect={() => {}} />
        <div className="flex flex-col gap-3">
          {suggestedVideos.map(vid => (
            <VideoCard key={vid.id} video={vid} layout="list" />
          ))}
        </div>
      </div>
      
      {showSaveModal && (
        <SaveToModal
          videoId={video.id}
          onClose={() => setShowSaveModal(false)}
        />
      )}
      
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        videoUrl={window.location.href} 
        videoTitle={video.title} 
        videoId={video.id} 
      />
    </div>
  );
}
