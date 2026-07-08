import { AppPath } from 'twenty-shared/types';

import { VOKA_AUTH_PATHS } from '@/app/constants/VokaAuthPaths';

export const CAPTCHA_PROTECTED_PATHS: string[] = [
  AppPath.SignInUp,
  AppPath.Verify,
  AppPath.VerifyEmail,
  AppPath.ResetPassword,
  AppPath.Invite,
  // FORK: Voka CRM — telas de auth próprias também exigem captcha
  ...VOKA_AUTH_PATHS,
];
