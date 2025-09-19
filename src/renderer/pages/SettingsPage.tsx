import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    FormControlLabel,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    Alert,
    Snackbar,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import useStore from '../store/useStore';
import { AppSettings } from '../../shared/types';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const settings = useStore(s => s.config?.settings);
    const updateSettings = useStore(s => s.updateSettings);
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (settings) {
            setLocalSettings({ ...settings });
        }
    }, [settings]);

    const handleSave = async () => {
        if (!localSettings) return;

        const updatedSettings = { ...localSettings };

        await window.electronAPI.settingsAPI.update(updatedSettings);
        updateSettings(updatedSettings);

        // Apply language change immediately
        if (updatedSettings.language !== i18n.language) {
            i18n.changeLanguage(updatedSettings.language);
        }

        setSaveSuccess(true);
    };

    if (!localSettings) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant='h4' component='h1' sx={{ mb: 3 }}>
                {t('settings.title')}
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.general')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>{t('settings.language')}</InputLabel>
                        <Select
                            value={localSettings.language}
                            onChange={e =>
                                setLocalSettings({ ...localSettings, language: e.target.value as 'ja' | 'en' })
                            }
                            label={t('settings.language')}
                        >
                            <MenuItem value='ja'>日本語</MenuItem>
                            <MenuItem value='en'>English</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={localSettings.showWindowOnStartup !== false}
                                onChange={e =>
                                    setLocalSettings({
                                        ...localSettings,
                                        showWindowOnStartup: e.target.checked,
                                    })
                                }
                            />
                        }
                        label={t('settings.showWindowOnStartup')}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={localSettings.darkMode}
                                onChange={e => setLocalSettings({ ...localSettings, darkMode: e.target.checked })}
                            />
                        }
                        label={t('settings.darkMode')}
                    />
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.logs')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label={t('settings.logDirectory')}
                        value={localSettings.logDirectory}
                        onChange={e => setLocalSettings({ ...localSettings, logDirectory: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.logRetentionDays')}
                        type='number'
                        value={localSettings.logRetentionDays}
                        onChange={e =>
                            setLocalSettings({
                                ...localSettings,
                                logRetentionDays: parseInt(e.target.value) || 7,
                            })
                        }
                        InputProps={{
                            inputProps: { min: 1, max: 365 },
                            endAdornment: t('settings.days'),
                        }}
                    />
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.advanced')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label={t('settings.restartDelayMs')}
                        type='number'
                        value={localSettings.restartDelayMs}
                        onChange={e =>
                            setLocalSettings({
                                ...localSettings,
                                restartDelayMs: Math.max(0, parseInt(e.target.value) || 0),
                            })
                        }
                        InputProps={{ inputProps: { min: 0, step: 100 } }}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.successfulStartThresholdMs')}
                        type='number'
                        value={localSettings.successfulStartThresholdMs}
                        onChange={e =>
                            setLocalSettings({
                                ...localSettings,
                                successfulStartThresholdMs: Math.max(0, parseInt(e.target.value) || 0),
                            })
                        }
                        InputProps={{ inputProps: { min: 0, step: 1000 } }}
                        fullWidth
                    />
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.ngrok')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label={t('settings.ngrokAuthToken')}
                        value={localSettings.ngrokAuthToken || ''}
                        onChange={e => setLocalSettings({ ...localSettings, ngrokAuthToken: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.ngrokMetadataName')}
                        value={localSettings.ngrokMetadataName || ''}
                        onChange={e => setLocalSettings({ ...localSettings, ngrokMetadataName: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.ngrokPorts')}
                        value={localSettings.ngrokPorts || ''}
                        onChange={e => setLocalSettings({ ...localSettings, ngrokPorts: e.target.value })}
                        fullWidth
                        helperText={t('settings.ngrokPorts')}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!localSettings.ngrokAutoStart}
                                onChange={e => setLocalSettings({ ...localSettings, ngrokAutoStart: e.target.checked })}
                            />
                        }
                        label={t('settings.ngrokAutoStart')}
                    />
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.authProxy')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label={t('settings.oidcProviderName')}
                        value={localSettings.oidcProviderName || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcProviderName: e.target.value })}
                        fullWidth
                        helperText='Default: Auth0'
                    />

                    <TextField
                        label={t('settings.oidcConfigurationUrl')}
                        value={localSettings.oidcConfigurationUrl || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcConfigurationUrl: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.oidcClientId')}
                        value={localSettings.oidcClientId || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcClientId: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.oidcClientSecret')}
                        type='password'
                        value={localSettings.oidcClientSecret || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcClientSecret: e.target.value })}
                        fullWidth
                    />

                    <TextField
                        label={t('settings.oidcAllowedUsers')}
                        value={localSettings.oidcAllowedUsers || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcAllowedUsers: e.target.value })}
                        fullWidth
                        helperText={t('settings.oidcAllowedUsersSample')}
                    />

                    <TextField
                        label={t('settings.oidcAllowedUsersGlob')}
                        value={localSettings.oidcAllowedUsersGlob || ''}
                        onChange={e => setLocalSettings({ ...localSettings, oidcAllowedUsersGlob: e.target.value })}
                        fullWidth
                        helperText={t('settings.oidcAllowedUsersGlobSample')}
                    />

                    <Alert severity='info'>{t('settings.oidcRequirementNote')}</Alert>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant='contained' startIcon={<SaveIcon />} onClick={handleSave}>
                    {t('settings.save')}
                </Button>
            </Box>

            <Snackbar
                open={saveSuccess}
                autoHideDuration={3000}
                onClose={() => setSaveSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSaveSuccess(false)} severity='success'>
                    {t('settings.saved')}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SettingsPage;
