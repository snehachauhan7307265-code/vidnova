export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscribers: number;
  verified?: boolean;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string; // For later when actual video plays
  cloudinaryPublicId?: string;
  channel?: User;
  userId?: string;
  channelName?: string;
  username?: string;
  views: number;
  createdAt: string;
  duration: string;
  description?: string;
  likes?: number;
  category: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  user: User;
  likes?: number;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  isPrivate: boolean;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  videoId: string;
  progress: number;
  timestamp: string;
}

export interface WatchLater {
  id: string;
  userId: string;
  videoId: string;
  timestamp: string;
}

export type NotificationType = 'like' | 'comment' | 'subscribe';

export interface Notification {
  id: string;
  userId: string; // The user who receives the notification
  actorId: string; // The user who performed the action
  actorName: string;
  actorAvatar: string;
  type: NotificationType;
  videoId?: string;
  videoTitle?: string;
  commentId?: string;
  isRead: boolean;
  createdAt: string;
}
