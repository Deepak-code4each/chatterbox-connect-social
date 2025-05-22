
import { supabase } from '@/integrations/supabase/client';
import { parseReactions, reactionsToJson, Reaction } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useMessageActions(userId: string | undefined) {
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

  const addReaction = async (messageId: string, emoji: string) => {
    if (!userId) return;
    
    try {
      // Get current reactions
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (messageError) throw messageError;
      
      // Parse the reactions properly
      const reactionsArray = parseReactions(messageData.reactions);
      
      // Check if user already added this emoji
      const existingReactionIndex = reactionsArray.findIndex(
        (r) => r.user_id === userId && r.emoji === emoji
      );
      
      if (existingReactionIndex === -1) {
        // Add new reaction
        reactionsArray.push({
          user_id: userId,
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
    if (!userId) return;
    
    try {
      // Get current reactions
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();
        
      if (messageError) throw messageError;
      
      // Parse the reactions properly
      let reactionsArray = parseReactions(messageData.reactions);
      
      // Filter out the reaction to remove
      reactionsArray = reactionsArray.filter(
        (r) => !(r.user_id === userId && r.emoji === emoji)
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

  return {
    sendMessage,
    deleteMessage,
    editMessage,
    markMessageAsSeen,
    addReaction,
    removeReaction
  };
}
