import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, X, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

import { uploadToCloudinary } from '../lib/cloudinary';

export function Upload() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('All');
  const [visibility, setVisibility] = useState('public');
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateVideo = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file.');
      return false;
    }
    // Limit to 100MB for preview
    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be smaller than 100MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateVideo(file)) {
        setVideoFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // default title
        setStep(2);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateVideo(file)) {
        setVideoFile(file);
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setStep(2);
      }
    }
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image for thumbnail.');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async () => {
    if (!videoFile || !currentUser) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const videoId = doc(collection(db, 'videos')).id;
      
      // Upload Thumbnail (Optional)
      let thumbnailUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
      if (thumbnailFile) {
        const thumbUpload = await uploadToCloudinary(thumbnailFile, 'image');
        thumbnailUrl = thumbUpload.secure_url;
      }

      // Upload Video
      const videoUpload = await uploadToCloudinary(videoFile, 'video', (p) => setProgress(p));
      const videoUrl = videoUpload.secure_url;
      
      const duration = videoUpload.duration 
        ? `${Math.floor(videoUpload.duration / 60)}:${Math.floor(videoUpload.duration % 60).toString().padStart(2, '0')}`
        : "0:00";
          
      // Save to Firestore
      await setDoc(doc(db, 'videos', videoId), {
        id: videoId,
        title,
        description,
        thumbnailUrl,
        videoUrl,
        cloudinaryPublicId: videoUpload.public_id,
        userId: currentUser.uid,
        username: userProfile?.username || 'user',
        channelName: userProfile?.displayName || 'Unknown',
        channel: {
          id: userProfile?.id || currentUser.uid,
          username: userProfile?.username || 'user',
          displayName: userProfile?.displayName || 'Unknown',
          avatarUrl: userProfile?.avatarUrl || '',
          subscribers: userProfile?.subscribers || 0,
          verified: userProfile?.verified || false
        },
        category,
        views: 0,
        likes: 0,
        comments: 0,
        duration,
        visibility, 
        createdAt: new Date().toISOString()
      });

      setUploading(false);
      navigate(`/watch/${videoId}`);
    } catch (err: any) {
      console.warn("Publish error:", err);
      setError(err.message || 'An error occurred during publishing');
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Upload Video</h1>
        {step === 2 && !uploading && (
          <Button variant="ghost" size="icon" onClick={() => {
            setStep(1);
            setVideoFile(null);
          }} aria-label="Cancel Upload">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {error && <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20">{error}</div>}

      {step === 1 ? (
        <div 
          className={`border-2 border-dashed rounded-3xl p-8 md:p-16 flex flex-col items-center justify-center text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
            <UploadIcon className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Drag and drop video files to upload</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8">Your videos will be private until you publish them.</p>
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          <Button size="lg" className="rounded-full px-8" onClick={() => fileInputRef.current?.click()}>
            Select Files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-4 md:p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">Details</h2>
              
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium" htmlFor="video-title">Title (required)</label>
                <Input 
                  id="video-title" 
                  placeholder="Add a title that describes your video" 
                  className="bg-background/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                />
              </div>
              
              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium" htmlFor="video-desc">Description</label>
                <textarea 
                  id="video-desc"
                  className="flex min-h-[120px] w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y disabled:opacity-50"
                  placeholder="Tell viewers about your video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={uploading}
                >
                  <option value="All">All</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Live">Live</option>
                  <option value="Programming">Programming</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Cooking">Cooking</option>
                  <option value="Podcasts">Podcasts</option>
                  <option value="News">News</option>
                  <option value="Sports">Sports</option>
                  <option value="Learning">Learning</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium">Thumbnail</label>
                <p className="text-xs text-muted-foreground mb-2">Select or upload a picture that shows what's in your video.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={thumbInputRef} 
                  onChange={handleThumbSelect} 
                />
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  <button 
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploading}
                    className="w-32 h-20 shrink-0 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <UploadIcon className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                  </button>
                  {thumbnailPreview && (
                    <div className="w-32 h-20 shrink-0 bg-secondary rounded-lg overflow-hidden relative border border-border">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }}
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1 hover:bg-black"
                        disabled={uploading}
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {videoFile ? (
                   <video 
                     src={URL.createObjectURL(videoFile)} 
                     className="w-full h-full object-cover opacity-50"
                   />
                ) : (
                  <span className="text-white/50 text-sm font-medium">Processing...</span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-1">
                  <span>Filename</span>
                  <span className="truncate max-w-[150px]" title={videoFile?.name}>{videoFile?.name}</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-1">
                  <span>Size</span>
                  <span>{videoFile ? (videoFile.size / (1024 * 1024)).toFixed(2) : 0} MB</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold mb-4">Visibility</h3>
              <div className="flex flex-col gap-3 text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="w-4 h-4 text-primary bg-background border-border" />
                  <span>Private</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="unlisted" checked={visibility === 'unlisted'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="w-4 h-4 text-primary bg-background border-border" />
                  <span>Unlisted</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="w-4 h-4 text-primary bg-background border-border" />
                  <span>Public</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col mt-auto gap-4">
              {uploading && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => { setStep(1); setVideoFile(null); }} disabled={uploading}>Cancel</Button>
                <Button variant="primary" onClick={handlePublish} disabled={uploading || !title.trim()}>
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing</> : 'Publish'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
