import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Stack,
    TextField,
    Alert,
} from '@mui/material';

interface TunnelInfo {
    port: number;
    url?: string;
    name: string;
}

const NgrokPage: React.FC = () => {
    const { t } = useTranslation();
    const [tunnels, setTunnels] = useState<TunnelInfo[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [lines, setLines] = useState<number>(200);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<boolean>(false);

    const refresh = async () => {
        try {
            const status = await window.electronAPI.ngrokAPI.status();
            setTunnels(Array.isArray(status) ? status : []);
        } catch (e: any) {
            setError(e?.message || String(e));
            setTunnels([]);
        }
        try {
            const latest = await window.electronAPI.ngrokAPI.readLogs(lines);
            setLogs(Array.isArray(latest) ? latest : []);
        } catch (e: any) {
            setError(e?.message || String(e));
            setLogs([]);
        }
    };

    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, 2000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines]);

    const handleStart = async () => {
        setBusy(true);
        setError(null);
        try {
            await window.electronAPI.ngrokAPI.start();
            await refresh();
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setBusy(false);
        }
    };

    const handleStop = async () => {
        setBusy(true);
        setError(null);
        try {
            await window.electronAPI.ngrokAPI.stop();
            await refresh();
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box>
            <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
                <Typography variant='h4'>{t('ngrok.title')}</Typography>
                <Stack direction='row' spacing={1}>
                    <Button variant='contained' onClick={handleStart} disabled={busy || tunnels.length > 0}>
                        {t('ngrok.start')}
                    </Button>
                    <Button variant='outlined' onClick={handleStop} disabled={busy || tunnels.length === 0}>
                        {t('ngrok.stop')}
                    </Button>
                </Stack>
            </Stack>

            {error && (
                <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                    <Typography variant='h6'>{t('ngrok.status')}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                        {tunnels.length > 0 ? 'Running' : 'Stopped'}
                    </Typography>
                </Stack>
                <TableContainer>
                    <Table size='small'>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('ngrok.ports')}</TableCell>
                                <TableCell>{t('ngrok.url')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tunnels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2}>{t('ngrok.noTunnels')}</TableCell>
                                </TableRow>
                            ) : (
                                tunnels.map(t => {
                                    const urlText = typeof t.url === 'string' ? t.url : '';
                                    return (
                                        <TableRow key={t.port}>
                                            <TableCell>{t.port}</TableCell>
                                            <TableCell>
                                                {urlText ? (
                                                    <a href={urlText} target='_blank' rel='noreferrer'>
                                                        {urlText}
                                                    </a>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                    <Typography variant='h6'>{t('ngrok.logs')}</Typography>
                    <TextField
                        size='small'
                        type='number'
                        label={t('logs.lines')}
                        value={lines}
                        onChange={e => setLines(Math.max(10, parseInt(e.target.value) || 200))}
                        sx={{ width: 160 }}
                    />
                </Stack>
                <Box
                    sx={{
                        bgcolor: theme => theme.palette.grey[900],
                        color: theme => theme.palette.common.white,
                        fontFamily: 'monospace',
                        p: 1,
                        borderRadius: 1,
                        height: 280,
                        overflow: 'auto',
                        whiteSpace: 'pre',
                    }}
                >
                    {logs.join('\n')}
                </Box>
            </Paper>
        </Box>
    );
};

export default NgrokPage;
