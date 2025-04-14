/// <reference types="@cloudflare/workers-types" />

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  description?: string;
  category: string;
  bill_image_url?: string;
  ocr_text?: string;
  split_type: 'equal' | 'percentage' | 'custom';
  is_settled: boolean;
  creator_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: number;
  expense_id: number;
  user_id: number;
  amount: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  expense_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: number;
  username: string;
}

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  R2_BUCKET: R2Bucket;
  OPENROUTER_API_KEY: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  SITE_NAME: string;
}
