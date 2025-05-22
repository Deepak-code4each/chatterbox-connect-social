
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Message } from '@/types';
import { Check, CheckCheck, Edit, MoreHorizontal, Send, Smile, Paperclip, Reply, Copy, Trash, Forward } from 'lucide-react';
import { UserStatusBadge } from './UserStatusBadge';

export const ChatUI: React.FC = () => {
  const { user } = useAuth();
  const {
    currentConversation,
    messages,
    sendMessage,
    userTyping,
    loadingMessages,
    setUserTyping,
    deleteMessage,
    editMessage,
    markMessageAsSeen,
    addReaction,
  } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as seen when the conversation is opened
    if (!user || !currentConversation) return;
    
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== user.id && msg.status !== 'seen'
    );
    
    unreadMessages.forEach(msg => {
      markMessageAsSeen(msg.id);
    });
  }, [currentConversation, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentConversation) return;
    
    await sendMessage(messageInput, 'text', replyTo?.id);
    setMessageInput('');
    setReplyTo(null);
    messageInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    setUserTyping(true);
    
    // Clear typing indicator after 2 seconds of inactivity
    const timer = setTimeout(() => {
      setUserTyping(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleEditComplete();
      } else {
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      if (editingMessageId) {
        setEditingMessageId(null);
      } else if (replyTo) {
        setReplyTo(null);
      }
    }
  };

  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const getMessageStatusIcon = (message: Message) => {
    if (message.sender_id !== user?.id) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'seen':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setMessageInput('');
    setTimeout(() => messageInputRef.current?.focus(), 0);
  };

  const handleEditComplete = async () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    await editMessage(editingMessageId, editingContent);
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  const handleReplyMessage = (message: Message) => {
    setReplyTo(message);
    messageInputRef.current?.focus();
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  const getReplyMessage = (replyId?: string) => {
    if (!replyId) return null;
    return messages.find(msg => msg.id === replyId);
  };

  const getMessageSender = (senderId: string) => {
    if (senderId === user?.id) return user;
    
    return currentConversation?.participants.find(p => p.id === senderId);
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome to the Chat</h2>
          <p className="text-muted-foreground mb-4">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center p-4 border-b">
        <div className="relative mr-3">
          {currentConversation.type === 'direct' ? (
            <>
              <Avatar>
                <AvatarImage src={currentConversation.participants.find(p => p.id !== user?.id)?.avatar_url} />
                <AvatarFallback>
                  {currentConversation.participants.find(p => p.id !== user?.id)?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <UserStatusBadge 
                status={currentConversation.participants.find(p => p.id !== user?.id)?.status || 'offline'} 
              />
            </>
          ) : (
            <Avatar>
              <AvatarFallback>
                {currentConversation.name ? currentConversation.name.charAt(0).toUpperCase() : 'G'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold">
            {currentConversation.type === 'direct'
              ? currentConversation.participants.find(p => p.id !== user?.id)?.full_name
              : currentConversation.name || 'Group Chat'}
          </h2>
          <div className="text-sm text-muted-foreground">
            {currentConversation.type === 'direct' ? (
              currentConversation.participants.find(p => p.id !== user?.id)?.status === 'online' ? (
                'Online'
              ) : (
                'Offline'
              )
            ) : (
              `${currentConversation.participants.length} members`
            )}
            
            {userTyping && (
              <span className="ml-2 italic text-xs">
                {userTyping.username} is typing...
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Search size={18} />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal size={18} />
          </Button>
        </div>
      </div>
      
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        {loadingMessages ? (
          <div className="flex justify-center">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-64`}></div>
                </div>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4">
              <MessageSquare size={48} className="mx-auto text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No messages yet</h3>
            <p className="text-muted-foreground mt-2">
              Be the first to send a message!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === user?.id;
              const showAvatar = !isCurrentUser && (index === 0 || messages[index - 1].sender_id !== message.sender_id);
              const replyMessage = getReplyMessage(message.reply_to);
              const sender = getMessageSender(message.sender_id);
              
              return (
                <div key={message.id} className={`mb-4 ${isCurrentUser ? 'flex flex-row-reverse' : 'flex'}`}>
                  {!isCurrentUser && showAvatar && (
                    <div className="mr-2 flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.avatar_url} />
                        <AvatarFallback>{sender?.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${!isCurrentUser && !showAvatar ? 'ml-10' : ''}`}>
                    {!isCurrentUser && showAvatar && (
                      <div className="mb-1 text-sm font-medium">{sender?.username}</div>
                    )}
                    
                    {replyMessage && (
                      <div className={`mb-1 text-xs rounded px-3 py-1 ${isCurrentUser ? 'bg-blue-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                        <div className="font-medium">
                          {replyMessage.sender_id === user?.id ? 'You' : getMessageSender(replyMessage.sender_id)?.username}
                        </div>
                        <div className="truncate">{replyMessage.content}</div>
                      </div>
                    )}
                    
                    <div className="group relative">
                      <div 
                        className={`chat-message-bubble ${
                          isCurrentUser ? 'sent' : 'received'
                        }`}
                      >
                        {message.content}
                        
                        <div className="inline-flex items-center text-xs text-muted-foreground ml-2">
                          {message.is_edited && <span className="mr-1">(edited)</span>}
                          {formatMessageTime(message.created_at)}
                          {getMessageStatusIcon(message)}
                        </div>
                        
                        <div className="hidden group-hover:flex absolute -top-8 right-0 bg-white dark:bg-gray-800 shadow-md rounded-md p-1 space-x-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleAddReaction(message.id, '👍')}
                              >
                                <Smile size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>React</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleReplyMessage(message)}
                              >
                                <Reply size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Reply</TooltipContent>
                          </Tooltip>
                          
                          {isCurrentUser && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => handleEditMessage(message)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    <Trash size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Text
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Forward className="mr-2 h-4 w-4" />
                                Forward
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="mt-1 flex space-x-1">
                          {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                            const count = message.reactions.filter(r => r.emoji === emoji).length;
                            return (
                              <button
                                key={emoji}
                                className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1"
                                onClick={() => handleAddReaction(message.id, emoji)}
                              >
                                {emoji} <span className="ml-1">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {userTyping && (
              <div className="flex items-center mb-4">
                <div className="mr-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userTyping.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>
      
      {/* Input area */}
      <div className="p-4 border-t">
        {replyTo && (
          <div className="flex items-center mb-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">
                Replying to {replyTo.sender_id === user?.id ? 'yourself' : getMessageSender(replyTo.sender_id)?.username}
              </div>
              <div className="text-sm truncate">{replyTo.content}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancelReply}>
              <X size={16} />
            </Button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Paperclip size={20} />
          </Button>
          
          <div className="relative flex-1">
            {editingMessageId ? (
              <Input
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-20"
                placeholder="Edit your message..."
                ref={messageInputRef}
              />
            ) : (
              <Input
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="pr-20"
                placeholder="Type a message..."
                ref={messageInputRef}
              />
            )}
            
            {editingMessageId && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditingMessageId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="h-8"
                  onClick={handleEditComplete}
                  disabled={!editingContent.trim()}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <Button 
            size="icon" 
            onClick={editingMessageId ? handleEditComplete : handleSendMessage}
            disabled={editingMessageId ? !editingContent.trim() : !messageInput.trim()}
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

import { MessageSquare, Search, X } from 'lucide-react';
