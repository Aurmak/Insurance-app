import React, { ReactNode } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@/app/styles/custom.css';
import MobileMetaTags from '@/app/components/MobileMetaTags';
import LoginScreen from '@/app/components/LoginScreen';
import DashboardScreen from '@/app/components/DashboardScreen';
import InspectionTypeScreen from '@/app/components/InspectionTypeScreen';
import VehicleCaptureScreen from '@/app/components/VehicleCaptureScreen';
import VehicleConfirmationScreen from '@/app/components/VehicleConfirmationScreen';
import VehicleAddPhotoScreen from '@/app/components/VehicleAddPhotoScreen';
import AIProcessingScreen from '@/app/components/AIProcessingScreen';
import AIReviewScreen from '@/app/components/AIReviewScreen';
import InspectionReportScreen from '@/app/components/InspectionReportScreen';
import SubmissionConfirmationScreen from '@/app/components/SubmissionConfirmationScreen';
import ReportsHistoryScreen from '@/app/components/ReportsHistoryScreen';
import ReportDetailScreen from '@/app/components/ReportDetailScreen';
import ProfileScreen from '@/app/components/ProfileScreen';
import PersonaGatewayScreen from '@/app/components/PersonaGatewayScreen';

// Create custom theme with colorful, fun, and accessible design
const theme = createTheme({
  palette: {
    mode: 'light',
    // PQGTL Primary palette (Burgundy)
    primary: {
      main: '#8B0037',
      light: '#B44569',
      dark: '#650028',
      contrastText: '#FFFFFF',
    },
    // PQGTL Secondary palette (Gold)
    secondary: {
      main: '#BC9633',
      light: '#D4B46B',
      dark: '#8F7121',
      contrastText: '#1A1A1A',
    },
    // Warm tertiary palette (Amber/Gold accent)
    tertiary: {
      main: '#BF952F',
      light: '#D7B865',
      dark: '#8D6D1D',
      contrastText: '#1A1A1A',
    },
    // Error palette (Bright Red)
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
      contrastText: '#FFFFFF',
    },
    // Warning palette (Bright Orange)
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
      contrastText: '#000000',
    },
    info: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#FFFFFF',
    },
    // Background colors (light and clean)
    background: {
      default: '#FBF8F7',
      paper: '#FFFFFF',
    },
    // Surface colors
    surface: {
      main: '#FFFFFF',
      dim: '#F7F0F3',
      bright: '#FFFFFF',
      container: '#F7EAF0',
      containerLow: '#FCF8F9',
      containerLowest: '#FFFFFF',
      containerHigh: '#EFDDE5',
      containerHighest: '#E4CBD6',
    },
    // Colorful containers
    primaryContainer: {
      main: '#F7EAF0',
      onContainer: '#5A0024',
    },
    secondaryContainer: {
      main: '#F8F2E3',
      onContainer: '#5F4A16',
    },
    tertiaryContainer: {
      main: '#FFF3D6',
      onContainer: '#92400E',
    },
    // Outline colors
    outline: {
      main: '#78909C',
      variant: '#B0BEC5',
    },
    // High contrast text for accessibility
    text: {
      primary: '#1A1A1A',        // Almost black for high contrast
      secondary: '#424242',      // Dark grey
      disabled: 'rgba(26, 26, 26, 0.38)',
    },
    divider: '#E0E0E0',
    // Action states with vibrant colors
    action: {
      active: 'rgba(139, 0, 55, 0.54)',
      hover: 'rgba(139, 0, 55, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(139, 0, 55, 0.16)',
      selectedOpacity: 0.16,
      disabled: 'rgba(26, 26, 26, 0.38)',
      disabledBackground: 'rgba(26, 26, 26, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(139, 0, 55, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.16,
    },
  },
  typography: {
    fontFamily: '"Avenir Next", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 16,  // Increased from 14px for better accessibility
    fontWeightLight: 300,
    fontWeightRegular: 450,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    // Display styles - large and bold
    displayLarge: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '3.75rem', // 60px
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: '-0.5px',
    },
    displayMedium: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '3rem', // 48px
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '2.5rem', // 40px
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0,
    },
    // Headline styles - prominent
    headlineLarge: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '2.25rem', // 36px
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '2rem', // 32px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.75rem', // 28px
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    // Title styles - clear and readable
    titleLarge: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.125rem', // 18px (increased from 16px)
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.15px',
    },
    titleSmall: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px (increased from 14px)
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.1px',
    },
    // Label styles - accessible sizing
    labelLarge: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px (increased from 14px)
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.1px',
    },
    labelMedium: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem', // 14px (increased from 12px)
      fontWeight: 600,
      lineHeight: 1.43,
      letterSpacing: '0.5px',
    },
    labelSmall: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.8125rem', // 13px (increased from 11px)
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: '0.5px',
    },
    // Body styles - 16px minimum for accessibility
    bodyLarge: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.125rem', // 18px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.5px',
    },
    bodyMedium: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px (increased from 14px)
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.25px',
    },
    bodySmall: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem', // 14px (increased from 12px)
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.4px',
    },
    // Legacy mappings for compatibility - all increased
    h1: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: 0,
    },
    h3: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    h5: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: 0,
    },
    h6: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: 0,
    },
    subtitle1: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1.125rem', // 18px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.15px',
    },
    subtitle2: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.1px',
    },
    body1: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
    },
    body2: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.25px',
    },
    button: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '1rem', // 16px (increased from 14px)
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem', // 14px (increased from 12px)
      fontWeight: 500,
      lineHeight: 1.43,
      letterSpacing: '0.4px',
    },
    overline: {
      fontFamily: '"Roboto", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      lineHeight: 2.2,
      letterSpacing: '0.8px',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 3px 6px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.08)',
    '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 6px 12px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.12)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.18), 0px 4px 8px rgba(0, 0, 0, 0.14)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,  // Increased to 48px for better touch targets (WCAG AAA)
          fontSize: '1rem', // 16px
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '12px 32px',
          letterSpacing: '0.5px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 2px 4px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&.Mui-focusVisible': {
            outline: '3px solid #F59E0B',
            outlineOffset: 2,
          },
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: 2,  // Thicker border for visibility
          borderColor: '#8B0037',
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(139, 0, 55, 0.08)',
            borderColor: '#650028',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(139, 0, 55, 0.08)',
          },
        },
        sizeLarge: {
          minHeight: 56,
          padding: '16px 40px',
          fontSize: '1.125rem',
        },
        sizeSmall: {
          minHeight: 40,
          padding: '8px 24px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 12,
          minWidth: 48,  // Minimum touch target
          minHeight: 48,
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(139, 0, 55, 0.08)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        sizeLarge: {
          padding: 16,
          minWidth: 56,
          minHeight: 56,
        },
        sizeSmall: {
          padding: 8,
          minWidth: 40,
          minHeight: 40,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '1rem',  // 16px
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#78909C',
              borderWidth: 2,
            },
            '&:hover fieldset': {
              borderColor: '#8B0037',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
              borderColor: '#8B0037',
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '1rem',  // 16px for accessibility
            padding: '16px 16px',
            minHeight: 24,  // Ensures proper touch target
          },
          '& .MuiInputLabel-root': {
            fontSize: '1rem',
              color: '#424242',
              fontWeight: 500,
              letterSpacing: '0.5px',
              '&.Mui-focused': {
              color: '#8B0037',
              fontWeight: 600,
            },
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-body2': {
            fontWeight: 500,
          },
          '&.MuiTypography-caption': {
            fontWeight: 500,
          },
          '&.MuiTypography-overline': {
            fontWeight: 600,
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 2,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5EAF5',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 10px 18px rgba(139, 0, 55, 0.16), 0px 3px 8px rgba(188, 150, 51, 0.14)',
            transform: 'translateY(-3px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',  // 14px
          height: 36,
          borderRadius: 10,
          fontWeight: 600,
          letterSpacing: '0.5px',
          border: '2px solid transparent',
        },
        filled: {
          backgroundColor: '#F7EAF0',
          color: '#5A0024',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#EFDDE5',
          },
        },
        colorPrimary: {
          backgroundColor: '#8B0037',
          color: '#FFFFFF',
        },
        colorSecondary: {
          backgroundColor: '#BC9633',
          color: '#1A1A1A',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
        },
        rounded: {
          borderRadius: 10,
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.12), 0px 2px 4px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '1rem',  // 16px
          padding: '12px 16px',
          fontWeight: 500,
        },
        standardError: {
          backgroundColor: '#FFEBEE',
          color: '#C62828',
          border: '2px solid #EF5350',
        },
        standardWarning: {
          backgroundColor: '#FFF3E0',
          color: '#E65100',
          border: '2px solid #FFB74D',
        },
        standardInfo: {
          backgroundColor: '#F7EAF0',
          color: '#5A0024',
          border: '2px solid #D8AFC0',
        },
        standardSuccess: {
          backgroundColor: '#E8F5E9',
          color: '#2E7D32',
          border: '2px solid #81C784',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 58,
          height: 38,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 4,
            transitionDuration: '300ms',
              '&.Mui-checked': {
                transform: 'translateX(20px)',
                color: '#fff',
                '& + .MuiSwitch-track': {
                backgroundColor: '#8B0037',
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 30,
            height: 30,
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiSwitch-track': {
            borderRadius: 10,
            backgroundColor: '#B0BEC5',
            opacity: 1,
            border: '2px solid #78909C',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
        },
        colorPrimary: {
          backgroundColor: '#8B0037',
          color: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 48,  // Accessible touch target
          padding: '12px 16px',
          '&:hover': {
            backgroundColor: 'rgba(139, 0, 55, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: '#F7EAF0',
            color: '#5A0024',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#EFDDE5',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E0E0E0',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          minWidth: 56,
          minHeight: 56,
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.14), 0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.12)',
            transform: 'scale(1.05)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        sizeLarge: {
          minWidth: 64,
          minHeight: 64,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '1rem',  // 16px
          fontWeight: 600,
        },
        secondary: {
          fontSize: '0.875rem',  // 14px
          fontWeight: 500,
          lineHeight: 1.43,
        },
      },
    },
  },
});

