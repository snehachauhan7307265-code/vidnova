import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Auth Profile
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Create Firestore User Document
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          id: userCredential.user.uid,
          displayName: name,
          email: email,
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
          subscribers: 0,
          verified: false,
          createdAt: new Date().toISOString()
        });
      } catch (firestoreError) {
        console.warn("Could not create user document in Firestore. Make sure your Firestore Security Rules are set up:", firestoreError);
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
        <p className="text-muted-foreground">Join VidNova to discover and share videos</p>
      </div>

      {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="name">Display Name</label>
          <Input id="name" type="text" placeholder="John Doe" required className="bg-background/50" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="name@example.com" required className="bg-background/50" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <Input id="password" type="password" placeholder="••••••••" required minLength={6} className="bg-background/50" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        
        <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
