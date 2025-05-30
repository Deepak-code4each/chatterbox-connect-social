
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ConversationSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ConversationSearch: React.FC<ConversationSearchProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search conversations..."
        className="pl-8 bg-sidebar-accent text-sidebar-foreground placeholder:text-sidebar-foreground/50"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};
