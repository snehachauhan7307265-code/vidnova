import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VideoCard } from '../components/video/VideoCard';
import { Filter, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Video } from '../types';
import { parseVideoData } from '../lib/videoUtils';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../utils/cn';

type UploadDateFilter = 'any' | 'today' | 'week' | 'month' | 'year';
type DurationFilter = 'any' | 'short' | 'medium' | 'long';
type ViewsFilter = 'any' | '100k' | '1m';

export function Search() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [dateFilter, setDateFilter] = useState<UploadDateFilter>('any');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('any');
  const [viewsFilter, setViewsFilter] = useState<ViewsFilter>('any');
  const [categoryFilter, setCategoryFilter] = useState<string>('any');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function searchVideos() {
      setLoading(true);
      const q = query(collection(db, 'videos'));
      const snap = await getDocs(q);
      let allFetched = snap.docs.map(d => parseVideoData(d.id, d.data()));
      allFetched = allFetched.filter(v => !v.visibility || v.visibility === 'public');
      
      const cats = Array.from(new Set(allFetched.map(v => v.category).filter(Boolean)));
      setCategories(cats);

      const searchResults = allFetched.filter(v => {
        const lowerQ = queryParam.toLowerCase();
        return (
          (v.title || '').toLowerCase().includes(lowerQ) || 
          (v.channel?.displayName || '').toLowerCase().includes(lowerQ) ||
          (v.description && v.description.toLowerCase().includes(lowerQ)) ||
          (v.category && v.category.toLowerCase().includes(lowerQ))
        );
      });
      
      setAllVideos(searchResults);
      setLoading(false);
    }
    searchVideos();
  }, [queryParam]);

  useEffect(() => {
    let filtered = [...allVideos];

    // Filter by Date
    if (dateFilter !== 'any') {
      const now = new Date();
      filtered = filtered.filter(v => {
        const d = new Date(v.createdAt);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (dateFilter === 'today') return diffDays <= 1;
        if (dateFilter === 'week') return diffDays <= 7;
        if (dateFilter === 'month') return diffDays <= 30;
        if (dateFilter === 'year') return diffDays <= 365;
        return true;
      });
    }

    // Filter by Duration
    if (durationFilter !== 'any') {
      filtered = filtered.filter(v => {
        const parts = v.duration.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        
        if (durationFilter === 'short') return seconds < 240; // < 4 mins
        if (durationFilter === 'medium') return seconds >= 240 && seconds <= 1200; // 4 - 20 mins
        if (durationFilter === 'long') return seconds > 1200; // > 20 mins
        return true;
      });
    }

    // Filter by Views
    if (viewsFilter !== 'any') {
      filtered = filtered.filter(v => {
        if (viewsFilter === '100k') return v.views >= 100000;
        if (viewsFilter === '1m') return v.views >= 1000000;
        return true;
      });
    }

    // Filter by Category
    if (categoryFilter !== 'any') {
      filtered = filtered.filter(v => v.category === categoryFilter);
    }

    setVideos(filtered);
  }, [allVideos, dateFilter, durationFilter, viewsFilter, categoryFilter]);

  const activeFiltersCount = (dateFilter !== 'any' ? 1 : 0) + 
                            (durationFilter !== 'any' ? 1 : 0) + 
                            (viewsFilter !== 'any' ? 1 : 0) + 
                            (categoryFilter !== 'any' ? 1 : 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap gap-2 items-center">
          Search results for <span className="text-primary break-all">"{queryParam}"</span>
        </h1>
        <Button 
          variant={showFilters ? "secondary" : "outline"} 
          className="rounded-full gap-2 shrink-0 relative"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-secondary/50 rounded-2xl p-6 border border-border grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm border-b border-border/50 pb-2 uppercase text-muted-foreground">Upload Date</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { val: 'any', label: 'Any time' },
                    { val: 'today', label: 'Today' },
                    { val: 'week', label: 'This week' },
                    { val: 'month', label: 'This month' },
                    { val: 'year', label: 'This year' }
                  ].map(f => (
                    <label key={f.val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="dateFilter" 
                        checked={dateFilter === f.val} 
                        onChange={() => setDateFilter(f.val as UploadDateFilter)} 
                        className="accent-primary"
                      />
                      <span className={dateFilter === f.val ? "text-foreground font-medium" : "text-muted-foreground"}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm border-b border-border/50 pb-2 uppercase text-muted-foreground">Duration</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { val: 'any', label: 'Any' },
                    { val: 'short', label: 'Under 4 minutes' },
                    { val: 'medium', label: '4 - 20 minutes' },
                    { val: 'long', label: 'Over 20 minutes' }
                  ].map(f => (
                    <label key={f.val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="durationFilter" 
                        checked={durationFilter === f.val} 
                        onChange={() => setDurationFilter(f.val as DurationFilter)} 
                        className="accent-primary"
                      />
                      <span className={durationFilter === f.val ? "text-foreground font-medium" : "text-muted-foreground"}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm border-b border-border/50 pb-2 uppercase text-muted-foreground">Features / Views</h3>
                <div className="flex flex-col gap-2">
                  {[
                    { val: 'any', label: 'Any' },
                    { val: '100k', label: 'Over 100k views' },
                    { val: '1m', label: 'Over 1M views' }
                  ].map(f => (
                    <label key={f.val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="viewsFilter" 
                        checked={viewsFilter === f.val} 
                        onChange={() => setViewsFilter(f.val as ViewsFilter)} 
                        className="accent-primary"
                      />
                      <span className={viewsFilter === f.val ? "text-foreground font-medium" : "text-muted-foreground"}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-sm border-b border-border/50 pb-2 uppercase text-muted-foreground">Category</h3>
                <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input 
                      type="radio" 
                      name="categoryFilter" 
                      checked={categoryFilter === 'any'} 
                      onChange={() => setCategoryFilter('any')} 
                      className="accent-primary"
                    />
                    <span className={categoryFilter === 'any' ? "text-foreground font-medium" : "text-muted-foreground"}>Any</span>
                  </label>
                  {categories.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input 
                        type="radio" 
                        name="categoryFilter" 
                        checked={categoryFilter === c} 
                        onChange={() => setCategoryFilter(c)} 
                        className="accent-primary"
                      />
                      <span className={categoryFilter === c ? "text-foreground font-medium" : "text-muted-foreground"}>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-zinc-500 py-10">Searching...</p>
        ) : videos.length > 0 ? (
          videos.map(video => (
            <VideoCard key={video.id} video={video} layout="list" />
          ))
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground">Try different keywords or remove search filters</p>
            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                className="mt-4 rounded-full"
                onClick={() => {
                  setDateFilter('any');
                  setDurationFilter('any');
                  setViewsFilter('any');
                  setCategoryFilter('any');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
