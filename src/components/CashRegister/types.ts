export interface CashRegister {
  id: string;
  user_id: string;
  opening_date: string;
  closing_date?: string;
  initial_cash: number;
  final_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CashRegisterTransaction {
  id: string;
  cash_register_id: string;
  transaction_type: 'SALE' | 'EXPENSE' | 'WITHDRAWAL' | 'DEPOSIT';
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface CashRegisterSummary {
  id: string;
  opening_date: string;
  initial_cash: number;
  status: 'OPEN' | 'CLOSED';
  total_sales: number;
  total_expenses: number;
  total_withdrawals: number;
  total_deposits: number;
  expected_cash: number;
}