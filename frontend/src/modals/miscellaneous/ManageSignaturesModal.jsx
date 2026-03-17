import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  IconButton,
  Modal,
  TextField,
  Typography,
  Grid,
  Divider,
  Chip,
  Button
} from '@mui/material';
import Skeleton from '@mui/material/Skeleton';

import CloseIcon from '@mui/icons-material/Close';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import { useStateContext } from 'contexts/ContextProvider';
import Swal from 'sweetalert2';

export default function ManageSignaturesModal({ open, handleClose }) {
  const { BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [signatures, setSignatures] = useState([]);
  const [selectedSign, setSelectedSign] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const skeletonKeysRef = useRef(
    Array.from({ length: 6 }, () => `sk-${Math.random().toString(36).slice(2)}`)
  );

  const handleGetSignatures = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosPrivate.get(`${BASE_URL}/eSignatures`);
      const list = Array.isArray(response?.data) ? response.data : [];
      setSignatures(list);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to load signatures';
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  function handleRemoveSignature(imgFilePath) {
    Swal.fire({
      title: 'Remove Signature',
      text: 'Are you sure you want to remove this signature?',
      icon: 'warning',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
      confirmButtonColor: '#4caf50', // Soft green
      customClass: {
        cancelButton: 'custom-cancel-button'
      }
    }).then(result => {
      if (result.isConfirmed) {
        axiosPrivate
          .delete(`${BASE_URL}/eSignatures/delete`, {
            params: { imgFilePath }
          })
          .then(() => {
            if (selectedSign === imgFilePath) setSelectedSign(undefined);
            handleGetSignatures();
            enqueueSnackbar('Signature removed successfully', {
              variant: 'success'
            });
          })
          .catch(err => {
            const message =
              err?.response?.data?.message || err?.message || 'Failed to remove signature';
            enqueueSnackbar(message, { variant: 'error' });
          });
      }
    });
  }

  useEffect(() => {
    if (open) {
      handleGetSignatures();
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={() => {
        setSelectedSign(undefined);
        setError('');
        handleClose();
        // formik.resetForm();
        // setError("");
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'absolute',
          backgroundColor: '#ffffff',
          // background:
          //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
          //   border: "solid 2px #46e3be",
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          borderRadius: '10px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          overflow: 'auto',
          p: 2,
          '@media (min-width: 10px)': {
            height: '90vh',
            width: '85vw'
          },

          '@media (min-width: 480px)': {
            height: '85vh',
            width: '80vw'
          },

          '@media (min-width: 640px)': {
            height: '75vh',
            width: '70vw'
          },

          '@media (min-width: 768px)': {
            height: '75vh',
            width: '70vw'
          },

          '@media (min-width: 1024px)': {
            height: '80vh',
            width: '70vw'
          },

          '@media (min-width: 1082px)': {
            height: '80vh',
            width: '65vw'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>{`Signatures' Management`}</Typography>
            <Typography variant="body2" color="text.secondary">
              Select, preview and manage your saved e-signatures
            </Typography>
          </Box>
          <IconButton onClick={() => handleClose()} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Typography sx={{ mr: 2 }}>Selected:</Typography>
          <TextField
            value={selectedSign || ''}
            size="small"
            inputProps={{ readOnly: true }}
            placeholder="None"
            sx={{ flex: 1, minWidth: '200px' }}
          />
          {selectedSign && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleRemoveSignature(selectedSign)}
              sx={{ minWidth: 'auto' }}
            >
              Delete Selected
            </Button>
          )}
        </Box>
        <Box
          sx={{
            overflow: 'auto',
            flex: 1,
            mt: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            backgroundColor: '#fafafa'
          }}
        >
          <Grid container spacing={2} justifyContent="flex-start">
            {loading &&
              skeletonKeysRef.current.map(key => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={key}>
                  <Box sx={{ borderRadius: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Skeleton variant="rounded" width="100%" height={180} />
                    </Box>
                    <Skeleton variant="text" width="60%" sx={{ mt: 1 }} />
                  </Box>
                </Grid>
              ))}
            {!loading && error && (
              <Grid item xs={12}>
                <Typography color="error" sx={{ width: '100%', textAlign: 'center' }}>
                  {error}
                </Typography>
              </Grid>
            )}
            {!loading && !error && signatures.length === 0 && (
              <Grid item xs={12}>
                <Typography sx={{ width: '100%', textAlign: 'center' }}>
                  No signatures found.
                </Typography>
              </Grid>
            )}
            {!loading &&
              !error &&
              signatures.length > 0 &&
              signatures.map((imgData, index) => {
                const isSelected = selectedSign === imgData;
                const fileName = (imgData || '').split('/').pop();
                return (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={imgData}>
                    <Box
                      onClick={() => setSelectedSign(imgData)}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        boxShadow: isSelected
                          ? '0 0 0 3px rgba(25, 118, 210, 0.15)'
                          : '0 2px 6px rgba(0,0,0,0.08)',
                        transition: 'transform .2s ease, box-shadow .2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                        }
                      }}
                      aria-selected={isSelected}
                    >
                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            zIndex: 2
                          }}
                        >
                          <Chip size="small" color="primary" label="Selected" />
                        </Box>
                      )}

                      <Box
                        sx={{
                          width: '100%',
                          height: 180,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fff'
                        }}
                      >
                        <img
                          src={`${BASE_URL}${imgData}`}
                          alt={`sign${index + 1}`}
                          draggable="false"
                          style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          width: '100%',
                          px: 1,
                          py: 1,
                          textAlign: 'center',
                          color: 'text.secondary',
                          backgroundColor: '#fff',
                          borderTop: '1px solid',
                          borderColor: 'divider'
                        }}
                        title={fileName}
                      >
                        {fileName}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      </Box>
    </Modal>
  );
}
