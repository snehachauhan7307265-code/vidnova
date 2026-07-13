import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Video } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <Video className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-6xl font-bold tracking-tighter mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button size="lg" className="rounded-full px-8">Go back home</Button>
      </Link>
    </div>
  );
}
