import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Playlist } from '../../types';
import { X, Clock, PlaySquare, Plus, Lock, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SaveToModalProps {
  videoId: string;
  onClose: () => void;
}

export function SaveToModal({ videoId, onClose }: SaveToModalProps) {
  const { currentUser } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [inWatchLater, setInWatchLater] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        // Check Watch Later
        const wlRef = doc(db, 'watchLater', `${currentUser.uid}_${videoId}`);
        const wlSnap = await getDocs(query(collection(db, 'watchLater'), where('userId', '==', currentUser.uid), where('videoId', '==', videoId)));
        setInWatchLater(!wlSnap.empty);

        // Fetch user's playlists
        const q = query(collection(db, 'playlists'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const pl = snap.docs.map(d => ({ id: d.id, ...d.data() } as Playlist));
        setPlaylists(pl);
      } catch (error) {
        console.error("Error fetching save data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser, videoId]);

  const toggleWatchLater = async () => {
    if (!currentUser) return;
    try {
      const docId = `${currentUser.uid}_${videoId}`;
      if (inWatchLater) {
        await deleteDoc(doc(db, 'watchLater', docId));
        setInWatchLater(false);
      } else {
        await setDoc(doc(db, 'watchLater', docId), {
          userId: currentUser.uid,
          videoId,
          timestamp: new Date().toISOString()
        });
        setInWatchLater(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePlaylist = async (playlist: Playlist) => {
    try {
      const isIncluded = playlist.videoIds?.includes(videoId);
      let newVideoIds = playlist.videoIds || [];
      if (isIncluded) {
        newVideoIds = newVideoIds.filter(id => id !== videoId);
      } else {
        newVideoIds.push(videoId);
      }
      await updateDoc(doc(db, 'playlists', playlist.id), {
        videoIds: newVideoIds,
        updatedAt: new Date().toISOString()
      });
      setPlaylists(playlists.map(p => p.id === playlist.id ? { ...p, videoIds: newVideoIds } : p));
    } catch (e) {
      console.error(e);
    }
  };

  const createPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPlaylistName.trim()) return;
    try {
      const newPlaylist = {
        userId: currentUser.uid,
        name: newPlaylistName.trim(),
        isPrivate,
        videoIds: [videoId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'playlists'), newPlaylist);
      setPlaylists([{ id: docRef.id, ...newPlaylist } as Playlist, ...playlists]);
      setShowCreate(false);
      setNewPlaylistName('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Save to...</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : (
            <>
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-secondary rounded-xl transition-colors">
                <input 
                  type="checkbox" 
                  checked={inWatchLater} 
                  onChange={toggleWatchLater} 
                  className="w-4 h-4 accent-primary"
                />
                <span className="flex-1 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Watch Later
                </span>
              </label>

              {playlists.map(pl => (
                <label key={pl.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-secondary rounded-xl transition-colors">
                  <input 
                    type="checkbox" 
                    checked={pl.videoIds?.includes(videoId)} 
                    onChange={() => togglePlaylist(pl)} 
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="flex-1 flex flex-col">
                    <span className="flex items-center gap-2 line-clamp-1 text-sm">
                      <PlaySquare className="h-4 w-4 text-muted-foreground shrink-0" /> {pl.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-6">
                      {pl.isPrivate ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                      {pl.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </span>
                </label>
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-border">
          {showCreate ? (
            <form onSubmit={createPlaylist} className="flex flex-col gap-3">
              <Input 
                placeholder="Playlist Name" 
                value={newPlaylistName} 
                onChange={(e) => setNewPlaylistName(e.target.value)} 
                autoFocus
              />
              <select 
                value={isPrivate ? 'private' : 'public'} 
                onChange={(e) => setIsPrivate(e.target.value === 'private')}
                className="bg-secondary border border-border rounded-xl p-2 text-sm"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="ghost" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={!newPlaylistName.trim()}>Create</Button>
              </div>
            </form>
          ) : (
            <Button variant="ghost" className="w-full gap-2 justify-start" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create new playlist
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
