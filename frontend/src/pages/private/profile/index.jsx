import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
  Alert,
  Chip,
  Avatar
} from '@mui/material';

import {
  Upload as UploadIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
  VpnKey as VpnKeyIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

import { useStateContext } from 'contexts/ContextProvider';
import UploadSignatureModal from 'modals/users/UploadSignatureModal';
import ChangePasswordModal from 'modals/miscellaneous/ChangePasswordModal';
import Swal from 'sweetalert2';
import FaceRegistrationModal from 'modals/face-recognition/FaceRegistrationModal';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import confirmationIcon from '../../../assets/images/face_recog_icon.png';

function BiometricSection({ title, onRegister, hasNewData, hasOldData, icon: Icon, registerText }) {
  const hasFace = Boolean(hasNewData || hasOldData);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        backgroundColor: '#fafafa',
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon sx={{ color: '#1f1f1f' }} />
          <Typography sx={{ fontWeight: 600, color: '#1f1f1f' }}>{title}</Typography>
        </div>
        {hasFace && <Chip size="small" label="Registered" color="success" sx={{ ml: 1 }} />}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          onClick={onRegister}
          startIcon={<Icon />}
          sx={{
            backgroundColor: '#1f1f1f',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f'
            },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            flexGrow: 1
          }}
        >
          {registerText}
        </Button>
      </Box>
    </Box>
  );
}

