import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar, SnackbarContent, Box, Button, LinearProgress, Typography } from '@mui/material';

type UpdateStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';

interface UpdateState {
    status: UpdateStatus;
    version?: string;
    progress?: number;
    error?: string;
}

const UpdateNotification: React.FC = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<UpdateState>({ status: 'idle' });
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const api = window.electronAPI?.updater;
        if (!api) return;
        const unsubscribe = api.onStateChanged((next: UpdateState) => {
            setState(next);
        });
        api.getState().then((current: UpdateState) => {
            if (current) setState(current);
        });
        return () => {
            try {
                unsubscribe?.();
            } catch {}
        };
    }, []);

    const status = state.status;
    const visible =
        !dismissed && (status === 'available' || status === 'downloading' || status === 'downloaded');

    if (!visible) return null;

    const handleUpdate = () => {
        window.electronAPI.updater.download();
    };

    const handleLater = () => {
        setDismissed(true);
    };

    let content: React.ReactNode = null;
    if (status === 'available') {
        content = (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 320 }}>
                <Typography variant='body2'>
                    {t('updater.confirm', { version: state.version ?? '' })}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button color='inherit' size='small' onClick={handleLater}>
                        {t('updater.later')}
                    </Button>
                    <Button color='primary' variant='contained' size='small' onClick={handleUpdate}>
                        {t('updater.update')}
                    </Button>
                </Box>
            </Box>
        );
    } else if (status === 'downloading') {
        const progress = Math.max(0, Math.min(100, Math.round(state.progress ?? 0)));
        content = (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 320 }}>
                <Typography variant='body2'>
                    {t('updater.downloading', { progress })}
                </Typography>
                <LinearProgress variant='determinate' value={progress} />
            </Box>
        );
    } else if (status === 'downloaded') {
        content = (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 320 }}>
                <Typography variant='body2'>{t('updater.installing')}</Typography>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Snackbar
            open
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            autoHideDuration={null}
        >
            <SnackbarContent message={content} sx={{ minWidth: 360 }} />
        </Snackbar>
    );
};

export default UpdateNotification;
