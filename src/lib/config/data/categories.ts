export type ProductCategory = 'protein' | 'pre-workout' | 'energy-drink' | 'bcaa' | 'eaa' | 'fat-burner' | 'appetite-suppressant';

export interface Category {
  id: ProductCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  productCount: number;
  href: string;
}

export const categories: Category[] = [
  {
    id: 'protein',
    name: 'Protein',
    description: 'Whey, plant-based, and other protein supplements',
    icon: '💪',
    color: 'bg-blue-500',
    productCount: 1247,
    href: '/products/protein-powder',
  },
  {
    id: 'pre-workout',
    name: 'Pre-Workout',
    description: 'Energy and performance boosters for training',
    icon: '⚡',
    color: 'bg-orange-500',
    productCount: 567,
    href: '/products/pre-workout',
  },
  {
    id: 'energy-drink',
    name: 'Energy Drinks',
    description: 'High-performance drinks with nootropics and stimulants',
    icon: '🥤',
    color: 'bg-red-500',
    productCount: 234,
    href: '/products/energy-drink',
  },
  {
    id: 'bcaa',
    name: 'BCAA',
    description: 'Branched-chain amino acids for recovery',
    icon: '🧬',
    color: 'bg-indigo-500',
    productCount: 278,
    href: '/products/bcaa',
  },
  {
    id: 'eaa',
    name: 'EAA',
    description: 'Essential amino acids for complete protein synthesis',
    icon: '🔬',
    color: 'bg-purple-500',
    productCount: 189,
    href: '/products/eaa',
  },
  {
    id: 'fat-burner',
    name: 'Fat Burners',
    description: 'Thermogenic supplements for weight management',
    icon: '🔥',
    color: 'bg-orange-600',
    productCount: 342,
    href: '/products/fat-burner',
  },
  {
    id: 'appetite-suppressant',
    name: 'Appetite Suppressants',
    description: 'Supplements to help control hunger and cravings',
    icon: '🍽️',
    color: 'bg-green-500',
    productCount: 156,
    href: '/products/appetite-suppressant',
  },
];
