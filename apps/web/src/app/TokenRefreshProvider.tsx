'use client';

import { useTokenRefresh } from '@/hooks/useTokenRefresh';

export default function TokenRefreshProvider() {
  useTokenRefresh();
  return null;
}
