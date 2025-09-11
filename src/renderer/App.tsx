import React, { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useTranslation } from 'react-i18next';
import useStore from './store/useStore';
import Layout from './components/Layout';
import ProcessesPage from './pages/ProcessesPage';
import SettingsPage from './pages/SettingsPage';
import LogsPage from './pages/LogsPage';

function App() {
  const { i18n } = useTranslation();
  const settings = useStore((s) => s.config?.settings);
  const initialize = useStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (settings) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings, i18n]);

  const theme = createTheme({
    palette: {
      mode: settings?.darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {(import.meta as any).env && (import.meta as any).env.DEV ? (
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/processes" replace />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/logs/:processId?" element={<LogsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      ) : (
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/processes" replace />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/logs/:processId?" element={<LogsPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      )}
    </ThemeProvider>
  );
}

export default App;
