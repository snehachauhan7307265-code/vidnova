import React from 'react';
import { useSubscriberCount } from '../../hooks/useSubscriberCount';

interface SubscriberCountProps {
  channelId: string;
}

export function SubscriberCount({ channelId }: SubscriberCountProps) {
  const subscribers = useSubscriberCount(channelId);

  const formatSubscribers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return <>{formatSubscribers(subscribers)}</>;
}
