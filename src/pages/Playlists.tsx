import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Playlist } from '../types';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Plus, PlaySquare, Lock, Globe, Trash2 } from 'lucide-react';

export function PlaylistsPage() {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylists() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'playlists'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
        items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setPlaylists(items);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlaylists();
  }, [currentUser]);

  const createPlaylist = async () => {
    if (!currentUser) return;
    const name = prompt("Enter playlist name:");
    if (!name?.trim()) return;

    try {
      const newPlaylist = {
        userId: currentUser.uid,
        name: name.trim(),
        isPrivate: true,
        videoIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'playlists'), newPlaylist);
      setPlaylists([{ id: docRef.id, ...newPlaylist } as Playlist, ...playlists]);
    } catch (e) {
      console.error(e);
    }
  };

  const deletePl = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    
    try {
      await deleteDoc(doc(db, 'playlists', id));
      setPlaylists(playlists.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Playlists</h1>
        <Button onClick={createPlaylist} className="gap-2 rounded-full">
          <Plus className="h-4 w-4" /> New Playlist
        </Button>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading playlists...</p>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map(playlist => (
            <Link key={playlist.id} to={`/playlists/${playlist.id}`} className="group flex flex-col gap-2 relative">
              <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                <PlaySquare className="h-10 w-10 text-muted-foreground/50" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-medium flex items-center gap-2">
                    <PlaySquare className="h-5 w-5" /> Play All
                  </span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
                  {playlist.videoIds?.length || 0} videos
                </div>
                
                <button 
                  onClick={(e) => deletePl(e, playlist.id)}
                  className="absolute top-2 right-2 bg-black/80 p-1.5 rounded text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-2">{playlist.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {playlist.isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {playlist.isPrivate ? 'Private' : 'Public'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-xl font-bold mb-2">No playlists found.</h2>
          <p className="text-muted-foreground">Create a playlist to organize your favorite videos.</p>
        </div>
      )}
    </div>
  );
}
