export const calculatorTheme = {
    sip: {
        light: ['#667eea', '#764ba2'],
        dark: ['#1a237e', '#283593'],
        icon: 'chart-line',
        color: '#667eea',
    },
    compareSip: {
        light: ['#f093fb', '#f5576c'],
        dark: ['#4a148c', '#6a1b9a'],
        icon: 'chart-bar',
        color: '#f093fb',
    },
    swp: {
        light: ['#4facfe', '#00f2fe'],
        dark: ['#01579b', '#0277bd'],
        icon: 'arrow-down-circle',
        color: '#4facfe',
    },
    stp: {
        light: ['#43e97b', '#38f9d7'],
        dark: ['#1b5e20', '#2e7d32'],
        icon: 'swap-horizontal',
        color: '#43e97b',
    },
    retirement: {
        light: ['#fa709a', '#fee140'],
        dark: ['#b71c1c', '#c62828'],
        icon: 'account-clock',
        color: '#fa709a',
    },
    fd: {
        light: ['#30cfd0', '#330867'],
        dark: ['#1a237e', '#311b92'],
        icon: 'bank',
        color: '#30cfd0',
    },
    rd: {
        light: ['#a8edea', '#fed6e3'],
        dark: ['#004d40', '#00695c'],
        icon: 'calendar-plus',
        color: '#a8edea',
    },
    ppf: {
        light: ['#ff9a56', '#ff6a88'],
        dark: ['#bf360c', '#d84315'],
        icon: 'shield-check',
        color: '#ff9a56',
    },
    interest: {
        light: ['#ffecd2', '#fcb69f'],
        dark: ['#4e342e', '#5d4037'],
        icon: 'percent',
        color: '#fcb69f',
    },
    currency: {
        light: ['#a1c4fd', '#c2e9fb'],
        dark: ['#0d47a1', '#1565c0'],
        icon: 'currency-usd',
        color: '#a1c4fd',
    },
    stock: {
        light: ['#d299c2', '#fef9d7'],
        dark: ['#4a148c', '#6a1b9a'],
        icon: 'chart-line-variant',
        color: '#d299c2',
    },
};

export const calculators = [
    {
        id: 'sip',
        title: 'SIP Calculator',
        description: 'Systematic Investment Plan',
        route: '/calculators/sip',
    },
    {
        id: 'compareSip',
        title: 'Compare SIP',
        description: 'Compare two SIP scenarios',
        route: '/calculators/compare-sip',
    },
    {
        id: 'swp',
        title: 'SWP Calculator',
        description: 'Systematic Withdrawal Plan',
        route: '/calculators/swp',
    },
    {
        id: 'stp',
        title: 'STP Calculator',
        description: 'Systematic Transfer Plan',
        route: '/calculators/stp',
    },
    {
        id: 'retirement',
        title: 'Retirement Planner',
        description: 'Plan your retirement corpus',
        route: '/calculators/retirement',
    },
    {
        id: 'fd',
        title: 'FD Calculator',
        description: 'Fixed Deposit returns',
        route: '/calculators/fd',
    },
    {
        id: 'rd',
        title: 'RD Calculator',
        description: 'Recurring Deposit returns',
        route: '/calculators/rd',
    },
    {
        id: 'ppf',
        title: 'PPF Calculator',
        description: 'Public Provident Fund',
        route: '/calculators/ppf',
    },
    {
        id: 'interest',
        title: 'Interest Calculator',
        description: 'Simple & Compound Interest',
        route: '/calculators/interest',
    },
    {
        id: 'currency',
        title: 'Currency Exchange',
        description: 'Convert currencies',
        route: '/calculators/currency',
    },
    {
        id: 'stock',
        title: 'Stock Return',
        description: 'Calculate stock profits',
        route: '/calculators/stock',
    },
];
