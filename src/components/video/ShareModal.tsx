import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Facebook, Twitter, Linkedin, Mail, Instagram, MessageCircle, Send, QrCode, Code, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle: string;
  videoId: string;
}

export function ShareModal({ isOpen, onClose, videoUrl, videoTitle, videoId }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'embed' | 'qr'>('share');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(videoUrl);
  const encodedTitle = encodeURIComponent(videoTitle);
  
  const embedCode = `<iframe width="560" height="315" src="${window.location.origin}/embed/${videoId}" title="${(videoTitle || '').replace(/"/g, '&quot;')}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="h-6 w-6 text-green-500" />,
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, '_blank'),
      bg: 'bg-green-500/10'
    },
    {
      name: 'Telegram',
      icon: <Send className="h-6 w-6 text-blue-400" />,
      action: () => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, '_blank'),
      bg: 'bg-blue-400/10'
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-6 w-6 text-blue-600" />,
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank'),
      bg: 'bg-blue-600/10'
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter className="h-6 w-6 text-sky-500" />,
      action: () => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank'),
      bg: 'bg-sky-500/10'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="h-6 w-6 text-blue-700" />,
      action: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank'),
      bg: 'bg-blue-700/10'
    },
    {
      name: 'Email',
      icon: <Mail className="h-6 w-6 text-gray-400" />,
      action: () => window.open(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`, '_blank'),
      bg: 'bg-gray-400/10'
    },
    {
      name: 'Instagram',
      icon: <Instagram className="h-6 w-6 text-pink-500" />,
      action: () => {
        copyToClipboard(videoUrl);
        alert('Link copied! Open Instagram to share it with your friends.');
      },
      bg: 'bg-pink-500/10'
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-[#1f1f1f] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Share</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                <button
                  onClick={() => setActiveTab('embed')}
                  className="flex flex-col items-center gap-2 min-w-[72px] group"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-zinc-300">Embed</span>
                </button>
                <button
                  onClick={() => setActiveTab('qr')}
                  className="flex flex-col items-center gap-2 min-w-[72px] group"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-secondary/80 transition-colors">
                    <QrCode className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-zinc-300">QR Code</span>
                </button>
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="flex flex-col items-center gap-2 min-w-[72px] group"
                  >
                    <div className={`w-14 h-14 rounded-full \${option.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {option.icon}
                    </div>
                    <span className="text-xs text-zinc-300">{option.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/10">
                <input 
                  type="text" 
                  readOnly 
                  value={videoUrl}
                  className="flex-1 bg-transparent text-sm text-zinc-300 px-2 outline-none"
                />
                <Button 
                  className={`rounded-lg px-4 \${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'} text-primary-foreground`}
                  onClick={() => copyToClipboard(videoUrl)}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="bg-black/40 rounded-xl overflow-hidden aspect-video border border-white/10 relative group">
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => copyToClipboard(embedCode)}
                >
                  <span className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Copy className="h-4 w-4" /> Copy Code
                  </span>
                </div>
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={(videoUrl || '').replace('/watch/', '/embed/')} 
                  title="Video Player" 
                  frameBorder="0" 
                  allowFullScreen
                  className="pointer-events-none"
                ></iframe>
              </div>
              <div className="relative">
                <textarea 
                  readOnly 
                  value={embedCode}
                  className="w-full h-24 bg-black/40 text-sm font-mono text-zinc-400 p-3 rounded-xl border border-white/10 outline-none resize-none hide-scrollbar"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setActiveTab('share')} className="text-zinc-400 hover:text-white">
                  Back
                </Button>
                <Button 
                  className={`rounded-lg px-4 \${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                  onClick={() => copyToClipboard(embedCode)}
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in slide-in-from-right-4 duration-200">
              <div className="bg-white p-4 rounded-xl shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodedUrl}`} 
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-zinc-400 text-center max-w-xs">
                Scan this QR code with your phone's camera to open this video.
              </p>
              <div className="flex items-center justify-between w-full pt-2">
                <Button variant="ghost" onClick={() => setActiveTab('share')} className="text-zinc-400 hover:text-white">
                  Back
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=\${encodedUrl}`;
                    link.download = 'video-qr.png';
                    link.click();
                  }}
                >
                  Download Image
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Toast Notification positioned absolute to modal */}
        {copied && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <Check className="h-4 w-4 text-green-400" />
            Link copied to clipboard
          </div>
        )}
      </div>
    </div>
  );
}
