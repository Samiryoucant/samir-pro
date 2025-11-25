import React, { useState } from 'react';
import { User, Theme } from '../types';
import { db } from '../services/mockDb';
import { useToast } from '../components/Toast.tsx';
import { Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  theme: Theme;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, theme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();

  const isDark = theme === 'dark';
  const isPizza = theme === 'pizza';

  const btnClass = `w-full py-3 rounded-lg font-bold text-white shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2 ${
      isDark 
        ? 'bg-indigo-600 hover:bg-indigo-700' 
        : (isPizza ? 'bg-pizza-600 hover:bg-pizza-700' : 'bg-lemon-600 hover:bg-lemon-700')
  }`;
  
  const linkClass = `font-bold cursor-pointer ${
      isDark 
        ? 'text-indigo-400' 
        : (isPizza ? 'text-pizza-600' : 'text-lemon-600')
  }`;
  
  const inputClass = `w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50 transition ${
      isDark 
        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
        : 'bg-gray-50 border-gray-200'
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (isLogin) {
      const user = db.users.find(email);
      if (user && user.passwordHash === password) {
        if (user.isBanned) {
          showToast('This account has been banned.', 'error');
          setLoading(false);
          return;
        }
        onLogin(user);
      } else {
        showToast('Invalid credentials. Hint: samirhossain0916@gmail.com / samirisquixora', 'error');
      }
    } else {
      if (!username || !email || !password) {
        showToast('All fields are required', 'error');
        setLoading(false);
        return;
      }
      if (db.users.find(email)) {
        showToast('Email already registered', 'error');
        setLoading(false);
        return;
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        username,
        email,
        passwordHash: password,
        role: 'user',
        isBanned: false,
        theme: theme,
        createdAt: new Date().toISOString()
      };
      db.users.create(newUser);
      showToast('Account created successfully!', 'success');
      onLogin(newUser);
    }
    setLoading(false);
  };

  return (
    <div className={`max-w-md mx-auto mt-12 p-8 rounded-2xl shadow-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-black mb-2 ${
            isDark 
              ? 'text-white' 
              : (isPizza ? 'text-pizza-700' : 'text-lemon-700')
        }`}>
          {isLogin ? 'Welcome Back!' : 'Join SAMIR PRO'}
        </h2>
        <p className="text-gray-500">
          {isLogin ? 'Access your courses and downloads.' : 'Start your learning journey today.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={inputClass}
              style={{ '--tw-ring-color': isDark ? '#6366f1' : (isPizza ? '#f97316' : '#84cc16') } as any}
              required
            />
          </div>
        )}
        
        <div>
          <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            style={{ '--tw-ring-color': isDark ? '#6366f1' : (isPizza ? '#f97316' : '#84cc16') } as any}
            required
          />
        </div>

        <div>
           <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Password</label>
           <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
             style={{ '--tw-ring-color': isDark ? '#6366f1' : (isPizza ? '#f97316' : '#84cc16') } as any}
            required
          />
        </div>

        <button type="submit" disabled={loading} className={btnClass}>
          {loading && <Loader2 className="animate-spin" size={20} />}
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <span onClick={() => { setIsLogin(!isLogin); setLoading(false); }} className={linkClass}>
          {isLogin ? 'Sign Up' : 'Log In'}
        </span>
      </div>
    </div>
  );
};