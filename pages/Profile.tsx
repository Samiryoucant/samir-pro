import React from 'react';
import { User, Theme } from '../types';
import { db } from '../services/mockDb';
import { FileDown, History, ShoppingBag, CreditCard, PlayCircle, ShieldCheck } from 'lucide-react';

interface ProfileProps {
  user: User;
  theme: Theme;
}

export const Profile: React.FC<ProfileProps> = ({ user, theme }) => {
  const purchases = db.purchases.all().filter(p => p.userId === user.id).reverse();
  const downloads = db.downloads.all().filter(d => d.userId === user.id).reverse();
  const courses = db.courses.all();
  
  const isPizza = theme === 'pizza';
  const accentColor = isPizza ? 'text-pizza-600' : 'text-lemon-600';
  const bgAccent = isPizza ? 'bg-pizza-500' : 'bg-lemon-500';

  const getAccessIcon = (type: string) => {
    switch(type) {
      case 'buy': return <CreditCard size={14} />;
      case 'ad_unlock': return <PlayCircle size={14} />;
      default: return <ShieldCheck size={14} />;
    }
  };

  const getAccessLabel = (type: string) => {
    switch(type) {
      case 'buy': return 'Purchased';
      case 'ad_unlock': return 'Ad Unlocked';
      default: return 'Admin Grant';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* User Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
         <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 ${bgAccent}`}>
           {user.username.charAt(0).toUpperCase()}
         </div>
         <h2 className="text-2xl font-black mb-1">{user.username}</h2>
         <p className="text-gray-500">{user.email}</p>
         
         <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-gray-50 rounded-xl">
               <div className={`text-2xl font-black ${accentColor}`}>{purchases.length}</div>
               <div className="text-xs font-bold text-gray-400 uppercase">Courses Owned</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
               <div className={`text-2xl font-black ${accentColor}`}>{user.role.toUpperCase()}</div>
               <div className="text-xs font-bold text-gray-400 uppercase">Account Status</div>
            </div>
         </div>
      </div>

      {/* Access History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
           <ShoppingBag className="text-gray-400" />
           <h3 className="font-bold text-lg">Access History</h3>
        </div>
        {purchases.length === 0 ? (
           <div className="p-12 text-center text-gray-400 italic">No courses owned yet.</div>
        ) : (
           <div className="divide-y divide-gray-100">
             {purchases.map(p => {
                const course = courses.find(c => c.id === p.courseId);
                return (
                   <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                         <img src={course?.thumbnail} className="w-16 h-10 rounded object-cover bg-gray-100" alt="Thumbnail" />
                         <div>
                            <p className="font-bold text-sm text-gray-900">{course?.title || 'Unknown Course'}</p>
                            <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${
                                p.type === 'buy' ? 'text-green-600' : 
                                p.type === 'ad_unlock' ? 'text-orange-500' : 'text-blue-500'
                            }`}>
                              {getAccessIcon(p.type)}
                              <span>{getAccessLabel(p.type)}</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xs text-gray-400 font-mono">
                            {new Date(p.grantedAt).toLocaleDateString()}
                         </div>
                         <div className="text-xs text-gray-300">
                            {new Date(p.grantedAt).toLocaleTimeString()}
                         </div>
                      </div>
                   </div>
                );
             })}
           </div>
        )}
      </div>

      {/* Download History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
           <History className="text-gray-400" />
           <h3 className="font-bold text-lg">Download History</h3>
        </div>
        {downloads.length === 0 ? (
           <div className="p-12 text-center text-gray-400 italic">No download history found.</div>
        ) : (
           <div className="divide-y divide-gray-100">
             {downloads.map(d => (
                <div key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                         <FileDown size={20} />
                      </div>
                      <div>
                         <p className="font-bold text-sm">{d.fileName}</p>
                         <p className="text-xs text-gray-500">{d.courseTitle}</p>
                      </div>
                   </div>
                   <div className="text-xs text-gray-400 font-mono">
                      {new Date(d.downloadedAt).toLocaleDateString()}
                   </div>
                </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};