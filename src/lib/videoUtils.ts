import { Video } from '../types';

export function parseVideoData(id: string, data: any): Video {
  return {
    id,
    title: data.title || '',
    description: data.description || '',
    thumbnailUrl: data.thumbnailUrl || '',
    videoUrl: data.videoUrl || '',
    views: data.views || 0,
    duration: data.duration || "0:00",
    category: data.category || "All",
    createdAt: data.createdAt || new Date().toISOString(),
    likes: data.likes || 0,
    userId: data.userId || (data.channel && data.channel.id),
    channelName: data.channelName || (data.channel && data.channel.displayName),
    username: data.username || (data.channel && data.channel.username),
    channel: data.channel || {
      id: data.userId || 'unknown',
      username: data.username || 'user',
      displayName: data.channelName || 'Unknown User',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
      subscribers: 0,
      verified: false
    }
  };
}
