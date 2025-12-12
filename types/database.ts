// ============================================================================
// Database Types for Multi-Tenant Architecture
// ============================================================================

export type Business = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  type: 'gym' | 'barber' | 'food_truck' | 'salon' | 'studio' | string;
  primary_color: string;
  tagline: string | null;
  external_link: string | null;
  external_link_text: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Status = {
  id: number;
  business_id: string;
  is_open: boolean;
  message: string | null;
};

export type Post = {
  id: number;
  business_id: string;
  content: string;
  created_at: string;
};

// Business type configurations for UI customization
export const BUSINESS_TYPE_CONFIG: Record<string, {
  icon: string;
  statusOpenText: string;
  statusClosedText: string;
  postLabel: string;
  postPlaceholder: string;
}> = {
  gym: {
    icon: 'Dumbbell',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Workout',
    postPlaceholder: "Enter today's workout...",
  },
  barber: {
    icon: 'Scissors',
    statusOpenText: 'Open for Appointments',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update with your clients...',
  },
  food_truck: {
    icon: 'Truck',
    statusOpenText: 'Open & Serving',
    statusClosedText: 'Closed',
    postLabel: 'Menu Update',
    postPlaceholder: "Today's specials...",
  },
  salon: {
    icon: 'Sparkles',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update...',
  },
  studio: {
    icon: 'Music',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update...',
  },
  default: {
    icon: 'Store',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update...',
  },
};

export function getBusinessConfig(type: string) {
  return BUSINESS_TYPE_CONFIG[type] || BUSINESS_TYPE_CONFIG.default;
}

