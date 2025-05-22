
import { Json } from '@/integrations/supabase/types';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  role: string;
  last_seen: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: 'text' | 'image' | 'file' | 'emoji';
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  status: 'sent' | 'delivered' | 'seen';
  reactions: Reaction[];
  reply_to?: string;
}

export interface Reaction {
  user_id: string;
  emoji: string;
}

export interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'community';
  created_at: string;
  updated_at: string;
  last_message?: Message;
  participants: User[];
  unread_count: number;
  is_pinned: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  created_at: string;
  created_by: string;
  member_count: number;
}

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

// Helper functions to safely type data from Supabase
export function parseUserStatus(status: string | null | undefined): UserStatus {
  if (status === 'online' || status === 'away' || status === 'busy') {
    return status;
  }
  return 'offline'; // Default status
}

export function parseMessageContentType(contentType: string | null | undefined): 'text' | 'image' | 'file' | 'emoji' {
  if (contentType === 'text' || contentType === 'image' || contentType === 'file' || contentType === 'emoji') {
    return contentType;
  }
  return 'text'; // Default type
}

export function parseMessageStatus(status: string | null | undefined): 'sent' | 'delivered' | 'seen' {
  if (status === 'sent' || status === 'delivered' || status === 'seen') {
    return status;
  }
  return 'sent'; // Default status
}

export function parseReactions(reactions: Json | null): Reaction[] {
  if (!reactions) return [];
  
  if (Array.isArray(reactions)) {
    return reactions.map(r => {
      if (typeof r === 'object' && r !== null && 'user_id' in r && 'emoji' in r) {
        return {
          user_id: String(r.user_id),
          emoji: String(r.emoji)
        };
      }
      return { user_id: '', emoji: '' }; // Fallback for invalid data
    }).filter(r => r.user_id !== '');
  }
  
  return [];
}

// New function to convert Reaction[] to Json for Supabase
export function reactionsToJson(reactions: Reaction[]): Json {
  return reactions as unknown as Json;
}
