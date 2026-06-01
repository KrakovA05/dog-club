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
  is_admin: boolean;
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
  created_at: string;
}
