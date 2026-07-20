import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Comment, Video } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { Edit2, Trash2 } from 'lucide-react';

export function Comments({ video }: { video: Video }) {
  const videoId = video.id;
  const { currentUser, userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // For replies and editing
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!videoId) return;
    const commentsRef = collection(db, 'videos', videoId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Comment[];
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [videoId]);

  const handlePostComment = async () => {
    if (!currentUser || !userProfile || !newComment.trim()) return;
    try {
      const commentsRef = collection(db, 'videos', videoId, 'comments');
      const docRef = await addDoc(commentsRef, {
        videoId,
        userId: currentUser.uid,
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        user: {
          id: userProfile.id,
          username: userProfile.displayName?.toLowerCase()?.replace(/\s+/g, '') || 'user',
          displayName: userProfile.displayName,
          avatarUrl: userProfile.avatarUrl,
          subscribers: userProfile.subscribers || 0
        }
      });
      setNewComment('');

      // Add Notification
      const notificationUserId = video.channel?.id || video.userId;
      if (notificationUserId && notificationUserId !== currentUser.uid) {
         await addDoc(collection(db, 'notifications'), {
           userId: notificationUserId,
           actorId: currentUser.uid,
           actorName: userProfile?.displayName || currentUser.displayName || 'User',
           actorAvatar: userProfile?.avatarUrl || currentUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
           type: 'comment',
           videoId: video.id,
           videoTitle: video.title,
           commentId: docRef.id,
           isRead: false,
           createdAt: new Date().toISOString()
         });
      }
    } catch (e) {
      console.error("Error posting comment:", e);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!currentUser || !userProfile || !replyText.trim()) return;
    try {
      const commentsRef = collection(db, 'videos', videoId, 'comments');
      await addDoc(commentsRef, {
        videoId,
        userId: currentUser.uid,
        text: replyText.trim(),
        parentId,
        createdAt: new Date().toISOString(),
        user: {
          id: userProfile.id,
          username: userProfile.displayName?.toLowerCase()?.replace(/\s+/g, '') || 'user',
          displayName: userProfile.displayName,
          avatarUrl: userProfile.avatarUrl,
          subscribers: userProfile.subscribers || 0
        }
      });
      setActiveReplyId(null);
      setReplyText('');
    } catch (e) {
      console.error("Error posting reply:", e);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await deleteDoc(doc(db, 'videos', videoId, 'comments', commentId));
    } catch (e) {
      console.error("Error deleting comment:", e);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await updateDoc(doc(db, 'videos', videoId, 'comments', commentId), {
        text: editText.trim(),
        updatedAt: new Date().toISOString()
      });
      setEditingId(null);
      setEditText('');
    } catch (e) {
      console.error("Error updating comment:", e);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Group comments
  const rootComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-6">{comments.length} Comments</h2>
      
      {/* Add main comment */}
      <div className="flex gap-4 mb-8">
        <div className="w-10 h-10 rounded-full mt-1 shrink-0 bg-zinc-800 flex items-center justify-center overflow-hidden">
          {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} alt="You" className="w-full h-full object-cover" /> : <div className="text-white text-xs">U</div>}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Input 
            type="text" 
            placeholder={currentUser ? "Add a comment..." : "Sign in to comment..."}
            className="border-0 border-b border-border rounded-none bg-transparent px-0 focus:border-primary/50 focus:ring-0 disabled:opacity-50"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!currentUser}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePostComment();
            }}
          />
          {newComment.trim() && (
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setNewComment('')}>Cancel</Button>
              <Button variant="primary" size="sm" className="rounded-full" onClick={handlePostComment}>Comment</Button>
            </div>
          )}
        </div>
      </div>

      {/* List comments */}
      <div className="flex flex-col gap-6">
        {rootComments.map(comment => {
          const commentReplies = replies.filter(r => r.parentId === comment.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return (
            <div key={comment.id} className="flex gap-4 group">
              <Link to={`/channel/${comment.user?.id}`} className="shrink-0">
                <img src={comment.user?.avatarUrl} alt={comment.user?.displayName} className="w-10 h-10 rounded-full mt-1 bg-zinc-800 object-cover" />
              </Link>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/channel/${comment.user?.id}`} className="font-semibold text-sm">@{comment.user?.username || 'user'}</Link>
                  <span className="text-xs text-zinc-500">{formatDate(comment.createdAt)} {comment.updatedAt && '(edited)'}</span>
                </div>
                
                {editingId === comment.id ? (
                  <div className="flex flex-col gap-2 mt-1">
                    <Input 
                      type="text" 
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="border-0 border-b border-border rounded-none bg-transparent px-0 focus:border-primary/50 focus:ring-0"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      <Button variant="primary" size="sm" onClick={() => handleEdit(comment.id)}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.text}</p>
                )}

                <div className="flex items-center gap-4 mt-2">
                  <button 
                    className="text-xs font-semibold text-zinc-400 hover:text-white"
                    onClick={() => {
                      if (!currentUser) return;
                      setActiveReplyId(activeReplyId === comment.id ? null : comment.id);
                      setReplyText('');
                    }}
                  >
                    Reply
                  </button>

                  {currentUser?.uid === comment.userId && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs text-zinc-400 hover:text-white" onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.text);
                      }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="text-xs text-zinc-400 hover:text-destructive" onClick={() => handleDelete(comment.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                {activeReplyId === comment.id && (
                  <div className="flex gap-3 mt-4">
                     <img src={userProfile?.avatarUrl} alt="You" className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                     <div className="flex-1 flex flex-col gap-2">
                      <Input 
                        type="text" 
                        placeholder="Add a reply..."
                        className="border-0 border-b border-border rounded-none bg-transparent px-0 focus:border-primary/50 focus:ring-0 text-sm h-8"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReply(comment.id);
                        }}
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveReplyId(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => handleReply(comment.id)}>Reply</Button>
                      </div>
                     </div>
                  </div>
                )}

                {/* Nested Replies */}
                {commentReplies.length > 0 && (
                  <div className="flex flex-col gap-4 mt-4 ml-4 pl-4 border-l border-white/10">
                    {commentReplies.map(reply => (
                      <div key={reply.id} className="flex gap-3 group/reply">
                        <Link to={`/channel/${reply.user?.id}`} className="shrink-0">
                          <img src={reply.user?.avatarUrl} alt={reply.user?.displayName} className="w-8 h-8 rounded-full bg-zinc-800 object-cover" />
                        </Link>
                        <div className="flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link to={`/channel/${reply.user?.id}`} className="font-semibold text-xs">@{reply.user?.username || 'user'}</Link>
                            <span className="text-[10px] text-zinc-500">{formatDate(reply.createdAt)} {reply.updatedAt && '(edited)'}</span>
                          </div>
                          
                          {editingId === reply.id ? (
                            <div className="flex flex-col gap-2 mt-1">
                              <Input 
                                type="text" 
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="border-0 border-b border-border rounded-none bg-transparent px-0 focus:border-primary/50 focus:ring-0 text-sm h-8"
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                                <Button variant="primary" size="sm" onClick={() => handleEdit(reply.id)}>Save</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{reply.text}</p>
                          )}
                          
                          {currentUser?.uid === reply.userId && (
                            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                              <button className="text-xs text-zinc-400 hover:text-white" onClick={() => {
                                setEditingId(reply.id);
                                setEditText(reply.text);
                              }}>
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button className="text-xs text-zinc-400 hover:text-destructive" onClick={() => handleDelete(reply.id)}>
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
