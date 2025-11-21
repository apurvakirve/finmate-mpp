/**
 * Design Tokens - FinMate App
 * Modern design system with Emerald → Lime gradient theme
 */

export const Colors = {
    // Primary Gradient (Emerald → Lime)
    primary: {
        start: '#10B981', // Emerald
        end: '#84CC16',   // Lime
        solid: '#10B981', // For non-gradient uses
    },

    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Neutral Grays
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },

    // Background
    background: {
        light: '#F9FAFB',
        dark: '#111827',
    },

    // Card
    card: {
        light: '#FFFFFF',
        dark: '#1F2937',
    },

    // Text
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        inverse: '#FFFFFF',
    },

    // Border
    border: {
        light: '#E5E7EB',
        medium: '#D1D5DB',
        dark: '#9CA3AF',
    },
};

export const Typography = {
    display: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700' as const,
    },
    heading: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '600' as const,
    },
    title: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400' as const,
    },
    caption: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500' as const,
    },
    small: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as const,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 5,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 8,
    },
};

export const Gradients = {
    primary: ['#10B981', '#84CC16'], // Emerald to Lime
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    error: ['#EF4444', '#DC2626'],
    dark: ['#1F2937', '#111827'],
};
