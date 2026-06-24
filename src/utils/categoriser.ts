import { Transaction } from '../types';

export const CATEGORIES = [
  "ATM / Cash",
  "Banking",
  "Eating Out",
  "Education",
  "Entertainment",
  "Groceries",
  "Health & Pharmacy",
  "Income",
  "Other",
  "Personal Care",
  "Shopping",
  "Subscriptions",
  "Transfers",
  "Transport",
  "Travel",
  "Utilities & Bills",
];

const API_BASE = process.env.REACT_APP_API_URL ?? 'http://localhost:8000';

export async function categoriseTransactions(
  transactions: Transaction[],
  onProgress?: (done: number, total: number) => void
): Promise<Transaction[]> {
  const BATCH = 50;
  const results: Transaction[] = [...transactions];

  for (let i = 0; i < transactions.length; i += BATCH) {
    const slice = transactions.slice(i, i + BATCH);

    try {
      const response = await fetch(`${API_BASE}/categorise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: slice.map(t => ({
            id:          t.id,
            description: t.description,
            amount:      t.amount,
          })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.detail ?? `API error ${response.status}`);
      }

      const predictions: { id: string; category: string; confidence: number }[] = await response.json();

      predictions.forEach(pred => {
        const idx = results.findIndex(t => t.id === pred.id);
        if (idx !== -1) {
          results[idx] = {
            ...results[idx],
            category: pred.category,
          };
        }
      });
    } catch (err) {
      console.error('Categorisation batch failed:', err);
      // Leave batch as Uncategorised and continue
    }

    onProgress?.(Math.min(i + BATCH, transactions.length), transactions.length);
  }

  return results;
}

export async function sendCorrection(
  description: string,
  amount: number,
  category: string
): Promise<void> {
  try {
    await fetch(`${API_BASE}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, category }),
    });
  } catch (err) {
    console.error('Failed to send correction:', err);
  }
}