import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit, updateDoc, doc } from 'firebase/firestore';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Share2, Save, MoreVertical, CheckCircle2, Music2, Loader2, Play, VolumeX, Volume2, ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { LikeButton } from '../components/video/LikeButton';
import { SubscribeButton } from '../components/video/SubscribeButton';
import { SaveToModal } from '../components/video/SaveToModal';
import { ShareModal } from '../components/video/ShareModal';
import { Comments } from '../components/video/Comments';
import { cn } from '../utils/cn';

function ShortPlayer({ video, isActive, isMuted, toggleMute, onVisible }: { key?: React.Key, video: Video, isActive: boolean, isMuted: boolean, toggleMute: () => void, onVisible: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            onVisible();
          }
        });
      },
      {
        threshold: 0.5
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [onVisible]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSave, setShowSave] = useState(false);
  
  useEffect(() => {
    if (isActive) {
      // Play
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay prevented:", e));
        
        // Update views
        const viewsRef = doc(db, 'videos', video.id);
        updateDoc(viewsRef, { views: (video.views || 0) + 1 }).catch(() => {});
      }
    } else {
      // Pause
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, video.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-full shrink-0 snap-always snap-start flex justify-center bg-black overflow-hidden group">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="w-full h-full object-cover sm:object-contain sm:max-w-[450px]"
        loop
        playsInline
        onClick={togglePlay}
        poster={video.thumbnailUrl}
      />
      
      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm">
            <Play className="h-10 w-10 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Mute Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:right-[calc(50%-200px)] z-20">
        <Button variant="ghost" size="icon" onClick={toggleMute} className="bg-black/40 hover:bg-black/60 text-white rounded-full">
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4 pb-20 sm:pb-6 z-10 sm:max-w-[450px] mx-auto w-full">
        {/* Right Actions */}
        <div className="absolute right-4 bottom-20 sm:bottom-6 flex flex-col items-center gap-6 pointer-events-auto">
          <div className="flex flex-col items-center gap-1">
            <LikeButton video={video} className="bg-black/40 hover:bg-black/60 rounded-full p-2 flex-col gap-1 w-12 h-auto text-xs font-semibold text-white" iconClassName="h-6 w-6" showText={true} showDislike={false} />
            
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowComments(true)} className="bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12">
              <MessageSquare className="h-6 w-6" />
            </Button>
            <span className="text-white text-xs font-semibold drop-shadow-md">Comment</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowShare(true)} className="bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12">
              <Share2 className="h-6 w-6" />
            </Button>
            <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowSave(true)} className="bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12">
              <Save className="h-6 w-6" />
            </Button>
            <span className="text-white text-xs font-semibold drop-shadow-md">Save</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <SubscribeButton channelId={video.channel?.id || video.userId || ''} className="bg-black/40 hover:bg-black/60 rounded-full w-12 h-auto py-2 flex flex-col gap-1 items-center justify-center text-white" showCount={false} iconOnly={false} layout="shorts" />
            
          </div>
        </div>

        {/* Bottom Info */}
        <div className="w-[80%] flex flex-col gap-3 pointer-events-auto drop-shadow-md pb-2">
          <div className="flex items-center gap-3">
            <Link to={`/channel/${video.channel?.id || video.userId}`} className="shrink-0">
              <img src={video.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${video.channel?.displayName || video.channelName || 'User'}`} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
            </Link>
            <Link to={`/channel/${video.channel?.id || video.userId}`} className="text-white font-semibold text-sm hover:underline flex items-center gap-1">
              @{video.channel?.username || video.channelName || 'user'}
              {video.channel?.verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
            </Link>
            
          </div>
          
          <h2 className="text-white text-sm font-medium line-clamp-2">
            {video.title}
          </h2>
          
          {video.description && (
             <p className="text-white/80 text-xs line-clamp-2">
               {video.description}
             </p>
          )}

          <div className="flex items-center gap-2 text-white/90 text-xs mt-1 bg-black/20 self-start px-2 py-1 rounded-full backdrop-blur-sm">
            <Music2 className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[200px]">
              Original audio - {video.channel?.displayName || video.channelName || 'Creator'}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showComments && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col sm:max-w-[450px] mx-auto pointer-events-auto">
          <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black">
            <h3 className="font-bold text-white">Comments</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowComments(false)} className="text-white hover:bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto bg-black p-4">
            <Comments video={video} />
          </div>
        </div>
      )}
      
      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        videoId={video.id} 
        videoTitle={video.title || 'Short Video'}
        videoUrl={`${window.location.origin}/watch/${video.id}`}
      />
      {showSave && <SaveToModal onClose={() => setShowSave(false)} videoId={video.id} />}
    </div>
  );
}

export function Shorts() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  useEffect(() => {
    async function fetchShorts() {
      try {
        // Fetch without where + orderBy to avoid composite index error
        const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        const allVids = snap.docs.map(d => parseVideoData(d.id, d.data()));
        
        let shortsVids = allVids.filter(v => v.isShort || v.category === 'Shorts');
        
        if (shortsVids.length === 0) {
          // Fallback if no shorts exist
          shortsVids = allVids.slice(0, 10);
        }
        
        setVideos(shortsVids);
      } catch (err) {
        console.error("Error fetching shorts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShorts();
  }, []);

  // Using IntersectionObserver instead of onScroll

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-black text-white flex-col gap-4">
        <VideoIcon className="h-12 w-12 text-zinc-500" />
        <p>No Shorts available right now.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100dvh-60px)] sm:h-[calc(100vh-4rem)] bg-black flex justify-center overflow-hidden">
      <div 
        className="w-full h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar flex flex-col"
        style={{ scrollBehavior: 'smooth' }}
      >
        {videos.map((video, index) => (
          <ShortPlayer 
            key={video.id} 
            video={video} 
            isActive={index === activeIndex} 
            isMuted={isMuted}
            toggleMute={() => setIsMuted(!isMuted)}
            onVisible={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

const VideoIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
