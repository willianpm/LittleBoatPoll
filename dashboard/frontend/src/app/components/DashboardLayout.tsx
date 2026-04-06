import { Outlet, Link, useLocation } from 'react-router';
import { BarChart3, Plus, History, Activity, Bot, Shield, FileText, Upload, Menu, X, Sun, Moon } from 'lucide-react';
import { cn } from './ui/utils';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

export function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navItems = [
    { path: '/', label: 'Visão Geral', icon: BarChart3 },
    { path: '/active', label: 'Enquetes Ativas', icon: Activity },
    { path: '/create', label: 'Criar Enquete', icon: Plus },
    { path: '/drafts', label: 'Rascunhos de Enquete', icon: FileText },
    { path: '/csv', label: 'Enquete CSV', icon: Upload },
    { path: '/moderation', label: 'Moderação', icon: Shield },
    { path: '/history', label: 'Histórico', icon: History },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#5865F2] dark:bg-[#4752C4] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="size-6" />
          <h1 className="font-bold text-lg">PollBot</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white hover:bg-white/10">
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-[#5865F2] dark:bg-[#4752C4] text-white flex flex-col fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bot className="size-8" />
            <div>
              <h1 className="font-bold text-lg">PollBot</h1>
              <p className="text-xs text-white/70">Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden lg:flex text-white hover:bg-white/10"
          >
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-white/70 mb-1">Status do Bot</p>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
