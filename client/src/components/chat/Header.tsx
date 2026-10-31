import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, MoreVertical, History, LayoutList } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onClearChat: () => void;
  onToggleHistory?: () => void;
  showingHistory?: boolean;
}

export default function Header({ onClearChat, onToggleHistory, showingHistory }: HeaderProps) {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center">
        {!isMobile && onToggleHistory && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onToggleHistory}
            aria-label={showingHistory ? "Hide history" : "Show history"}
          >
            <History className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-serif font-semibold text-[#FF5470]">StyleChat</h1>
      </div>
      <div className="flex items-center space-x-3">
        {!isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearChat}
            className="px-3 py-1 h-8"
          >
            New Chat
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onClearChat}>
              New Chat
            </DropdownMenuItem>
            {isMobile && onToggleHistory && (
              <DropdownMenuItem onClick={onToggleHistory}>
                {showingHistory ? "Hide History" : "Show History"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
