'use client';
import { useState, useMemo } from 'react';
import { calculateMetrics, formatCurrency } from '../utils/calculations';
import { loadData, saveData } from '../utils/storage';

export default function Dashboard() {
  const [inputs, setInputs] = useState(() => loadData());
  const [isEditing, setIsEditing] = useState(false);

// 1. Load Data on Mount (initialized from storage)

  // 2. Calculate Real-time (derived, memoized)
  const metrics = useMemo(() => {
    return inputs ? calculateMetrics(inputs) : null;
  }, [inputs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

// 3. Save to Local Storage (No more API call!)
  const handleSave = () => {
    saveData(inputs);
    setIsEditing(false);
    alert("Saved to Browser Storage!");
  };

  if (!inputs || !metrics) return <div className="p-10">Loading Engine...</div>;

  return (
<div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div><h1 className="text-2xl font-bold">CEO Command Center</h1><p className="text-xs text-gray-500">Local Browser Version</p></div>
          <button onClick={() => setIsEditing(!isEditing)} className="bg-black text-white px-5 py-2 rounded-lg text-sm font-bold">{isEditing ? 'Close' : 'Edit'}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === SECTION 1: PROFITABILITY === */}
        <section className="space-y-6">
          <SectionHeader title="1. Are we Profitable?" sub="Financial Health" />
          <BreakdownCard label="Net Revenue" value={metrics.netRevenue} breakdown={metrics.breakdowns.netRevenue} />
          <BreakdownCard label="Contribution Margin" value={metrics.cmDollars} color="text-blue-600" breakdown={metrics.breakdowns.cm} sub={`${metrics.cmPercent.toFixed(1)}% Margin`} />
          <BreakdownCard label="EBITDA (Net Profit)" value={metrics.ebitda} color={metrics.ebitda > 0 ? "text-green-600" : "text-red-600"} breakdown={metrics.breakdowns.ebitda} />
        </section>

        {/* === SECTION 2: MARKETING === */}
        <section className="space-y-6">
          <SectionHeader title="2. Efficiency" sub="Team Performance" />
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase">MER (ROAS)</div>
            <div className="text-3xl font-bold mt-1 text-gray-900">{metrics.mer.toFixed(2)}x</div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 uppercase">Blended CAC</div>
            <div className="text-3xl font-bold mt-1 text-gray-900">{formatCurrency(metrics.blendedCac)}</div>
          </div>
        </section>

        {/* === SECTION 3: SCALING === */}
        <section className="space-y-6">
          <SectionHeader title="3. Scaling Logic" sub="Budget Limits" />
          <BreakdownCard label="Safe Max CPA" value={metrics.safeMaxCpa} breakdown={metrics.breakdowns.safeCpa} color="text-purple-600" />
          <BreakdownCard label="True Cash Burn" value={metrics.netBurn} breakdown={metrics.breakdowns.burn} color="text-orange-600" sub="Includes Inventory" />
        </section>

        {/* EDIT DRAWER */}
        {isEditing && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l p-6 overflow-y-auto z-50">
             <h2 className="font-bold text-lg mb-4">Edit Inputs</h2>
             
             {/* Reuse the InputGroups from the previous code... */}
             <InputGroup title="Revenue"><Input name="gross_sales_incl_gst" val={inputs.gross_sales_incl_gst} onChange={handleInputChange} label="Gross Sales" /><Input name="gst_rate_percent" val={inputs.gst_rate_percent} onChange={handleInputChange} label="GST %" /><Input name="discounts_total" val={inputs.discounts_total} onChange={handleInputChange} label="Discounts" /><Input name="returns_value_ex_gst" val={inputs.returns_value_ex_gst} onChange={handleInputChange} label="Returns (Ex GST)" /></InputGroup>
             <InputGroup title="COGS"><Input name="cost_mfg_per_unit" val={inputs.cost_mfg_per_unit} onChange={handleInputChange} label="Mfg Cost" /><Input name="units_sold" val={inputs.units_sold} onChange={handleInputChange} label="Units Sold" /><Input name="inventory_purchased_value" val={inputs.inventory_purchased_value} onChange={handleInputChange} label="Inv. Purchased" /></InputGroup>
             <InputGroup title="Logistics"><Input name="shipping_expense_forward" val={inputs.shipping_expense_forward} onChange={handleInputChange} label="Shipping" /><Input name="rto_penalty_total" val={inputs.rto_penalty_total} onChange={handleInputChange} label="RTO Penalty" /><Input name="warehouse_pick_pack_total" val={inputs.warehouse_pick_pack_total} onChange={handleInputChange} label="Pick & Pack" /></InputGroup>
             <InputGroup title="Marketing"><Input name="ad_spend_total" val={inputs.ad_spend_total} onChange={handleInputChange} label="Total Ads" /><Input name="total_fixed_opex" val={inputs.total_fixed_opex} onChange={handleInputChange} label="Fixed OpEx" /><Input name="target_profit_per_order" val={inputs.target_profit_per_order} onChange={handleInputChange} label="Target Profit" /><Input name="orders_new_customer" val={inputs.orders_new_customer} onChange={handleInputChange} label="New Cust Orders" /><Input name="total_orders" val={inputs.total_orders} onChange={handleInputChange} label="Total Orders" /></InputGroup>

             <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded font-bold mt-4">Save to Browser</button>
          </div>
        )}
      </main>
    </div>
  );
}

// === NEW COMPONENT: BREAKDOWN CARD ===
// This renders the "Receipt" style breakdown
function BreakdownCard({ label, value, breakdown, color = "text-gray-900", sub }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</div>
            {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
          </div>
          <button className="text-gray-400 hover:text-blue-600 text-xs font-bold">
            {isOpen ? 'Hide Calc' : 'Show Calc'}
          </button>
        </div>
      </div>
      
      {/* The Breakdown Section */}
      {isOpen && breakdown && (
        <div className="bg-gray-50 border-t border-gray-100 p-4 text-xs">
          <div className="space-y-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className={item.type === 'base' ? 'font-bold text-gray-700' : 'text-gray-500 pl-2'}>
                  {item.label}
                </span>
                <span className={`font-mono ${item.val < 0 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatCurrency(item.val)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between items-center font-bold text-gray-900">
              <span>= {label}</span>
              <span>{formatCurrency(value)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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