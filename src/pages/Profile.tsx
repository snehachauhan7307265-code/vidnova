import React, { useState, useEffect, useRef } from 'react';
import { VideoCard } from '../components/video/VideoCard';
import { CheckCircle2, ChevronRight, Settings, Upload as UploadIcon, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { Video } from '../types';
import { uploadToCloudinary } from '../lib/cloudinary';
import { parseVideoData } from '../lib/videoUtils';
import { SubscriberCount } from '../components/video/SubscriberCount';
import { SubscribedChannels } from '../components/video/SubscribedChannels';
import { cn } from '../utils/cn';

export function Profile() {
  const { currentUser, userProfile } = useAuth();
  const [userVideos, setUserVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'subscriptions'>('videos');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Edit states
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'videos'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map(d => parseVideoData(d.id, d.data()));
      
      vids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setUserVideos(vids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !userProfile) return;
    
    try {
      setUploading(true);
      
      let newAvatarUrl = userProfile.avatarUrl;
      let newBannerUrl = userProfile.bannerUrl;

      if (avatarFile) {
        const upload = await uploadToCloudinary(avatarFile, 'image');
        newAvatarUrl = upload.secure_url;
      }

      if (bannerFile) {
        const upload = await uploadToCloudinary(bannerFile, 'image');
        newBannerUrl = upload.secure_url;
      }

      const updates: any = {
        displayName: displayName.trim() || userProfile.displayName,
      };

      if (newAvatarUrl !== userProfile.avatarUrl) updates.avatarUrl = newAvatarUrl;
      if (newBannerUrl !== userProfile.bannerUrl) updates.bannerUrl = newBannerUrl;

      // Update User Doc
      await updateDoc(doc(db, 'users', currentUser.uid), updates);

      // Update all videos authored by this user
      const q = query(collection(db, 'videos'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((videoDoc) => {
          const videoData = videoDoc.data();
          batch.update(videoDoc.ref, {
            channel: {
              ...videoData.channel,
              displayName: updates.displayName,
              avatarUrl: newAvatarUrl
            }
          });
        });
        await batch.commit();
      }

      setIsEditing(false);
      setAvatarFile(null);
      setBannerFile(null);
      setAvatarPreview(null);
      setBannerPreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser || !userProfile) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to view your channel.</div>;
  }

  return (
    <div className="pb-12">
      {/* Banner */}
      <div className="w-full h-40 md:h-56 bg-zinc-900 border-b border-border relative">
        <img 
          src={userProfile.bannerUrl || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2000&q=80"} 
          alt="Banner" 
          className="w-full h-full object-cover mix-blend-overlay opacity-50" 
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center -mt-10 md:-mt-14 mb-8 relative z-10">
          <img 
            src={userProfile.avatarUrl} 
            alt={userProfile.displayName} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background object-cover bg-background shadow-lg" 
          />
          
          <div className="flex-1 mt-2 md:mt-12 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-1">
              {userProfile.displayName}
              {userProfile.verified && <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400 mb-4">
              <span>@{userProfile.username}</span>
              <span><SubscriberCount channelId={userProfile.id} /> subscribers</span>
              <span>{userVideos.length} videos</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" className="rounded-full" onClick={() => setIsEditing(true)}>Customize Channel</Button>
              <Button variant="secondary" className="rounded-full gap-2">Manage Videos</Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 border-b border-border mb-6 overflow-x-auto hide-scrollbar text-sm">
          <button 
            className={cn("py-3 border-b-2 font-medium whitespace-nowrap transition-colors", activeTab === 'videos' ? "border-primary text-foreground" : "border-transparent text-zinc-500 hover:text-foreground")}
            onClick={() => setActiveTab('videos')}
          >
            Videos
          </button>
          <button 
            className={cn("py-3 border-b-2 font-medium whitespace-nowrap transition-colors", activeTab === 'subscriptions' ? "border-primary text-foreground" : "border-transparent text-zinc-500 hover:text-foreground")}
            onClick={() => setActiveTab('subscriptions')}
          >
            Subscriptions
          </button>
        </div>

        <div>
          {activeTab === 'videos' ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-xl font-bold">Latest Videos</h2>
                <ChevronRight className="h-5 w-5 text-zinc-500" />
              </div>
              
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">Loading your videos...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {userVideos.length > 0 ? userVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                  )) : (
                    <p className="text-zinc-500 col-span-full">You haven't uploaded any videos yet.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <SubscribedChannels />
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-md w-full relative">
            <button 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              onClick={() => setIsEditing(false)}
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">Customize Channel</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Channel Name</label>
                <Input 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Profile Picture</label>
                <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarSelect} />
                <div className="flex items-center gap-4">
                  <img src={avatarPreview || userProfile.avatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover bg-zinc-800" />
                  <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={uploading}>
                    Change Avatar
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Channel Banner</label>
                <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={handleBannerSelect} />
                <div className="flex flex-col gap-2">
                  <div className="w-full h-24 bg-zinc-800 rounded-lg overflow-hidden border border-border relative">
                    {(bannerPreview || userProfile.bannerUrl) ? (
                      <img src={bannerPreview || userProfile.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">No banner set</div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => bannerInputRef.current?.click()} disabled={uploading}>
                    Change Banner
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={uploading}>Cancel</Button>
                <Button variant="primary" onClick={handleSaveProfile} disabled={uploading || !displayName.trim()}>
                  {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
