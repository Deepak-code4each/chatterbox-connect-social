
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Conversation, parseMessageContentType, parseMessageStatus, parseReactions } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useMessages(currentConversation: Conversation | null, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userTyping, setUserTyping] = useState<{ userId: string; username: string } | null>(null);
  const { toast } = useToast();

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
          .filter(msg => msg.sender_id !== userId && msg.status === 'sent');
          
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
            if (userId && newMessageData.sender_id !== userId) {
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
          payload.payload.user_id !== userId
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
  }, [currentConversation, userId, toast]);

  return { messages, setMessages, loadingMessages, userTyping };
}
