import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useSubscriberCount(channelId: string | undefined) {
  const [subscribers, setSubscribers] = useState(0);

  useEffect(() => {
    if (!channelId) return;

    const subQ = query(
      collection(db, 'subscriptions'),
      where('creatorId', '==', channelId)
    );

    const unsubscribe = onSnapshot(subQ, (snapshot) => {
      setSubscribers(snapshot.size);
    });

    return () => unsubscribe();
  }, [channelId]);

  return subscribers;
}
