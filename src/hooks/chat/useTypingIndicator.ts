
import { supabase } from '@/integrations/supabase/client';

export function useTypingIndicator(userId: string | undefined) {
  const handleUserTyping = async (isTyping: boolean, conversationId: string, username: string) => {
    if (!userId || !conversationId) return;
    
    try {
      await supabase
        .channel('typing')
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: userId,
            username,
            conversation_id: conversationId,
            is_typing: isTyping,
          },
        });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  return { handleUserTyping };
}
