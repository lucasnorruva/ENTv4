// src/lib/supplier-data.ts

// A static list of suppliers with more details for richer graph visualization.
interface Supplier {
  id: string;
  name: string;
  location: string;
}

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup-de', name: 'German Components GmbH', location: 'Germany' },
  { id: 'sup-us', name: 'US Silicon & Wafers', location: 'USA' },
  {
    id: 'sup-cn',
    name: 'Shenzhen Precision Parts',
    location: 'China',
  },
  { id: 'sup-jp', name: 'Kyoto Advanced Materials', location: 'Japan' },
  { id: 'sup-kr', name: 'Seoul Semiconductors', location: 'South Korea' },
  { id: 'sup-in', name: 'Mumbai Fine Textiles', location: 'India' },
  { id: 'sup-vn', name: 'Vietnam Assembly Inc.', location: 'Vietnam' },
  { id: 'sup-br', name: 'Brazilian Leather Co.', location: 'Brazil' },
  { id: 'sup-pl', name: 'Polish Electronics', location: 'Poland' },
  { id: 'sup-it', name: 'Italian Fashion House', location: 'Italy' },
];
