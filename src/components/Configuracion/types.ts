export interface CompanySettings {
  id: string;
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanySettingsFormData {
  name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
}