import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  TextField,
  Typography,
  InputAdornment,
  Tooltip
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '90vh',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#f0f0f0',
  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
  borderRadius: '12px',
  overflow: 'auto'
};

export default function ChangePasswordModal({ open, handleClose }) {
  const { auth, setAuth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [retypePassword, setRetypePassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    username: '',
    password: '',
    newPassword: ''
  });

  const handleGetUserData = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/user/getUser/${auth?.uid}`)
      .then(res => {
        const data = res?.data;

        setValues({
          username: data.username,
          newPassword: ''
        });
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUpdate = () => {
    setLoading(true);
    setError('');

    const userData = { ...values, changePass: 0 };
    if (auth?.officeId) {
      userData.officeId = auth.officeId;
    }

    if (auth?.unitId) {
      userData.unitId = auth.unitId;
    }

    axiosPrivate
      .put(`/user/changePassword/${auth?.uid}`, userData)
      .then(res => {
        const { data } = res;

        localStorage.setItem('authInfo', JSON.stringify(data?.data));

        setAuth(data?.data);

        setValues({
          password: '',
          newPassword: ''
        });
        setRetypePassword('');
        enqueueSnackbar('Password Changed Successfully', {
          variant: 'success'
        });
        handleClose();
      })
      .catch(err => {
        setError(err?.response?.data?.error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open) {
      handleGetUserData();
    }
  }, [open]);

  const validatePassword = password => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[-!@#$%^&*.])[A-Za-z\d-!@#$%^&*.]{8,}$/;

    return regex.test(password);
  };

  const handleLogout = () => {
    // accountService.logout().then(() => {
    //   setAuth(null);
    // });

    setAuth(null);

    localStorage.clear();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      BackdropProps={{
        onClick: event => event.stopPropagation()
      }}
    >
      <Box sx={style}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            pt: 4,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Poppins',
              fontSize: '30px',
              fontWeight: 'bold',
              color: '#1f1f1f'
            }}
          >
            Change Password
          </Typography>

          {auth?.changePass === 0 && (
            <IconButton onClick={handleClose}>
              <CancelIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ padding: '24px' }}>
          {error && (
            <Box sx={{ backgroundColor: 'red', width: '100%', mb: 2, p: 1 }}>
              <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
            </Box>
          )}

          <Typography sx={{ color: '#333', fontSize: '14px', mb: 1 }}>Email</Typography>
          <TextField
            id="username"
            placeholder="Email"
            variant="outlined"
            size="small"
            fullWidth
            disabled={loading}
            value={values?.username}
            onChange={evt => setValues({ ...values, username: evt.target.value })}
            sx={{
              mb: 2
            }}
          />

          <Typography sx={{ color: '#333', fontSize: '14px', mb: 1 }}>Current Password</Typography>
          <TextField
            id="password"
            placeholder="Enter current password"
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            size="small"
            fullWidth
            disabled={loading}
            value={values?.password}
            onChange={evt => setValues({ ...values, password: evt.target.value })}
            sx={{
              mb: 2
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showPassword ? 'Hide Password' : 'Show Password'}>
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ color: '#333', fontSize: '14px', mb: 1 }}>New Password</Typography>
          <TextField
            id="new-password"
            placeholder="New Password"
            type={showNewPassword ? 'text' : 'password'}
            variant="outlined"
            size="small"
            fullWidth
            disabled={loading}
            value={values?.newPassword}
            onChange={evt => setValues({ ...values, newPassword: evt.target.value })}
            error={values.newPassword && !validatePassword(values.newPassword)}
            helperText={
              values.newPassword && !validatePassword(values.newPassword)
                ? 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character.'
                : ''
            }
            sx={{
              mb: 2
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showNewPassword ? 'Hide Password' : 'Show Password'}>
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />

          <Typography sx={{ color: '#333', fontSize: '14px', mb: 1 }}>
            Retype New Password
          </Typography>
          <TextField
            id="retype-password"
            placeholder="Retype New Password"
            type={showRetypePassword ? 'text' : 'password'}
            variant="outlined"
            size="small"
            fullWidth
            disabled={loading}
            value={retypePassword}
            onChange={evt => setRetypePassword(evt.target.value)}
            error={retypePassword && retypePassword !== values.newPassword}
            helperText={
              retypePassword && retypePassword !== values.newPassword && 'Passwords do not match.'
            }
            sx={{
              mb: 4
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showRetypePassword ? 'Hide Password' : 'Show Password'}>
                    <IconButton onClick={() => setShowRetypePassword(!showRetypePassword)}>
                      {showRetypePassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Button
              disabled={
                retypePassword !== values.newPassword ||
                !retypePassword ||
                !values.newPassword ||
                !validatePassword(values.newPassword)
              }
              onClick={handleUpdate}
              variant="contained"
              sx={{
                borderRadius: '8px',
                backgroundColor: '#09504a',
                color: '#fff',
                padding: '10px 20px',
                fontSize: '16px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: 'black',
                  fontWeight: 'bolder',
                  border: 'solid 1px gray'
                }
              }}
            >
              Submit
            </Button>

            {auth?.changePass === 1 && (
              <Button
                onClick={handleLogout}
                variant="contained"
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#1f1f1f',
                  color: '#fff',
                  padding: '10px 20px',
                  fontSize: '16px',
                  textTransform: 'none',
                  ml: 4,
                  '&:hover': {
                    backgroundColor: 'lightgray',
                    color: 'black',
                    fontWeight: 'bolder',
                    border: 'solid 1px gray'
                  }
                }}
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
