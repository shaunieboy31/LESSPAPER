/* eslint-disable no-nested-ternary */
import React from 'react';
import { Box, Button, Grid, IconButton, Modal, TextField, Typography } from '@mui/material';

import CancelIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import SelectDocStatus from 'components/Textfields/SelectDocStatus';
import SelectDocType from 'components/Textfields/SelectDocType';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import SelectAllDestinations from 'components/Textfields/SelectAllDestinations';

dayjs.extend(utc);
dayjs.extend(timezone);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  height: '80vh',
  width: '70vw',
  bgcolor: '#f0f0f0',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  overflowY: 'auto',
  p: 4,
  '@media (max-width: 680px)': {
    width: '95vw'
  }
};

export default function FilterModal({
  open,
  handleClose,
  filters,
  loading,
  docType,
  setDocType,
  handleInputChange,
  handleFilterDocLogs
}) {
  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
      }}
    >
      <Box sx={style}>
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              zIndex: 100,
              py: 2
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Poppins',
                fontWeight: '500',
                fontSize: '25px'
              }}
            >
              Filter Documents
            </Typography>
            <IconButton onClick={handleClose}>
              <CancelIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              p: 2
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  id="id"
                  name="id"
                  label="Doc ID"
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  value={filters.id}
                  onChange={handleInputChange}
                  sx={{
                    width: '100%',
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                      {
                        display: 'none'
                      },
                    '& input[type=number]': {
                      MozAppearance: 'textfield'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="lpsNo"
                  name="lpsNo"
                  label="LPS No"
                  variant="outlined"
                  size="small"
                  disabled={loading}
                  value={filters.lpsNo}
                  onChange={handleInputChange}
                  sx={{
                    width: '100%',
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                      {
                        display: 'none'
                      },
                    '& input[type=number]': {
                      MozAppearance: 'textfield'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={filters.docType === 'Others' ? 6 : 12}>
                <SelectDocType
                  label="Document Type"
                  name="docType"
                  disabled={loading}
                  value={filters.docType}
                  onChange={(fieldName, selectedValue) => {
                    const value = {
                      target: { name: fieldName, value: selectedValue }
                    };

                    handleInputChange(value);

                    if (selectedValue !== 'Others') {
                      setDocType('');
                    }
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>

              {filters.docType === 'Others' ? (
                <Grid item xs={6}>
                  <TextField
                    name="otherDocTypes"
                    label="Specify Document Type"
                    size="small"
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    variant="standard"
                    fullWidth
                    sx={{
                      mt: -0.5
                    }}
                  />
                </Grid>
              ) : (
                <Box />
              )}
              <Grid item xs={12}>
                <SelectDocStatus
                  label="Document Status"
                  name="status"
                  disabled={loading}
                  value={filters.status}
                  onChange={(fieldName, selectedValue) => {
                    const value = {
                      target: { name: fieldName, value: selectedValue }
                    };

                    handleInputChange(value);
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="title"
                  name="title"
                  label="Document Title"
                  variant="outlined"
                  size="small"
                  value={filters.title}
                  onChange={handleInputChange}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Primary Source"
                  name="primSource"
                  disabled={loading}
                  value={filters.primSource}
                  onChange={(fieldName, selectedValue) => {
                    const value = {
                      target: {
                        name: fieldName,
                        value: selectedValue
                      }
                    };

                    handleInputChange(value);
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Last Source"
                  name="lastSource"
                  disabled={loading}
                  value={filters.lastSource}
                  onChange={(fieldName, selectedValue) => {
                    const value = {
                      target: {
                        name: fieldName,
                        value: selectedValue
                      }
                    };

                    handleInputChange(value);
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <SelectAllDestinations
                  label="Destination"
                  name="destination"
                  disabled={loading}
                  value={filters.destination}
                  onChange={(fieldName, selectedValue) => {
                    const value = {
                      target: {
                        name: fieldName,
                        value: selectedValue
                      }
                    };

                    handleInputChange(value);
                  }}
                  sx={{
                    width: '100%'
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'end', mt: 2 }}>
          <Button
            onClick={() => handleFilterDocLogs()} // The button will now submit the form
            sx={{
              backgroundColor: loading ? 'lightgray' : '#534f7c',
              color: '#fff',
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
            <SearchIcon sx={{ mr: 1 }} />
            Filter
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
