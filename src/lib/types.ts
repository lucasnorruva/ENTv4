export interface Product {
  id: string;
  productName: string;
  productDescription: string;
  productImage: string;
  currentInformation: string; // This will be a stringified JSON
  status: 'Published' | 'Draft' | 'Archived';
  lastUpdated: string;
}
