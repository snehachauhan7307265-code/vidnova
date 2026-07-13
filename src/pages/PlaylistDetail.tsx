import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Playlist, Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { VideoCard } from '../components/video/VideoCard';
import { Button } from '../components/ui/Button';
import { Play, Shuffle, Lock, Globe, Edit2, Trash2 } from 'lucide-react';
import { Input } from '../components/ui/Input';

export function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    async function fetchPlaylist() {
      if (!id) return;
      try {
        const docRef = doc(db, 'playlists', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setPlaylist(null);
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as Playlist;
        
        if (data.isPrivate && data.userId !== currentUser?.uid) {
          setPlaylist(null);
          setLoading(false);
          return;
        }

        setPlaylist(data);
        setEditName(data.name);

        if (data.videoIds && data.videoIds.length > 0) {
          const videosData: Video[] = [];
          for (let i = 0; i < data.videoIds.length; i += 10) {
            const chunk = data.videoIds.slice(i, i + 10);
            const vq = query(collection(db, 'videos'), where('__name__', 'in', chunk));
            const vSnap = await getDocs(vq);
            vSnap.docs.forEach(d => {
              videosData.push(parseVideoData(d.id, d.data()));
            });
          }
          const sorted = data.videoIds.map((vid: any) => videosData.find(v => v.id === vid)).filter(Boolean) as Video[];
          setVideos(sorted);
        }
      } catch (error) {
        console.error("Error fetching playlist:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylist();
  }, [id, currentUser]);

  const saveEdit = async () => {
    if (!playlist || !editName.trim() || !id) return;
    try {
      await updateDoc(doc(db, 'playlists', id), {
        name: editName.trim(),
        updatedAt: new Date().toISOString()
      });
      setPlaylist({ ...playlist, name: editName.trim() });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deletePl = async () => {
    if (!id || !confirm("Delete this playlist?")) return;
    try {
      await deleteDoc(doc(db, 'playlists', id));
      navigate('/playlists');
    } catch (e) {
      console.error(e);
    }
  };

  const removeVideo = async (videoId: string) => {
    if (!playlist || !id) return;
    try {
      const newVideoIds = playlist.videoIds.filter(v => v !== videoId);
      await updateDoc(doc(db, 'playlists', id), {
        videoIds: newVideoIds,
        updatedAt: new Date().toISOString()
      });
      setPlaylist({ ...playlist, videoIds: newVideoIds });
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading playlist...</div>;
  if (!playlist) return <div className="p-8 text-center text-muted-foreground">Playlist not found or is private.</div>;

  const isOwner = currentUser?.uid === playlist.userId;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Sidebar Info */}
      <div className="w-full lg:w-[350px] shrink-0 bg-secondary/50 rounded-2xl p-6 flex flex-col gap-4 border border-white/5 h-fit lg:sticky lg:top-24">
        <div className="aspect-video bg-black/50 rounded-xl overflow-hidden relative">
          {videos.length > 0 ? (
            <img src={videos[0].thumbnailUrl} alt={playlist.name} className="w-full h-full object-cover opacity-80 blur-[2px] scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {videos.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
               <img src={videos[0].thumbnailUrl} alt={playlist.name} className="w-3/4 aspect-video object-cover rounded-lg shadow-2xl" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <Input 
                value={editName} 
                onChange={(e: any) => setEditName(e.target.value)}
                className="font-bold text-xl"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditName(playlist.name); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold break-words">{playlist.name}</h1>
              {isOwner && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="shrink-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {videos.length} videos
            </span>
            <span className="flex items-center gap-1">
              {playlist.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              {playlist.isPrivate ? 'Private' : 'Public'}
            </span>
            <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button className="flex-1 gap-2 rounded-full" disabled={videos.length === 0} onClick={() => navigate(`/watch/${videos[0]?.id}`)}>
            <Play className="h-4 w-4 fill-current" /> Play All
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full shrink-0" disabled={videos.length === 0}>
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>

        {isOwner && (
          <Button variant="ghost" className="mt-4 gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 justify-start" onClick={deletePl}>
            <Trash2 className="h-4 w-4" /> Delete playlist
          </Button>
        )}
      </div>

      {/* Videos List */}
      <div className="flex-1 flex flex-col gap-4">
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-2 group">
              <span className="text-muted-foreground font-medium w-6 text-center">{index + 1}</span>
              <div className="flex-1">
                <VideoCard video={video} layout="list" />
              </div>
              {isOwner && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
                  onClick={() => removeVideo(video.id)}
                  title="Remove from playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No videos in this playlist yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
