export interface User {
  id: string;
  email: string;
  role: 'vendedor' | 'admin' | 'contador';
  active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserFormData {
  email: string;
  password: string;
  role: 'vendedor' | 'admin' | 'contador';
}