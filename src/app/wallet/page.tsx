"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase, Transaction } from '@/lib/supabaseClient';
import { loadRazorpayScript } from '@/components/RazorpayScript';
import { isStateRestricted, RESTRICTED_INDIAN_STATES } from '@/lib/geoBlock';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, AlertTriangle, Building2, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WalletPage() {
  const { user, profile, wallet, refreshWallet } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [depositAmount, setDepositAmount] = useState(500);
  const [withdrawAmount, setWithdrawAmount] = useState(250);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Withdrawal modal & state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [userState, setUserState] = useState('Delhi');
  const [showStateModal, setShowStateModal] = useState(false);

  // Charts data
  const [earningsChartData, setEarningsChartData] = useState<any[]>([]);
  const [balanceChartData, setBalanceChartData] = useState<any[]>([]);

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data as Transaction[]);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const earningsByDay: Record<string, number> = {};
        const balanceByDay: Record<string, number> = {};

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = dayNames[d.getDay()];
          earningsByDay[key] = 0;
          balanceByDay[key] = 0;
        }

        let runningBalance = 0;
        for (const tx of data) {
          const txDate = new Date(tx.created_at);
          const dayKey = dayNames[txDate.getDay()];
          if (tx.type === 'deposit' || tx.type === 'winning') {
            earningsByDay[dayKey] = (earningsByDay[dayKey] || 0) + tx.amount;
            runningBalance += tx.amount;
          } else if (tx.type === 'withdrawal' || tx.type === 'entry_fee') {
            runningBalance -= tx.amount;
          }
          balanceByDay[dayKey] = runningBalance;
        }

        setEarningsChartData(
          Object.entries(earningsByDay).map(([day, Winnings]) => ({ day, Winnings }))
        );
        setBalanceChartData(
          Object.entries(balanceByDay).map(([day, Balance]) => ({ day, Balance }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Razorpay Checkout Launcher (Test Mode)
  const handleRazorpayDeposit = async (amount: number) => {
    if (!user) return;
    
    // Geo-block state check
    if (isStateRestricted(userState)) {
      toast.error(`Cash deposits are legally restricted in ${userState}.`, { icon: '🚫' });
      return;
    }

    setActionLoading(true);
    setAlert(null);

    const res = await loadRazorpayScript();
    if (!res) {
      toast.error('Failed to load Razorpay Payment Gateway SDK.');
      setActionLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_5123456789',
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      name: 'Focus Arena',
      description: `Deposit +${amount} Tokens into Wallet`,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150',
      handler: async function (response: any) {
        toast.success(`Payment Success! Credit ID: ${response.razorpay_payment_id || 'PAY-TEST'}`);
        try {
          const { data, error } = await supabase.rpc('deposit_tokens_secure', {
            p_user_id: user.id,
            p_amount: amount
          });

          if (!error) {
            toast.success(`Successfully credited +${amount} Tokens to your wallet!`);
            await refreshWallet();
            await loadTransactions();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setActionLoading(false);
        }
      },
      prefill: {
        name: profile?.name || user.email?.split('@')[0],
        email: user.email,
        contact: '9999999999'
      },
      theme: {
        color: '#00FFA3'
      }
    };

    try {
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (e) {
      // Fallback for simulation
      const { data, error } = await supabase.rpc('deposit_tokens_secure', {
        p_user_id: user.id,
        p_amount: amount
      });
      if (!error) {
        toast.success(`[Test Mode] Credited +${amount} Tokens!`);
        await refreshWallet();
        await loadTransactions();
      }
      setActionLoading(false);
    }
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || withdrawAmount <= 0) return;
    if (withdrawAmount > (wallet?.balance || 0)) {
      toast.error('Insufficient wallet balance!');
      return;
    }
    setActionLoading(true);

    try {
      const { data, error } = await supabase.rpc('withdraw_tokens_secure', {
        p_user_id: user.id,
        p_amount: withdrawAmount
      });

      if (error || (data && data.error)) {
        toast.error(error?.message || data?.error || 'Withdrawal failed.');
        return;
      }

      toast.success(`Withdrawal request for ₹${withdrawAmount} submitted! Payout processing to ${upiId || 'registered UPI ID'}.`);
      setShowWithdrawModal(false);
      await refreshWallet();
      await loadTransactions();
    } catch (e) {
      console.error(e);
      toast.error('Error submitting withdrawal.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTransactions();
      refreshWallet();
    }
  }, [user]);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label-mono text-xs mt-4">FETCHING WALLET METRICS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-white">
      {/* Title Header */}
      <header className="pb-4 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">Wallet & Payment Ledger</h2>
          <p className="text-xs text-neutral-400 font-mono mt-1">Manage cash deposits, payout withdrawals, and track ledger history</p>
        </div>

        {/* State selection pill */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-xs">
          <span className="text-neutral-400">State:</span>
          <select 
            value={userState} 
            onChange={(e) => setUserState(e.target.value)}
            className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
          >
            <option value="Delhi" className="bg-neutral-900">Delhi (Allowed)</option>
            <option value="Maharashtra" className="bg-neutral-900">Maharashtra (Allowed)</option>
            <option value="Karnataka" className="bg-neutral-900">Karnataka (Allowed)</option>
            <option value="Assam" className="bg-neutral-900">Assam (Restricted 🚫)</option>
            <option value="Odisha" className="bg-neutral-900">Odisha (Restricted 🚫)</option>
            <option value="Telangana" className="bg-neutral-900">Telangana (Restricted 🚫)</option>
            <option value="Andhra Pradesh" className="bg-neutral-900">Andhra Pradesh (Restricted 🚫)</option>
            <option value="Nagaland" className="bg-neutral-900">Nagaland (Restricted 🚫)</option>
            <option value="Sikkim" className="bg-neutral-900">Sikkim (Restricted 🚫)</option>
          </select>
        </div>
      </header>

      {/* Restricted State Flash Warning */}
      {isStateRestricted(userState) && (
        <div className="bg-red-950/80 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 font-mono text-xs text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="font-bold block uppercase text-red-400">Cash Contests Restricted in {userState}</span>
            <span>State regulations prohibit real-money contests in {userState}. You can still play all Free & Public Study Arenas!</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 cols): Balance + Razorpay Checkout */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-2 border-emerald-500/40 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div>
                <span className="font-mono text-[10px] text-neutral-400 uppercase font-bold tracking-wider">AVAILABLE WALLET BALANCE</span>
                <h3 className="font-display text-4xl md:text-5xl font-black text-emerald-400 tracking-tight mt-1">
                  ₹{wallet?.balance ?? 0} <span className="text-base text-neutral-400 font-mono font-normal">INR / TKN</span>
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-2">
                  100% Game of Skill • Instant UPI Deposits & Withdrawals
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleRazorpayDeposit(depositAmount)}
                  disabled={actionLoading || isStateRestricted(userState)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 fill-black" />
                  Deposit Funds
                </button>

                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={actionLoading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider border border-neutral-700 px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  Withdraw Cash
                </button>
              </div>
            </div>

            {/* Quick Deposit Preset Bar */}
            <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-wrap items-center gap-3 font-mono text-xs">
              <span className="text-neutral-400 font-bold text-[10px] uppercase">Quick Deposit Presets:</span>
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setDepositAmount(amt);
                    handleRazorpayDeposit(amt);
                  }}
                  disabled={actionLoading || isStateRestricted(userState)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-emerald-400 hover:text-emerald-400 font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Study Arena Rewards</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '10px' }} />
                    <Bar dataKey="Winnings" fill="#00FFA3" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Balance Growth Trend</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7047EB" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#7047EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#849588" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1f2a', borderColor: '#3a4a3f', borderRadius: '6px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="Balance" stroke="#7047EB" strokeWidth={1.5} fillOpacity={1} fill="url(#balGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Ledger Listing */}
        <div className="lg:col-span-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col h-[520px] font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">
              Transaction History
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] text-neutral-500 uppercase">No transactions recorded</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit' || tx.type === 'winning';
                  return (
                    <div 
                      key={tx.id}
                      className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{tx.description || tx.type.toUpperCase()}</p>
                        <span className="text-[8px] text-neutral-500 block mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString()} • {tx.type}
                        </span>
                      </div>
                      
                      <span className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isDeposit ? '+' : '-'}₹{tx.amount}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Withdrawal Request Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl max-w-md w-full font-mono space-y-4 text-white">
            <h3 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2 text-emerald-400">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              UPI Cash Payout Withdrawal
            </h3>
            <p className="text-xs text-neutral-400">
              Withdraw winnings directly to your GPay / PhonePe / Paytm UPI ID.
            </p>

            <form onSubmit={handleWithdrawRequest} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 font-bold mb-1">UPI ID / VPA (e.g. user@okaxis)</label>
                <input
                  type="text"
                  required
                  placeholder="name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 font-bold mb-1">Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={50}
                  max={wallet?.balance || 10000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(parseInt(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-400 py-2.5 rounded-xl hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Submit Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
