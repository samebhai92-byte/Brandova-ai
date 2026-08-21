// ... (imports)
import { User, HistoryItem, Notification, PaymentRequest, ActivationCode, PRO_DAILY_CREDITS, FREE_TOTAL_CREDITS } from '../types';

const USERS_KEY = 'brandova_secure_users_v1';
const HISTORY_KEY = 'brandova_secure_history_v1';
const NOTIFICATIONS_KEY = 'brandova_secure_notifs_v1';
const REQUESTS_KEY = 'brandova_secure_requests_v1';
const CURRENT_USER_KEY = 'brandova_secure_session_v1';
const CODES_KEY = 'brandova_secure_hashes_v1';

// --- Security Utils ---

// Simple synchronous hash for client-side obfuscation (Not crypto-grade, but sufficient for requirement)
export const secureHash = (str: string): string => {
  let hash = 0;
  const salt = "BRANDOVA_SECURE_SALT_2024";
  const text = str + salt;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Admin Credentials Hash (admin786)
const ADMIN_HASH = secureHash("admin786");

export const verifyAdminCredentials = (email: string, pass: string): boolean => {
  return email === 'admin@brandova.ai' && secureHash(pass) === ADMIN_HASH;
};

// --- Anti-Tamper Logic ---
const validateUserIntegrity = (user: User): User => {
  // If a free user has more than FREE_TOTAL_CREDITS and hasn't just been created/reset, it's suspicious
  // Or if a user has infinite credits.
  if (user.role === 'user' && user.plan === 'free' && user.credits > FREE_TOTAL_CREDITS) {
    return { ...user, credits: 0, tamperFlag: true };
  }
  // Reset Pro credits logic
  if (user.plan === 'pro') {
     const today = new Date().toDateString();
     const lastReset = user.lastCreditReset ? new Date(user.lastCreditReset).toDateString() : '';
     if (today !== lastReset) {
        return { ...user, credits: PRO_DAILY_CREDITS, lastCreditReset: new Date().toISOString() };
     }
  }
  return user;
};

// --- User Management ---

export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  const current = getCurrentSession();
  if (current && current.id === user.id) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
};

// New: Register a new user
export const registerUser = (name: string, email: string, password: string): User => {
  const users = getUsers();
  
  // 1. Check for duplicate email
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("This email is already registered. Please login.");
  }

  // 2. Hash password
  const passwordHash = secureHash(password);

  // 3. Create User
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: 'user',
    credits: 20,
    plan: 'free',
    joinDate: new Date().toISOString(),
    passwordHash: passwordHash
  };

  // 4. Save
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  
  // 5. Auto Login
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  return newUser;
};

// New: Authenticate existing user
export const authenticateUser = (email: string, password: string): User => {
  // Check Admin first (Hardcoded bypass for specific email)
  if (email === 'admin@brandova.ai') {
     if (secureHash(password) === ADMIN_HASH) {
         const adminUser: User = {
            id: 'admin_master',
            name: 'Administrator',
            email: email,
            role: 'admin',
            credits: 99999,
            plan: 'pro',
            joinDate: new Date().toISOString()
         };
         // We don't save admin to users array to keep it hidden, just session
         localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminUser));
         return adminUser;
     } else {
         throw new Error("Invalid admin credentials");
     }
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  
  if (!user) {
    throw new Error("Account not found. Please create a new account.");
  }
  
  if (user.passwordHash !== secureHash(password)) {
    throw new Error("Incorrect password. Please try again.");
  }
  
  const validated = validateUserIntegrity(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(validated));
  return validated;
};

export const loginUser = (user: User) => {
  const validated = validateUserIntegrity(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(validated));
  saveUser(validated);
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentSession = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  if (!data) return null;
  const user = JSON.parse(data);
  const validated = validateUserIntegrity(user);
  
  if (validated.tamperFlag) {
     // If tamper detected, force update storage to lock them out
     saveUser(validated);
     return validated;
  }
  
  if (JSON.stringify(user) !== JSON.stringify(validated)) {
      saveUser(validated);
  }
  return validated;
};

// --- Data Persistence ---

