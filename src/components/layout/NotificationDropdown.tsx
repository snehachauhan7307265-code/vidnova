import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types';
import { Bell, MessageSquare, ThumbsUp, UserPlus, Check, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export function NotificationDropdown() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => {
      handleMarkAsRead(n.id);
    });
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <ThumbsUp className="h-4 w-4 text-primary" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'subscribe': return <UserPlus className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getMessage = (n: Notification) => {
    switch(n.type) {
      case 'like': return `liked your video "${n.videoTitle}"`;
      case 'comment': return `commented on "${n.videoTitle}"`;
      case 'subscribe': return `subscribed to your channel`;
      default: return `interacted with you`;
    }
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Notifications" 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </Button>

      <AnimatePresence>
        {showDropdown && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-xl flex flex-col z-50 origin-top-right overflow-hidden border border-white/10"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/50">
              <h3 className="font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark all as read</button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`flex items-start gap-3 p-4 border-b border-border transition-colors hover:bg-white/5 ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}
                  >
                    <Link to={`/channel/${n.actorId}`} onClick={() => setShowDropdown(false)} className="shrink-0 relative mt-1">
                      <img src={n.actorAvatar} alt={n.actorName} className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                        {getIcon(n.type)}
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <Link to={`/channel/${n.actorId}`} onClick={() => setShowDropdown(false)} className="font-semibold hover:underline">
                          {n.actorName}
                        </Link>{' '}
                        {n.type === 'subscribe' ? (
                          <span className="text-zinc-300">{getMessage(n)}</span>
                        ) : (
                          <Link to={`/watch/${n.videoId}`} onClick={() => setShowDropdown(false)} className="text-zinc-300 hover:text-white transition-colors">
                            {getMessage(n)}
                          </Link>
                        )}
                      </p>
                      <span className="text-xs text-zinc-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {!n.isRead && (
                        <button onClick={() => handleMarkAsRead(n.id)} className="text-zinc-400 hover:text-primary" title="Mark as read">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} className="text-zinc-400 hover:text-red-500" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
