import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#91f78e', contrastText: '#005e17' },
    secondary: { main: '#006d3a' },
    background: { default: '#0e0e0e', paper: '#1a1a1a' },
    text: { primary: '#ffffff', secondary: '#adaaaa' },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`,
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 700,
        },
        outlinedSecondary: {
          color: '#60a5fa',
          borderColor: '#2563eb',
          '&:hover': {
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
          },
        },
        containedSecondary: {
          backgroundColor: '#2563eb',
          color: '#eff6ff',
          '&:hover': {
            backgroundColor: '#1d4ed8',
          },
        },
      },
    },
  },
});
