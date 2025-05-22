
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
