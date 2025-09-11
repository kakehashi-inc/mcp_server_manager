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
    Divider,
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import useStore from '../store/useStore';
import { AppSettings } from '../../shared/types';

const SettingsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const settings = useStore(s => s.config?.settings);
    const wslDistributions = useStore(s => s.wslDistributions);
    const updateSettings = useStore(s => s.updateSettings);
    const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [wslLogDirs, setWslLogDirs] = useState<Record<string, string>>({});

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
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    {t('settings.appearance')}
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={localSettings.darkMode}
                            onChange={e => setLocalSettings({ ...localSettings, darkMode: e.target.checked })}
                        />
                    }
                    label={t('settings.darkMode')}
                />
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
