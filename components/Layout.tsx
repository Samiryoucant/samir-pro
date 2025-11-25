import React, { useState } from 'react';
import { User, Theme } from '../types';
import { LogOut, Home, Grid, User as UserIcon, Settings, Sun, Moon, ShoppingBag, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  theme: Theme;
  onLogout: () => void;
  onSwitchTheme: (t: Theme) => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, user, theme, onLogout, onSwitchTheme, currentPage, onNavigate 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Theme Config
  const isPizza = theme === 'pizza';
  const bgMain = isPizza ? 'bg-pizza-50' : 'bg-lemon-50';
  const textMain = isPizza ? 'text-pizza-900' : 'text-lemon-900';
  const bgSidebar = isPizza ? 'bg-white border-pizza-200' : 'bg-white border-lemon-200';
  const btnActive = isPizza ? 'bg-pizza-100 text-pizza-700' : 'bg-lemon-100 text-lemon-700';
  const btnHover = isPizza ? 'hover:bg-pizza-50' : 'hover:bg-lemon-50';
  const brandColor = isPizza ? 'text-pizza-600' : 'text-lemon-600';

  const NavItem = ({ page, icon: Icon, label }: { page: string, icon: any, label: string }) => (
    <button
      onClick={() => { onNavigate(page); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${currentPage === page ? btnActive : `${textMain} ${btnHover}`}`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className={`min-h-screen ${bgMain} ${textMain} transition-colors duration-300 font-sans`}>
      {/* Mobile Header */}
      <div className={`lg:hidden flex items-center justify-between p-4 bg-white shadow-sm border-b ${isPizza ? 'border-pizza-200' : 'border-lemon-200'}`}>
        <div className={`font-bold text-xl ${brandColor}`}>SAMIR PRO</div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          <Grid />
        </button>
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out border-r
          lg:static lg:translate-x-0 ${bgSidebar}
          ${mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:shadow-none'}
        `}>
          <div className="p-6">
            <h1 className={`text-2xl font-black tracking-tighter ${brandColor} mb-8`}>
              SAMIR PRO
            </h1>
            
            <nav className="space-y-2">
              <NavItem page="home" icon={Home} label="Browse Courses" />
              {user && <NavItem page="my-courses" icon={ShoppingBag} label="My Courses" />}
              {user && <NavItem page="profile" icon={UserIcon} label="Profile" />}
              {user?.role === 'admin' && (
                <>
                  <div className="pt-4 pb-2 text-xs uppercase font-bold opacity-50 tracking-wider">Admin</div>
                  <NavItem page="admin-dashboard" icon={Grid} label="Dashboard" />
                  <NavItem page="admin-requests" icon={Shield} label="Buy Requests" />
                  <NavItem page="admin-courses" icon={Settings} label="Manage Courses" />
                </>
              )}
            </nav>
          </div>

          <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-gray-50/50">
             <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-semibold uppercase opacity-60">Theme</span>
                <div className="flex bg-gray-200 rounded-full p-1">
                   <button 
                    onClick={() => onSwitchTheme('pizza')}
                    className={`p-1.5 rounded-full transition ${isPizza ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
                   >
                     <Sun size={14} />
                   </button>
                   <button 
                    onClick={() => onSwitchTheme('lemon')}
                    className={`p-1.5 rounded-full transition ${!isPizza ? 'bg-white shadow-sm text-lime-600' : 'text-gray-500'}`}
                   >
                     <Moon size={14} />
                   </button>
                </div>
             </div>
             
             {user ? (
               <div className="flex items-center gap-3 px-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isPizza ? 'bg-pizza-500' : 'bg-lemon-500'}`}>
                   {user.username.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold truncate">{user.username}</p>
                   <p className="text-xs opacity-70 truncate">{user.email}</p>
                 </div>
                 <button onClick={onLogout} className="text-gray-400 hover:text-red-500">
                   <LogOut size={18} />
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => onNavigate('login')}
                className={`w-full py-2 rounded-lg font-bold text-white shadow-md transition-transform active:scale-95 ${isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700'}`}
               >
                 Login / Register
               </button>
             )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24">
          <div className="max-w-5xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};