
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, parseUserStatus } from '@/types';

export function useUsers(userId: string | undefined) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userId) return;
      
      setLoadingUsers(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId);
          
        if (error) throw error;
        
        const formattedUsers: User[] = data.map((profile) => ({
          id: profile.id,
          email: profile.email || '',
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          status: parseUserStatus(profile.status),
          role: profile.role || 'user',
          last_seen: profile.last_seen || new Date().toISOString(),
        }));
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();

    // Subscribe to status changes
    const statusSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
      }, (payload) => {
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === payload.new.id 
              ? { 
                ...u, 
                status: parseUserStatus(payload.new.status), 
                last_seen: payload.new.last_seen 
              } 
              : u
          )
        );
      })
      .subscribe();

    return () => {
      statusSubscription.unsubscribe();
    };
  }, [userId]);

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!userId || !query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
        
      if (error) throw error;
      
      return data.map((profile) => ({
        id: profile.id,
        email: profile.email || '',
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        status: parseUserStatus(profile.status),
        role: profile.role || 'user',
        last_seen: profile.last_seen || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  return { users, loadingUsers, searchUsers };
}
