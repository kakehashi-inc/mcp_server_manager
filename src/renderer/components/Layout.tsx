import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Memory as ProcessIcon,
  Settings as SettingsIcon,
  Description as LogsIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    {
      text: t('nav.processes'),
      icon: <ProcessIcon />,
      path: '/processes'
    },
    {
      text: t('nav.logs'),
      icon: <LogsIcon />,
      path: '/logs'
    },
    {
      text: t('nav.settings'),
      icon: <SettingsIcon />,
      path: '/settings'
    }
  ];

  const handleMinimize = () => {
    window.electronAPI.windowAPI.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI.windowAPI.maximize();
  };

  const handleClose = () => {
    window.electronAPI.windowAPI.close();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          WebkitAppRegion: 'drag'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('app.title')}
          </Typography>
          {process.platform !== 'darwin' && (
            <Box sx={{ WebkitAppRegion: 'no-drag' }}>
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                onClick={handleMinimize}
              >
                <MinimizeIcon />
              </IconButton>
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                onClick={handleMaximize}
                sx={{ mx: 1 }}
              >
                <MaximizeIcon />
              </IconButton>
              <IconButton
                size="small"
                edge="end"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.12)' 
              : '1px solid rgba(0, 0, 0, 0.12)'
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          height: '100vh',
          overflow: 'auto'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
