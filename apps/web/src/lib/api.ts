import prisma from '@/lib/prisma';

export { prisma };

export function getWebUrl() {
  return process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://catchandtrade.com';
}

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://catchandtrade.com/api';
}
