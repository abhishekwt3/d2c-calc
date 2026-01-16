'use client';
import { useState, useEffect } from 'react';
import { calculateMetrics, formatCurrency } from '../utils/calculations';
import { loadData, saveData } from '../utils/storage';
import { METRIC_DEFINITIONS } from '../utils/definitions';
import AIChat from '../components/AIChat';

export default function Dashboard() {
  const [inputs, setInputs] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState('light');
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const data = loadData();
    setInputs(data);
  }, []);

  useEffect(() => {
    if (inputs) setMetrics(calculateMetrics(inputs));
  }, [inputs]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    saveData(inputs);
    setIsEditing(false);
  };

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setWaitlistStatus('error');
      setTimeout(() => setWaitlistStatus(''), 3000);
      return;
    }
    
    setWaitlistStatus('loading');
    
    try {
      const response = await fetch('/api/mailchimp/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          listType: 'beta'
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setWaitlistStatus('success');
        setEmail('');
        setTimeout(() => setWaitlistStatus(''), 5000);
      } else {
        setWaitlistStatus('error');
        console.error('Mailchimp error:', data.error);
        setTimeout(() => setWaitlistStatus(''), 3000);
      }
    } catch (error) {
      setWaitlistStatus('error');
      console.error('Submission error:', error);
      setTimeout(() => setWaitlistStatus(''), 3000);
    }
  };

  const handleFeedback = () => {
    window.open('mailto:feedback@signalroi.com?subject=SignalROI Feedback', '_blank');
  };

  if (!inputs || !metrics) return <div className="p-10 text-center mt-10" style={{ color: 'var(--muted)' }}>Loading Strategy Engine...</div>;

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg)', color: 'var(--text)' }}>      
      {/* HEADER */}
      <header className="sticky top-0 z-10 shadow-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
  {/* Logo */}
  <img
    src="/android-chrome-192x192.png"   // replace with your logo path
    alt="SignalROI logo"
    width={42}
    height={42}
    className="w-11 h-11 object-contain"
  />

  {/* Text */}
  <div>
    <h1
      className="text-2xl font-bold tracking-tight"
      style={{ color: 'var(--text)' }}
    >
      SignalROI
    </h1>
    <p
      className="text-xs font-medium"
      style={{ color: 'var(--muted)' }}
    >
      For decision makers in e-commerce
    </p>
  </div>