export default function ProfilePage() {
  const { auth, setAuth, BASE_URL } = useStateContext();

  // State management
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [openSignatureModal, setOpenSignatureModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  // Biometric states
  const [openFaceRegister, setOpenFaceRegister] = useState(false);
  const [faceData, setFaceData] = useState();
  const [existingFaceData, setExistingFaceData] = useState(null);

  useEffect(() => {
    if (!auth) return;
    setExistingFaceData(auth.faceData || null);
  }, [auth]);

  // Face registration handler
  const handleRegisterFace = () => {
    Swal.fire({
      title: 'Get ready to smile 😊',
      text: "We'll take a quick snapshot to register your face. Make sure you're in a well-lit area!",
      imageUrl: confirmationIcon, // Replace with your own icon path
      imageWidth: 80,
      imageHeight: 80,
      imageAlt: 'Face Icon',
      showCancelButton: true,
      confirmButtonColor: '#4caf50', // Soft green
      customClass: {
        cancelButton: 'custom-cancel-button'
      },
      confirmButtonText: "Let's do it!",
      cancelButtonText: 'Maybe later'
    }).then(result => {
      if (result.isConfirmed) {
        setOpenFaceRegister(true);
      }
    });
  };

  // Clear messages
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (!auth) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#1f1f1f' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        py: 3,
        px: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #1f1f1f 0%, #6a4c6d 100%)',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '2rem'
              }}
            >
              <PersonIcon sx={{ fontSize: '2rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {auth?.firstName} {auth?.middleIntl ? `${auth.middleIntl}. ` : ''}
                {auth?.lastName}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {auth?.role?.join(', ')}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                {auth?.officeName || auth?.unitName}
              </Typography>
              {auth?.unitName && auth?.officeName && (
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                  {auth.unitName}
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Messages */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={clearMessages}
            action={
              <IconButton size="small" onClick={clearMessages}>
                <CheckCircleIcon />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={clearMessages}
            action={
              <IconButton size="small" onClick={clearMessages}>
                <CheckCircleIcon />
              </IconButton>
            }
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* User Information Display */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#1f1f1f' }} />
                    <Typography variant="h6" sx={{ color: '#1f1f1f', fontWeight: 600 }}>
                      User Information
                    </Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        First Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.firstName || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Last Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.lastName || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Middle Initial
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.middleIntl || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Username
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.username || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Roles
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.role?.join(', ') || 'Not provided'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Office
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.officeName || auth?.unitName || 'Not assigned'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: '#1f1f1f', fontWeight: 600, mb: 1 }}
                      >
                        Unit
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {auth?.unitName || 'Not assigned'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Status */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon sx={{ color: '#1f1f1f' }} />
                    <Typography variant="h6" sx={{ color: '#1f1f1f', fontWeight: 600 }}>
                      Account Status
                    </Typography>
                  </Box>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 2, color: '#1f1f1f', fontWeight: 600 }}
                    >
                      Status
                    </Typography>
                    <Chip
                      label={auth?.changePass ? 'Password Change Required' : 'Active'}
                      color={auth?.changePass ? 'warning' : 'success'}
                      size="small"
                    />
                  </Box>

                  <Divider />

                  <Button
                    variant="outlined"
                    startIcon={<VpnKeyIcon />}
                    onClick={() => setOpenPasswordModal(true)}
                    sx={{
                      borderColor: '#1f1f1f',
                      color: '#1f1f1f',
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: '#a2cb6b',
                        backgroundColor: '#a2cb6b',
                        color: '#1f1f1f'
                      }
                    }}
                    fullWidth
                  >
                    Change Password
                  </Button>
                  {auth?.enableFaceRecog && (
                    <Box>
                      <BiometricSection
                        title="Face Recognition"
                        onRegister={handleRegisterFace}
                        hasOldData={existingFaceData}
                        hasNewData={faceData}
                        icon={SentimentSatisfiedAltIcon}
                        registerText={existingFaceData ? 'Update Face' : 'Register Face'}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Signature Management */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FingerprintIcon sx={{ color: '#1f1f1f' }} />
                    <Typography variant="h6" sx={{ color: '#1f1f1f', fontWeight: 600 }}>
                      Signature Management
                    </Typography>
                  </Box>
                }
                action={
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setOpenSignatureModal(true)}
                    sx={{
                      backgroundColor: '#1f1f1f',
                      '&:hover': {
                        backgroundColor: '#a2cb6b',
                        color: '#1f1f1f'
                      },
                      px: 3,
                      py: 1,
                      fontSize: '1rem',
                      fontWeight: 500
                    }}
                  >
                    Manage Signatures
                  </Button>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, color: '#1f1f1f', fontWeight: 600 }}
                      >
                        Signature
                      </Typography>
                      {auth?.signPath?.[0]?.sign ? (
                        <Box
                          component="img"
                          src={`${BASE_URL}${auth.signPath[0].sign}`}
                          alt="Signature"
                          sx={{
                            width: '100%',
                            maxHeight: '150px',
                            objectFit: 'contain',
                            border: '2px solid #e0e0e0',
                            borderRadius: 2,
                            p: 1,
                            backgroundColor: '#fafafa'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '150px',
                            border: '2px dashed #ddd',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '1rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          No signature uploaded
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, color: '#1f1f1f', fontWeight: 600 }}
                      >
                        Initial
                      </Typography>
                      {auth?.signPath?.[0]?.initial ? (
                        <Box
                          component="img"
                          src={`${BASE_URL}${auth.signPath[0].initial}`}
                          alt="Initial"
                          sx={{
                            width: '100%',
                            maxHeight: '150px',
                            objectFit: 'contain',
                            border: '2px solid #e0e0e0',
                            borderRadius: 2,
                            p: 1,
                            backgroundColor: '#fafafa'
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            height: '150px',
                            border: '2px dashed #ddd',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '1rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          No initial uploaded
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Modals */}
      <UploadSignatureModal
        open={openSignatureModal}
        handleClose={() => setOpenSignatureModal(false)}
        dataFromActions={auth}
        updateTableFunction={() => {}}
      />

      <ChangePasswordModal
        open={openPasswordModal}
        handleClose={() => setOpenPasswordModal(false)}
      />

      <FaceRegistrationModal
        open={openFaceRegister}
        handleClose={() => setOpenFaceRegister(false)}
        data={{ uid: auth?.uid }}
        onSuccess={newFaceData => {
          setFaceData(newFaceData);
          setExistingFaceData(newFaceData);
          setAuth(prev => ({
            ...prev,
            faceData: newFaceData,
            enableFaceRecog: true
          }));
        }}
      />
    </Box>
  );
}
