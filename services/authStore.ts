
import { User, UserRole, UserPermissions } from '../types';

const USERS_KEY = 'agrolink_core_db_v4'; 
const SESSION_KEY = 'agrolink_core_session_v4';

const ADMIN_PERMISSIONS: UserPermissions = {
  dashboard: true,
  map: true,
  visits: true,
  producers: true,
  proposals: true,
  catalog: true,
  reports: true,
  users: true
};

const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: true,
  map: true,
  visits: true,
  producers: true,
  proposals: true,
  catalog: true,
  reports: true,
  users: false
};

const getAuthorizedUsers = (): User[] => {
  const saved = localStorage.getItem(USERS_KEY);
  let usersList: User[] = saved ? JSON.parse(saved) : [];

  const masterAccounts: User[] = [
    {
      id: 'admin-master',
      name: 'Administrador Master',
      email: 'admin@agrolink.com.br',
      whatsapp: '5500000000000',
      password: 'Admin@2025!',
      role: 'admin',
      permissions: ADMIN_PERMISSIONS,
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-betoleite',
      name: 'Beto Leite',
      email: 'falecom@betoleite.com.br',
      whatsapp: '5500000000000',
      password: 'Beto@2025!',
      role: 'operator',
      permissions: DEFAULT_PERMISSIONS,
      isVerified: true,
      createdAt: new Date().toISOString()
    }
  ];

  masterAccounts.forEach(master => {
    const exists = usersList.find(u => u.email.toLowerCase() === master.email.toLowerCase());
    if (!exists) {
      usersList.push(master);
    } else {
      const idx = usersList.findIndex(u => u.email.toLowerCase() === master.email.toLowerCase());
      usersList[idx].password = master.password;
    }
  });

  localStorage.setItem(USERS_KEY, JSON.stringify(usersList));
  return usersList;
};

export const authStore = {
  getUsers: () => getAuthorizedUsers(),
  
  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  },

  login: (email: string, password: string): User | null => {
    const users = getAuthorizedUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  register: (data: Partial<User>): { success: boolean; code?: string; error?: string } => {
    const users = getAuthorizedUsers();
    const cleanEmail = data.email?.trim().toLowerCase();

    if (users.find(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name!,
      email: cleanEmail!,
      whatsapp: data.whatsapp!,
      password: data.password,
      role: 'operator',
      permissions: DEFAULT_PERMISSIONS,
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    console.log(`CÓDIGO DE ATIVAÇÃO PARA ${cleanEmail}: ${verificationCode}`);
    return { success: true, code: verificationCode };
  },

  verifyEmail: (email: string): boolean => {
    const users = getAuthorizedUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.isVerified = true;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.hash = '/auth';
  },

  addUser: (user: User) => {
    const users = getAuthorizedUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  updateUser: (updatedUser: User) => {
    let users = getAuthorizedUsers();
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  deleteUser: (id: string) => {
    if (id === 'admin-master') return;
    let users = getAuthorizedUsers();
    users = users.filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};
