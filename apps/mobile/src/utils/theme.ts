import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6C63FF',
    accent: '#FF6B9D',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#212529',
    placeholder: '#6C757D',
    disabled: '#DEE2E6',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    onSurface: '#495057',
    notification: '#FF6B9D',
    
    // Custom colors
    secondary: '#4ECDC4',
    success: '#51CF66',
    warning: '#FFD43B',
    error: '#FF6B6B',
    info: '#74C0FC',
    
    // Gradients
    primaryGradient: ['#6C63FF', '#9C88FF'],
    accentGradient: ['#FF6B9D', '#FF8E9B'],
    
    // Conversation UI
    myMessage: '#6C63FF',
    theirMessage: '#E9ECEF',
    unreadDot: '#FF6B9D',
    
    // Match cards
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Blur levels
    blurred: 'rgba(255, 255, 255, 0.8)',
    semiBlurred: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Custom spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Typography
  fonts: {
    ...DefaultTheme.fonts,
    title: {
      fontFamily: 'System',
      fontSize: 24,
      fontWeight: 'bold' as const,
    },
    heading: {
      fontFamily: 'System',
      fontSize: 20,
      fontWeight: '600' as const,
    },
    body: {
      fontFamily: 'System',
      fontSize: 16,
      fontWeight: 'normal' as const,
    },
    caption: {
      fontFamily: 'System',
      fontSize: 14,
      fontWeight: 'normal' as const,
    },
    small: {
      fontFamily: 'System',
      fontSize: 12,
      fontWeight: 'normal' as const,
    },
  },
  
  // Radius
  roundness: 12,
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6.27,
      elevation: 10,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10.32,
      elevation: 16,
    },
  },
};