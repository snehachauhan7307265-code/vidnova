import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Video } from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
}

export function EditVideoModal({ isOpen, onClose, video }: EditVideoModalProps) {
  const [title, setTitle] = useState(video?.title || '');
  const [description, setDescription] = useState(video?.description || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnailUrl || '');
  const [visibility, setVisibility] = useState(video?.visibility || 'public');
  const [category, setCategory] = useState(video?.category || 'Entertainment');
  const [loading, setLoading] = useState(false);

  // Update state when video changes
  React.useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setThumbnailUrl(video.thumbnailUrl || '');
      setVisibility(video.visibility || 'public');
      setCategory(video.category || 'Entertainment');
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, {
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        visibility,
        category
      });
      toast.success('Video updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1f1f1f] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Edit Video details</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[80vh]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Title (required)</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[120px] resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Thumbnail URL</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="https://..."
            />
            {thumbnailUrl && (
              <div className="mt-2 aspect-video w-48 rounded-xl overflow-hidden border border-white/10">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="Entertainment">Entertainment</option>
              <option value="Education">Education</option>
              <option value="Music">Music</option>
              <option value="Gaming">Gaming</option>
              <option value="Technology">Technology</option>
              <option value="Sports">Sports</option>
              <option value="News">News</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Visibility</label>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || !title.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}