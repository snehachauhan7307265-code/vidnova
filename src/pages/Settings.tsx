import React from 'react';
import { Button } from '../components/ui/Button';

export function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-1">
            <button className="text-left px-4 py-2 bg-secondary text-foreground font-medium rounded-lg">Account</button>
            <button className="text-left px-4 py-2 text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors">Notifications</button>
            <button className="text-left px-4 py-2 text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors">Playback and performance</button>
            <button className="text-left px-4 py-2 text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors">Downloads</button>
            <button className="text-left px-4 py-2 text-muted-foreground hover:bg-secondary/50 rounded-lg transition-colors">Privacy</button>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col gap-8">
          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-bold border-b border-border pb-2">Account</h2>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">Choose how you appear and what you see on VidNova</h3>
              <p className="text-sm text-muted-foreground mb-4">Signed in as johndoe@example.com</p>
              
              <div className="flex items-center gap-6">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-16 h-16 rounded-full" />
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-lg">John Doe</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Edit on Google</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-2 flex flex-col gap-4">
              <h3 className="font-semibold">Your channel</h3>
              <p className="text-sm text-muted-foreground">This is your public presence on VidNova. You need a channel to upload your own videos, comment on videos, or create playlists.</p>
              <div className="flex gap-4 items-center">
                <span className="font-medium text-sm">Your channel</span>
                <a href="#" className="text-primary text-sm hover:underline">John Doe</a>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" size="sm">Channel status and features</Button>
                <Button variant="outline" size="sm">Create a new channel</Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
