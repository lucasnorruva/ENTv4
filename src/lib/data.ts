import type { Product } from './types';

export let products: Product[] = [
  {
    id: 'pp-001',
    productName: 'Eco-Friendly Smart Watch Series 5',
    productDescription: 'A stylish and sustainable smart watch with advanced health tracking features, made from recycled materials.',
    productImage: 'https://placehold.co/100x100.png',
    currentInformation: JSON.stringify({
      "materials": ["Recycled Aluminum", "Organic Cotton Strap"],
      "certifications": ["EcoCert", "Fair Trade"],
      "battery_life_hours": 72,
      "water_resistance_atm": 5,
    }, null, 2),
    status: 'Published',
    lastUpdated: '2024-07-20',
  },
  {
    id: 'pp-002',
    productName: 'Pro-Grade 4K Drone',
    productDescription: 'Capture stunning aerial footage with our professional-grade drone, featuring a 4K camera and 3-axis gimbal.',
    productImage: 'https://placehold.co/100x100.png',
    currentInformation: JSON.stringify({
      "camera_resolution": "4K",
      "flight_time_minutes": 30,
      "range_km": 5,
      "weight_grams": 795,
    }, null, 2),
    status: 'Published',
    lastUpdated: '2024-07-18',
  },
  {
    id: 'pp-003',
    productName: 'Organic Cotton T-Shirt',
    productDescription: 'A soft, comfortable, and sustainable t-shirt made from 100% organic cotton.',
    productImage: 'https://placehold.co/100x100.png',
    currentInformation: JSON.stringify({
      "material": "100% Organic Cotton",
      "origin": "India",
      "color": "White",
    }, null, 2),
    status: 'Draft',
    lastUpdated: '2024-07-21',
  },
  {
    id: 'pp-004',
    productName: 'Recycled Plastic Backpack',
    productDescription: 'Durable and spacious backpack made entirely from recycled plastic bottles. Perfect for daily commute or travel.',
    productImage: 'https://placehold.co/100x100.png',
    currentInformation: JSON.stringify({
      "capacity_liters": 25,
      "materials": ["Recycled PET"],
      "features": ["Laptop Compartment", "Water Resistant"],
    }, null, 2),
    status: 'Archived',
    lastUpdated: '2023-11-05',
  },
    {
    id: 'pp-005',
    productName: 'Modular Shelving Unit',
    productDescription: 'A versatile and customizable shelving unit designed to adapt to your space and needs. Made from sustainable bamboo.',
    productImage: 'https://placehold.co/100x100.png',
    currentInformation: JSON.stringify({
      "material": "Bamboo",
      "dimensions_cm": { "width": 80, "height": 180, "depth": 30 },
      "assembly_required": true
    }, null, 2),
    status: 'Published',
    lastUpdated: '2024-06-15',
  },
];
