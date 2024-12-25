import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',      // 更柔和的蓝色
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#9c27b0',      // 紫色作为次要色
        light: '#ba68c8',
        dark: '#7b1fa2',
      },
      background: {
        default: '#f5f5f5',   // 更柔和的背景色
        paper: '#ffffff',
      },
      text: {
        primary: '#2c3e50',   // 更柔和的文字颜色
        secondary: '#546e7a',
      },
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Arial',
        'sans-serif'
      ].join(','),
      h1: {
        fontSize: '2.5rem',
        fontWeight: 600,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
          elevation1: {
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0 2px 4px rgba(0,0,0,0.05)',
      '0px 2px 4px rgba(0,0,0,0.1)',
      '0px 3px 6px rgba(0,0,0,0.1)',
      '0px 4px 8px rgba(0,0,0,0.1)',
      '0px 5px 10px rgba(0,0,0,0.1)',
      '0px 6px 12px rgba(0,0,0,0.1)',
      '0px 7px 14px rgba(0,0,0,0.1)',
      '0px 8px 16px rgba(0,0,0,0.1)',
      '0px 9px 18px rgba(0,0,0,0.1)',
      '0px 10px 20px rgba(0,0,0,0.1)',
      '0px 11px 22px rgba(0,0,0,0.1)',
      '0px 12px 24px rgba(0,0,0,0.1)',
      '0px 13px 26px rgba(0,0,0,0.1)',
      '0px 14px 28px rgba(0,0,0,0.1)',
      '0px 15px 30px rgba(0,0,0,0.1)',
      '0px 16px 32px rgba(0,0,0,0.1)',
      '0px 17px 34px rgba(0,0,0,0.1)',
      '0px 18px 36px rgba(0,0,0,0.1)',
      '0px 19px 38px rgba(0,0,0,0.1)',
      '0px 20px 40px rgba(0,0,0,0.1)',
      '0px 21px 42px rgba(0,0,0,0.1)',
      '0px 22px 44px rgba(0,0,0,0.1)',
      '0px 23px 46px rgba(0,0,0,0.1)',
      '0px 24px 48px rgba(0,0,0,0.1)'
    ],
  });

export default theme;