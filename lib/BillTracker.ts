/**
 * Bill Tracking and Prediction Service
 * Automatically detects recurring bills, tracks payments, and predicts next due dates
 */

import { Transaction } from '../types/aiInsights';

export interface Bill {
    id: string;
    name: string; // Merchant/recipient name
    category: string; // rent, utilities, insurance, subscriptions, etc.
    amount: number; // Average amount
    amountVariance: number; // Allowed variance in amount (±%)
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
    lastPaidDate: string;
    nextDueDate: string;
    paymentHistory: BillPayment[];
    confidence: number; // 0-100, how confident we are this is a bill
    isActive: boolean;
    autoDetected: boolean; // true if detected, false if manually added
    reminderDays: number; // Days before due to remind user
}

export interface BillPayment {
    transactionId: string;
    amount: number;
    paidDate: string;
    status: 'paid' | 'pending' | 'overdue';
    merchant: string;
}

export interface BillDetectionResult {
    bills: Bill[];
    confidence: number;
    detectionDate: string;
}

/**
 * Analyzes transactions to detect recurring bills
 */
export function detectBills(transactions: Transaction[]): BillDetectionResult {
    const bills: Bill[] = [];
    const now = new Date();

    // Group transactions by recipient/merchant
    const merchantGroups = groupTransactionsByMerchant(transactions);

    // Analyze each merchant group for recurring patterns
    for (const [merchant, txns] of Object.entries(merchantGroups)) {
        // Need at least 2 transactions to detect a pattern
        if (txns.length < 2) continue;

        // Sort by date
        const sortedTxns = txns.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Check if amounts are similar (within 10% variance)
        const amounts = sortedTxns.map(t => t.amount);
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const amountVariance = calculateVariance(amounts, avgAmount);

        // If amounts vary too much, likely not a recurring bill
        if (amountVariance > 15) continue;

        // Calculate time intervals between transactions
        const intervals = calculateIntervals(sortedTxns);
        const frequency = detectFrequency(intervals);

        // If no clear frequency pattern, skip
        if (!frequency) continue;

        // Calculate confidence based on:
        // - Number of occurrences (more = higher confidence)
        // - Consistency of intervals (more consistent = higher confidence)
        // - Amount consistency (less variance = higher confidence)
        const confidence = calculateConfidence(txns.length, intervals, amountVariance);

        // Only include if confidence is above threshold
        if (confidence < 60) continue;

        // Get the last transaction as the last payment
        const lastTxn = sortedTxns[sortedTxns.length - 1];
        const lastPaidDate = lastTxn.created_at;

        // Predict next due date based on frequency
        const nextDueDate = predictNextDueDate(lastPaidDate, frequency);

        // Create bill object
        const bill: Bill = {
            id: `bill_${merchant.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
            name: merchant,
            category: categorizeBill(lastTxn.transaction_type, merchant),
            amount: Math.round(avgAmount),
            amountVariance: 10,
            frequency,
            lastPaidDate,
            nextDueDate,
            paymentHistory: sortedTxns.map(txn => ({
                transactionId: txn.id,
                amount: txn.amount,
                paidDate: txn.created_at,
                status: 'paid' as const,
                merchant: txn.to_name || merchant,
            })),
            confidence,
            isActive: true,
            autoDetected: true,
            reminderDays: 3,
        };

        bills.push(bill);
    }

    return {
        bills,
        confidence: bills.length > 0 ?
            bills.reduce((sum, b) => sum + b.confidence, 0) / bills.length : 0,
        detectionDate: now.toISOString(),
    };
}

/**
 * Groups transactions by merchant/recipient
 */
function groupTransactionsByMerchant(transactions: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};

    for (const txn of transactions) {
        // Only consider outgoing transactions (deductions)
        if (txn.type !== 'deduct') continue;

        const merchant = txn.to_name || 'Unknown';

        if (!groups[merchant]) {
            groups[merchant] = [];
        }
        groups[merchant].push(txn);
    }

    return groups;
}

/**
 * Calculates variance in amounts
 */
function calculateVariance(amounts: number[], average: number): number {
    if (amounts.length === 0) return 100;

    const maxDeviation = Math.max(...amounts.map(amt => Math.abs(amt - average)));
    return (maxDeviation / average) * 100;
}

/**
 * Calculates time intervals between transactions in days
 */
function calculateIntervals(transactions: Transaction[]): number[] {
    const intervals: number[] = [];

    for (let i = 1; i < transactions.length; i++) {
        const prevDate = new Date(transactions[i - 1].created_at);
        const currDate = new Date(transactions[i].created_at);
        const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);
    }

    return intervals;
}

/**
 * Detects frequency pattern from intervals
 */
function detectFrequency(intervals: number[]): Bill['frequency'] | null {
    if (intervals.length === 0) return null;

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

    // Weekly: ~7 days (±2 days tolerance)
    if (avgInterval >= 5 && avgInterval <= 9) return 'weekly';

    // Biweekly: ~14 days (±3 days tolerance)
    if (avgInterval >= 11 && avgInterval <= 17) return 'biweekly';

    // Monthly: ~30 days (±5 days tolerance)
    if (avgInterval >= 25 && avgInterval <= 35) return 'monthly';

    // Quarterly: ~90 days (±10 days tolerance)
    if (avgInterval >= 80 && avgInterval <= 100) return 'quarterly';

    // Yearly: ~365 days (±30 days tolerance)
    if (avgInterval >= 335 && avgInterval <= 395) return 'yearly';

    return null;
}

/**
 * Calculates confidence score for bill detection
 */
function calculateConfidence(
    occurrences: number,
    intervals: number[],
    amountVariance: number
): number {
    // Base confidence on number of occurrences
    let confidence = Math.min(occurrences * 20, 60); // Max 60 from occurrences

    // Add points for consistent intervals
    if (intervals.length > 0) {
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
        const intervalVariance = calculateVariance(intervals, avgInterval);

        // Less variance = more confidence (max 25 points)
        const intervalScore = Math.max(0, 25 - intervalVariance);
        confidence += intervalScore;
    }

    // Add points for consistent amounts (max 15 points)
    const amountScore = Math.max(0, 15 - amountVariance);
    confidence += amountScore;

    return Math.min(Math.round(confidence), 100);
}

/**
 * Predicts next due date based on last payment and frequency
 */
export function predictNextDueDate(lastPaidDate: string, frequency: Bill['frequency']): string {
    const lastDate = new Date(lastPaidDate);
    const nextDate = new Date(lastDate);

    switch (frequency) {
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate.toISOString();
}

/**
 * Categorizes a bill based on transaction type and merchant name
 */
function categorizeBill(transactionType: string, merchant: string): string {
    const merchantLower = merchant.toLowerCase();

    // Check merchant name for keywords
    if (merchantLower.includes('rent') || merchantLower.includes('landlord')) return 'rent';
    if (merchantLower.includes('electric') || merchantLower.includes('power')) return 'utilities';
    if (merchantLower.includes('water') || merchantLower.includes('gas')) return 'utilities';
    if (merchantLower.includes('internet') || merchantLower.includes('wifi')) return 'utilities';
    if (merchantLower.includes('phone') || merchantLower.includes('mobile')) return 'utilities';
    if (merchantLower.includes('insurance')) return 'insurance';
    if (merchantLower.includes('netflix') || merchantLower.includes('spotify') ||
        merchantLower.includes('subscription')) return 'subscriptions';
    if (merchantLower.includes('gym') || merchantLower.includes('fitness')) return 'subscriptions';
    if (merchantLower.includes('loan') || merchantLower.includes('emi')) return 'loans';

    // Fall back to transaction type
    return transactionType || 'other';
}

/**
 * Gets upcoming bills within specified days
 */
export function getUpcomingBills(bills: Bill[], daysAhead: number = 30): Bill[] {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return bills
        .filter(bill => bill.isActive)
        .filter(bill => {
            const dueDate = new Date(bill.nextDueDate);
            return dueDate >= now && dueDate <= futureDate;
        })
        .sort((a, b) =>
            new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        );
}

/**
 * Gets bills that are overdue
 */
export function getOverdueBills(bills: Bill[]): Bill[] {
    const now = new Date();

    return bills
        .filter(bill => bill.isActive)
        .filter(bill => new Date(bill.nextDueDate) < now)
        .sort((a, b) =>
            new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()
        );
}

/**
 * Calculates days until a bill is due
 */
export function getDaysUntilDue(bill: Bill): number {
    const now = new Date();
    const dueDate = new Date(bill.nextDueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Marks a bill as paid with a transaction
 */
export function markBillAsPaid(bill: Bill, transaction: Transaction): Bill {
    const payment: BillPayment = {
        transactionId: transaction.id,
        amount: transaction.amount,
        paidDate: transaction.created_at,
        status: 'paid',
        merchant: transaction.to_name,
    };

    const updatedBill: Bill = {
        ...bill,
        lastPaidDate: transaction.created_at,
        nextDueDate: predictNextDueDate(transaction.created_at, bill.frequency),
        paymentHistory: [...bill.paymentHistory, payment],
    };

    return updatedBill;
}

/**
 * Checks if a transaction matches a bill
 */
export function transactionMatchesBill(transaction: Transaction, bill: Bill): boolean {
    // Must be a deduction
    if (transaction.type !== 'deduct') return false;

    // Check merchant name similarity
    const merchantMatch = transaction.to_name?.toLowerCase() === bill.name.toLowerCase();
    if (!merchantMatch) return false;

    // Check amount is within variance
    const amountDiff = Math.abs(transaction.amount - bill.amount);
    const allowedVariance = bill.amount * (bill.amountVariance / 100);
    const amountMatch = amountDiff <= allowedVariance;

    return amountMatch;
}

/**
 * Auto-detects and marks bills as paid from new transactions
 */
export function processBillPayments(bills: Bill[], transactions: Transaction[]): Bill[] {
    const updatedBills = [...bills];

    for (const transaction of transactions) {
        for (let i = 0; i < updatedBills.length; i++) {
            const bill = updatedBills[i];

            // Check if transaction matches this bill
            if (transactionMatchesBill(transaction, bill)) {
                // Check if this transaction is after the last payment
                const txnDate = new Date(transaction.created_at);
                const lastPaidDate = new Date(bill.lastPaidDate);

                if (txnDate > lastPaidDate) {
                    updatedBills[i] = markBillAsPaid(bill, transaction);
                }
            }
        }
    }

    return updatedBills;
}
