import React, { useEffect, useState } from 'react';
import { User, Theme, Course } from '../types';
import { db } from '../services/mockDb';
import { Search, Lock, Unlock, PlayCircle } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  theme: Theme;
  onViewCourse: (id: string) => void;
  filter: 'all' | 'owned';
}

export const Dashboard: React.FC<DashboardProps> = ({ user, theme, onViewCourse, filter }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [ownedIds, setOwnedIds] = useState<string[]>([]);

  const isPizza = theme === 'pizza';

  useEffect(() => {
    let all = db.courses.all();
    if (filter === 'owned' && user) {
      const purchases = db.purchases.all().filter(p => p.userId === user.id);
      const ids = purchases.map(p => p.courseId);
      all = all.filter(c => ids.includes(c.id));
      setOwnedIds(ids);
    } else if (user) {
      // Still fetch owned IDs to show icons
      const purchases = db.purchases.all().filter(p => p.userId === user.id);
      setOwnedIds(purchases.map(p => p.courseId));
    }
    setCourses(all);
  }, [user, filter]);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-3xl font-black ${isPizza ? 'text-pizza-800' : 'text-lemon-800'}`}>
            {filter === 'owned' ? 'My Library' : 'Explore Courses'}
          </h2>
          <p className="opacity-70">
            {filter === 'owned' ? 'Continue your learning journey.' : 'Find the best resources for your career.'}
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Search courses..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{ '--tw-ring-color': isPizza ? '#f97316' : '#84cc16' } as any}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-lg">No courses found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => {
            const isOwned = ownedIds.includes(course.id);
            return (
              <div 
                key={course.id} 
                onClick={() => onViewCourse(course.id)}
                className={`group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border cursor-pointer ${isPizza ? 'border-pizza-100 hover:border-pizza-300' : 'border-lemon-100 hover:border-lemon-300'}`}
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                    {isOwned ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1 ${isPizza ? 'bg-green-500' : 'bg-green-600'}`}>
                        <Unlock size={12} /> OWNED
                      </span>
                    ) : (
                       <span className={`px-2 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1 bg-gray-900/50 backdrop-blur-sm`}>
                        <Lock size={12} /> LOCKED
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-5">
                   <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-current">{course.title}</h3>
                   <div className="flex items-center justify-between mt-4">
                     <div className={`font-black text-xl ${isPizza ? 'text-pizza-600' : 'text-lemon-600'}`}>
                        {course.price === 0 ? 'FREE' : `৳${course.price}`}
                     </div>
                     <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {course.files.length} Files
                     </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};