import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, X } from 'lucide-react';
import { Input } from '../ui/Input';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface Suggestion {
  id: string;
  type: 'recent' | 'video';
  text: string;
  docId?: string; // For deleting recent searches
}

export function SearchBox({ mobile = false, onClose }: { mobile?: boolean, onClose?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchSuggestions() {
      if (!searchQuery.trim()) {
        // Fetch recent searches if empty
        if (currentUser) {
          const q = query(
            collection(db, 'searchHistory'),
            where('userId', '==', currentUser.uid)
          );
          try {
            const snap = await getDocs(q);
            let recents = snap.docs.map(d => ({
              id: d.data().query + '-recent',
              type: 'recent' as const,
              text: d.data().query,
              docId: d.id,
              timestamp: d.data().timestamp
            }));
            
            // Sort client-side to avoid needing a composite index
            recents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            recents = recents.slice(0, 5);
            
            setSuggestions(recents);
          } catch (e) {
            console.error(e);
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
        return;
      }

      // Fetch videos for suggestions
      const qVideos = query(collection(db, 'videos'), limit(20)); // Limit to 20 to filter client side for prefix matches
      try {
        const snap = await getDocs(qVideos);
        const lowerQuery = searchQuery.toLowerCase();
        const matches = snap.docs
          .map(d => d.data().title as string)
          .filter(title => title.toLowerCase().includes(lowerQuery))
          .slice(0, 8); // Top 8 suggestions

        setSuggestions(matches.map(m => ({ id: m + '-video', type: 'video' as const, text: m })));
      } catch (e) {
        console.error(e);
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentUser]);

  const handleSearch = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;
    
    setShowSuggestions(false);
    
    // Save to history
    if (currentUser) {
      try {
        await addDoc(collection(db, 'searchHistory'), {
          userId: currentUser.uid,
          query: text,
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save search history", e);
      }
    }
    
    if (onClose) onClose();
    navigate(`/search?q=${encodeURIComponent(text)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        handleSearch(suggestions[focusedIndex].text);
      } else {
        handleSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const removeRecent = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'searchHistory', docId));
      setSuggestions(prev => prev.filter(s => s.docId !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="font-bold text-primary">{part}</span> : <span key={i}>{part}</span>
        )}
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className={cn("w-full relative group", mobile ? "" : "flex items-center")}>
      <div className={cn("relative w-full flex items-center", mobile ? "h-full" : "")}>
        <div className="absolute left-4 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" aria-hidden="true" />
        </div>
        <Input 
          type="search" 
          placeholder="Search masterpieces..." 
          className={cn(
            "pl-12 pr-5 w-full bg-secondary border-muted focus:border-primary/50 transition-all",
            mobile ? "h-12 border-0 rounded-none bg-background text-lg" : "rounded-full"
          )}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search query"
        />
        {mobile && (
          <button onClick={onClose} className="absolute right-4 p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={cn(
          "absolute z-50 bg-background border border-border shadow-xl overflow-hidden",
          mobile ? "top-12 left-0 right-0 border-x-0 border-b-0 h-[calc(100vh-3rem)]" : "top-full left-0 right-0 mt-1 rounded-2xl"
        )}>
          <ul className="py-2">
            {suggestions.map((suggestion, index) => (
              <li 
                key={suggestion.id}
                className={cn(
                  "px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors",
                  index === focusedIndex ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => handleSearch(suggestion.text)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {suggestion.type === 'recent' ? (
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">
                    {renderHighlightedText(suggestion.text, searchQuery)}
                  </span>
                </div>
                {suggestion.type === 'recent' && suggestion.docId && (
                  <button 
                    onClick={(e) => removeRecent(e, suggestion.docId!)}
                    className="p-1 text-muted-foreground hover:text-foreground shrink-0 ml-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
