// utils/storage.js

const STORAGE_KEY = 'd2c_dashboard_v1';

// Default data (The Indian D2C Scenario)
const DEFAULT_DATA = {
  gross_sales_incl_gst: 5000000,
  gst_rate_percent: 18,
  discounts_total: 200000,
  returns_value_ex_gst: 150000,
  
  total_orders: 2500,
  orders_new_customer: 1800,
  units_sold: 3000,
  
  cost_mfg_per_unit: 400,
  packaging_consumables_total: 50000,
  inventory_purchased_value: 1500000,
  
  shipping_expense_forward: 250000,
  rto_penalty_total: 120000,
  warehouse_pick_pack_total: 75000,
  payment_gateway_fees: 100000,
  
  ad_spend_total: 1200000,
  ad_spend_prospecting: 800000,
  
  total_fixed_opex: 800000,
  target_profit_per_order: 200,
  cash_on_hand: 2500000
};

export const loadData = () => {
  if (typeof window === 'undefined') return DEFAULT_DATA;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_DATA;
  
  try {
    return JSON.parse(saved);
  } catch (e) {
    return DEFAULT_DATA;
  }
};

export const saveData = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};