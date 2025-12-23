// utils/calculations.js

export const calculateMetrics = (inputs) => {
  const num = (v) => parseFloat(v) || 0;

  // --- INPUTS ---
  const grossSales = num(inputs.gross_sales_incl_gst);
  const gstRate = num(inputs.gst_rate_percent) || 18;
  const discounts = num(inputs.discounts_total);
  const returns = num(inputs.returns_value_ex_gst);
  
  const unitsSold = num(inputs.units_sold);
  const totalOrders = num(inputs.total_orders) || 1;
  const newOrders = num(inputs.orders_new_customer) || 1;
  
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
  const netRevenue = netSalesExGst - discounts - returns;
  
  const cogsSold = (unitsSold * mfgCost) + packaging;
  const logistics = shipping + rto + pickPack + pgFees;
  const variableCosts = cogsSold + logistics;
  
  const cmDollars = netRevenue - variableCosts;
  const cmPercent = netRevenue > 0 ? (cmDollars / netRevenue) * 100 : 0;
  
  const ebitda = cmDollars - adSpendTotal - opex;
  const netMarginPercent = netRevenue > 0 ? (ebitda / netRevenue) * 100 : 0;

  const cashOutflow = opex + adSpendTotal + inventoryBought;
  const netBurn = (opex + adSpendTotal + inventoryBought) - cmDollars;

  // Unit Economics
  const aov = totalOrders > 0 ? netRevenue / totalOrders : 0;
  const variableProfitPerOrder = (cmDollars / totalOrders);
  const opexPerOrder = opex / totalOrders;
  const safeMaxCpa = variableProfitPerOrder - opexPerOrder - targetProfit;

  // Efficiency
  const mer = adSpendTotal > 0 ? (netRevenue / adSpendTotal) : 0;
  const newCustRevenue = newOrders * aov; 
  const ncRoas = adSpendProspecting > 0 ? (newCustRevenue / adSpendProspecting) : 0;
  const blendedCac = adSpendTotal / newOrders;
  const mpas = safeMaxCpa * newOrders;

  return {
    // Values
    netRevenue, cmDollars, cmPercent, ebitda, netMarginPercent, netBurn,
    blendedCac, mer, ncRoas, adSpendTotal, safeMaxCpa, mpas,
    
    // BREAKDOWNS (The "Receipt" Logic)
    breakdowns: {
      netRevenue: [
        { label: "Gross Sales (Inc GST)", val: grossSales, type: 'base' },
        { label: `Less GST (${gstRate}%)`, val: -(grossSales - netSalesExGst), type: 'sub' },
        { label: "Less Discounts", val: -discounts, type: 'sub' },
        { label: "Less Returns", val: -returns, type: 'sub' },
      ],
      cm: [
        { label: "Net Revenue", val: netRevenue, type: 'base' },
        { label: "COGS & Packaging", val: -cogsSold, type: 'sub' },
        { label: "Logistics, RTO & Fees", val: -logistics, type: 'sub' },
      ],
      ebitda: [
        { label: "Contribution Margin", val: cmDollars, type: 'base' },
        { label: "Marketing Spend", val: -adSpendTotal, type: 'sub' },
        { label: "Fixed OpEx", val: -opex, type: 'sub' },
      ],
      safeCpa: [
        { label: "Contribution / Order", val: variableProfitPerOrder, type: 'base' },
        { label: "Fixed OpEx / Order", val: -opexPerOrder, type: 'sub' },
        { label: "Target Profit / Order", val: -targetProfit, type: 'sub' },
      ],
      burn: [
        { label: "Fixed OpEx", val: opex, type: 'base' },
        { label: "Ad Spend", val: adSpendTotal, type: 'add' },
        { label: "Inventory Purchase", val: inventoryBought, type: 'add' },
        { label: "Less: Contrib. Margin", val: -cmDollars, type: 'sub' }, // CM offsets the burn
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