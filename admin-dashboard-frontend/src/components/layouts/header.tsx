import { Bell, Search, AlignJustify, UtensilsCrossed } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserDropdown } from './user-dropdown';

export function Header() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-16 flex items-center gap-3 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl shadow-sm px-3 md:px-5 sticky top-0 z-30">
      {/* Left: Hamburger + Logo on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-12 w-12 text-[#64748B] hover:text-[#1E293B] hover:bg-black/[0.04] rounded-xl transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <AlignJustify className="h-5 w-5" />
        </button>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-sm">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-[#1E293B]">ADLER</span>
        </div>
      </div>

      {/* Search
      <div className="relative hidden md:block max-w-sm flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#A09F9A]" />
        <Input
          placeholder="Search employees, shifts…"
          className="pl-9 h-12 bg-black/[0.03] border-black/[0.08] focus-visible:ring-blue-500/20 focus-visible:border-blue-400/50 rounded-xl text-sm transition-all"
        /> */}
      {/* </div> */}

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12 text-[#64748B] hover:text-[#1E293B] hover:bg-black/[0.04] rounded-xl transition-all"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white animate-pulse" />
        </Button>

        <UserDropdown />
      </div>
    </header>
  );
}
