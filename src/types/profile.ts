export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string | null;
  plan_id?: string | null;
  plan_status?: string | null;
}