export const getHistory = (userId: string): HistoryItem[] => {
  const data = localStorage.getItem(HISTORY_KEY);
  const allHistory: HistoryItem[] = data ? JSON.parse(data) : [];
  return allHistory.filter(h => h.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addHistory = (item: HistoryItem) => {
  const data = localStorage.getItem(HISTORY_KEY);
  const allHistory: HistoryItem[] = data ? JSON.parse(data) : [];
  allHistory.push(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
};

export const getNotifications = (userId: string): Notification[] => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  const all: Notification[] = data ? JSON.parse(data) : [];
  return all.filter(n => n.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addNotification = (notif: Notification) => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  // Shared store logic: Read ALL notifications, append new one, write back.
  // This ensures we don't overwrite notifications for other users or lose data.
  const all: Notification[] = data ? JSON.parse(data) : [];
  all.push(notif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
};

export const markNotificationRead = (id: string) => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return;
  const all: Notification[] = JSON.parse(data);
  const index = all.findIndex(n => n.id === id);
  if (index >= 0) {
    all[index].read = true;
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  }
};

export const getPaymentRequests = (): PaymentRequest[] => {
  const data = localStorage.getItem(REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const createPaymentRequest = (req: PaymentRequest) => {
  const data = localStorage.getItem(REQUESTS_KEY);
  const all: PaymentRequest[] = data ? JSON.parse(data) : [];
  all.push(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
};

export const updatePaymentRequest = (id: string, status: 'approved' | 'rejected', adminResponse?: string) => {
  const data = localStorage.getItem(REQUESTS_KEY);
  if (!data) return;
  const all: PaymentRequest[] = JSON.parse(data);
  const index = all.findIndex(r => r.id === id);
  if (index >= 0) {
    all[index].status = status;
    if (adminResponse) {
      all[index].adminResponse = adminResponse;
    }
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  }
};

// --- Token Management (Secure) ---

export const getActivationCodes = (): ActivationCode[] => {
  const data = localStorage.getItem(CODES_KEY);
  return data ? JSON.parse(data) : [];
};

// Generates exactly 10 codes with 30-day expiry
export const generateBatchCodes = (count: number = 10): string[] => {
  const storedCodes = getActivationCodes();
  const rawCodes: string[] = [];
  const newEntries: ActivationCode[] = [];
  
  // Expiry is 30 days from now
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  // Ensure we generate exactly 'count' unique codes
  while (rawCodes.length < count) {
    // Generate 8 random alphanumeric chars for BRANDOVA-PRO-XXXXXXXX
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
    const codeStr = `BRANDOVA-PRO-${randomStr}`;
    const hash = secureHash(codeStr);
    
    // Check if hash exists in storage or current batch
    if (storedCodes.find(c => c.hash === hash) || newEntries.find(c => c.hash === hash)) {
      continue; // Collision detected, retry
    }

    rawCodes.push(codeStr);
    newEntries.push({
      hash: hash,
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      used: false
    });
  }
  
  localStorage.setItem(CODES_KEY, JSON.stringify([...storedCodes, ...newEntries]));
  return rawCodes;
};

// Helper for Admin to check if a manually entered code is valid/exists
export const validateCodeForAdmin = (rawCode: string): 'valid' | 'invalid' | 'used' | 'expired' => {
  const codes = getActivationCodes();
  const inputHash = secureHash(rawCode.trim());
  const code = codes.find(c => c.hash === inputHash);
  
  if (!code) return 'invalid';
  if (code.used) return 'used';
  if (new Date() > new Date(code.expiresAt)) return 'expired';
  
  return 'valid';
};

// Validates input against stored hashes and expiry
export const redeemActivationCode = (inputCode: string, user: User): { success: boolean, msg: string, user?: User } => {
  const codes = getActivationCodes();
  const inputHash = secureHash(inputCode.trim());
  const index = codes.findIndex(c => c.hash === inputHash);
  
  if (index === -1) return { success: false, msg: 'Invalid activation code.' };
  
  const code = codes[index];
  
  if (code.used) return { success: false, msg: 'Code has already been used.' };
  
  // Check Expiry
  if (new Date() > new Date(code.expiresAt)) {
    return { success: false, msg: 'Activation code has expired.' };
  }

  if (user.plan === 'pro') return { success: false, msg: 'User is already on Pro plan.' };

  // Mark used (permanently invalidates it for future use)
  codes[index] = {
    ...code,
    used: true,
    usedBy: user.name,
    usedAt: new Date().toISOString()
  };
  localStorage.setItem(CODES_KEY, JSON.stringify(codes));

  // Upgrade User
  const upgradedUser: User = {
    ...user,
    plan: 'pro',
    credits: PRO_DAILY_CREDITS,
    lastCreditReset: new Date().toISOString()
  };
  
  saveUser(upgradedUser);
  return { success: true, msg: 'Pro Plan Activated Successfully', user: upgradedUser };
};