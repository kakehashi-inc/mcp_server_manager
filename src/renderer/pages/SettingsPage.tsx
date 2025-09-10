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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as FolderIcon
} from '@mui/icons-material';
import useStore from '../store/useStore';
import { AppSettings } from '@shared/types';

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, wslDistributions, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [wslLogDirs, setWslLogDirs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
      setWslLogDirs({ ...settings.wslLogDirectories });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;

    const updatedSettings = {
      ...localSettings,
      wslLogDirectories: wslLogDirs
    };

    await window.electronAPI.settingsAPI.update(updatedSettings);
    updateSettings(updatedSettings);
    
    // Apply language change immediately
    if (updatedSettings.language !== i18n.language) {
      i18n.changeLanguage(updatedSettings.language);
    }
    
    setSaveSuccess(true);
  };

  const handleBrowseLogDirectory = async () => {
    // Note: Electron dialog API needs to be implemented in main process
    // For now, just allow manual text input
    console.log('Browse directory not implemented yet');
  };

  const handleWslLogDirChange = (distribution: string, value: string) => {
    setWslLogDirs({
      ...wslLogDirs,
      [distribution]: value
    });
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
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {t('settings.title')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('settings.general')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('settings.language')}</InputLabel>
            <Select
              value={localSettings.language}
              onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value as 'ja' | 'en' })}
              label={t('settings.language')}
            >
              <MenuItem value="ja">日本語</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('settings.appearance')}
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={localSettings.darkMode}
              onChange={(e) => setLocalSettings({ ...localSettings, darkMode: e.target.checked })}
            />
          }
          label={t('settings.darkMode')}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {t('settings.logs')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label={t('settings.logDirectory')}
              value={localSettings.logDirectory}
              onChange={(e) => setLocalSettings({ ...localSettings, logDirectory: e.target.value })}
              fullWidth
            />
            <IconButton onClick={handleBrowseLogDirectory}>
              <FolderIcon />
            </IconButton>
          </Box>

          <TextField
            label={t('settings.logRetentionDays')}
            type="number"
            value={localSettings.logRetentionDays}
            onChange={(e) => setLocalSettings({ 
              ...localSettings, 
              logRetentionDays: parseInt(e.target.value) || 7 
            })}
            InputProps={{ 
              inputProps: { min: 1, max: 365 },
              endAdornment: t('settings.days')
            }}
          />

          {wslDistributions.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1">
                {t('settings.wslLogDirectories')}
              </Typography>
              <List>
                {wslDistributions.map((dist) => (
                  <ListItem key={dist.name} sx={{ px: 0 }}>
                    <ListItemText
                      primary={dist.name}
                      secondary={dist.isDefault ? 'Default' : ''}
                    />
                    <ListItemSecondaryAction sx={{ width: '50%' }}>
                      <TextField
                        value={wslLogDirs[dist.name] || '~/.mcpm/logs'}
                        onChange={(e) => handleWslLogDirChange(dist.name, e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          {t('settings.save')}
        </Button>
      </Box>

      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSaveSuccess(false)} severity="success">
          {t('settings.saved')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
