
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, User, Message, parseUserStatus, parseMessageContentType, parseMessageStatus, parseReactions } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!userId) return;
      
      setLoadingConversations(true);
      
      try {
        // Get conversations where the user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId);
          
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
              .neq('sender_id', userId)
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
  }, [userId, toast]);

  return { conversations, setConversations, loadingConversations };
}
