import { User, Member, TontineGroup, PaymentTransaction, AppNotification } from '../types';

export const CURRENT_MODERATOR: User = {
  id: 'user_mod_1',
  name: 'Administrateur TontiFlow',
  firstName: 'Admin',
  lastName: 'TontiFlow',
  email: 'admin@tontiflow.africa',
  phone: '+237 6 99 45 22 10',
  whatsappNumber: '+237 6 99 45 22 10',
  avatarUrl: '/src/assets/images/avatar_claire_moderator_1790600689069.jpg',
  role: 'moderator',
  trustScore: 100,
  kycStatus: 'verified',
  city: 'Douala',
  country: 'Cameroun',
};

export const CURRENT_MEMBER: User = {
  id: 'user_mem_1',
  name: 'Membre TontiFlow',
  firstName: 'Membre',
  lastName: 'TontiFlow',
  email: 'membre@tontiflow.africa',
  phone: '+237 6 75 12 34 56',
  whatsappNumber: '+237 6 75 12 34 56',
  role: 'member',
  trustScore: 100,
  kycStatus: 'verified',
  city: 'Douala',
  country: 'Cameroun',
};

// Clean Production Data: Empty by default
export const MOCK_MEMBERS: Member[] = [];
export const MOCK_GROUPS: TontineGroup[] = [];
export const MOCK_NOTIFICATIONS: AppNotification[] = [];

export function generateMockTransactions(): PaymentTransaction[] {
  return [];
}
