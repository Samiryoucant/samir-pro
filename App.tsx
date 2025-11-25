import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { User, Theme } from './types';
import { db } from './services/mockDb';
// FIX: Removed .tsx extension from import path. This often causes build failure in production.
import { ToastProvider, useToast } from './components/Toast'; 

// Pages
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { CourseView } from './pages/CourseView';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('pizza');
  const [page, setPage] = useState('home');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { showToast } = useToast();

  // We MUST use Firestore, not localStorage. The mockDb should be replaced 
  // with actual Firebase logic in a real application.
  useEffect(() => {
    // Restore session
    const storedUser = localStorage.getItem('samir_current_user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setTheme(u.theme);
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('samir_current_user', JSON.stringify(u));
    setTheme(u.theme);
    setPage('home');
    showToast(`Welcome back, ${u.username}!`, 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('samir_current_user');
    setPage('login');
    showToast('Logged out successfully', 'success');
  };

  const handleSwitchTheme = (t: Theme) => {
    setTheme(t);
    if (user) {
      const updated = { ...user, theme: t };
      setUser(updated);
      localStorage.setItem('samir_current_user', JSON.stringify(updated));
      db.users.update(user.id, { theme: t });
    }
  };

  const navigate = (p: string) => {
    setPage(p);
    if (p !== 'course-view') setSelectedCourseId(null);
  };

  const viewCourse = (id: string) => {
    setSelectedCourseId(id);
    setPage('course-view');
  };

  // Guard routes
  if (!user && ['my-courses', 'profile', 'admin-dashboard'].includes(page)) {
    setPage('login');
  }

  // Render Page Content
  let content;
  switch (page) {
    case 'login':
      content = <Auth onLogin={handleLogin} theme={theme} />;
      break;
    case 'home':
      content = <Dashboard user={user} theme={theme} onViewCourse={viewCourse} filter="all" />;
      break;
    case 'my-courses':
      content = <Dashboard user={user} theme={theme} onViewCourse={viewCourse} filter="owned" />;
      break;
    case 'course-view':
      content = <CourseView user={user} theme={theme} courseId={selectedCourseId!} onBack={() => navigate('home')} />;
      break;
    case 'profile':
      content = <Profile user={user!} theme={theme} />;
      break;
    case 'admin-dashboard':
    case 'admin-requests':
    case 'admin-courses':
      content = <AdminPanel user={user!} theme={theme} subPage={page} onViewCourse={viewCourse} />;
      break;
    default:
      content = <Dashboard user={user} theme={theme} onViewCourse={viewCourse} filter="all" />;
  }

  return (
    <Layout 
      user={user} 
      theme={theme} 
      onLogout={handleLogout} 
      onSwitchTheme={handleSwitchTheme}
      currentPage={page}
      onNavigate={navigate}
    >
      {content}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
