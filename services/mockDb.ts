import { User, Course, BuyRequest, Purchase, AdWatch, Role, DownloadRecord } from '../types';

const DB_KEYS = {
  USERS: 'samir_users',
  COURSES: 'samir_courses',
  REQUESTS: 'samir_requests',
  PURCHASES: 'samir_purchases',
  AD_WATCHES: 'samir_ad_watches',
  DOWNLOADS: 'samir_downloads',
};

// Initial Data Seeding
const seedData = () => {
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    const admin: User = {
      id: 'admin-1',
      username: 'SamirAdmin',
      email: 'samirhossain0916@gmail.com',
      passwordHash: 'samirisquixora', // Plaintext for demo simulation
      role: 'admin',
      isBanned: false,
      theme: 'pizza',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify([admin]));
  }
  
  if (!localStorage.getItem(DB_KEYS.COURSES)) {
    const initialCourses: Course[] = [
      {
        id: 'c1',
        title: 'Complete PHP Mastery 2024',
        description: 'Learn PHP from scratch to advanced. Includes 50+ projects and real-world scenarios.',
        price: 1500,
        thumbnail: 'https://picsum.photos/400/225?random=1',
        banner: 'https://picsum.photos/800/400?random=101',
        sampleImages: [
          'https://picsum.photos/400/225?random=10',
          'https://picsum.photos/400/225?random=11'
        ],
        unlockAdsRequired: 5,
        files: [
          { id: 'f1', name: 'Intro.mp4', type: 'video', size: '50MB', url: '#', sourceType: 'link' },
          { id: 'f2', name: 'SourceCode.zip', type: 'zip', size: '120MB', url: '#', sourceType: 'link' }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: 'c2',
        title: 'React Native for Beginners',
        description: 'Build mobile apps with React Native. Zero to Hero.',
        price: 2000,
        thumbnail: 'https://picsum.photos/400/225?random=2',
        banner: 'https://picsum.photos/800/400?random=102',
        sampleImages: [],
        unlockAdsRequired: 10,
        files: [
          { id: 'f3', name: 'Guide.pdf', type: 'pdf', size: '5MB', url: '#', sourceType: 'link' }
        ],
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(DB_KEYS.COURSES, JSON.stringify(initialCourses));
  }
  
  // Initialize other tables if empty
  [DB_KEYS.REQUESTS, DB_KEYS.PURCHASES, DB_KEYS.AD_WATCHES, DB_KEYS.DOWNLOADS].forEach(key => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
  });
};

seedData();

// Helpers
const get = <T>(key: string): T => JSON.parse(localStorage.getItem(key) || '[]');
const set = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const db = {
  users: {
    all: () => get<User[]>(DB_KEYS.USERS),
    find: (email: string) => get<User[]>(DB_KEYS.USERS).find(u => u.email === email),
    create: (user: User) => {
      const users = get<User[]>(DB_KEYS.USERS);
      users.push(user);
      set(DB_KEYS.USERS, users);
      return user;
    },
    update: (id: string, updates: Partial<User>) => {
      const users = get<User[]>(DB_KEYS.USERS);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        set(DB_KEYS.USERS, users);
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
      set(DB_KEYS.COURSES, courses);
    },
    update: (id: string, updates: Partial<Course>) => {
      const courses = get<Course[]>(DB_KEYS.COURSES);
      const idx = courses.findIndex(c => c.id === id);
      if (idx !== -1) {
        courses[idx] = { ...courses[idx], ...updates };
        set(DB_KEYS.COURSES, courses);
        return courses[idx];
      }
      return null;
    },
    delete: (id: string) => {
      const courses = get<Course[]>(DB_KEYS.COURSES).filter(c => c.id !== id);
      set(DB_KEYS.COURSES, courses);
    }
  },
  requests: {
    all: () => get<BuyRequest[]>(DB_KEYS.REQUESTS),
    create: (req: BuyRequest) => {
      const reqs = get<BuyRequest[]>(DB_KEYS.REQUESTS);
      reqs.push(req);
      set(DB_KEYS.REQUESTS, reqs);
    },
    updateStatus: (id: string, status: 'approved' | 'rejected') => {
      const reqs = get<BuyRequest[]>(DB_KEYS.REQUESTS);
      const req = reqs.find(r => r.id === id);
      if (req) {
        req.status = status;
        set(DB_KEYS.REQUESTS, reqs);
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
      // Avoid duplicates
      if (!p.find(x => x.userId === purchase.userId && x.courseId === purchase.courseId)) {
        p.push(purchase);
        set(DB_KEYS.PURCHASES, p);
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
      set(DB_KEYS.AD_WATCHES, watches);
      return idx !== -1 ? watches[idx].count : 1;
    }
  },
  downloads: {
    all: () => get<DownloadRecord[]>(DB_KEYS.DOWNLOADS),
    add: (record: DownloadRecord) => {
      const d = get<DownloadRecord[]>(DB_KEYS.DOWNLOADS);
      d.push(record);
      set(DB_KEYS.DOWNLOADS, d);
    }
  }
};