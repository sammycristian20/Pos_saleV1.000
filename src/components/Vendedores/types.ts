export interface Seller {
  id: string;
  name: string;
  phone: string;
  address: string;
  photo_url?: string;
  hire_date: string;
  salary: number;
  contract_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
  birth_date: string;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface SellerFormData {
  name: string;
  phone: string;
  address: string;
  hire_date: string;
  salary: number;
  contract_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
  birth_date: string;
  email?: string;
  photo_url?: string;
}