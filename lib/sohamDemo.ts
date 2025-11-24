import { EnvelopeKey } from '../app/(tabs)/PiggyBanks';

export type DemoDuration = '1w' | '1m' | '1y';

export interface SohamData {
    transactions: any[];
    balance: number;
    piggyBanks: {
        balances: Record<EnvelopeKey, number>;
        jarTargets: Record<EnvelopeKey, number>;
        readyInvestments: any[];
    };
}

const SOHAM_ID = 'soham_demo_id';
const OTHER_USER_ID = 'other_user_id';

export const generateSohamData = (duration: DemoDuration): SohamData => {
    const now = new Date();
    const transactions: any[] = [];
    let balance = 0;

    // Base Piggy Bank State
    const piggyBalances: Record<string, number> = {
        'emis': 0,
        'rent': 0,
        'insurance': 0,
        'other': 0,
        'meal': 0,
        'travel': 0,
        'treats': 0,
        'vacations': 0,
        'savings': 0,
        'emergency': 0,
        'investments': 0,
    };

    const jarTargets: Record<string, number> = {
        'rent': 5000, // Lower rent for demo
        'emergency': 10000,
        'vacations': 20000, // New Phone/Bike
    };

    let daysToSimulate = 0;
    if (duration === '1w') daysToSimulate = 7;
    if (duration === '1m') daysToSimulate = 30;
    if (duration === '1y') daysToSimulate = 365;

    // Simulation Loop
    for (let d = daysToSimulate; d >= 0; d--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
        const dateStr = date.toISOString();

        // Irregular Income (Gig work: 3-4 times a week)
        if (d % 2 === 0 || d % 5 === 0) {
            const income = 500 + Math.floor(Math.random() * 500); // 500-1000
            transactions.push({
                id: `inc_${d}`,
                created_at: dateStr,
                amount: income,
                type: 'transfer', // Incoming
                transaction_type: 'salary', // or gig
                from_user_id: OTHER_USER_ID,
                to_user_id: SOHAM_ID,
                from_name: 'Gig Work',
                to_name: 'Soham',
                method: 'upi'
            });
            balance += income;

            // Simulate Piggy Bank Allocation (Simple 20% savings rule for demo)
            if (duration === '1w') {
                // Just starting, mostly spending
                piggyBalances['emergency'] += income * 0.05;
            } else if (duration === '1m') {
                piggyBalances['emergency'] += income * 0.10;
                piggyBalances['rent'] += income * 0.10;
            } else {
                piggyBalances['emergency'] += income * 0.10;
                piggyBalances['rent'] += income * 0.10;
                piggyBalances['vacations'] += income * 0.10; // Saving for bike/phone
                piggyBalances['investments'] += income * 0.05;
            }
        }

        // Daily Expenses
        const expense = 100 + Math.floor(Math.random() * 200);
        transactions.push({
            id: `exp_${d}`,
            created_at: dateStr,
            amount: expense,
            type: 'deduct',
            transaction_type: 'food',
            from_user_id: SOHAM_ID,
            to_user_id: OTHER_USER_ID,
            from_name: 'Soham',
            to_name: 'Shop',
            method: 'cash'
        });
        balance -= expense;
    }

    // Adjust Piggy Banks based on duration narrative
    if (duration === '1w') {
        // Low savings
    } else if (duration === '1m') {
        // Rent accumulated
        piggyBalances['rent'] = Math.min(piggyBalances['rent'], 5000);
    } else if (duration === '1y') {
        // Healthy savings
        piggyBalances['emergency'] = 8500;
        piggyBalances['vacations'] = 12000; // Partial for bike
        piggyBalances['investments'] = 5000;
    }

    return {
        transactions: transactions.reverse(), // Newest first
        balance: Math.max(balance, 150), // Ensure positive balance
        piggyBanks: {
            balances: piggyBalances,
            jarTargets,
            readyInvestments: []
        }
    };
};
