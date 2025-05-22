
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useMessageEdit(userId: string | undefined) {
  const { toast } = useToast();

  const deleteMessage = async (messageId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userId); // Only allow deleting own messages
        
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
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
          is_edited: true,
        })
        .eq('id', messageId)
        .eq('sender_id', userId); // Only allow editing own messages
        
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
    if (!userId) return;
    
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

  return {
    deleteMessage,
    editMessage,
    markMessageAsSeen
  };
}
