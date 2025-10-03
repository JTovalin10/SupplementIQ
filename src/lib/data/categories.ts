import { ProductCategory } from '../types';

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
    id: 'protein_powder',
    name: 'Protein Powder',
    description: 'Whey, plant-based, and other protein supplements',
    icon: '💪',
    color: 'bg-blue-500',
    productCount: 1247,
    href: '/products/protein-powder'
  },
  {
    id: 'mass_gainer',
    name: 'Mass Gainer',
    description: 'High-calorie supplements for weight gain',
    icon: '⚖️',
    color: 'bg-green-500',
    productCount: 342,
    href: '/products/mass-gainer'
  },
  {
    id: 'pre_workout',
    name: 'Pre-Workout',
    description: 'Energy and performance boosters',
    icon: '⚡',
    color: 'bg-orange-500',
    productCount: 567,
    href: '/products/pre-workout'
  },
  {
    id: 'post_workout',
    name: 'Post-Workout',
    description: 'Recovery and muscle building supplements',
    icon: '🔄',
    color: 'bg-purple-500',
    productCount: 423,
    href: '/products?category=post_workout'
  },
  {
    id: 'multivitamin',
    name: 'Multivitamins',
    description: 'Essential vitamins and minerals',
    icon: '💊',
    color: 'bg-yellow-500',
    productCount: 891,
    href: '/products/multivitamin'
  },
  {
    id: 'omega_3',
    name: 'Omega-3',
    description: 'Fish oil and essential fatty acids',
    icon: '🐟',
    color: 'bg-cyan-500',
    productCount: 234,
    href: '/products?category=omega_3'
  },
  {
    id: 'creatine',
    name: 'Creatine',
    description: 'Strength and power enhancement',
    icon: '💥',
    color: 'bg-red-500',
    productCount: 156,
    href: '/products/creatine'
  },
  {
    id: 'bcaa',
    name: 'BCAA',
    description: 'Branched-chain amino acids',
    icon: '🧬',
    color: 'bg-indigo-500',
    productCount: 278,
    href: '/products?category=bcaa'
  }
];
