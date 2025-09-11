import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Paper,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    ToggleButton,
    ToggleButtonGroup,
    TextField,
    IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon, Clear as ClearIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import useStore from '../store/useStore';

const LogsPage: React.FC = () => {
    const { t } = useTranslation();
    const { processId } = useParams();
    const { servers } = useStore();

    const [selectedProcessId, setSelectedProcessId] = useState<string>(processId || '');
    const [logType, setLogType] = useState<'stdout' | 'stderr'>('stdout');
    const [logLines, setLogLines] = useState<string[]>([]);
    const [lineCount, setLineCount] = useState<number>(100);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

    useEffect(() => {
        if (processId) {
            setSelectedProcessId(processId);
        } else if (servers.length > 0 && !selectedProcessId) {
            setSelectedProcessId(servers[0].id);
        }
    }, [processId, servers, selectedProcessId]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (selectedProcessId) {
            loadLogs();

            if (autoRefresh) {
                interval = setInterval(loadLogs, 2000);
            }
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [selectedProcessId, logType, lineCount, autoRefresh]);

    const loadLogs = async () => {
        if (!selectedProcessId) return;

        try {
            const logs = await window.electronAPI.logAPI.read(selectedProcessId, logType, lineCount);
            setLogLines(logs);
        } catch (error) {
            console.error('Failed to load logs:', error);
            setLogLines([]);
        }
    };

    const handleClearLogs = async () => {
        if (!selectedProcessId) return;

        try {
            await window.electronAPI.logAPI.clear(selectedProcessId);
            setLogLines([]);
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    };

    const handleCopyLogs = () => {
        const logsText = logLines.join('\n');
        navigator.clipboard.writeText(logsText);
    };

    const selectedServer = servers.find(s => s.id === selectedProcessId);

    return (
        <Box>
            <Typography variant='h4' component='h1' sx={{ mb: 3 }}>
                {t('logs.title')}
            </Typography>

            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>{t('process.fields.name')}</InputLabel>
                    <Select
                        value={selectedProcessId}
                        onChange={e => setSelectedProcessId(e.target.value)}
                        label={t('process.fields.name')}
                    >
                        {servers.map(server => (
                            <MenuItem key={server.id} value={server.id}>
                                {server.config.displayName || server.id}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <ToggleButtonGroup
                    value={logType}
                    exclusive
                    onChange={(_, value) => value && setLogType(value)}
                    size='small'
                >
                    <ToggleButton value='stdout'>{t('logs.stdout')}</ToggleButton>
                    <ToggleButton value='stderr'>{t('logs.stderr')}</ToggleButton>
                </ToggleButtonGroup>

                <TextField
                    label={t('logs.lines')}
                    type='number'
                    value={lineCount}
                    onChange={e => setLineCount(parseInt(e.target.value) || 100)}
                    InputProps={{ inputProps: { min: 10, max: 1000 } }}
                    sx={{ width: 120 }}
                    size='small'
                />

                <ToggleButton
                    value='auto'
                    selected={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    size='small'
                >
                    Auto Refresh
                </ToggleButton>

                <Box sx={{ flexGrow: 1 }} />

                <IconButton onClick={loadLogs} title={t('logs.refresh')}>
                    <RefreshIcon />
                </IconButton>

                <IconButton onClick={handleCopyLogs} title='Copy'>
                    <CopyIcon />
                </IconButton>

                <IconButton onClick={handleClearLogs} title={t('logs.clear')} color='error'>
                    <ClearIcon />
                </IconButton>
            </Box>

            <Paper
                sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    minHeight: 400,
                    maxHeight: 600,
                    overflow: 'auto',
                }}
            >
                {selectedServer ? (
                    logLines.length > 0 ? (
                        <Box
                            component='pre'
                            sx={{
                                m: 0,
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                color: logType === 'stderr' ? 'error.main' : 'grey.100',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                            }}
                        >
                            {logLines.join('\n')}
                        </Box>
                    ) : (
                        <Typography variant='body2' sx={{ color: 'grey.500' }}>
                            {t('logs.noLogs')}
                        </Typography>
                    )
                ) : (
                    <Typography variant='body2' sx={{ color: 'grey.500' }}>
                        Select a process to view logs
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default LogsPage;
