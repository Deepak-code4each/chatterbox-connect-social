
import { useSendMessage } from './useSendMessage';
import { useMessageEdit } from './useMessageEdit';
import { useMessageReactions } from './useMessageReactions';

export function useMessageActions(userId: string | undefined) {
  const { sendMessage } = useSendMessage(userId);
  const { deleteMessage, editMessage, markMessageAsSeen } = useMessageEdit(userId);
  const { addReaction, removeReaction } = useMessageReactions(userId);

  return {
    sendMessage,
    deleteMessage,
    editMessage,
    markMessageAsSeen,
    addReaction,
    removeReaction
  };
}
