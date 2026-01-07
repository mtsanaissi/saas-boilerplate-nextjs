export interface UserConsent {
  user_id: string;
  analytics_enabled: boolean;
  marketing_enabled: boolean;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  created_at: string;
  ip_address: string | null;
}

export interface AccountDeletionRequest {
  user_id: string;
  token: string;
  requested_at: string;
  expires_at: string;
  confirmed_at: string | null;
}
