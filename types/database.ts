// ============================================================================
// Database Types for Multi-Tenant Architecture
// ============================================================================

export type Business = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  type: 'gym' | 'barber' | 'food_truck' | 'salon' | 'studio' | 'cafe' | 'retail' | string;
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

// ============================================================================
// Business Type Presets - Templates for each business type
// ============================================================================

export type BusinessTypePreset = {
  value: string;
  label: string;
  icon: string;
  color: string;
  tagline: string;
  statusOpenText: string;
  statusClosedText: string;
  postLabel: string;
  postPlaceholder: string;
  defaultStatusMessage: string;
  ctaText: string;
};

export const BUSINESS_PRESETS: BusinessTypePreset[] = [
  {
    value: 'gym',
    label: 'Gym / Fitness',
    icon: 'Dumbbell',
    color: '#22c55e', // Green
    tagline: 'Daily Workouts',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Workout',
    postPlaceholder: "Enter today's workout...",
    defaultStatusMessage: 'Check the feed for today\'s workout!',
    ctaText: 'Join Now',
  },
  {
    value: 'barber',
    label: 'Barber Shop',
    icon: 'Scissors',
    color: '#3b82f6', // Blue
    tagline: 'Fresh Cuts Daily',
    statusOpenText: 'Open for Walk-ins',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update with your clients...',
    defaultStatusMessage: 'Walk-ins welcome!',
    ctaText: 'Book Now',
  },
  {
    value: 'food_truck',
    label: 'Food Truck',
    icon: 'Truck',
    color: '#f59e0b', // Amber
    tagline: 'Street Eats',
    statusOpenText: 'Open & Serving',
    statusClosedText: 'Closed for Today',
    postLabel: 'Menu Update',
    postPlaceholder: "Today's specials...",
    defaultStatusMessage: 'Check our location for today!',
    ctaText: 'View Menu',
  },
  {
    value: 'salon',
    label: 'Salon / Spa',
    icon: 'Sparkles',
    color: '#ec4899', // Pink
    tagline: 'Beauty & Wellness',
    statusOpenText: 'Open for Appointments',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share news, specials, or availability...',
    defaultStatusMessage: 'Book your appointment today!',
    ctaText: 'Book Appointment',
  },
  {
    value: 'studio',
    label: 'Studio / Classes',
    icon: 'Music',
    color: '#8b5cf6', // Purple
    tagline: 'Classes & Sessions',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Schedule',
    postPlaceholder: "Today's class schedule...",
    defaultStatusMessage: 'Check the schedule for upcoming classes!',
    ctaText: 'View Schedule',
  },
  {
    value: 'cafe',
    label: 'Cafe / Coffee Shop',
    icon: 'Coffee',
    color: '#78350f', // Brown
    tagline: 'Fresh Brews',
    statusOpenText: 'Open & Brewing',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: "Today's specials, new items...",
    defaultStatusMessage: 'Come grab a fresh cup!',
    ctaText: 'Order Ahead',
  },
  {
    value: 'retail',
    label: 'Retail / Shop',
    icon: 'ShoppingBag',
    color: '#0891b2', // Cyan
    tagline: 'Now Open',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'New arrivals, sales, updates...',
    defaultStatusMessage: 'Stop by and see what\'s new!',
    ctaText: 'Shop Now',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'Store',
    color: '#6b7280', // Gray
    tagline: 'Updates',
    statusOpenText: 'Open',
    statusClosedText: 'Closed',
    postLabel: 'Update',
    postPlaceholder: 'Share an update...',
    defaultStatusMessage: 'Welcome!',
    ctaText: 'Learn More',
  },
];

export function getBusinessPreset(type: string): BusinessTypePreset {
  return BUSINESS_PRESETS.find(p => p.value === type) || BUSINESS_PRESETS[BUSINESS_PRESETS.length - 1];
}

// Legacy config for backwards compatibility
export const BUSINESS_TYPE_CONFIG: Record<string, {
  icon: string;
  statusOpenText: string;
  statusClosedText: string;
  postLabel: string;
  postPlaceholder: string;
}> = Object.fromEntries(
  BUSINESS_PRESETS.map(p => [p.value, {
    icon: p.icon,
    statusOpenText: p.statusOpenText,
    statusClosedText: p.statusClosedText,
    postLabel: p.postLabel,
    postPlaceholder: p.postPlaceholder,
  }])
);

export function getBusinessConfig(type: string) {
  return BUSINESS_TYPE_CONFIG[type] || BUSINESS_TYPE_CONFIG.other;
}
