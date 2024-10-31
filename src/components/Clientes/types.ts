export type DocumentType = 'CEDULA' | 'RNC' | 'PASSPORT';
export type ClientType = 'PERSONAL' | 'BUSINESS';

export interface Cliente {
  id: string;
  name: string;
  client_type: ClientType;
  document: string;
  document_type: DocumentType;
  phone: string;
  email: string;
  address: string;
  created_at?: string;
  updated_at?: string;
}

export type ClienteFormData = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

export interface ClienteFormProps {
  formData: ClienteFormData;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
  isLoading?: boolean;
}

export interface ClienteTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}