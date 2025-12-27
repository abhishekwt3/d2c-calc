'use client';
import { useState, useEffect } from 'react';
import { calculateMetrics, formatCurrency } from '../utils/calculations';
import { loadData, saveData } from '../utils/storage';
// Import the text definitions
import { METRIC_DEFINITIONS } from '../utils/definitions'; 

export default function Dashboard() {
  const [inputs, setInputs] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const data = loadData();
    setInputs(data);
  }, []);

  useEffect(() => {
    if (inputs) setMetrics(calculateMetrics(inputs));
  }, [inputs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    saveData(inputs);
    setIsEditing(false);
  };

  if (!inputs || !metrics) return <div className="p-10 text-center mt-10 text-gray-500">Loading Strategy Engine...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">      
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CEO&apos;s Snapshot</h1>
            <p className="text-xs text-gray-500 font-medium">For decison makers in e-ecommerce</p>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition">
            {isEditing ? 'Close Editor' : 'Edit Numbers'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === SECTION 1: PROFITABILITY === */}
        <section className="space-y-6">
          <SectionHeader title="1. Are we Profitable?" sub="Financial Health & Margins" />
          
          <BreakdownCard 
            defKey="netRevenue"
            value={metrics.netRevenue} 
            breakdown={metrics.breakdowns.netRevenue}
          />

          <BreakdownCard 
            defKey="cmDollars"
            value={metrics.cmDollars} 
            color="text-blue-600"
            breakdown={metrics.breakdowns.cm}
            sub={`${metrics.cmPercent.toFixed(1)}% Margin`}
          />

          <BreakdownCard 
            defKey="ebitda"
            value={metrics.ebitda} 
            color={metrics.ebitda > 0 ? "text-green-600" : "text-red-600"}
            breakdown={metrics.breakdowns.ebitda}
            sub={metrics.ebitda > 0 ? "Profitable" : "Loss Making"}
          />
        </section>

        {/* === SECTION 2: MARKETING === */}
        <section className="space-y-6">
          <SectionHeader title="2. Efficiency" sub="Team Performance & Ad Spend" />
          
          {/* Converted to BreakdownCard for consistency */}
          <BreakdownCard 
            defKey="mer"
            value={metrics.mer.toFixed(2) + "x"}
            // Manual tiny breakdown for MER
            breakdown={[
                { label: "Net Revenue", val: metrics.netRevenue, type: "base" },
                { label: "÷ Total Ad Spend", val: metrics.adSpendTotal, type: "sub_text" } // Custom type to show text
            ]}
          />

          <BreakdownCard 
            defKey="blendedCac"
            value={metrics.blendedCac}
            breakdown={[
                { label: "Total Ad Spend", val: metrics.adSpendTotal, type: "base" },
                { label: "÷ New Orders", val: inputs.orders_new_customer, type: "sub_text" }
            ]}
          />
          <BreakdownCard 
        defKey="costPerOrder"
        value={metrics.costPerOrder}
        sub="All Orders (Blended)"
        color="text-indigo-600"
        breakdown={[
            { label: "Total Ad Spend", val: metrics.adSpendTotal, type: "base" },
            { label: "÷ Total Orders", val: inputs.total_orders, type: "sub_text" }
        ]}
      />
        </section>

        {/* === SECTION 3: SCALING === */}
        <section className="space-y-6">
          <SectionHeader title="3. Scaling Logic" sub="Budget Limits & Cash Traps" />
          
          <BreakdownCard 
            defKey="safeMaxCpa"
            value={metrics.safeMaxCpa} 
            breakdown={metrics.breakdowns.safeCpa}
            color="text-purple-600"
            sub="Max Bid Limit"
          />

          <BreakdownCard 
            defKey="netBurn"
            value={metrics.netBurn} 
            breakdown={metrics.breakdowns.burn}
            color="text-orange-600"
            sub="Includes Inventory Buys"
          />
        </section>

        {/* EDIT DRAWER */}
        {isEditing && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l p-6 overflow-y-auto z-50 animate-in slide-in-from-right">
             <div className="flex justify-between items-center mb-6">
               <h2 className="font-bold text-lg">Edit Inputs</h2>
               <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">✕</button>
             </div>
             
             {/* Same Inputs as before */}
             <InputGroup title="Revenue"><Input name="gross_sales_incl_gst" val={inputs.gross_sales_incl_gst} onChange={handleInputChange} label="Gross Sales" /><Input name="gst_rate_percent" val={inputs.gst_rate_percent} onChange={handleInputChange} label="GST %" /><Input name="discounts_total" val={inputs.discounts_total} onChange={handleInputChange} label="Discounts" /> <Input name="fees_commissions" val={inputs.fees_commissions} onChange={handleInputChange} label="Fees / Commissions" /> <Input name="returns_value_ex_gst" val={inputs.returns_value_ex_gst} onChange={handleInputChange} label="Returns (Ex GST)" /></InputGroup>
             <InputGroup title="COGS"><Input name="cost_mfg_per_unit" val={inputs.cost_mfg_per_unit} onChange={handleInputChange} label="Mfg Cost / Unit" /><Input name="units_sold" val={inputs.units_sold} onChange={handleInputChange} label="Units Sold" /><Input name="inventory_purchased_value" val={inputs.inventory_purchased_value} onChange={handleInputChange} label="Inv. Purchased" /></InputGroup>
             <InputGroup title="Logistics"><Input name="shipping_expense_forward" val={inputs.shipping_expense_forward} onChange={handleInputChange} label="Shipping" /><Input name="rto_penalty_total" val={inputs.rto_penalty_total} onChange={handleInputChange} label="RTO Penalty" /><Input name="warehouse_pick_pack_total" val={inputs.warehouse_pick_pack_total} onChange={handleInputChange} label="Packaging / Handling" /></InputGroup>
             <InputGroup title="Marketing"><Input name="ad_spend_total" val={inputs.ad_spend_total} onChange={handleInputChange} label="Total Ads" /><Input name="total_fixed_opex" val={inputs.total_fixed_opex} onChange={handleInputChange} label="Fixed OpEx" /><Input name="target_profit_per_order" val={inputs.target_profit_per_order} onChange={handleInputChange} label="Target Profit" /><Input name="orders_new_customer" val={inputs.orders_new_customer} onChange={handleInputChange} label="New Cust Orders" /><Input name="total_orders" val={inputs.total_orders} onChange={handleInputChange} label="Total Orders" /></InputGroup>

             <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold mt-4 transition">
               Save Updates
             </button>
          </div>
        )}
      </main>
    </div>
  );
}

