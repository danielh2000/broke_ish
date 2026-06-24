import React, { useState, useCallback } from 'react';
import { TrendingDown, LayoutDashboard, List, Upload, Wallet } from 'lucide-react';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budget } from './pages/Budget';
import { Transaction, AppView, BudgetEntry } from './types';
import { sendCorrection } from './utils/categoriser';
import './App.css';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);

  const handleDataReady = useCallback((data: Transaction[]) => {
    setTransactions(data);
    setView('dashboard');
  }, []);

  const handleCategoryChange = useCallback((id: string, category: string, description: string, amount: number) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
    // Fire and forget — send correction to backend to retrain model
    sendCorrection(description, amount, category);
  }, []);

  if (view === 'landing') {
    return <Landing onDataReady={handleDataReady} />;
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">
          <TrendingDown size={20} strokeWidth={2.5} />
          <span>broke<span className="logo-accent">_ish</span></span>
        </div>
        <div className="nav-tabs">
          <button
            className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <LayoutDashboard size={15} strokeWidth={2} />
            Dashboard
          </button>
          <button
            className={`nav-tab ${view === 'transactions' ? 'active' : ''}`}
            onClick={() => setView('transactions')}
          >
            <List size={15} strokeWidth={2} />
            Transactions
          </button>
          <button
            className={`nav-tab ${view === 'budget' ? 'active' : ''}`}
            onClick={() => setView('budget')}
          >
            <Wallet size={15} strokeWidth={2} />
            Budget
          </button>
        </div>
        <button
          className="nav-upload-btn"
          onClick={() => setView('landing')}
          title="Upload a new CSV"
        >
          <Upload size={14} strokeWidth={2} />
          New file
        </button>
      </nav>

      <main className="main-content">
        {view === 'dashboard'    && <Dashboard transactions={transactions} />}
        {view === 'transactions' && (
          <Transactions transactions={transactions} onCategoryChange={handleCategoryChange} />
        )}
        {view === 'budget'       && <Budget transactions={transactions} budgets={budgets} setBudgets={setBudgets} />}
      </main>
    </div>
  );
}