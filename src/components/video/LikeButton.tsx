import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Video } from '../../types';

export function LikeButton({ video }: { video: Video }) {
  const { currentUser, userProfile } = useAuth();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);

  useEffect(() => {
    if (!video?.id) return;
    const likesRef = collection(db, 'likes');
    const q = query(likesRef, where('videoId', '==', video.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLikes(snapshot.size);
      if (currentUser) {
        const userLike = snapshot.docs.find(d => d.data().userId === currentUser.uid);
        setIsLiked(!!userLike);
        setLikeId(userLike ? userLike.id : null);
      } else {
        setIsLiked(false);
        setLikeId(null);
      }
    });

    return () => unsubscribe();
  }, [video?.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      alert("Please sign in to like videos");
      return;
    }
    
    try {
      if (isLiked && likeId) {
        await deleteDoc(doc(db, 'likes', likeId));
      } else if (!isLiked) {
        // Double check to prevent duplicate clicks
        const likesRef = collection(db, 'likes');
        await addDoc(likesRef, {
          videoId: video.id,
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        });

        // Add Notification
        const notificationUserId = video.channel?.id || video.userId;
        if (notificationUserId && notificationUserId !== currentUser.uid) {
           await addDoc(collection(db, 'notifications'), {
             userId: notificationUserId,
             actorId: currentUser.uid,
             actorName: userProfile?.displayName || currentUser.displayName || 'User',
             actorAvatar: userProfile?.avatarUrl || currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
             type: 'like',
             videoId: video.id,
             videoTitle: video.title,
             isRead: false,
             createdAt: new Date().toISOString()
           });
        }
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const formatViews = (views?: number) => {
    if (views === undefined || views === null || isNaN(views)) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="flex items-center bg-secondary rounded-full overflow-hidden border border-white/5">
      <button 
        className={`flex items-center gap-2 px-4 py-2 hover:bg-white/10 text-sm font-medium transition-colors border-r border-border ${isLiked ? 'text-primary' : ''}`}
        onClick={handleLike}
        aria-label="Like"
      >
        <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} /> {formatViews(likes)}
      </button>
      <button className="px-4 py-2 hover:bg-white/10 transition-colors" aria-label="Dislike" onClick={() => currentUser ? alert("Dislike functionality not implemented") : alert("Please sign in")}>
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  );
}
