import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#91f78e', contrastText: '#005e17' },
    secondary: { main: '#006d3a' },
    background: { default: '#0e0e0e', paper: '#131313' },
    text: { primary: '#ffffff', secondary: '#adaaaa' }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: `'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif`,
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.02em' },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { fontWeight: 700, textTransform: 'none' }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: 'none'
        }
      }
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
