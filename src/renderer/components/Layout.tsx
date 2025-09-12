import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import {
    Memory as ProcessIcon,
    Settings as SettingsIcon,
    Lan as NgrokIcon,
    Minimize as MinimizeIcon,
    CropSquare as MaximizeIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

const appBarHeight = 64;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

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
                position='fixed'
                sx={{
                    width: '100%',
                    ml: 0,
                    WebkitAppRegion: 'drag',
                }}
            >
                <Toolbar>
                    <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }}>
                        {t('app.title')}
                    </Typography>
                    <Box sx={{ WebkitAppRegion: 'no-drag', mr: 2, display: 'flex', gap: 1 }}>
                        {[
                            { path: '/processes', Icon: ProcessIcon, key: 'proc' },
                            { path: '/ngrok', Icon: NgrokIcon, key: 'ngrok' },
                            { path: '/settings', Icon: SettingsIcon, key: 'settings' },
                        ].map(({ path, Icon, key }) => {
                            const active = location.pathname.startsWith(path);
                            return (
                                <Box
                                    key={key}
                                    sx={{
                                        position: 'relative',
                                        borderRadius: 1,
                                        bgcolor: theme => (active ? theme.palette.action.selected : 'transparent'),
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 8,
                                            right: 8,
                                            bottom: -6,
                                            height: 3,
                                            borderRadius: 2,
                                            bgcolor: theme => (active ? theme.palette.primary.main : 'transparent'),
                                        },
                                    }}
                                >
                                    <IconButton
                                        size='small'
                                        color={active ? 'inherit' : 'default'}
                                        onClick={() => navigate(path)}
                                    >
                                        <Icon />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </Box>
                    {
                        <Box sx={{ WebkitAppRegion: 'no-drag' }}>
                            <IconButton size='small' edge='end' color='inherit' onClick={handleMinimize}>
                                <MinimizeIcon />
                            </IconButton>
                            <IconButton size='small' edge='end' color='inherit' onClick={handleMaximize} sx={{ mx: 1 }}>
                                <MaximizeIcon />
                            </IconButton>
                            <IconButton size='small' edge='end' color='inherit' onClick={handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    }
                </Toolbar>
            </AppBar>
            <Box
                component='main'
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    p: 3,
                    width: '100%',
                    height: `calc(100vh - ${appBarHeight}px)`,
                    overflow: 'auto',
                    mt: `${appBarHeight}px`,
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
