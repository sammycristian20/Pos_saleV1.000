import express from 'express';
import { createClient } from '@supabase/supabase-js';
import type { Sale } from '../../components/POS/types';

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a new sale
router.post('/', async (req, res) => {
  try {
    const saleData: Sale = req.body;

    // Validate required fields
    if (!saleData.items || saleData.items.length === 0) {
      return res.status(400).json({ error: 'No items in sale' });
    }

    // Start database transaction
    const { data: saleResult, error: saleError } = await supabase.rpc('create_sale', {
      sale_data: {
        total: saleData.total,
        payment_method: saleData.payment_method,
        amount_paid: saleData.amount_paid,
        change: saleData.change,
        client_id: saleData.client_id,
        status: saleData.status,
        items: saleData.items
      }
    });

    if (saleError) {
      throw saleError;
    }

    res.status(201).json(saleResult);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ 
      error: 'Error creating sale',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all sales
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items (
          *,
          product:products (
            name,
            barcode
          )
        ),
        client:customers (
          name,
          document,
          document_type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ 
      error: 'Error fetching sales',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get a specific sale
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items (
          *,
          product:products (
            name,
            barcode
          )
        ),
        client:customers (
          name,
          document,
          document_type
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ 
      error: 'Error fetching sale',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cancel a sale
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get sale items to restore stock
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select(`
        *,
        items:sale_items (
          product_id,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (sale.status === 'cancelled') {
      return res.status(400).json({ error: 'Sale is already cancelled' });
    }

    // Update sale status
    const { error: updateError } = await supabase
      .from('sales')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Restore stock for each item
    for (const item of sale.items) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ 
          stock: supabase.raw(`stock + ${item.quantity}`)
        })
        .eq('id', item.product_id);

      if (stockError) throw stockError;
    }

    res.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    res.status(500).json({ 
      error: 'Error cancelling sale',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;