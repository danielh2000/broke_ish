import React, { useMemo, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '../types';
import { CATEGORIES, } from '../utils/categoriser';

interface TransactionsProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: string, description: string, amount: number) => void;
}

function formatZAR(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function Transactions({ transactions, onCategoryChange }: TransactionsProps) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const allCategories = useMemo(() => {
    const used = Array.from(new Set(transactions.map(t => t.category)));
    return ['All', ...used.sort()];
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === 'All' || t.category === filterCat;
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') return Math.abs(b.amount) - Math.abs(a.amount);
        return new Date(b.date).getTime() - new Date(a.date).getTime() || 0;
      });
  }, [transactions, search, filterCat, sortBy]);

  return (
    <div className="transactions-page">
      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <Search size={15} strokeWidth={2} />
          <input
            className="search-input"
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
        >
          {allCategories.map(c => <option key={c}>{c}</option>)}
        </select>

        <div className="sort-toggle">
          <button
            className={sortBy === 'date' ? 'active' : ''}
            onClick={() => setSortBy('date')}
          >Date</button>
          <button
            className={sortBy === 'amount' ? 'active' : ''}
            onClick={() => setSortBy('amount')}
          >Amount</button>
        </div>
      </div>

      {/* Count */}
      <p className="txn-count">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {filterCat !== 'All' && ` in ${filterCat}`}
      </p>

      {/* List */}
      <div className="txn-list">
        {filtered.length === 0 ? (
          <div className="txn-empty">No transactions match your search.</div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className={`txn-row ${t.amount >= 0 ? 'txn-row--credit' : 'txn-row--debit'}`}>
              <div className="txn-icon">
                {t.amount >= 0
                  ? <ArrowDownLeft size={14} strokeWidth={2} />
                  : <ArrowUpRight size={14} strokeWidth={2} />}
              </div>
              <div className="txn-info">
                <span className="txn-desc">{t.description}</span>
                <span className="txn-date">{t.date}</span>
              </div>
              <select
                className="txn-cat-select"
                value={t.category}
                onChange={e => onCategoryChange(t.id, e.target.value, t.description, t.amount)}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className={`txn-amount ${t.amount >= 0 ? 'credit' : 'debit'}`}>
                {t.amount >= 0 ? '+' : '-'}{formatZAR(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}