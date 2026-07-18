import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useSubscriberCount } from '../hooks/useSubscriberCount';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { EditVideoModal } from '../components/video/EditVideoModal';
import { DeleteVideoModal } from '../components/video/DeleteVideoModal';
import { Eye, ThumbsUp, MessageSquare, UserPlus, PlaySquare, Edit2, Trash2, Globe, Lock, Loader2, Image as ImageIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { deleteFromCloudinary } from '../lib/cloudinary';

export function Dashboard() {
  const { currentUser } = useAuth();
  const subscriberCount = useSubscriberCount(currentUser?.uid);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalComments, setTotalComments] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<'7' | '30'>('7');
  const [videoToEdit, setVideoToEdit] = useState<Video | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'videos'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, async (snap) => {
      const vids = snap.docs.map(d => parseVideoData(d.id, d.data()));
      vids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVideos(vids);
      
      let commentsCount = 0;
      for (const v of vids) {
        const cQ = query(collection(db, 'videos', v.id, 'comments'));
        const cSnap = await getDocs(cQ);
        commentsCount += cSnap.size;
      }
      setTotalComments(commentsCount);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDelete = async (video: Video) => {
    
    setDeletingId(video.id);
    try {
      if (video.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(video.cloudinaryPublicId, 'video');
        } catch (err) {
          console.warn("Could not delete from cloudinary (might be already deleted)", err);
        }
      }
      await deleteDoc(doc(db, 'videos', video.id));
      toast.success('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setDeletingId(null);
    }
  };

  const chartData = useMemo(() => {
    const days = chartPeriod === '7' ? 7 : 30;
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      let dayViews = 0;
      videos.forEach(v => {
        if (v.dailyViews && v.dailyViews[dateStr]) {
          dayViews += v.dailyViews[dateStr];
        }
      });
      
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: dayViews
      });
    }
    return data;
  }, [videos, chartPeriod]);

  if (!currentUser) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view your dashboard.</div>;
  }

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full mb-16 sm:mb-0">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Channel dashboard</h1>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-[#1f1f1f] p-4 sm:p-6 rounded-xl border border-white/10 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <PlaySquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="font-medium text-xs sm:text-sm">Videos</h3>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{videos.length}</p>
        </div>
        <div className="bg-[#1f1f1f] p-4 sm:p-6 rounded-xl border border-white/10 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="font-medium text-xs sm:text-sm">Views</h3>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-[#1f1f1f] p-4 sm:p-6 rounded-xl border border-white/10 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="font-medium text-xs sm:text-sm">Likes</h3>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{totalLikes.toLocaleString()}</p>
        </div>
        <div className="bg-[#1f1f1f] p-4 sm:p-6 rounded-xl border border-white/10 flex flex-col gap-1 sm:gap-2">
          <div className="flex items-center gap-2 text-zinc-400">
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="font-medium text-xs sm:text-sm">Subscribers</h3>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{subscriberCount.toLocaleString()}</p>
        </div>
        <div className="bg-[#1f1f1f] p-4 sm:p-6 rounded-xl border border-white/10 flex flex-col gap-1 sm:gap-2 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <h3 className="font-medium text-xs sm:text-sm">Comments</h3>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-[#1f1f1f] rounded-xl border border-white/10 p-4 sm:p-6 mb-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">Views over time</h2>
          <div className="flex gap-2 bg-black/40 p-1 rounded-lg border border-white/5 w-fit">
            <button
              onClick={() => setChartPeriod('7')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${chartPeriod === '7' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setChartPeriod('30')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${chartPeriod === '30' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Last 30 days
            </button>
          </div>
        </div>
        <div className="h-[250px] sm:h-[300px] w-full -ml-4 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-[#1f1f1f] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-lg sm:text-xl font-bold text-white">Channel content</h2>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-sm">
                <th className="p-4 font-medium w-[40%]">Video</th>
                <th className="p-4 font-medium">Visibility</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Views</th>
                <th className="p-4 font-medium">Likes</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading content...
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500">
                    You have not uploaded any videos yet.
                  </td>
                </tr>
              ) : (
                videos.map(video => (
                  <tr key={video.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex gap-4 items-center">
                        <div className="relative w-32 aspect-video rounded-md overflow-hidden shrink-0 bg-zinc-800">
                          {video.thumbnailUrl ? (
                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-zinc-500" /></div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium text-white">
                            {video.duration}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-1">{video.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        {video.visibility === 'private' ? (
                          <><Lock className="h-4 w-4 text-zinc-400" /><span className="text-zinc-400">Private</span></>
                        ) : (
                          <><Globe className="h-4 w-4 text-green-500" /><span className="text-green-500">Public</span></>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-zinc-300">{video.views.toLocaleString()}</td>
                    <td className="p-4 text-sm text-zinc-300">{(video.likes || 0).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVideoToEdit(video)}
                          className="text-zinc-300 hover:text-white hover:bg-white/10"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVideoToDelete(video)}
                          disabled={deletingId === video.id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {deletingId === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobile Video List */}
        <div className="md:hidden">
          {loading ? (
             <div className="p-8 text-center text-zinc-500">
               <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
               Loading content...
             </div>
          ) : videos.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              You have not uploaded any videos yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {videos.map(video => (
                <div key={video.id} className="p-4 border-b border-white/5 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="relative w-28 aspect-video rounded-md overflow-hidden shrink-0 bg-zinc-800">
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-zinc-500" /></div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-medium text-white">
                        {video.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white line-clamp-2 mb-1">{video.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <span>{video.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {video.visibility === 'private' ? (
                          <><Lock className="h-3 w-3 text-zinc-400" /><span className="text-zinc-400">Private</span></>
                        ) : (
                          <><Globe className="h-3 w-3 text-green-500" /><span className="text-green-500">Public</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoToEdit(video)}
                      className="text-zinc-300 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoToDelete(video)}
                      disabled={deletingId === video.id}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {deletingId === video.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditVideoModal 
        isOpen={!!videoToEdit} 
        onClose={() => setVideoToEdit(null)} 
        video={videoToEdit} 
      />
      <DeleteVideoModal
        isOpen={!!videoToDelete}
        onClose={() => setVideoToDelete(null)}
        video={videoToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
