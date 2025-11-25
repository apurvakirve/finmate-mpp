// Google AI Studio inspired dark theme
export const AIStudioTheme = {
    colors: {
        // Backgrounds
        background: '#0B0B0F',
        surface: '#1A1A1E',
        surfaceVariant: '#2A2A2E',

        // Borders
        border: '#2A2A2E',
        borderLight: '#3A3A3E',

        // Primary (Google Blue)
        primary: '#8AB4F8',
        primaryDark: '#669DF6',
        primaryLight: '#AECBFA',

        // Accent colors
        accent: '#C58AF9',
        success: '#81C995',
        warning: '#FDD663',
        error: '#F28B82',
        info: '#3B82F6',

        // Text
        text: '#E8EAED',
        textSecondary: '#9AA0A6',
        textMuted: '#5F6368',
        textInverse: '#1F2937',

        // Special
        overlay: 'rgba(0, 0, 0, 0.6)',
        glow: 'rgba(138, 180, 248, 0.15)',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    typography: {
        h1: {
            fontSize: 32,
            fontWeight: '700' as const,
            lineHeight: 40,
        },
        h2: {
            fontSize: 24,
            fontWeight: '600' as const,
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600' as const,
            lineHeight: 28,
        },
        body: {
            fontSize: 14,
            fontWeight: '400' as const,
            lineHeight: 20,
        },
        bodyLarge: {
            fontSize: 16,
            fontWeight: '400' as const,
            lineHeight: 24,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
            lineHeight: 16,
        },
    },

    shadows: {
        sm: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
    },
};

export type AIStudioTheme = typeof AIStudioTheme;
