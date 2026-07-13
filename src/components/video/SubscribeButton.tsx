import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { User } from '../../types';
import { cn } from '../../utils/cn';

interface SubscribeButtonProps {
  channelId: string;
  channelName: string;
  className?: string;
  showCount?: boolean;
}

export function SubscribeButton({ channelId, channelName, className, showCount = false }: SubscribeButtonProps) {
  const { currentUser, userProfile } = useAuth();
  const [subscribers, setSubscribers] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) return;

    const subQ = query(
      collection(db, 'subscriptions'),
      where('creatorId', '==', channelId)
    );

    const unsubscribe = onSnapshot(subQ, (snapshot) => {
      setSubscribers(snapshot.size);

      if (currentUser) {
        const userSub = snapshot.docs.find(d => d.data().subscriberId === currentUser.uid);
        if (userSub) {
          setIsSubscribed(true);
          setSubscriptionId(userSub.id);
        } else {
          setIsSubscribed(false);
          setSubscriptionId(null);
        }
      } else {
        setIsSubscribed(false);
        setSubscriptionId(null);
      }
    });

    return () => unsubscribe();
  }, [channelId, currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      alert("Please sign in to subscribe");
      return;
    }

    if (!channelId) {
      console.error("No channel ID provided");
      return;
    }

    if (currentUser.uid === channelId) {
      alert("You cannot subscribe to yourself");
      return;
    }

    try {
      if (isSubscribed) {
        // Optimistic update
        setIsSubscribed(false);
        setSubscribers(s => Math.max(0, s - 1));
        const targetId = subscriptionId || `${currentUser.uid}_${channelId}`;
        
        await deleteDoc(doc(db, 'subscriptions', targetId));
      } else {
        // Optimistic update
        setIsSubscribed(true);
        setSubscribers(s => s + 1);
        
        const subId = `${currentUser.uid}_${channelId}`;
        const subRef = doc(db, 'subscriptions', subId);
        await setDoc(subRef, {
          subscriberId: currentUser.uid,
          creatorId: channelId,
          createdAt: new Date().toISOString()
        });

        // Add Notification (fire and forget)
        addDoc(collection(db, 'notifications'), {
          userId: channelId,
          actorId: currentUser.uid,
          actorName: userProfile?.displayName || currentUser.displayName || 'User',
          actorAvatar: userProfile?.avatarUrl || currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
          type: 'subscribe',
          isRead: false,
          createdAt: new Date().toISOString()
        }).catch(console.error);
      }
    } catch (e) {
      console.error("Error subscribing:", e);
    }
  };

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (!channelId) return null;
  if (currentUser?.uid === channelId) {
    return (
       <div className="flex flex-col">
         {showCount && <span className="text-sm font-medium">{formatSubscribers(subscribers)} subscribers</span>}
       </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
       {showCount && <span className="text-sm font-medium mr-2">{formatSubscribers(subscribers)} subscribers</span>}
       <Button 
         variant={isSubscribed ? "secondary" : "primary"} 
         className={cn(isSubscribed ? "" : "px-6 rounded-full", className)}
         onClick={handleSubscribe}
       >
         {isSubscribed ? 'Subscribed' : 'Subscribe'}
       </Button>
    </div>
  );
}
