export type UserRole = 'client' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified: boolean;
  photoUrl?: string;
  city?: string;
  governorate?: string;
  countryCode?: string;
  suspended: boolean;
  referralCode?: string;
  loyaltyPoints?: number;
  creditBalance?: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId: string | null;
  children?: Category[];
  active: boolean;
  countryCode?: string | null;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  user?: User;
  companyName?: string;
  isCompany: boolean;
  description?: string;
  categoryId?: string | null;
  category?: Category | null;
  experienceYears: number;
  zones?: string[];
  serviceRadiusKm: number;
  verificationLevel: 'none' | 'phone' | 'identity' | 'professional' | 'certified';
  identityVerified: boolean;
  professionalVerified: boolean;
  avgRating: number;
  reviewsCount: number;
  completedBookingsCount: number;
  cancelledBookingsCount: number;
  responseRate: number;
  acceptsUrgent: boolean;
  gallery?: string[];
  subscriptionPlan: 'free' | 'pro' | 'business';
  subscriptionExpiresAt?: string | null;
  createdAt: string;
}

export type DocumentType = 'id_card' | 'professional_license' | 'insurance' | 'other';
export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface ProviderDocument {
  id: string;
  providerId: string;
  provider?: ProviderProfile;
  type: DocumentType;
  fileUrl: string;
  label?: string;
  status: DocumentStatus;
  reviewNote?: string;
  createdAt: string;
}

export interface ServiceOffering {
  id: string;
  providerId: string;
  provider?: ProviderProfile;
  categoryId?: string | null;
  category?: Category | null;
  title: string;
  description?: string;
  price: number;
  currency: string;
  priceUnit: string;
  durationEstimateMinutes?: number;
  photos?: string[];
  active: boolean;
}

export type RequestStatus = 'open' | 'quoted' | 'accepted' | 'completed' | 'cancelled';
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly';

export interface ServiceRequest {
  id: string;
  clientId: string;
  client?: User;
  categoryId?: string | null;
  category?: Category | null;
  title: string;
  description: string;
  photos?: string[];
  addressLine?: string;
  city?: string;
  governorate?: string;
  desiredDate?: string;
  urgent: boolean;
  budget?: number;
  status: RequestStatus;
  isB2B: boolean;
  requesterCompanyName?: string;
  numberOfSites?: number;
  isRecurring: boolean;
  recurrenceFrequency?: RecurrenceFrequency | null;
  createdAt: string;
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Quote {
  id: string;
  requestId: string;
  request?: ServiceRequest;
  providerId: string;
  provider?: ProviderProfile;
  laborPrice: number;
  materialPrice: number;
  travelPrice: number;
  totalPrice: number;
  currency: string;
  durationEstimateMinutes?: number;
  validUntil?: string;
  message?: string;
  status: QuoteStatus;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export interface Booking {
  id: string;
  clientId: string;
  client?: User;
  providerId: string;
  provider?: ProviderProfile;
  requestId?: string | null;
  quoteId?: string | null;
  serviceId?: string | null;
  service?: ServiceOffering | null;
  assignedTeamMemberId?: string | null;
  assignedTeamMember?: TeamMember | null;
  scheduledAt: string;
  addressLine?: string;
  city?: string;
  price: number;
  currency: string;
  status: BookingStatus;
  cancellationReason?: string;
  paid: boolean;
  createdAt: string;
}

export type TeamMemberRole = 'manager' | 'technician';

export interface TeamMember {
  id: string;
  providerId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  role: TeamMemberRole;
  active: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  client?: User;
  providerId: string;
  provider?: ProviderProfile;
  requestId?: string | null;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  clientId: string;
  client?: User;
  providerId: string;
  rating: number;
  punctuality?: number;
  communication?: number;
  quality?: number;
  priceQuality?: number;
  comment?: string;
  hidden: boolean;
  providerReply?: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface LoyaltyAccount {
  loyaltyPoints: number;
  creditBalance: number;
  referralCode: string;
  currencySymbol: string;
  rules: {
    POINTS_PER_COMPLETED_BOOKING: number;
    POINTS_PER_REVIEW: number;
    POINTS_PER_REFERRAL: number;
    POINTS_PER_DT: number;
    MIN_REDEEMABLE_POINTS: number;
  };
}

export type LoyaltyReason = 'booking_completed' | 'review_submitted' | 'referral_bonus' | 'redemption' | 'admin_adjustment';

export interface LoyaltyTransaction {
  id: string;
  points: number;
  reason: LoyaltyReason;
  note?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referred?: User;
  status: 'pending' | 'completed';
  rewardPoints: number;
  completedAt?: string | null;
  createdAt: string;
}

export type PromotionType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  type: PromotionType;
  value: number;
  maxDiscountAmount?: number | null;
  minBookingAmount?: number | null;
  firstBookingOnly: boolean;
  categoryId?: string | null;
  category?: Category | null;
  city?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  maxUsesPerUser: number;
  usesCount: number;
  active: boolean;
  isPublic: boolean;
  currency: string;
  createdAt: string;
}

export interface ParsedRequest {
  categoryId: string | null;
  categoryName: string | null;
  title: string;
  description: string;
  city: string | null;
  urgent: boolean;
  budget: number | null;
}

export interface DraftQuote {
  laborPrice: number;
  materialPrice: number;
  travelPrice: number;
  message: string;
}

export interface ProviderMatch {
  provider: ProviderProfile;
  reasons: string[];
}

export interface PopularService {
  title: string;
  count: number;
}

export interface Country {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  defaultLanguage: string;
  phoneCode?: string;
  active: boolean;
}
