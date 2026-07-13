import React from 'react';
import { Link } from 'react-router-dom';
import { Video } from '../../types';
import { CheckCircle2, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/Button';

interface VideoCardProps {
  video: Video;
  layout?: 'grid' | 'list';
  key?: React.Key;
}

export function VideoCard({ video, layout = 'grid' }: VideoCardProps) {
  const formatViews = (views?: number) => {
    if (views === undefined || views === null || isNaN(views)) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (layout === 'list') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 group cursor-pointer"
      >
        <Link to={`/watch/${video.id}`} className="relative aspect-video sm:w-64 md:w-80 shrink-0 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-3 right-3 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur">
            {video.duration}
          </div>
        </Link>
        
        <div className="flex flex-col flex-1 py-1">
          <Link to={`/watch/${video.id}`} className="text-sm sm:text-base font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </Link>
          <div className="text-[11px] text-zinc-600 mt-1 mb-2 flex items-center gap-1">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{video.createdAt}</span>
          </div>
          
          <Link to={`/channel/${video.channel?.id || video.userId}`} className="flex items-center gap-2 mb-3">
            <img src={video.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${video.channel?.displayName || video.channelName || 'User'}`} alt={video.channel?.displayName || video.channelName || 'Unknown'} className="h-6 w-6 rounded-full bg-zinc-800" />
            <span className="text-xs text-zinc-500 hover:text-foreground transition-colors flex items-center gap-1">
              {video.channel?.displayName || video.channelName || 'Unknown'}
              {video.channel?.verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
            </span>
          </Link>

          <p className="text-xs text-zinc-500 line-clamp-2 hidden sm:block">
            {video.description}
          </p>
        </div>
        
        <div className="hidden sm:block">
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-5 w-5 text-zinc-400" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Grid layout
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-3 group cursor-pointer"
    >
      <Link to={`/watch/${video.id}`} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title} 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-3 right-3 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur">
          {video.duration}
        </div>
      </Link>
      
      <div className="flex gap-3 mt-1 relative pr-6">
        <Link to={`/channel/${video.channel?.id || video.userId}`} className="shrink-0 mt-0.5">
          <img src={video.channel?.avatarUrl || `https://ui-avatars.com/api/?name=${video.channel?.displayName || video.channelName || 'User'}`} alt={video.channel?.displayName || video.channelName || 'Unknown'} className="h-10 w-10 rounded-full object-cover bg-zinc-800" />
        </Link>
        <div className="flex flex-col">
          <Link to={`/watch/${video.id}`} className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </Link>
          <Link to={`/channel/${video.channel?.id || video.userId}`} className="text-xs text-zinc-500 hover:text-foreground transition-colors mt-1 flex items-center gap-1">
            {video.channel?.displayName || video.channelName || 'Unknown'}
            {video.channel?.verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
          </Link>
          <div className="text-[11px] text-zinc-600 flex items-center gap-1 mt-0.5">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{video.createdAt}</span>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2">
          <MoreVertical className="h-5 w-5 text-zinc-400" />
        </Button>
      </div>
    </motion.div>
  );
}
