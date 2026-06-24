import React, { useMemo, useState } from 'react';
import { parseDate } from '../utils/parseDate';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Transaction, CategorySummary } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries':        '#1B4332',
  'Eating Out':       '#2D6A4F',
  'Transport':        '#40916C',
  'Entertainment':    '#52B788',
  'Shopping':         '#74C69D',
  'Health & Pharmacy':'#095028',
  'Utilities & Bills':'#C8B560',
  'Subscriptions':    '#A99247',
  'Travel':           '#6B705C',
  'Education':        '#3D405B',
  'Personal Care':    '#81B29A',
  'Income':           '#B7E4C7',
  'Transfers':        '#D8F3DC',
  'ATM / Cash':       '#8D8D8D',
  'Other':            '#BDBDBD',
  'Uncategorised':    '#E0E0E0',
};

function getCategoryColor(cat: string, index: number): string {
  if (CATEGORY_COLORS[cat]) return CATEGORY_COLORS[cat];
  const fallbacks = ['#2D6A4F','#40916C','#52B788','#74C69D','#C8B560','#A99247','#6B705C','#3D405B'];
  return fallbacks[index % fallbacks.length];
}

function formatZAR(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatZARShort(amount: number) {
  if (Math.abs(amount) >= 1000) {
    return `R${(amount / 1000).toFixed(1)}k`;
  }
  return `R${amount.toFixed(0)}`;
}

// Custom donut label
const RADIAN = Math.PI / 180;
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#FAFAF5" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// Custom tooltip for donut
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="chart-tooltip">
      <span className="tooltip-label">{d.name}</span>
      <span className="tooltip-value">{formatZAR(d.value)}</span>
      <span className="tooltip-pct">{(d.payload.percentage).toFixed(1)}%</span>
    </div>
  );
}

// Custom tooltip for bar chart
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="tooltip-label">{label}</span>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.fill }} />
          <span className="tooltip-bar-label">{p.name}:</span>
          <span className="tooltip-value">{formatZAR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ transactions }: DashboardProps) {
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);

  const expenses = useMemo(() => transactions.filter(t => t.amount < 0), [transactions]);
  const income   = useMemo(() => transactions.filter(t => t.amount > 0), [transactions]);

  const totalSpent  = useMemo(() => expenses.reduce((s, t) => s + Math.abs(t.amount), 0), [expenses]);
  const totalIncome = useMemo(() => income.reduce((s, t) => s + t.amount, 0), [income]);
  const net = totalIncome - totalSpent;

  // Category summaries for donut + breakdown bar list
  const categories: CategorySummary[] = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    expenses.forEach(t => {
      const cat = t.category;
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += Math.abs(t.amount);
      map[cat].count += 1;
    });
    return Object.entries(map)
      .map(([category, { total, count }]) => ({
        category,
        total,
        count,
        percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, totalSpent]);

  // Monthly bar chart data
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; Spent: number; Income: number }> = {};

    transactions.forEach(t => {
      const date = parseDate(t.date);
      if (!date) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (!map[key]) map[key] = { month: label, Spent: 0, Income: 0 };
      if (t.amount < 0) map[key].Spent += Math.abs(t.amount);
      else              map[key].Income += t.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [transactions]);

  const topCategory = categories[0];

  return (
    <div className="dashboard">
      {/* ── Summary cards ─────────────────────────────── */}
      <div className="summary-grid">
        <div className="summary-card summary-card--spent">
          <span className="summary-label">Total Spent</span>
          <span className="summary-amount">{formatZAR(totalSpent)}</span>
          <span className="summary-sub">{expenses.length} transactions</span>
        </div>
        <div className="summary-card summary-card--income">
          <span className="summary-label">Money In</span>
          <span className="summary-amount">{formatZAR(totalIncome)}</span>
          <span className="summary-sub">{income.length} transactions</span>
        </div>
        <div className={`summary-card summary-card--net ${net >= 0 ? 'positive' : 'negative'}`}>
          <span className="summary-label">Net</span>
          <span className="summary-amount">{formatZAR(net)}</span>
          <span className="summary-sub">{net >= 0 ? "You're in the green" : 'Spent more than earned'}</span>
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────── */}
      <div className="charts-row">

        {/* Donut — spending by category */}
        <div className="card chart-card chart-card--donut">
          <h2 className="card-title">Spending by Category</h2>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  labelLine={false}
                  label={renderCustomLabel}
                  onMouseEnter={(_, i) => setActiveDonutIndex(i)}
                  onMouseLeave={() => setActiveDonutIndex(null)}
                >
                  {categories.map((cat, i) => (
                    <Cell
                      key={cat.category}
                      fill={getCategoryColor(cat.category, i)}
                      opacity={activeDonutIndex === null || activeDonutIndex === i ? 1 : 0.55}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centre label */}
            <div className="donut-centre">
              <span className="donut-centre-label">total spent</span>
              <span className="donut-centre-value">{formatZARShort(totalSpent)}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="donut-legend">
            {categories.map((cat, i) => (
              <div key={cat.category} className="donut-legend-item"
                onMouseEnter={() => setActiveDonutIndex(i)}
                onMouseLeave={() => setActiveDonutIndex(null)}
              >
                <span className="legend-dot" style={{ backgroundColor: getCategoryColor(cat.category, i) }} />
                <span className="donut-legend-name">{cat.category}</span>
                <span className="donut-legend-pct">{cat.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart — monthly cash flow */}
        <div className="card chart-card chart-card--bar">
          <h2 className="card-title">Monthly Cash Flow</h2>
          {monthlyData.length === 0 ? (
            <div className="chart-empty">Not enough date data to build monthly view.</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData} barCategoryGap="30%" barGap={4}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: 'Inter', fontSize: 11, fill: 'var(--ink-light)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatZARShort}
                  tick={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fill: 'var(--ink-light)' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(27,67,50,0.05)' }} />
                <Legend
                  wrapperStyle={{ fontFamily: 'Inter', fontSize: 12, color: 'var(--ink-mid)', paddingTop: 12 }}
                />
                <Bar dataKey="Income" fill="#52B788" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent"  fill="#1B4332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Lower section (existing) ───────────────────── */}
      <div className="dashboard-lower">
        <div className="card category-breakdown">
          <h2 className="card-title">Category Breakdown</h2>
          <div className="bar-list">
            {categories.map((cat, i) => (
              <div key={cat.category} className="bar-row">
                <div className="bar-meta">
                  <span className="bar-name">{cat.category}</span>
                  <span className="bar-amount">{formatZAR(cat.total)}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: getCategoryColor(cat.category, i),
                    }}
                  />
                </div>
                <span className="bar-pct">{cat.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="side-stats">
          {topCategory && (
            <div className="card stat-card">
              <h3 className="stat-card-label">Biggest category</h3>
              <p className="stat-card-value">{topCategory.category}</p>
              <p className="stat-card-sub">
                {formatZAR(topCategory.total)} · {topCategory.count} transactions
              </p>
            </div>
          )}
          <div className="card stat-card">
            <h3 className="stat-card-label">Avg. transaction</h3>
            <p className="stat-card-value">
              {expenses.length > 0 ? formatZAR(totalSpent / expenses.length) : '—'}
            </p>
            <p className="stat-card-sub">across {expenses.length} expenses</p>
          </div>
          <div className="card stat-card">
            <h3 className="stat-card-label">Categories tracked</h3>
            <p className="stat-card-value">{categories.length}</p>
            <p className="stat-card-sub">from {transactions.length} total transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
}