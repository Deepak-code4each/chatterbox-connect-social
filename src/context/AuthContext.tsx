
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, parseUserStatus } from '../types';
import { Session } from '@supabase/supabase-js';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateStatus: (status: 'online' | 'offline' | 'away' | 'busy') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Unable to restore your session. Please log in again.",
          variant: "destructive",
        });
      }
      
      setSession(session);
      
      if (session?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setUser({
            id: profileData.id,
            email: session.user.email || '',
            username: profileData.username,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            status: parseUserStatus(profileData.status),
            role: profileData.role || 'user',
            last_seen: profileData.last_seen || new Date().toISOString(),
          });
          
          // Update the user's status to online
          await supabase
            .from('profiles')
            .update({ 
              status: 'online',
              last_seen: new Date().toISOString()
            })
            .eq('id', session.user.id);
        }
      }
      
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
            
          if (profileData) {
            setUser({
              id: profileData.id,
              email: newSession.user.email || '',
              username: profileData.username,
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              status: 'online',
              role: profileData.role || 'user',
              last_seen: new Date().toISOString(),
            });
            
            // Update status to online
            await supabase
              .from('profiles')
              .update({ 
                status: 'online',
                last_seen: new Date().toISOString() 
              })
              .eq('id', newSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    // Handle window close/refresh to set user offline
    const handleBeforeUnload = async () => {
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            status: 'offline',
            last_seen: new Date().toISOString() 
          })
          .eq('id', user.id);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      setLoading(true);
      
      // Check if username already exists
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .limit(1);
        
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Username already taken');
      }
      
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) throw error;
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              full_name: fullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
              status: 'online',
              role: 'user',
              last_seen: new Date().toISOString(),
            },
          ]);
          
        if (profileError) throw profileError;
      }
      
      toast({
        title: "Account created",
        description: "Please check your email to verify your account",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Set status to offline before signing out
        await supabase
          .from('profiles')
          .update({ 
            status: 'offline',
            last_seen: new Date().toISOString() 
          })
          .eq('id', user.id);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUser({ ...user, ...data });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUser({ ...user, status });
      
      toast({
        title: "Status updated",
        description: `Your status is now: ${status}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      updateProfile,
      updateStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
