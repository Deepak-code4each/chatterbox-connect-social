
import { supabase } from '@/integrations/supabase/client';
import { parseReactions, reactionsToJson, Reaction } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export function useMessageReactions(userId: string | undefined) {
  const { toast } = useToast();

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
    addReaction,
    removeReaction
  };
}
