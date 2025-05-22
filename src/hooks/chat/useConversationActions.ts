
import { useCreateConversation } from './useCreateConversation';
import { useTypingIndicator } from './useTypingIndicator';

export function useConversationActions(userId: string | undefined) {
  const { createConversation } = useCreateConversation(userId);
  const { handleUserTyping } = useTypingIndicator(userId);

  return { createConversation, handleUserTyping };
}