</div>


          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg transition hover:opacity-70"
              style={{ 
                background: 'var(--border)',
                color: 'var(--text)'
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Edit Button */}
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="px-5 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
              style={{ 
                background: 'var(--text)', 
                color: 'var(--bg)' 
              }}
            >
              {isEditing ? 'Close Editor' : 'Edit Numbers'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 pb-32 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
            color="#2563eb"
            breakdown={metrics.breakdowns.cm}
            sub={`${metrics.cmPercent.toFixed(1)}% Margin`}
          />

          <BreakdownCard 
            defKey="ebitda"
            value={metrics.ebitda} 
            color={metrics.ebitda > 0 ? "#10b981" : "#ef4444"}
            breakdown={metrics.breakdowns.ebitda}
            sub={metrics.ebitda > 0 ? "Profitable" : "Loss Making"}
          />
        </section>

        {/* === SECTION 2: MARKETING === */}
        <section className="space-y-6">
          <SectionHeader title="2. Efficiency" sub="Team Performance & Ad Spend" />
          
          <BreakdownCard 
            defKey="mer"
            value={metrics.mer.toFixed(2) + "x"}
            breakdown={[
                { label: "Net Revenue", val: metrics.netRevenue, type: "base" },
                { label: "÷ Total Ad Spend", val: metrics.adSpendTotal, type: "sub_text" }
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
            color="#6366f1"
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
            color="#a855f7"
            sub="Max Bid Limit"
          />

          <BreakdownCard 
            defKey="netBurn"
            value={metrics.netBurn} 
            breakdown={metrics.breakdowns.burn}
            color="#f97316"
            sub="Includes Inventory Buys"
          />
        </section>

        {/* EDIT DRAWER */}
        {isEditing && (
          <div 
            className="fixed inset-y-0 right-0 w-96 shadow-2xl p-6 overflow-y-auto z-50 animate-in slide-in-from-right"
            style={{ 
              background: 'var(--surface)', 
              borderLeft: '1px solid var(--border)' 
            }}
          >
             <div className="flex justify-between items-center mb-6">
               <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Edit Inputs</h2>
               <button 
                 onClick={() => setIsEditing(false)} 
                 className="hover:opacity-70"
                 style={{ color: 'var(--muted)' }}
               >
                 ✕
               </button>
             </div>
             
             <InputGroup title="Revenue">
               <Input name="gross_sales_incl_gst" val={inputs.gross_sales_incl_gst} onChange={handleInputChange} label="Gross Sales" />
               <Input name="gst_rate_percent" val={inputs.gst_rate_percent} onChange={handleInputChange} label="GST %" />
               <Input name="discounts_total" val={inputs.discounts_total} onChange={handleInputChange} label="Discounts" /> 
               <Input name="fees_commissions" val={inputs.fees_commissions} onChange={handleInputChange} label="Fees / Commissions" /> 
               <Input name="returns_value_ex_gst" val={inputs.returns_value_ex_gst} onChange={handleInputChange} label="Returns (Ex GST)" />
             </InputGroup>
             <InputGroup title="COGS">
               <Input name="cost_mfg_per_unit" val={inputs.cost_mfg_per_unit} onChange={handleInputChange} label="Mfg Cost / Unit" />
               <Input name="units_sold" val={inputs.units_sold} onChange={handleInputChange} label="Units Sold" />
               <Input name="inventory_purchased_value" val={inputs.inventory_purchased_value} onChange={handleInputChange} label="Inv. Purchased" />
             </InputGroup>
             <InputGroup title="Logistics (Total / Month)">
               <Input name="shipping_expense_forward" val={inputs.shipping_expense_forward} onChange={handleInputChange} label="Shipping" />
               <Input name="rto_penalty_total" val={inputs.rto_penalty_total} onChange={handleInputChange} label="RTO Penalty" />
               <Input name="warehouse_pick_pack_total" val={inputs.warehouse_pick_pack_total} onChange={handleInputChange} label="Packaging / Handling" />
             </InputGroup>
             <InputGroup title="Marketing">
               <Input name="ad_spend_total" val={inputs.ad_spend_total} onChange={handleInputChange} label="Total Ads" />
               <Input name="total_fixed_opex" val={inputs.total_fixed_opex} onChange={handleInputChange} label="Fixed OpEx" />
               <Input name="target_profit_per_order" val={inputs.target_profit_per_order} onChange={handleInputChange} label="Target Profit" />
               <Input name="orders_new_customer" val={inputs.orders_new_customer} onChange={handleInputChange} label="New Cust Orders" />
               <Input name="total_orders" val={inputs.total_orders} onChange={handleInputChange} label="Total Orders" />
             </InputGroup>

             <button 
               onClick={handleSave} 
               className="w-full py-3 rounded-lg font-bold mt-4 transition hover:opacity-90"
               style={{ 
                 background: 'var(--accent)', 
                 color: 'var(--bg)' 
               }}
             >
               Save Updates
             </button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer 
        email={email}
        setEmail={setEmail}
        waitlistStatus={waitlistStatus}
        handleWaitlistSubmit={handleWaitlistSubmit}
        handleFeedback={handleFeedback}
      />

      {/* AI CHAT - Fixed at bottom */}
      {metrics && !isEditing && <AIChat metrics={metrics} />}
    </div>
  );
}

// === BREAKDOWN CARD COMPONENT ===
function BreakdownCard({ defKey, value, breakdown, color, sub }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const def = METRIC_DEFINITIONS[defKey] || { title: defKey, insight: "No definition found." };
  const displayValue = typeof value === 'number' ? formatCurrency(value) : value;

  return (
    <div 
      className="rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)' 
      }}
    >
      <div className="p-5 cursor-pointer flex justify-between items-start" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {def.title}
          </div>
          <div 
            className="text-2xl font-bold mt-1" 
            style={{ color: color || 'var(--text)' }}
          >
            {displayValue}
          </div>
          {sub && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>}
        </div>
        <button 
          className="text-xs font-bold px-2 py-1 rounded"
          style={{
            background: isOpen ? 'var(--border)' : 'color-mix(in srgb, var(--accent) 10%, transparent)',
            color: isOpen ? 'var(--muted)' : 'var(--accent)'
          }}
        >
          {isOpen ? 'Hide Info' : 'Details'}
        </button>
      </div>
      
      {isOpen && (
        <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
            {breakdown && (
                <div 
                  className="p-4 text-xs"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <div className="space-y-2">
                        {breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span 
                              className={item.type === 'base' ? 'font-bold' : 'pl-2'}
                              style={{ color: item.type === 'base' ? 'var(--text)' : 'var(--muted)' }}
                            >
                              {item.label}
                            </span>
                            <span 
                              className="font-mono"
                              style={{ color: item.val < 0 ? '#ef4444' : 'var(--text)' }}
                            >
                              {item.type === 'sub_text' ? typeof item.val === 'number' ? item.val : item.val : formatCurrency(item.val)}
                            </span>
                        </div>
                        ))}
                    </div>
                </div>
            )}

            <div 
              className="p-4"
              style={{ background: 'color-mix(in srgb, var(--surface) 80%, var(--muted) 20%)' }}
            >
                <h4 
                  className="text-xs font-bold uppercase mb-1"
                  style={{ color: 'var(--text)' }}
                >
                  What this tells you:
                </h4>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--muted)' }}
                >
                  {def.insight}
                </p>
                {def.goodIf && (
                    <div 
                      className="mt-2 text-xs font-medium flex items-center"
                      style={{ color: 'var(--accent)' }}
                    >
                        <span className="mr-1">🎯</span> Target: {def.goodIf}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function SectionHeader({ title, sub }) {
  return (
    <div className="pb-2 mb-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{title}</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>
    </div>
  );
}

function InputGroup({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--accent)' }}>
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Input({ label, name, val, onChange }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text)' }}>
        {label}
      </label>
      <input 
        type="number" 
        name={name} 
        value={val} 
        onChange={onChange} 
        className="w-full rounded px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 transition"
        style={{ 
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--text)',
          '--tw-ring-color': 'var(--accent)'
        }}
      />
    </div>
  );
}

// === FOOTER COMPONENT ===
function Footer({ email, setEmail, waitlistStatus, handleWaitlistSubmit, handleFeedback }) {
  return (
    <footer 
      className="mt-16 py-12 pb-32"
      style={{ 
        background: 'var(--surface)', 
        borderTop: '1px solid var(--border)' 
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Left Section - Waitlist */}
          <div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
              Join the Beta Waitlist
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              Be the first to access advanced features and analytics for your e-commerce business.
            </p>
            
            <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition"
                style={{ 
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  '--tw-ring-color': 'var(--accent)'
                }}
              />
              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                className="px-6 py-2 rounded-lg text-sm font-bold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: 'var(--accent)', 
                  color: 'var(--bg)' 
                }}
              >
                {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
            
            {waitlistStatus === 'success' && (
              <div 
                className="mt-3 text-sm font-medium flex items-center gap-2"
                style={{ color: '#10b981' }}
              >
                <span>✓</span> You&apos;re on the list! We&apos;ll be in touch soon.
              </div>
            )}
            {waitlistStatus === 'error' && (
              <div 
                className="mt-3 text-sm font-medium flex items-center gap-2"
                style={{ color: '#ef4444' }}
              >
                <span>✕</span> Please enter a valid email address.
              </div>
            )}
          </div>

          {/* Right Section - Feedback & Info */}
          <div className="flex flex-col items-start md:items-end">
            <button
              onClick={handleFeedback}
              className="px-6 py-2 rounded-lg text-sm font-bold transition hover:opacity-90"
              style={{ 
                background: 'var(--border)', 
                color: 'var(--text)' 
              }}
            >
              Send Feedback
            </button>

            <div className="mt-8 text-xs md:text-right" style={{ color: 'var(--muted)' }}>
              <p>© 2024 SignalROI. Built for decision makers.</p>
              <p className="mt-1">Strategy Engine v1.0</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}