import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, User, Reaction, parseUserStatus, parseMessageContentType, parseMessageStatus, parseReactions, reactionsToJson } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ChatContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  users: User[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  loadingUsers: boolean;
  userTyping: { userId: string; username: string } | null;
  sendMessage: (content: string, contentType: 'text' | 'image' | 'file' | 'emoji', replyToMessageId?: string) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  markMessageAsSeen: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  createConversation: (participantIds: string[], name?: string, type?: 'direct' | 'group' | 'community') => Promise<string>;
  setUserTyping: (isTyping: boolean) => void;
  searchUsers: (query: string) => Promise<User[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userTyping, setUserTyping] = useState<{ userId: string; username: string } | null>(null);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      setLoadingUsers(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);
          
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
  }, [user]);

  // Fetch user conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      
      setLoadingConversations(true);
      
      try {
        // Get conversations where the user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);
          
        if (participantError) throw participantError;
        
        if (!participantData || participantData.length === 0) {
          setLoadingConversations(false);
          return;
        }
        
        const conversationIds = participantData.map(p => p.conversation_id);
        
        // Get conversation details
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .in('id', conversationIds);
          
        if (conversationsError) throw conversationsError;
        
        // For each conversation, get participants and last message
        const conversationsWithDetails = await Promise.all(
          conversationsData.map(async (conv) => {
            // Get participants
            const { data: participantsData } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .eq('conversation_id', conv.id);
              
            const participantIds = participantsData?.map(p => p.user_id) || [];
            
            // Get participant profiles
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', participantIds);
              
            const participants: User[] = profilesData?.map((profile) => ({
              id: profile.id,
              email: profile.email || '',
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              status: parseUserStatus(profile.status),
              role: profile.role || 'user',
              last_seen: profile.last_seen || new Date().toISOString(),
            })) || [];
            
            // Get last message
            const { data: messagesData } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1);
              
            let lastMessage: Message | undefined = undefined;
            if (messagesData && messagesData.length > 0) {
              const msgData = messagesData[0];
              lastMessage = {
                id: msgData.id,
                conversation_id: msgData.conversation_id,
                sender_id: msgData.sender_id,
                content: msgData.content,
                content_type: parseMessageContentType(msgData.content_type),
                created_at: msgData.created_at,
                updated_at: msgData.updated_at,
                is_edited: msgData.is_edited || false,
                status: parseMessageStatus(msgData.status),
                reactions: parseReactions(msgData.reactions),
                reply_to: msgData.reply_to,
              };
            }
              
            // Get unread count
            const { data: unreadData } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', conv.id)
              .neq('sender_id', user.id)
              .neq('status', 'seen');
              
            const unreadCount = unreadData?.length || 0;
            
            return {
              id: conv.id,
              name: conv.name,
              type: conv.type as 'direct' | 'group' | 'community',
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              participants,
              last_message: lastMessage,
              unread_count: unreadCount,
              is_pinned: conv.is_pinned || false,
            } as Conversation;
          })
        );
        
        // Sort conversations by last message date or creation date
        const sortedConversations = conversationsWithDetails.sort((a, b) => {
          const dateA = a.last_message ? new Date(a.last_message.created_at) : new Date(a.created_at);
          const dateB = b.last_message ? new Date(b.last_message.created_at) : new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });
        
        setConversations(sortedConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();

    // Subscribe to new conversations and updates
    const conversationsSubscription = supabase
      .channel('public:conversations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
    };
  }, [user]);

  // Fetch messages when conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation) {
        setMessages([]);
        return;
      }
      
      setLoadingMessages(true);
      
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', currentConversation.id)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        const formattedMessages: Message[] = messagesData.map((message) => ({
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          content: message.content,
          content_type: parseMessageContentType(message.content_type),
          created_at: message.created_at,
          updated_at: message.updated_at,
          is_edited: message.is_edited || false,
          status: parseMessageStatus(message.status),
          reactions: parseReactions(message.reactions),
          reply_to: message.reply_to,
        }));
        
        setMessages(formattedMessages);
        
        // Mark messages as delivered if they're not from the current user
        const undeliveredMessages = messagesData
          .filter(msg => msg.sender_id !== user?.id && msg.status === 'sent');
          
        if (undeliveredMessages.length > 0) {
          await Promise.all(
            undeliveredMessages.map(msg =>
              supabase
                .from('messages')
                .update({ status: 'delivered' })
                .eq('id', msg.id)
            )
          );
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Subscribe to message updates for current conversation
    let messagesSubscription;
    if (currentConversation) {
      messagesSubscription = supabase
        .channel(`messages:${currentConversation.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessageData = payload.new;
            const newMessage: Message = {
              id: newMessageData.id,
              conversation_id: newMessageData.conversation_id,
              sender_id: newMessageData.sender_id,
              content: newMessageData.content,
              content_type: parseMessageContentType(newMessageData.content_type),
              created_at: newMessageData.created_at,
              updated_at: newMessageData.updated_at,
              is_edited: newMessageData.is_edited || false,
              status: parseMessageStatus(newMessageData.status),
              reactions: parseReactions(newMessageData.reactions),
              reply_to: newMessageData.reply_to,
            };
            
            setMessages(prev => [...prev, newMessage]);
            
            // If message is not from current user, mark as delivered
            if (user && newMessageData.sender_id !== user.id) {
              supabase
                .from('messages')
                .update({ status: 'delivered' })
                .eq('id', newMessageData.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessageData = payload.new;
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessageData.id 
                  ? {
                      id: updatedMessageData.id,
                      conversation_id: updatedMessageData.conversation_id,
                      sender_id: updatedMessageData.sender_id,
                      content: updatedMessageData.content,
                      content_type: parseMessageContentType(updatedMessageData.content_type),
                      created_at: updatedMessageData.created_at,
                      updated_at: updatedMessageData.updated_at,
                      is_edited: updatedMessageData.is_edited || false,
                      status: parseMessageStatus(updatedMessageData.status),
                      reactions: parseReactions(updatedMessageData.reactions),
                      reply_to: updatedMessageData.reply_to,
                    } 
                  : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        })
        .subscribe();
    }

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (
          payload.payload.conversation_id === currentConversation?.id &&
          payload.payload.user_id !== user?.id
        ) {
          setUserTyping({
            userId: payload.payload.user_id,
            username: payload.payload.username
          });
          
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setUserTyping(null);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      if (messagesSubscription) messagesSubscription.unsubscribe();
      if (typingSubscription) typingSubscription.unsubscribe();
    };
  }, [currentConversation, user]);

  const sendMessage = async (
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'emoji' = 'text',
    replyToMessageId?: string
  ): Promise<void> => {
    if (!user || !currentConversation) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: currentConversation.id,
            sender_id: user.id,
            content,
            content_type: contentType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_edited: false,
            status: 'sent',
            reactions: [],
            reply_to: replyToMessageId,
          },
        ])
        .select();
        
      if (error) throw error;
      
      // Update conversation's last update time
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id); // Only allow deleting own messages
        
      if (error) throw error;
      
      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
          is_edited: true,
        })
        .eq('id', messageId)
        .eq('sender_id', user.id); // Only allow editing own messages
        
      if (error) throw error;
      
      toast({
        title: "Message edited",
        description: "Your message has been updated",
      });
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markMessageAsSeen = async (messageId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'seen' })
        .eq('id', messageId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      // Get current reactions
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (messageError) throw messageError;
      
      let reactionsArray = parseReactions(messageData.reactions);
      
      // Check if user already added this emoji
      const existingReactionIndex = reactionsArray.findIndex(
        (r) => r.user_id === user.id && r.emoji === emoji
      );
      
      if (existingReactionIndex === -1) {
        // Add new reaction
        reactionsArray.push({
          user_id: user.id,
          emoji: emoji,
        });
        
        // Update message with new reactions
        const { error } = await supabase
          .from('messages')
          .update({ reactions: reactionsToJson(reactionsArray) })
          .eq('id', messageId);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      // Get current reactions
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (messageError) throw messageError;
      
      let reactionsArray = parseReactions(messageData.reactions);
      
      // Filter out the reaction to remove
      reactionsArray = reactionsArray.filter(
        (r) => !(r.user_id === user.id && r.emoji === emoji)
      );
      
      // Update message with new reactions
      const { error } = await supabase
        .from('messages')
        .update({ reactions: reactionsToJson(reactionsArray) })
        .eq('id', messageId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        title: "Error",
        description: "Failed to remove reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createConversation = async (
    participantIds: string[], 
    name?: string, 
    type: 'direct' | 'group' | 'community' = 'direct'
  ): Promise<string> => {
    if (!user) throw new Error('No user logged in');
    
    try {
      // Include current user in participants
      if (!participantIds.includes(user.id)) {
        participantIds.push(user.id);
      }
      
      // For direct messages between 2 people, check if conversation already exists
      if (type === 'direct' && participantIds.length === 2) {
        const otherUserId = participantIds.find(id => id !== user.id);
        
        // Find existing direct conversations
        const { data: existingParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);
          
        if (existingParticipants && existingParticipants.length > 0) {
          const existingConvIds = existingParticipants.map(p => p.conversation_id);
          
          // Check if other user is in any of these conversations
          const { data: otherUserParticipations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', otherUserId)
            .in('conversation_id', existingConvIds);
            
          if (otherUserParticipations && otherUserParticipations.length > 0) {
            // Get conversation types to find direct conversations
            const { data: conversations } = await supabase
              .from('conversations')
              .select('id, type')
              .in('id', otherUserParticipations.map(p => p.conversation_id))
              .eq('type', 'direct');
              
            if (conversations && conversations.length > 0) {
              // Return existing conversation ID
              return conversations[0].id;
            }
          }
        }
      }
      
      // Create new conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          {
            name: name || null,
            type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_pinned: false,
          },
        ])
        .select();
        
      if (conversationError) throw conversationError;
      
      const conversationId = conversationData[0].id;
      
      // Add participants
      const participantRows = participantIds.map(userId => ({
        conversation_id: conversationId,
        user_id: userId,
        joined_at: new Date().toISOString(),
      }));
      
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantRows);
        
      if (participantError) throw participantError;
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUserTyping = async (isTyping: boolean) => {
    if (!user || !currentConversation) return;
    
    try {
      await supabase
        .channel('typing')
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            username: user.username,
            conversation_id: currentConversation.id,
            is_typing: isTyping,
          },
        });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!user || !query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
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

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        users,
        loadingConversations,
        loadingMessages,
        loadingUsers,
        userTyping,
        sendMessage,
        setCurrentConversation,
        deleteMessage,
        editMessage,
        markMessageAsSeen,
        addReaction,
        removeReaction,
        createConversation,
        setUserTyping: handleUserTyping,
        searchUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};