// === UPDATED COMPONENT: BREAKDOWN CARD WITH DEFINITIONS ===
function BreakdownCard({ defKey, value, breakdown, color = "text-gray-900", sub }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get definition from our new dictionary
  const def = METRIC_DEFINITIONS[defKey] || { title: defKey, insight: "No definition found." };
  
  // Handle formatting based on if value is string (like "3.5x") or number
  const displayValue = typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Clickable Header */}
      <div className="p-5 cursor-pointer flex justify-between items-start" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{def.title}</div>
          <div className={`text-2xl font-bold mt-1 ${color}`}>{displayValue}</div>
          {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
        <button className={`text-xs font-bold px-2 py-1 rounded ${isOpen ? 'bg-gray-100 text-gray-600' : 'text-blue-600 bg-blue-50'}`}>
          {isOpen ? 'Hide Info' : 'Details'}
        </button>
      </div>
      
      {/* Expanded Section: Math + English Definition */}
      {isOpen && (
        <div className="bg-slate-50 border-t border-gray-200">
            
            {/* 1. The Math Breakdown */}
            {breakdown && (
                <div className="p-4 border-b border-gray-200 text-xs">
                    <div className="space-y-2">
                        {breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span className={item.type === 'base' ? 'font-bold text-gray-700' : 'text-gray-500 pl-2'}>
                            {item.label}
                            </span>
                            <span className={`font-mono ${item.val < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                            {/* Handle special custom types for dividers or text */}
                            {item.type === 'sub_text' ? typeof item.val === 'number' ? item.val : item.val : formatCurrency(item.val)}
                            </span>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. The CEO Insight (Definition) */}
            <div className="p-4 bg-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-1">What this tells you:</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{def.insight}</p>
                {def.goodIf && (
                    <div className="mt-2 text-xs font-medium text-blue-700 flex items-center">
                        <span className="mr-1">🎯</span> Target: {def.goodIf}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

// Helpers (Same as before)
function SectionHeader({ title, sub }) {
  return <div className="border-b border-gray-200 pb-2 mb-2"><h2 className="font-bold text-lg text-gray-900">{title}</h2><p className="text-xs text-gray-500">{sub}</p></div>;
}

function InputGroup({ title, children }) {
  return <div className="mb-4"><h4 className="text-xs font-bold text-blue-600 uppercase mb-2">{title}</h4><div className="space-y-2">{children}</div></div>;
}

function Input({ label, name, val, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
      <input type="number" name={name} value={val} onChange={onChange} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white font-medium focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" />
    </div>
  );
}