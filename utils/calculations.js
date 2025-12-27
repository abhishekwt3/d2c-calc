// utils/calculations.js

export const calculateMetrics = (inputs) => {
  const num = (v) => parseFloat(v) || 0;

  // --- INPUTS ---
  const grossSales = num(inputs.gross_sales_incl_gst);
  const gstRate = num(inputs.gst_rate_percent) || 18;
  const discounts = num(inputs.discounts_total);
  const returns = num(inputs.returns_value_ex_gst);
  const commissions = num(inputs.fees_commissions); // <--- NEW
  
  const totalOrders = num(inputs.total_orders) || 1;
  const newOrders = num(inputs.orders_new_customer) || 1;
  // ... (Other inputs load as normal)
  const unitsSold = num(inputs.units_sold);
  const mfgCost = num(inputs.cost_mfg_per_unit);
  const packaging = num(inputs.packaging_consumables_total);
  const inventoryBought = num(inputs.inventory_purchased_value);
  const shipping = num(inputs.shipping_expense_forward);
  const rto = num(inputs.rto_penalty_total);
  const pickPack = num(inputs.warehouse_pick_pack_total);
  const pgFees = num(inputs.payment_gateway_fees);
  const adSpendTotal = num(inputs.ad_spend_total);
  const adSpendProspecting = num(inputs.ad_spend_prospecting) || (adSpendTotal * 0.8);
  const opex = num(inputs.total_fixed_opex);
  const targetProfit = num(inputs.target_profit_per_order);

  // --- CALCULATIONS ---
  const gstMultiplier = 1 + (gstRate / 100);
  const netSalesExGst = grossSales / gstMultiplier;
  
  // NEW: Subtract Commissions from Revenue
  const netRevenue = netSalesExGst - discounts - returns - commissions;
  
  const cogsSold = unitsSold > 0 ? (unitsSold * mfgCost) + packaging : 0;
  const logistics = unitsSold > 0 ? (shipping + rto + pickPack + pgFees) : 0;
  const variableCosts = cogsSold + logistics;
  
  const cmDollars = netRevenue - variableCosts;
  const cmPercent = netRevenue > 0 ? (cmDollars / netRevenue) * 100 : 0;
  
  const ebitda = cmDollars - adSpendTotal - opex;
  const netBurn = (opex + adSpendTotal + inventoryBought) - cmDollars;

  // --- MARKETING METRICS ---
  const blendedCac = adSpendTotal / newOrders; // Strict Growth Cost
  const costPerOrder = adSpendTotal / totalOrders; // <--- NEW: Accounts for Old Customers
  
  const mer = adSpendTotal > 0 ? (netRevenue / adSpendTotal) : 0;
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;

  // --- SCALING ---
  const variableProfitPerOrder = (cmDollars / totalOrders);
  const opexPerOrder = opex / totalOrders;
  const safeMaxCpa = variableProfitPerOrder - opexPerOrder - targetProfit;

  return {
    netRevenue, cmDollars, cmPercent, ebitda, netBurn,
    blendedCac, costPerOrder, mer, adSpendTotal, safeMaxCpa,
    
    breakdowns: {
      netRevenue: [
        { label: "Gross Sales", val: grossSales, type: 'base' },
        { label: `Less GST (${gstRate}%)`, val: -(grossSales - netSalesExGst), type: 'sub' },
        { label: "Discounts", val: -discounts, type: 'sub' },
        { label: "Returns", val: -returns, type: 'sub' },
        { label: "Fees/Commissions", val: -commissions, type: 'sub' }, // <--- NEW LINE
      ],
      cm: [
        { label: "Net Revenue", val: netRevenue, type: 'base' },
        { label: "COGS", val: -cogsSold, type: 'sub' },
        { label: "Logistics & RTO", val: -logistics, type: 'sub' },
      ],
      ebitda: [
        { label: "Contribution Margin", val: cmDollars, type: 'base' },
        { label: "Ad Spend", val: -adSpendTotal, type: 'sub' },
        { label: "Fixed OpEx", val: -opex, type: 'sub' },
      ],
      safeCpa: [
        { label: "Contribution / Order", val: variableProfitPerOrder, type: 'base' },
        { label: "OpEx / Order", val: -opexPerOrder, type: 'sub' },
        { label: "Target Profit", val: -targetProfit, type: 'sub' },
      ],
      burn: [
        { label: "OpEx + Ads", val: opex + adSpendTotal, type: 'base' },
        { label: "Inventory Buy", val: inventoryBought, type: 'add' },
        { label: "Less: CM", val: -cmDollars, type: 'sub' },
      ]
    }
  };
};

export const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};