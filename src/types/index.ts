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
