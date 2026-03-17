import React from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  TextField,
  Typography,
  Modal,
  Paper,
  Divider
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import SelectAllDestinations from 'components/Textfields/SelectAllDestinations';
import SelectDocStatus from 'components/Textfields/SelectDocStatus';
import SelectDocType from 'components/Textfields/SelectDocType';

export default function FilterModal({
  filters,
  loading,
  docType,
  setDocType,
  setOpenFilter,
  handleInputChange,
  handleFilterDocLogs
}) {
  const handleSubmit = e => {
    e.preventDefault();
    handleFilterDocLogs();
  };

  return (
    <Modal
      open
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          setOpenFilter(false);
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 800,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 3,
              pb: 2
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Filter Documents
            </Typography>
            <IconButton onClick={() => setOpenFilter(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          {/* Form Content */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 3,
              overflowY: 'auto',
              flex: 1
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="docuId"
                  label="Doc ID"
                  fullWidth
                  size="small"
                  disabled={loading}
                  value={filters.docuId}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="lpsNo"
                  label="LPS No"
                  fullWidth
                  size="small"
                  disabled={loading}
                  value={filters.lpsNo}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} md={filters.docType === 'Others' ? 6 : 12}>
                <SelectDocType
                  label="Document Type"
                  name="docType"
                  disabled={loading}
                  value={filters.docType}
                  onChange={(fieldName, selectedValue) => {
                    handleInputChange({
                      target: { name: fieldName, value: selectedValue }
                    });

                    if (selectedValue !== 'Others') {
                      setDocType('');
                    }
                  }}
                  sx={{ width: '100%' }}
                />
              </Grid>

              {filters.docType === 'Others' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Specify Document Type"
                    size="small"
                    fullWidth
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <SelectDocStatus
                  label="Document Status"
                  name="status"
                  disabled={loading}
                  value={filters.status}
                  onChange={(fieldName, selectedValue) =>
                    handleInputChange({
                      target: { name: fieldName, value: selectedValue }
                    })
                  }
                  sx={{ width: '100%' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  name="title"
                  label="Document Title"
                  fullWidth
                  size="small"
                  value={filters.title}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Primary Source"
                  name="primarySources"
                  disabled={loading}
                  value={filters.primarySources}
                  onChange={(fieldName, selectedValue) =>
                    handleInputChange({
                      target: { name: fieldName, value: selectedValue }
                    })
                  }
                  sx={{ width: '100%' }}
                />
              </Grid>

              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Last Source"
                  name="lastSource"
                  disabled={loading}
                  value={filters.lastSource}
                  onChange={(fieldName, selectedValue) =>
                    handleInputChange({
                      target: { name: fieldName, value: selectedValue }
                    })
                  }
                  sx={{ width: '100%' }}
                />
              </Grid>

              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Destination"
                  name="destinations"
                  disabled={loading}
                  value={filters.destinations}
                  onChange={(fieldName, selectedValue) =>
                    handleInputChange({
                      target: { name: fieldName, value: selectedValue }
                    })
                  }
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>

            {/* Footer */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                mt: 4
              }}
            >
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={loading}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: loading ? 'lightgray' : '#09504a',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  '&:hover': {
                    backgroundColor: '#a2cb6b',
                    color: '#1f1f1f',
                    fontWeight: 'bold'
                  }
                }}
              >
                {loading ? 'Filtering...' : 'Filter'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
}
