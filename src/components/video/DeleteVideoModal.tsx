import React, { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Video } from '../../types';

interface DeleteVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onConfirm: (video: Video) => Promise<void>;
}

export function DeleteVideoModal({ isOpen, onClose, video, onConfirm }: DeleteVideoModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !video) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(video);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1f1f1f] w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Video
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white" disabled={loading}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <p className="text-zinc-300">
            Are you sure you want to delete <span className="font-semibold text-white">"{video.title}"</span>?
          </p>
          <p className="text-sm text-zinc-500">
            This action is permanent and cannot be undone. The video will be removed from your channel and all views/likes will be lost.
          </p>
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-zinc-300 hover:text-white">
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white border-none">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Video
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
