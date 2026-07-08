export type ServiceType = "daycare" | "hotel";

export interface PriceRow {
  id: string;
  service_type: ServiceType;
  label: string;
  description: string | null;
  price: number;
  unit: string;
  is_featured: boolean;
  sort_order: number;
}

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface ReviewRow {
  id: string;
  author_name: string;
  text: string;
  rating: number;
  pet_type: string | null;
  pet_photo_url: string | null;
  created_at: string;
  is_published: boolean;
}

export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  type: "dog" | "cat";
  breed: string | null;
  birth_year: number | null;
  weight_kg: number | null;
  special_needs: string | null;
  passport_full_name: string | null;
  passport_photo_url: string | null;
  created_at: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type DaycareFormat = "hour" | "half_day" | "full_day";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  pet_id: string;
  service_type: "daycare" | "hotel";
  daycare_format: DaycareFormat | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  status: BookingStatus;
  price_total: number | null;
  created_at: string;
  pets?: Pick<Pet, "name" | "type" | "breed">;
}

export type CapacityZone = "dog_daycare" | "dog_hotel" | "cats";

export interface CapacityZoneRow {
  zone: CapacityZone;
  label: string;
  capacity: number;
}

// Доступность по одной дате (результат RPC get_availability)
export interface DayAvailability {
  d: string;
  capacity: number;
  occupied: number;
  remaining: number;
}

// ─── Абонементы детсада (миграция 026) ─────────────────────────────────────
export type SubscriptionType = "visits_6" | "visits_12";
export type SubscriptionStatus = "active" | "expired" | "used_up" | "frozen";

export interface Subscription {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  pet_id: string | null;
  type: SubscriptionType;
  total_visits: number;
  price: number;
  purchased_at: string;
  expires_at: string;
  status: SubscriptionStatus;
  frozen_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface SubscriptionVisit {
  id: string;
  subscription_id: string;
  visit_date: string;
  marked_by: string | null;
  booking_id: string | null;
  notes: string | null;
  created_at: string;
}

// Параметры тарифов абонементов: посещения, цена, срок действия в днях
export const SUBSCRIPTION_PLANS: Record<
  SubscriptionType,
  { visits: number; price: number; durationDays: number; label: string }
> = {
  visits_6: { visits: 6, price: 6480, durationDays: 60, label: "6 посещений" },
  visits_12: { visits: 12, price: 11520, durationDays: 90, label: "12 посещений" },
};

// Статус с учётом истечения (expired вычисляется на лету, не фоновым джобом)
export function effectiveSubscriptionStatus(s: Pick<Subscription, "status" | "expires_at">): SubscriptionStatus {
  if (s.status === "active" && new Date(s.expires_at) < new Date()) return "expired";
  return s.status;
}
