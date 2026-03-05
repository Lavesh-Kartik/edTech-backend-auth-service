export interface OAuthProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  provider: 'google' | 'github';
}
