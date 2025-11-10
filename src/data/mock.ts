// Centralized mock data used by PublicService and DB seeding

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  city: string;
  logo?: string;
  info?: string;
};

export type Allergen = {
  id: string;
  code: string;
  name: string;
  icon?: string;
};

export const restaurantsData: Restaurant[] = [
  {
    id: '8e3b5c2e-5e2a-4c2a-9b4f-6d9c2c1f2a11',
    name: 'La Buena Mesa',
    slug: 'la-buena-mesa',
    city: 'Madrid',
    logo: '/assets/logos/la-buena-mesa.png',
    info: 'Restaurante de cocina mediterránea',
  },
  {
    id: 'f0d1a6c4-1b32-4c8f-9e21-2d7b5a9c3e44',
    name: 'Green Bites',
    slug: 'green-bites',
    city: 'Barcelona',
    logo: '/assets/logos/green-bites.png',
    info: 'Opciones veganas y vegetarianas',
  },
];

export const allergensData: Allergen[] = [
  { id: '0c6f9d86-7e1a-4f5d-9d12-6c1a8b7e5f01', code: 'GLUTEN', name: 'Gluten', icon: '🌾' },
  { id: '3b4d2e5f-8a9c-4d1e-b2f3-7c8d9e0a1b23', code: 'DAIRY', name: 'Lácteos', icon: '🥛' },
  { id: '5e6f7a8b-9c0d-4e1f-a2b3-c4d5e6f7a890', code: 'NUTS', name: 'Frutos secos', icon: '🥜' },
];

export const tagsByRestaurantData: Record<string, string[]> = {
  'la-buena-mesa': ['especial', 'fuerte', 'sin-gluten'],
  'green-bites': ['vegano', 'sin-gluten', 'saludable'],
};

export const menusData: Record<string, any> = {
  'la-buena-mesa': {
    id: 'a1b2c3d4-5678-4e9f-8012-abcdef123456',
    published_at: new Date().toISOString(),
    sections: [
      {
        id: 'c3d4e5f6-7890-41a2-b3c4-def123456789',
        name: 'Entrantes',
        items: [
          {
            id: 'e5f67890-9012-43c4-d5e6-f12345678901',
            name: 'Ensalada de temporada',
            description: 'Lechuga, tomate, vinagreta',
            price: 6.5,
            tags: ['saludable'],
            allergens: ['DAIRY'],
            variants: [],
          },
        ],
      },
    ],
  },
  'green-bites': {
    id: 'b2c3d4e5-6789-4f01-9123-bcdef1234567',
    published_at: new Date().toISOString(),
    sections: [
      {
        id: 'd4e5f678-8901-42b3-c4d5-ef1234567890',
        name: 'Bocadillos',
        items: [
          {
            id: 'f6789012-0123-44d5-e6f7-123456789012',
            name: 'Wrap vegano',
            description: 'Relleno con hummus y verduras',
            price: 7.0,
            tags: ['vegano'],
            allergens: [],
            variants: [],
          },
        ],
      },
    ],
  },
};
