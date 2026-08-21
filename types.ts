export type UserRole = 'admin' | 'user';

export type PlanType = 'free' | 'pro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  plan: PlanType;
  joinDate: string;
  lastCreditReset?: string; // ISO date string
  tamperFlag?: boolean; // If true, user is locked out
  passwordHash?: string; // Secure storage for auth
}

export interface ActivationCode {
  hash: string; // Storing HASH, not raw code
  createdAt: string;
  expiresAt: string; // Expiry date (30 days from creation)
  used: boolean;
  usedBy?: string;
  usedAt?: string;
}

export interface GeneratorInput {
  type: 'logo' | 'brand_name' | 'identity' | 'bio' | 'caption' | 'marketing' | 'hashtags' | 'shorts';
  description: string;
  audience: string;
  style: string;
  platform?: string;
  language: 'English' | 'Hindi' | 'Hinglish';
}

export interface HistoryItem {
  id: string;
  userId: string;
  type: GeneratorInput['type'];
  input: string;
  output: string;
  timestamp: string;
  isImage: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type: 'info' | 'success' | 'alert' | 'code';
  metadata?: { code?: string };
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  userMessage?: string;
  adminResponse?: string;
}

export const TOOLS = [
  { id: 'logo', name: 'Logo Design', icon: 'Hexagon', desc: 'Visual Identity', isImage: true },
  { id: 'brand_name', name: 'Brand Names', icon: 'Type', desc: 'Nomenclature', isImage: false },
  { id: 'identity', name: 'Identity Suite', icon: 'Fingerprint', desc: 'Core Values', isImage: false },
  { id: 'bio', name: 'Social Bio', icon: 'Sparkles', desc: 'Instagram/LinkedIn', isImage: false },
  { id: 'caption', name: 'Viral Captions', icon: 'MessageSquareQuote', desc: 'Engagement', isImage: false },
  { id: 'hashtags', name: 'Hashtag Stack', icon: 'Hash', desc: 'SEO & Reach', isImage: false },
  { id: 'marketing', name: 'Ad Copy', icon: 'Megaphone', desc: 'High Conversion', isImage: false },
  { id: 'shorts', name: 'AI Shorts Cutter', icon: 'Scissors', desc: 'Free clips + captions', isImage: false, isFree: true },
] as const;

export const GENERATION_COST = 5;
export const PRO_DAILY_CREDITS = 100;
export const FREE_TOTAL_CREDITS = 20;