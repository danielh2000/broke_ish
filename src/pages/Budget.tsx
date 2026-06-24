import React, { useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Transaction, BudgetEntry } from '../types';
import { CATEGORIES } from '../utils/categoriser';

interface BudgetProps {
  transactions: Transaction[];
  budgets?: BudgetEntry[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetEntry[]>>;
}

function formatZAR(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

const STATUS_THRESHOLDS = {
  safe:    0.80,  // under 80% → green
  warning: 1.00,  // 80–100% → amber
                  // over 100% → red
};

function getStatus(spent: number, limit: number): 'safe' | 'warning' | 'over' {
  const ratio = spent / limit;
  if (ratio <= STATUS_THRESHOLDS.safe)    return 'safe';
  if (ratio <= STATUS_THRESHOLDS.warning) return 'warning';
  return 'over';
}

const STATUS_META = {
  safe:    { icon: CheckCircle,    label: 'On track',      colorClass: 'status--safe' },
  warning: { icon: AlertTriangle,  label: 'Heads up',      colorClass: 'status--warning' },
  over:    { icon: XCircle,        label: 'Over budget',   colorClass: 'status--over' },
};

// Categories that make sense to budget (exclude income/transfers)
const BUDGETABLE = CATEGORIES.filter(c => !['Income', 'Transfers'].includes(c));

export function Budget({ transactions, budgets = [], setBudgets }: BudgetProps) {
  const [adding, setAdding]         = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [formCat, setFormCat]       = useState(BUDGETABLE[0]);
  const [formLimit, setFormLimit]   = useState('');

  // Actual spend per category from transactions
  const spendMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount);
      });
    return map;
  }, [transactions]);

  // Categories not yet budgeted
  const availableCategories = useMemo(() =>
    BUDGETABLE.filter(c => !budgets.some(b => b.category === c)),
  [budgets]);

  function openAddForm() {
    setFormCat(availableCategories[0] ?? BUDGETABLE[0]);
    setFormLimit('');
    setEditingIdx(null);
    setAdding(true);
  }

  function openEditForm(idx: number) {
    setFormCat(budgets[idx].category);
    setFormLimit(String(budgets[idx].limit));
    setAdding(false);
    setEditingIdx(idx);
  }

  function handleSave() {
    const limit = parseFloat(formLimit);
    if (!formCat || isNaN(limit) || limit <= 0) return;

    if (editingIdx !== null) {
      setBudgets(prev => prev.map((b, i) => i === editingIdx ? { category: formCat, limit } : b));
      setEditingIdx(null);
    } else {
      setBudgets(prev => [...prev, { category: formCat, limit }]);
      setAdding(false);
    }
    setFormLimit('');
  }

  function handleDelete(idx: number) {
    setBudgets(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  }

  function handleCancel() {
    setAdding(false);
    setEditingIdx(null);
    setFormLimit('');
  }

  // Summary totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s, b) => s + (spendMap[b.category] ?? 0), 0);
  const overCount     = budgets.filter(b => getStatus(spendMap[b.category] ?? 0, b.limit) === 'over').length;

  return (
    <div className="budget-page">

      {/* ── Header row ─────────────────────────────── */}
      <div className="budget-header">
        <div>
          <h1 className="budget-title">Budget</h1>
          <p className="budget-sub">Set a limit per category and track where you stand.</p>
        </div>
        {availableCategories.length > 0 && (
          <button className="btn-add" onClick={openAddForm} disabled={adding || editingIdx !== null}>
            <PlusCircle size={16} strokeWidth={2} />
            Add budget
          </button>
        )}
      </div>

      {/* ── Summary strip ──────────────────────────── */}
      {budgets.length > 0 && (
        <div className="budget-summary-strip">
          <div className="strip-stat">
            <span className="strip-label">Total budgeted</span>
            <span className="strip-value">{formatZAR(totalBudgeted)}</span>
          </div>
          <div className="strip-divider" />
          <div className="strip-stat">
            <span className="strip-label">Total spent</span>
            <span className="strip-value">{formatZAR(totalSpent)}</span>
          </div>
          <div className="strip-divider" />
          <div className="strip-stat">
            <span className="strip-label">Remaining</span>
            <span className={`strip-value ${totalBudgeted - totalSpent >= 0 ? 'positive' : 'negative'}`}>
              {formatZAR(totalBudgeted - totalSpent)}
            </span>
          </div>
          {overCount > 0 && (
            <>
              <div className="strip-divider" />
              <div className="strip-stat">
                <span className="strip-label">Over budget</span>
                <span className="strip-value negative">{overCount} categor{overCount === 1 ? 'y' : 'ies'}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Add / Edit form ────────────────────────── */}
      {(adding || editingIdx !== null) && (
        <div className="budget-form-card card">
          <h3 className="form-title">{editingIdx !== null ? 'Edit budget' : 'New budget'}</h3>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Category</label>
              {editingIdx !== null ? (
                <div className="form-static">{formCat}</div>
              ) : (
                <select
                  className="form-select"
                  value={formCat}
                  onChange={e => setFormCat(e.target.value)}
                >
                  {availableCategories.map(c => <option key={c}>{c}</option>)}
                </select>
              )}
            </div>
            <div className="form-field">
              <label className="form-label">Monthly limit (R)</label>
              <div className="form-input-wrap">
                <span className="form-prefix">R</span>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0.00"
                  value={formLimit}
                  onChange={e => setFormLimit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-save" onClick={handleSave}
                disabled={!formLimit || parseFloat(formLimit) <= 0}>
                Save
              </button>
              <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ────────────────────────────── */}
      {budgets.length === 0 && !adding && (
        <div className="budget-empty">
          <p className="empty-title">No budgets set yet</p>
          <p className="empty-sub">Add a category budget above to start tracking your spending limits.</p>
          <button className="btn-add" onClick={openAddForm}>
            <PlusCircle size={16} strokeWidth={2} />
            Add your first budget
          </button>
        </div>
      )}

      {/* ── Budget cards grid ──────────────────────── */}
      {budgets.length > 0 && (
        <div className="budget-grid">
          {budgets.map((b, i) => {
            const spent   = spendMap[b.category] ?? 0;
            const status  = getStatus(spent, b.limit);
            const meta    = STATUS_META[status];
            const pct     = Math.min((spent / b.limit) * 100, 100);
            const diff    = b.limit - spent;
            const StatusIcon = meta.icon;

            return (
              <div key={b.category} className={`budget-card card ${meta.colorClass}`}>
                <div className="budget-card-header">
                  <span className="budget-cat-name">{b.category}</span>
                  <div className="budget-card-actions">
                    <button className="icon-btn" onClick={() => openEditForm(i)} title="Edit">
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                    <button className="icon-btn icon-btn--delete" onClick={() => handleDelete(i)} title="Delete">
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="budget-bar-track">
                  <div
                    className={`budget-bar-fill budget-bar--${status}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Amounts */}
                <div className="budget-amounts">
                  <div className="budget-spent">
                    <span className="amt-label">Spent</span>
                    <span className="amt-value">{formatZAR(spent)}</span>
                  </div>
                  <div className="budget-limit">
                    <span className="amt-label">Budget</span>
                    <span className="amt-value">{formatZAR(b.limit)}</span>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`budget-status-badge ${meta.colorClass}`}>
                  <StatusIcon size={13} strokeWidth={2.5} />
                  <span>{meta.label}</span>
                  {status === 'over'
                    ? <span className="badge-diff">by {formatZAR(Math.abs(diff))}</span>
                    : <span className="badge-diff">{formatZAR(Math.abs(diff))} left</span>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}