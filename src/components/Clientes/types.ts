export interface Cliente {
  id: string;
  name: string;
  document: string;
  document_type: 'CEDULA' | 'RNC' | 'PASSPORT';
  phone: string;
  email: string;
  address: string;
}

export type ClienteFormData = Omit<Cliente, 'id'>;

export interface ClienteFormProps {
  formData: ClienteFormData;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isEditing: boolean;
}

export interface ClienteTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (id: string) => Promise<void>;
}