// Inner component with routes - completely isolated from Figma props
function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

function normalizeRole(rawRole: string) {
  if (rawRole === 'claims-agent') return 'field-agent';
  if (rawRole === 'supervisor' || rawRole === 'claim-handler') return 'policyholder';
  return rawRole;
}

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isLoggedIn()) {
    return <Navigate to="/persona-select" replace />;
  }
  return <>{children}</>;
}

function MobileRoleRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function AppRoutes() {
  const storedRole = sessionStorage.getItem('userRole') || '';
  const normalizedRole = normalizeRole(storedRole);
  if (storedRole && storedRole !== normalizedRole) {
    sessionStorage.setItem('userRole', normalizedRole);
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/persona-select" replace />} />
        <Route path="/persona-select" element={<PersonaGatewayScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <DashboardScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/inspection-type"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <InspectionTypeScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route path="/claims/new" element={<Navigate to="/inspection-type" replace />} />
        <Route
          path="/vehicle-capture"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <VehicleCaptureScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/vehicle-confirmation"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <VehicleConfirmationScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/vehicle-add-photo"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <VehicleAddPhotoScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/ai-processing/:targetId"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <AIProcessingScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route path="/inspection-overview" element={<Navigate to="/add-observation" replace />} />
        <Route
          path="/ai-review/:observationId"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <AIReviewScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/inspection-report"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <InspectionReportScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route path="/claims/summary" element={<Navigate to="/inspection-report" replace />} />
        <Route
          path="/submission-confirmation"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <SubmissionConfirmationScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/reports-history"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <ReportsHistoryScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route path="/claims" element={<Navigate to="/reports-history" replace />} />
        <Route
          path="/report/:reportId"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <ReportDetailScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/claims/:reportId"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <ReportDetailScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
        <Route
          path="/profile"
          element={(
            <RequireAuth>
              <MobileRoleRoute>
                <ProfileScreen />
              </MobileRoleRoute>
            </RequireAuth>
          )}
        />
      </Routes>
    </Router>
  );
}

// Isolated wrapper that prevents any props from reaching ThemeProvider
function CleanThemeProvider() {
  // Use React.createElement to have complete control over props
  return React.createElement(
    ThemeProvider,
    { theme: theme },
    React.createElement(CssBaseline, null),
    React.createElement(MobileMetaTags, null),
    React.createElement(AppRoutes, null)
  );
}

CleanThemeProvider.displayName = 'CleanThemeProvider';

// Export default - receives Figma props but doesn't pass them down
export default function App() {
  // Don't accept or use any props at all
  // Simply return CleanThemeProvider
  return React.createElement(CleanThemeProvider, null);
}
