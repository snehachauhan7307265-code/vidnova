import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { SubscriberCount } from './SubscriberCount';
import { SubscribeButton } from './SubscribeButton';

export function SubscribedChannels() {
  const { currentUser } = useAuth();
  const [channels, setChannels] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const subQ = query(
          collection(db, 'subscriptions'),
          where('subscriberId', '==', currentUser.uid)
        );
        const subSnap = await getDocs(subQ);
        
        const channelIds = subSnap.docs.map(d => d.data().creatorId || d.data().channelId);
        
        if (channelIds.length === 0) {
          setChannels([]);
          setLoading(false);
          return;
        }

        const channelPromises = channelIds.map(async (id) => {
          const channelDoc = await getDoc(doc(db, 'users', id));
          if (channelDoc.exists()) {
            return { id: channelDoc.id, ...channelDoc.data() } as User;
          }
          return null;
        });

        const fetchedChannels = (await Promise.all(channelPromises)).filter((c): c is User => c !== null);
        setChannels(fetchedChannels);
      } catch (e) {
        console.error("Error fetching subscriptions:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [currentUser]);

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Loading subscriptions...</div>;
  }

  if (channels.length === 0) {
    return <div className="text-center py-10 text-zinc-500">You haven't subscribed to any channels yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {channels.map(channel => (
        <div key={channel.id} className="flex flex-col items-center p-6 bg-zinc-900 rounded-xl border border-white/5 text-center transition-transform hover:scale-105">
          <Link to={`/channel/${channel.id}`} className="flex flex-col items-center group">
            <img 
              src={channel.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'} 
              alt={channel.displayName} 
              className="w-24 h-24 rounded-full mb-4 object-cover ring-2 ring-transparent group-hover:ring-primary transition-all" 
            />
            <h3 className="font-bold text-lg flex items-center gap-1 justify-center mb-1">
              {channel.displayName}
              {channel.verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </h3>
            <div className="text-sm text-zinc-400 mb-4">
              <SubscriberCount channelId={channel.id} /> subscribers
            </div>
          </Link>
          <SubscribeButton channelId={channel.id} channelName={channel.displayName} />
        </div>
      ))}
    </div>
  );
}
