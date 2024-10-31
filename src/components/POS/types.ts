import { Product } from './types';

export type FiscalDocumentType = 
  | 'CREDITO_FISCAL'
  | 'CONSUMO'
  | 'NOTA_DEBITO'
  | 'NOTA_CREDITO'
  | 'COMPRAS'
  | 'GASTOS_MENORES'
  | 'REGIMENES_ESPECIALES'
  | 'GUBERNAMENTAL';

export interface Discount {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  active: boolean;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  start_date?: string;
  end_date?: string;
}

export interface CartItem extends Product {
  quantity: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  discount_amount?: number;
}

export interface PaymentDetails {
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
  amount_tendered: number;
  change_amount: number;
  reference_number?: string;
  authorization_code?: string;
  fiscal_document_type: FiscalDocumentType;
  fiscal_number: string;
}

export interface Sale {
  customer_id?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  discount_amount: number;
  discount_id?: string;
  payment_method: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
  amount_paid: number;
  change_amount: number;
  fiscal_document_type: FiscalDocumentType;
  fiscal_number: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
    total: number;
    discount_amount?: number;
  }[];
}