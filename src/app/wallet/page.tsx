"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-context';
import { supabase, Transaction } from '@/lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function WalletPage() {
  const { user, wallet, refreshWallet } = useAuth();
  
  // Ledger states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [depositAmount, setDepositAmount] = useState(500);
  const [withdrawAmount, setWithdrawAmount] = useState(250);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  // Charts data
  const [earningsChartData, setEarningsChartData] = useState<any[]>([]);
  const [balanceChartData, setBalanceChartData] = useState<any[]>([]);

  // Fetch transactions list
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

        // Build chart data from real transactions (last 7 days)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const earningsByDay: Record<string, number> = {};
        const balanceByDay: Record<string, number> = {};

        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = dayNames[d.getDay()];
          earningsByDay[key] = 0;
          balanceByDay[key] = 0;
        }

        // Accumulate real transaction amounts
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

  // Deposit tokens transaction handler
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || depositAmount <= 0) return;
    setActionLoading(true);
    setAlert(null);

    try {
      const { data, error } = await supabase.rpc('deposit_tokens_secure', {
        p_user_id: user.id,
        p_amount: depositAmount
      });

      if (error || (data && data.error)) {
        setAlert({ type: 'error', text: error?.message || data?.error || 'Deposit execution failed.' });
        return;
      }

      setAlert({ type: 'success', text: `Successfully credited +${depositAmount} TKN to your wallet.` });
      await refreshWallet();
      await loadTransactions();
    } catch (e) {
      console.error(e);
      setAlert({ type: 'error', text: 'Error executing transaction.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Withdraw tokens transaction handler
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || withdrawAmount <= 0) return;
    setActionLoading(true);
    setAlert(null);

    try {
      const { data, error } = await supabase.rpc('withdraw_tokens_secure', {
        p_user_id: user.id,
        p_amount: withdrawAmount
      });

      if (error || (data && data.error)) {
        setAlert({ type: 'error', text: error?.message || data?.error || 'Withdrawal execution failed.' });
        return;
      }

      setAlert({ type: 'success', text: `Successfully withdrew -${withdrawAmount} TKN to external ledger.` });
      await refreshWallet();
      await loadTransactions();
    } catch (e) {
      console.error(e);
      setAlert({ type: 'error', text: 'Error executing transaction.' });
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
    <div className="space-y-6">
      {/* Title */}
      <header className="pb-4 border-b border-outline-variant">
        <h2 className="font-display text-2xl font-black text-on-surface uppercase tracking-tight">Wallet ledger</h2>
        <p className="text-xs text-on-surface-variant mt-1">Manage stakes tokens balance, trace ledger history, and query charts</p>
      </header>

      {alert && (
        <div className={`border rounded-lg p-4 text-xs flex items-center gap-3 ${
          alert.type === 'error' ? 'bg-error-container/15 border-error/50 text-error' : 'bg-primary-container/15 border-primary-container/50 text-primary-fixed'
        }`}>
          <span className="material-symbols-outlined text-sm">payments</span>
          <span>{alert.text}</span>
        </div>
      )}

      {/* Grid splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns (8 cols): Balance + Charts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Balance card panel */}
          <div className="card-base p-6 md:p-8 bg-grid-pattern relative overflow-hidden group border-t-2 border-primary-fixed">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
              <div>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Stake Tokens Balance</p>
                <h3 className="font-display text-4xl md:text-5xl font-black text-primary-fixed tracking-tight mt-1.5 drop-shadow-[0_0_15px_rgba(0,255,163,0.3)]">
                  {wallet?.balance ?? 0} <span className="text-base text-on-surface font-mono font-normal">TKN</span>
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mt-3">
                  Stake tokens to enter money lobbies. Yield focus rewards during timed study sprints.
                </p>
              </div>

              {/* Quick Action trigger forms */}
              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <form onSubmit={handleDeposit} className="flex gap-2">
                  <input
                    type="number"
                    min={50}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(parseInt(e.target.value))}
                    className="bg-background border border-outline-variant rounded px-2.5 py-1.5 font-mono text-xs text-on-surface focus:outline-none w-24"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-primary-container hover:bg-primary-fixed text-on-primary font-label-mono text-[10px] font-bold px-4 rounded transition-colors cursor-pointer"
                  >
                    Deposit
                  </button>
                </form>

                <form onSubmit={handleWithdraw} className="flex gap-2">
                  <input
                    type="number"
                    min={50}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseInt(e.target.value))}
                    className="bg-background border border-outline-variant rounded px-2.5 py-1.5 font-mono text-xs text-on-surface focus:outline-none w-24"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-surface-variant border border-outline-variant hover:bg-surface-bright text-on-surface font-label-mono text-[10px] font-bold px-4 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Withdraw
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Wallet charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base p-5 space-y-4">
              <h4 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Study Rewards Per Day</h4>
              <div className="h-48 w-full">
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

            <div className="card-base p-5 space-y-4">
              <h4 className="font-display text-xs font-bold text-on-surface uppercase tracking-wider">Balance Over Time</h4>
              <div className="h-48 w-full">
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

        {/* Right Column (4 cols): Ledger ledger listing */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-xl p-6 flex flex-col h-[480px]">
            <h3 className="font-display text-sm font-bold text-on-surface uppercase tracking-wider mb-4">Ledger History</h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {transactions.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[10px] text-on-surface-variant font-label-mono uppercase">No ledger entries registered</p>
                </div>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit' || tx.type === 'winning';
                  return (
                    <div 
                      key={tx.id}
                      className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg flex items-center justify-between gap-3 font-mono text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{tx.description || tx.type.toUpperCase()}</p>
                        <span className="text-[8px] text-on-surface-variant block mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString()} • {tx.type}
                        </span>
                      </div>
                      
                      <span className={`font-bold font-display ${isDeposit ? 'text-primary-fixed' : 'text-error'}`}>
                        {isDeposit ? '+' : '-'}{tx.amount}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
