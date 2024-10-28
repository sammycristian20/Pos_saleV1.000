export interface Tax {
  id: number;
  name: string;
  rate: number;
  description: string;
  applies_to: string;
  created_at?: string;
  updated_at?: string;
}

export type TaxFormData = Omit<Tax, 'id' | 'created_at' | 'updated_at'>;

export interface TaxFormProps {
  formData: TaxFormData;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isEditing: boolean;
  onCancel: () => void;
}

export interface TaxTableProps {
  taxes: Tax[];
  onEdit: (tax: Tax) => void;
  onDelete: (id: number) => Promise<void>;
}