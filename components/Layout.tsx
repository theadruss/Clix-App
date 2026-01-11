
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Calendar, 
  PlusCircle, 
  CheckSquare, 
  User as UserIcon,
  Ticket,
  BarChart3,
  Users,
  Shield,
  Briefcase,
  Image as ImageIcon,
  Bell
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, activeTab, setActiveTab }) => {
  const [showNotifs, setShowNotifs] = useState(false);

  const navItems = {
    [UserRole.STUDENT]: [
      { icon: Calendar, label: 'Feed', id: 'feed' },
      { icon: ImageIcon, label: 'Media', id: 'media' },
      { icon: Users, label: 'Clubs', id: 'clubs' },
      { icon: Ticket, label: 'Tickets', id: 'tickets' },
      { icon: UserIcon, label: 'Profile', id: 'profile' },
    ],
    [UserRole.CLUB_ADMIN]: [
      { icon: LayoutDashboard, label: 'Dash', id: 'dashboard' },
      { icon: Calendar, label: 'Events', id: 'events' },
      { icon: Users, label: 'Club', id: 'club' },
      { icon: ImageIcon, label: 'Media', id: 'media' },
      { icon: UserIcon, label: 'Profile', id: 'profile' },
    ],
    [UserRole.COLLEGE_ADMIN]: [
      { icon: CheckSquare, label: 'Approval', id: 'approvals' },
      { icon: Shield, label: 'Clubs', id: 'clubs_manage' },
      { icon: BarChart3, label: 'Report', id: 'reports' },
      { icon: UserIcon, label: 'Profile', id: 'profile' },
    ]
  };

  const roleLabel = {
    [UserRole.STUDENT]: 'Student',
    [UserRole.CLUB_ADMIN]: 'Club Admin',
    [UserRole.COLLEGE_ADMIN]: 'College Admin'
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-black font-sans">
      
      {/* Top Header - Branding & Notification */}
      <header className="fixed top-0 w-full z-20 bg-black text-white px-4 py-3 flex justify-between items-center border-b-2 border-yellow-500 shadow-md">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-sm flex items-center justify-center text-black font-black text-xs border border-white">
               {user.name.charAt(0)}
            </div>
            <div>
               <h1 className="text-2xl font-black tracking-tighter leading-none">CLIX<span className="text-yellow-400">.</span></h1>
               <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{roleLabel[user.role]}</p>
            </div>
         </div>

         {/* Notification Icon */}
         <div className="relative">
             <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 hover:bg-gray-800 rounded-full transition-colors group"
             >
                 <Bell size={20} className="text-white group-hover:text-yellow-400 transition-colors" />
                 {/* Mock badge if items exist */}
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
             </button>

             {/* Notification Dropdown */}
             {showNotifs && (
                 <div className="absolute top-12 right-0 w-72 bg-white border-2 border-black shadow-[4px_4px_0px_#000] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div className="p-3 border-b-2 border-black bg-gray-50 flex justify-between items-center">
                         <h3 className="font-black text-xs uppercase tracking-widest text-black">Notifications</h3>
                         <button onClick={() => setShowNotifs(false)} className="text-xs font-bold hover:text-red-500 text-black">Close</button>
                     </div>
                     <div className="max-h-64 overflow-y-auto p-2 space-y-2 text-black">
                         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-xs">
                             <p className="font-bold text-black">System</p>
                             <p className="text-gray-800">Welcome to the new Clix platform!</p>
                             <span className="text-[10px] text-gray-500">Just now</span>
                         </div>
                         <div className="bg-white border border-gray-200 p-2 text-xs">
                             <p className="font-bold text-black">Event Reminder</p>
                             <p className="text-gray-800">Don't forget to check out upcoming hackathons.</p>
                             <span className="text-[10px] text-gray-500">2 hours ago</span>
                         </div>
                     </div>
                 </div>
             )}
         </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 pb-24 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto min-h-full py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-white border-t-2 border-black z-30 pb-safe">
         <div className="flex justify-around items-end max-w-2xl mx-auto">
           {navItems[user.role].map((item) => {
             const isActive = activeTab === item.id;
             return (
               <button 
                 key={item.label} 
                 onClick={() => setActiveTab(item.id)}
                 className={`flex-1 flex flex-col items-center py-3 transition-all relative group
                   ${isActive ? 'text-black' : 'text-gray-400 hover:text-gray-600'}
                 `}
               >
                 {isActive && (
                    <div className="absolute top-0 w-full h-1 bg-yellow-400"></div>
                 )}
                 <item.icon size={24} className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                 <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
               </button>
             );
           })}
         </div>
      </nav>
    </div>
  );
};

export default Layout;
