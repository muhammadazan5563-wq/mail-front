export interface GmailAccount {
  email: string;
  connectedAt: string;
  status: 'active' | 'expired';
  refreshToken?: string;
  accessToken?: string;
  expiresAt?: number;
}

export interface Contact {
  id: string;
  email: string;
  name: string;
  listName: string;
  createdAt?: string;
  company?: string;
  firstName?: string;
  variables?: Record<string, string>;
  /** Lightweight count used by list summaries to avoid loading all contacts into memory */
  _count?: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'normal' | 'auto';
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  contactListName: string;
  subject: string;
  bodyTemplate: string;
  senderEmail?: string;
  delaySeconds: number;
  sendLimit?: number;
  senderEmails?: string[];
  emailsPerHourPerAccount?: number;
  totalContacts: number;
  sentCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  startedAt?: string;
}

export interface CampaignLog {
  id: string;
  campaignId: string;
  timestamp: string;
  recipient: string;
  sender: string;
  status: 'success' | 'failed';
  subject: string;
  errorMessage?: string;
}

export interface QueueItem {
  id: string;
  campaignId: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  status: 'pending' | 'sending' | 'success' | 'failed';
  subject: string;
  body: string;
  delayUntil: number;
}

// Auth types
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Admin types
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  stats?: {
    accounts: number;
    contacts: number;
    campaigns: number;
    emailsSent: number;
  };
}

export interface LoginHistoryEntry {
  id: number;
  user_id: number;
  ip_address: string;
  user_agent: string;
  success: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface AdminRestriction {
  id: number;
  type: 'ip_ban' | 'user_ban';
  value: string;
  reason: string;
  created_by: number;
  is_active: boolean;
  created_at: string;
  created_by_email?: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  totalContacts: number;
  recentLogins: LoginHistoryEntry[];
}
