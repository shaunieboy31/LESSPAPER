import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TextField
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import LPSModal from '../../layouts/ModalLayout';

export default function SystemSettingsModal({ open, handleClose }) {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axiosPrivate.get('/documents/system-settings');
      const settingsMap = {};

      response.data.forEach(setting => {
        // Parse boolean values
        if (setting.value === 'true' || setting.value === 'false') {
          settingsMap[setting.key] = setting.value === 'true';
        } else {
          settingsMap[setting.key] = setting.value;
        }
      });

      setSettings(settingsMap);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load settings on modal open
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Update each setting
      const updatePromises = Object.entries(settings).map(([key, value]) =>
        axiosPrivate.put(`/documents/system-settings/${key}`, {
          value: value.toString(),
          updatedBy: auth?.username || 'admin'
        })
      );

      await Promise.all(updatePromises);

      enqueueSnackbar('Settings saved successfully!', { variant: 'success' });
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save settings');
      enqueueSnackbar('Failed to save settings', { variant: 'error' });
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
  };

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="System Settings"
      headerColor="#09504a"
      loading={loading}
      error={error}
      width="600px"
      buttons={[
        <Button
          variant="contained"
          onClick={handleReset}
          color="error"
          disabled={saving}
          sx={{
            px: 3,
            '&:hover': {
              backgroundColor: '#ff5500',
              color: '#1f1f1f'
            }
          }}
        >
          Reset
        </Button>,
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={
            (settings.enableLimitNumberOfSignatories && !settings.maxNumberOfSignatories) || saving
          }
          sx={{
            px: 3,
            fontWeight: 600,
            backgroundColor: saving ? 'grey.400' : '#09504a',
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f'
            }
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      ]}
    >
      <Box sx={{ p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && !auth?.role ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* ================= DOCUMENT SETTINGS ================= */}
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa'
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={3}>
                Document Settings
              </Typography>

              <Box display="flex" flexDirection="column" gap={3}>
                {/* Enable Transmission Cutoff */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cutoffEnabled || false}
                      onChange={e => {
                        handleSettingChange('cutoffEnabled', e.target.checked);
                      }}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#258476',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#258476'
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={600}>Enable Transmission Cutoff Lockdown</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Restrict all transactions outside business hours (Weekdays 6 AM – 5 PM
                        only).
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />

                {/* Restrict Documents Without SDS Name */}
                {auth?.role.includes('admin') && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.restrictDocsWithoutSDS || false}
                        onChange={e =>
                          handleSettingChange('restrictDocsWithoutSDS', e.target.checked)
                        }
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#258476',
                            '& + .MuiSwitch-track': {
                              backgroundColor: '#258476'
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography fontWeight={600}>
                          Restrict Documents Without SDS Name
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Prevent users from uploading documents without the Superintendent’s name.
                        </Typography>
                      </Box>
                    }
                    sx={{
                      alignItems: 'flex-start',
                      '& .MuiFormControlLabel-label': { mt: 0.5 }
                    }}
                  />
                )}
              </Box>
            </Paper>

            {/* ================= SIGNATORY SETTINGS ================= */}
            {auth?.role.includes('admin') && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={3}>
                  Signatory Limit
                </Typography>

                <Box display="flex" flexDirection="column" gap={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableLimitNumberOfSignatories || false}
                        onChange={e => {
                          handleSettingChange('enableLimitNumberOfSignatories', e.target.checked);
                          if (!e.target.checked) {
                            handleSettingChange('maxNumberOfSignatories', '');
                          }
                        }}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#258476',
                            '& + .MuiSwitch-track': {
                              backgroundColor: '#258476'
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography fontWeight={600}>Enable Signatory Limit</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Restrict the number of signatories per document.
                        </Typography>
                      </Box>
                    }
                    sx={{
                      alignItems: 'flex-start',
                      '& .MuiFormControlLabel-label': { mt: 0.5, mb: 1 }
                    }}
                  />

                  <TextField
                    label="Maximum Number of Signatories"
                    value={settings.maxNumberOfSignatories || ''}
                    disabled={!settings.enableLimitNumberOfSignatories}
                    onChange={e => handleSettingChange('maxNumberOfSignatories', e.target.value)}
                    type="number"
                    size="small"
                    fullWidth
                  />
                </Box>
              </Paper>
            )}

            {/* ================= DIVISION SETTINGS ================= */}
            {auth?.role.includes('admin') && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa'
                }}
              >
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Division Configuration
                </Typography>

                <Typography variant="body2" color="text.secondary" mb={3}>
                  Select the division for document processing.
                </Typography>

                <FormControl fullWidth size="small">
                  <InputLabel id="division-select-label">Division</InputLabel>
                  <Select
                    labelId="division-select-label"
                    value={settings.division || ''}
                    label="Division"
                    size="small"
                    onChange={e => handleSettingChange('division', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#258476'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#258476'
                        }
                      },
                      '& .MuiSelect-select': {
                        backgroundColor: 'rgba(89, 57, 92, 0.02)'
                      }
                    }}
                  >
                    <MenuItem value="imus">SDO - Imus City</MenuItem>
                    <MenuItem value="gentri">SDO - General Trias City</MenuItem>
                    <MenuItem value="binan">SDO - Biñan City</MenuItem>
                    <MenuItem value="dasma">SDO - Dasmariñas City</MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </LPSModal>
  );
}
