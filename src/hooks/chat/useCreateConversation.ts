
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useCreateConversation(userId: string | undefined) {
  const { toast } = useToast();

  const createConversation = async (
    participantIds: string[], 
    name?: string, 
    type: 'direct' | 'group' | 'community' = 'direct'
  ): Promise<string> => {
    if (!userId) throw new Error('No user logged in');
    
    try {
      // Include current user in participants
      if (!participantIds.includes(userId)) {
        participantIds.push(userId);
      }
      
      // For direct messages between 2 people, check if conversation already exists
      if (type === 'direct' && participantIds.length === 2) {
        const otherUserId = participantIds.find(id => id !== userId);
        
        // Find existing direct conversations
        const { data: existingParticipants } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId);
          
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

  return { createConversation };
}
