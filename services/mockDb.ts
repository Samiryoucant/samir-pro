import { User, Course, BuyRequest, Purchase, AdWatch, Role, DownloadRecord } from '../types';

const DB_KEYS = {
  USERS: 'samir_v2_users',
  COURSES: 'samir_v2_courses',
  REQUESTS: 'samir_v2_requests',
  PURCHASES: 'samir_v2_purchases',
  AD_WATCHES: 'samir_v2_ad_watches',
  DOWNLOADS: 'samir_v2_downloads',
};

// Safety wrapper for LocalStorage to prevent crashes
const safeSet = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage Quota Exceeded", e);
    alert("Storage Full! Browser storage is full. Please delete some courses or use External Links for files instead of uploading directly.");
  }
};

const get = <T>(key: string): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {
    return [] as T;
  }
};

// Initial Data Seeding
const seedData = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const admin: User = {
      id: 'admin-1',
      username: 'SamirAdmin',
      email: 'samirhossain0916@gmail.com',
      passwordHash: 'samirisquixora', 
      role: 'admin',
      isBanned: false,
      theme: 'pizza',
      createdAt: new Date().toISOString()
    };
    safeSet(DB_KEYS.USERS, [admin]);
  }
  
  // Start with NO demo courses for production feel
  if (!localStorage.getItem(DB_KEYS.COURSES)) {
    safeSet(DB_KEYS.COURSES, []);
  }
  
  [DB_KEYS.REQUESTS, DB_KEYS.PURCHASES, DB_KEYS.AD_WATCHES, DB_KEYS.DOWNLOADS].forEach(key => {
    if (!localStorage.getItem(key)) safeSet(key, []);
  });
};

seedData();

export const db = {
  users: {
    all: () => get<User[]>(DB_KEYS.USERS),
    find: (email: string) => get<User[]>(DB_KEYS.USERS).find(u => u.email === email),
    create: (user: User) => {
      const users = get<User[]>(DB_KEYS.USERS);
      users.push(user);
      safeSet(DB_KEYS.USERS, users);
      return user;
    },
    update: (id: string, updates: Partial<User>) => {
      const users = get<User[]>(DB_KEYS.USERS);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        safeSet(DB_KEYS.USERS, users);
        return users[idx];
      }
      return null;
    }
  },
  courses: {
    all: () => get<Course[]>(DB_KEYS.COURSES),
    create: (course: Course) => {
      const courses = get<Course[]>(DB_KEYS.COURSES);
      courses.push(course);
      safeSet(DB_KEYS.COURSES, courses);
    },
    update: (id: string, updates: Partial<Course>) => {
      const courses = get<Course[]>(DB_KEYS.COURSES);
      const idx = courses.findIndex(c => c.id === id);
      if (idx !== -1) {
        courses[idx] = { ...courses[idx], ...updates };
        safeSet(DB_KEYS.COURSES, courses);
        return courses[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const courses = get<Course[]>(DB_KEYS.COURSES).filter(c => c.id !== id);
      safeSet(DB_KEYS.COURSES, courses);
    }
  },
  requests: {
    all: () => get<BuyRequest[]>(DB_KEYS.REQUESTS),
    create: (req: BuyRequest) => {
      const reqs = get<BuyRequest[]>(DB_KEYS.REQUESTS);
      reqs.push(req);
      safeSet(DB_KEYS.REQUESTS, reqs);
    },
    updateStatus: (id: string, status: 'approved' | 'rejected') => {
      const reqs = get<BuyRequest[]>(DB_KEYS.REQUESTS);
      const req = reqs.find(r => r.id === id);
      if (req) {
        req.status = status;
        safeSet(DB_KEYS.REQUESTS, reqs);
        return req;
      }
      return null;
    }
  },
  purchases: {
    all: () => get<Purchase[]>(DB_KEYS.PURCHASES),
    userHasAccess: (userId: string, courseId: string) => {
      return get<Purchase[]>(DB_KEYS.PURCHASES).some(p => p.userId === userId && p.courseId === courseId);
    },
    grant: (purchase: Purchase) => {
      const p = get<Purchase[]>(DB_KEYS.PURCHASES);
      if (!p.find(x => x.userId === purchase.userId && x.courseId === purchase.courseId)) {
        p.push(purchase);
        safeSet(DB_KEYS.PURCHASES, p);
      }
    }
  },
  ads: {
    getWatchCount: (userId: string, courseId: string) => {
      const watches = get<AdWatch[]>(DB_KEYS.AD_WATCHES);
      return watches.find(w => w.userId === userId && w.courseId === courseId)?.count || 0;
    },
    increment: (userId: string, courseId: string) => {
      const watches = get<AdWatch[]>(DB_KEYS.AD_WATCHES);
      const idx = watches.findIndex(w => w.userId === userId && w.courseId === courseId);
      if (idx !== -1) {
        watches[idx].count += 1;
        watches[idx].lastWatchedAt = new Date().toISOString();
      } else {
        watches.push({ userId, courseId, count: 1, lastWatchedAt: new Date().toISOString() });
      }
      safeSet(DB_KEYS.AD_WATCHES, watches);
      return idx !== -1 ? watches[idx].count : 1;
    }
  },
  downloads: {
    all: () => get<DownloadRecord[]>(DB_KEYS.DOWNLOADS),
    add: (record: DownloadRecord) => {
      const d = get<DownloadRecord[]>(DB_KEYS.DOWNLOADS);
      d.push(record);
      safeSet(DB_KEYS.DOWNLOADS, d);
    }
  }
};