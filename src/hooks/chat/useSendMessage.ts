
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useSendMessage(userId: string | undefined) {
  const { toast } = useToast();

  const sendMessage = async (
    conversationId: string,
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'emoji' = 'text',
    replyToMessageId?: string
  ): Promise<void> => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: userId,
            content,
            content_type: contentType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_edited: false,
            status: 'sent',
            reactions: [],
            reply_to: replyToMessageId,
          },
        ]);
        
      if (error) throw error;
      
      // Update conversation's last update time
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { sendMessage };
}
