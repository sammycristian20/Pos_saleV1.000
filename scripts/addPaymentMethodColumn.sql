-- Add payment_method column to invoices table
ALTER TABLE invoices 
ADD COLUMN payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'CREDIT'));

-- Add comment for documentation
COMMENT ON COLUMN invoices.payment_method IS 'Payment method used for the invoice (CASH, CARD, TRANSFER, CREDIT)';