/// <reference types="@cloudflare/workers-types" />

export interface User {
  username: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  creator: string;
  bill_image_url?: string;
  created_at: string;
  participants: string[];
  is_settled: boolean;
}

export interface Balance {
  owed_by_me: Record<string, number>;
  owed_to_me: Record<string, number>;
  total_balance: number;
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

export interface Variables {
  username: string;
}
