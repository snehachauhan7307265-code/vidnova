import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, X, Check, Loader2, CheckCircle2, PlaySquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';

export function Upload() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragActive, setDragActive] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('Gaming');
  const [visibility, setVisibility] = useState('public');
  const [isShort, setIsShort] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);

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
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
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
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        thumbnailUrl,
        videoUrl,
        cloudinaryPublicId: videoUpload.public_id,
        userId: currentUser.uid,
        userName: userProfile?.displayName || currentUser.displayName || 'Unknown',
        userEmail: currentUser.email || '',
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
        subscribers: 0,
        comments: 0,
        duration,
        visibility,
        isShort,
        createdAt: serverTimestamp()
      });

      setUploading(false);
      setUploadedVideoId(videoId);
      setStep(3);
      setTimeout(() => navigate(isShort ? `/shorts/${videoId}` : `/watch/${videoId}`), 2000);
    } catch (err: any) {
      console.warn("Publish error:", err);
      setError(err.message || 'An error occurred during publishing');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setStep(1);
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setTitle('');
    setDescription('');
    setTags('');
    setCategory('Gaming');
    setVisibility('public');
    setIsShort(false);
    setProgress(0);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{step === 3 ? 'Video Published' : 'Upload Video'}</h1>
        {step === 2 && !uploading && (
          <Button variant="ghost" size="icon" onClick={handleCancel} aria-label="Cancel Upload">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      {error && <div className="mb-4 p-4 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20">{error}</div>}

      {step === 1 && (
        <div 
          className={`border-2 border-dashed rounded-3xl p-8 md:p-24 flex flex-col items-center justify-center text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-secondary rounded-full flex items-center justify-center mb-8">
            <UploadIcon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Drag and drop video files to upload</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-10">Your videos will be private until you publish them.</p>
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          <Button size="lg" className="rounded-full px-10 py-6 text-lg" onClick={() => fileInputRef.current?.click()}>
            Select Files
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <h2 className="text-xl font-bold mb-6">Details</h2>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-medium" htmlFor="video-title">Title (required)</label>
                <Input 
                  id="video-title" 
                  placeholder="Add a title that describes your video" 
                  className="bg-background/50 text-lg py-6"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={uploading}
                />
              </div>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-medium" htmlFor="video-desc">Description</label>
                <textarea 
                  id="video-desc"
                  className="flex min-h-[160px] w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y disabled:opacity-50"
                  placeholder="Tell viewers about your video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-medium" htmlFor="video-tags">Tags</label>
                <Input 
                  id="video-tags" 
                  placeholder="gaming, tutorial, review (comma separated)" 
                  className="bg-background/50"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div className="flex flex-col gap-2 mb-6">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={uploading}
                >
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
                  <option value="All">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-medium">Thumbnail</label>
                <p className="text-xs text-muted-foreground mb-3">Select or upload a picture that shows what's in your video. A good thumbnail stands out and draws viewers' attention.</p>
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
                    className="w-36 h-24 shrink-0 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors disabled:opacity-50"
                  >
                    <UploadIcon className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Upload thumbnail</span>
                  </button>
                  {thumbnailPreview && (
                    <div className="w-36 h-24 shrink-0 bg-secondary rounded-lg overflow-hidden relative border border-border">
                      <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setThumbnailPreview(null); setThumbnailFile(null); }}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:bg-black transition-colors"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                {videoFile ? (
                   <video
                      src={URL.createObjectURL(videoFile)}
                      className="w-full h-full object-cover opacity-80"
                     controls={false}
                     muted
                     onLoadedMetadata={(e) => {
                       const v = e.target;
                       if (v.videoHeight > v.videoWidth) {
                         setIsShort(true);
                       }
                     }}
                   />
                ) : (
                  <span className="text-white/50 text-sm font-medium">Processing...</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                     <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                        <span className="text-white font-medium">{Math.round(progress)}%</span>
                     </div>
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 bg-secondary/30">
                <div className="text-sm flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Video link</span>
                  <span className="truncate text-blue-400 cursor-pointer hover:underline">
                    {uploading ? 'Processing...' : 'Will be generated after publish'}
                  </span>
                </div>
                <div className="text-sm flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Filename</span>
                  <span className="truncate" title={videoFile?.name}>{videoFile?.name}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl mb-6">
              <h3 className="font-semibold mb-4">Format</h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isShort} onChange={(e) => setIsShort(e.target.checked)} disabled={uploading} className="w-4 h-4 text-primary bg-background border-border rounded" />
                <div className="flex flex-col">
                  <span className="font-medium">Upload as Short</span>
                  <span className="text-xs text-muted-foreground mt-1">Optimized for vertical viewing</span>
                </div>
              </label>
            </div>
            
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-semibold mb-4">Visibility</h3>
              <p className="text-xs text-muted-foreground mb-4">Choose who can see your video</p>
              <div className="flex flex-col gap-4 text-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="private" checked={visibility === 'private'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="mt-1 w-4 h-4 text-primary bg-background border-border" />
                  <div className="flex flex-col">
                    <span className="font-medium">Private</span>
                    <span className="text-xs text-muted-foreground mt-1">Only you and people you choose can watch your video</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="unlisted" checked={visibility === 'unlisted'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="mt-1 w-4 h-4 text-primary bg-background border-border" />
                  <div className="flex flex-col">
                    <span className="font-medium">Unlisted</span>
                    <span className="text-xs text-muted-foreground mt-1">Anyone with the video link can watch your video</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="radio" name="visibility" value="public" checked={visibility === 'public'} onChange={(e) => setVisibility(e.target.value)} disabled={uploading} className="mt-1 w-4 h-4 text-primary bg-background border-border" />
                  <div className="flex flex-col">
                    <span className="font-medium">Public</span>
                    <span className="text-xs text-muted-foreground mt-1">Everyone can watch your video</span>
                  </div>
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
              
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={handleCancel} disabled={uploading}>Cancel</Button>
                <Button variant="primary" onClick={handlePublish} disabled={uploading || !title.trim()} className="px-8">
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</> : 'Publish'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-card p-12 rounded-3xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-10">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Video published!</h2>
          <p className="text-sm text-primary animate-pulse mb-4">Redirecting to video...</p>
          <p className="text-lg text-muted-foreground mb-8">Your video "{title}" has been successfully uploaded and published.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')} className="gap-2">
              Go to Dashboard
            </Button>
            <Button variant="primary" size="lg" onClick={() => navigate(isShort ? `/shorts/${uploadedVideoId}` : `/watch/${uploadedVideoId}`)} className="gap-2">
              <PlaySquare className="h-5 w-5" />
              Watch Video
            </Button>
          </div>
          <div className="mt-8 pt-6 border-t border-border w-full">
             <Button variant="ghost" onClick={handleCancel}>Upload another video</Button>
          </div>
        </div>
      )}
    </div>
  );
}
