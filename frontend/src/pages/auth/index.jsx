import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';

import { AccountCircle } from '@mui/icons-material';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import LoginValidation, { initialLog } from 'schema/login';
import './login.css';
import { useStateContext } from 'contexts/ContextProvider';

import { MdRateReview } from 'react-icons/md';

import useAxiosPrivate from 'contexts/interceptors/axios';
import LessPaperLogo from 'components/LessPaperLogo';
import socket from 'contexts/socket';
import SelfServicePortal from '../self-service-portal'; // Import SelfServicePortal

import LPSLogo from '../../assets/images/lps_logo.png';
import DepEdImusBg from '../../assets/images/DepEdImus.webp';
import DepEdDasmaBg from '../../assets/images/DepEdDasma.jpg';
import DepEdGenTriBg from '../../assets/images/DepEdGenTri.png';
import DepEdBinanBg from '../../assets/images/DepEdBinan.jpg';
import logo from '../../assets/images/deped_logo.png';

const BG_IMAGES = {
  imus: DepEdImusBg,
  dasma: DepEdDasmaBg,
  gentri: DepEdGenTriBg,
  binan: DepEdBinanBg
};

export default function LoginPage() {
  const { setAuth, division } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  // State to toggle views: 'login' or 'portal'
  const [view, setView] = useState('login');

  const navigate = useNavigate();
  const theme = useTheme();

  const [showPassword, setShowPassword] = useState(false);

  // eslint-disable-next-line no-unused-vars
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const formik = useFormik({
    initialValues: initialLog,
    validationSchema: LoginValidation,
    onSubmit: async () => {
      setLoading(true);
      setError('');
      await axiosPrivate
        .post('/user/login', formik?.values, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        })
        .then(res => {
          const { data } = res;

          if (data?.valid) {
            console.log(`ITO AND DATA: ${JSON.stringify(data?.data.positions)}`);

            setAuth(data?.data);
            navigate('/dashboard');

            localStorage.setItem('authInfo', JSON.stringify(data?.data));

            socket.emit(
              'joinRoom',
              data?.data?.officeId === 1 ? data?.data?.unitName : data?.data?.officeName
            );
          }
        })
        .catch(err => {
          let message = '';
          if (err?.response?.status === 404) {
            message = 'Invalid Credentials';
          } else if (err?.response?.status === 401) {
            message = err?.response?.data?.error;
          } else {
            message = 'Internal Server Error';
          }
          setError(message || err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${BG_IMAGES[division] || DepEdImusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
          background:
            'linear-gradient(to right, rgba(22, 65, 85, 0.95) 0%, rgba(20, 70, 82, 0.85) 20%, rgba(35, 137, 143, 0) 100%)',
          zIndex: 1
        }}
      >
        <Container
          maxWidth="xl" // Keep wider container for dashboard-like portal view
          sx={{
            position: 'relative',
            zIndex: 2,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Header Logo Area (Visible in both views, or maybe just Login View?) 
            SelfServicePortal (SearchPage) has its own header logos in the card, but let's keep the global one.
            Wait, SelfServicePortal (Result View) has its own header.
            SearchPage has logo inside.
            Keep global header for now, maybe hide in portal mode if it clashes.
        */}
          <Box
            sx={{ pt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src={logo} alt="DepEd Logo" style={{ height: 50 }} />
              <Box
                sx={{
                  borderLeft: '2px solid rgba(255,255,255,0.5)',
                  pl: 2,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 500, letterSpacing: 1 }}>
                  Less Paper System
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={() => setView(view === 'login' ? 'portal' : 'login')}
              sx={{
                background: '#09504a',
                boxShadow: '0 3px 5px 2px rgba(77, 182, 172, .3)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 4,
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 0.5, sm: 0.75, md: 1 },
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                textTransform: 'none',
                transition: 'all 0.1s ease',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  background: 'radial-gradient(circle at center, #a2cb6b 30%, #9cc266 90%)',
                  color: 'black'
                }
              }}
            >
              {view === 'login' ? 'Self-Service Portal' : 'Back to Login'}
            </Button>
          </Box>

          <Box sx={{ flex: 1, height: '100%', pt: view === 'portal' ? 4 : 0 }}>
            {/* Conditional Rendering */}
            {view === 'portal' ? (
              <SelfServicePortal onBackToLogin={() => setView('login')} />
            ) : (
              <Grid container sx={{ flex: 1, height: '100%' }}>
                {/* Left Side Content */}
                <Grid
                  item
                  xs={12}
                  md={7}
                  lg={8}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    height: '100%',
                    flexDirection: 'column',
                    pr: 8
                  }}
                >
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: { md: '3.5rem', lg: '4.5rem' },
                        lineHeight: 1.1,
                        mb: 3,
                        textShadow: '0 4px 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      Streamline <br />
                      Your Records, <br />
                      Go Paperless.
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        maxWidth: '600px',
                        lineHeight: 1.6,
                        fontWeight: 300
                      }}
                    >
                      The DepEd Imus – Less Paper System helps you manage documents with precision,
                      reduce paper use, and keep your data protected. Log in to work smarter today.
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Side Login Card */}
                <Grid
                  item
                  xs={12}
                  md={5}
                  lg={4}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Box
                    component="form"
                    onSubmit={formik.handleSubmit}
                    sx={{
                      width: '100%',
                      maxWidth: 450,
                      p: 5,
                      borderRadius: 4,
                      backdropFilter: 'blur(20px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2.5,
                      clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)',
                      '@media (max-width: 600px)': {
                        width: '90vw',
                        minHeight: 'auto',
                        height: 'auto'
                      },
                      '@media (max-width: 480px)': {
                        maxWidth: '85vw'
                      },
                      '@media (max-height: 600px)': {
                        minHeight: 'auto',
                        height: 'auto',
                        padding: 2
                      }
                    }}
                  >
                    <Box
                      sx={{
                        mb: 1,
                        mr: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      {/* PAPER FOLD */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          width: '20%',
                          height: '20%',
                          backgroundColor: '#fff',
                          borderBottom: 'solid 1px black',
                          borderLeft: 'solid 1px #c0c0c0',
                          boxShadow: '8px 8px 25px rgba(70, 79, 199, 0.3)',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 1
                          }
                        }}
                      />
                      {/* Left side: text */}
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 1 }}>
                          Welcome Back
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          Sign in to access your LPS portal
                        </Typography>
                      </Box>

                      {/* Right side: logo */}
                      <Box
                        component="img"
                        src={LPSLogo}
                        draggable="false"
                        sx={{
                          height: { xs: '70px', xl: '90px' },
                          my: { xs: -1, sm: -1.5, md: -2 },
                          '@media (max-width: 600px)': {
                            height: '70px',
                            my: -0.5
                          },
                          '@media (max-width: 480px)': {
                            height: '60px',
                            my: 0
                          },
                          '@media (max-height: 600px)': {
                            height: '100px'
                          },
                          '@media (max-height: 500px)': {
                            height: '80px'
                          }
                        }}
                      />
                    </Box>
                    <LessPaperLogo />

                    {error && (
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: '#ffebee',
                          color: '#cb2431',
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          border: '1px solid #ffcdd2'
                        }}
                      >
                        {error}
                      </Box>
                    )}

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600, color: '#444' }}
                      >
                        Email Address
                      </Typography>
                      <TextField
                        fullWidth
                        id="username"
                        placeholder="Enter your Email Address"
                        variant="outlined"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBLur}
                        error={formik.touched.username && Boolean(formik.errors.username)}
                        helperText={formik.touched.username && formik.errors.username}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccountCircle sx={{ color: '#666' }} />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            bgcolor: '#fff',
                            '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' }
                          }
                        }}
                      />
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, fontWeight: 600, color: '#444' }}
                      >
                        Password
                      </Typography>
                      <TextField
                        fullWidth
                        id="password"
                        placeholder="Enter your password"
                        type={showPassword ? 'text' : 'password'}
                        variant="outlined"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBLur}
                        error={formik.touched.password && Boolean(formik.errors.password)}
                        helperText={formik.touched.password && formik.errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon sx={{ color: '#666' }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 2,
                            bgcolor: '#fff',
                            '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' }
                          }
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mt: 1,
                          alignItems: 'center'
                        }}
                      >
                        {/* Placeholder for "Remember me" if needed later */}
                        <Box />
                      </Box>
                    </Box>

                    <Button
                      type="submit"
                      fullWidth
                      disabled={loading}
                      variant="contained"
                      sx={{
                        py: 1.5,
                        mt: 1,
                        background: '#09504a',
                        boxShadow: '0 3px 5px 2px rgba(77, 182, 172, .3)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(27, 94, 84, 0.4)',
                        '&:hover': {
                          background: 'radial-gradient(circle at center, #a2cb6b 30%, #9cc266 90%)',
                          color: 'black'
                        }
                      }}
                    >
                      Login
                    </Button>

                    <Divider sx={{ my: 1, color: '#666', fontSize: '0.8rem' }}>Or</Divider>

                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setView('portal')}
                      sx={{
                        py: 1.5,
                        borderColor: '#1b5e54',
                        color: '#1b5e54',
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none',
                        borderWidth: 1.5,
                        '&:hover': {
                          borderWidth: 1.5,
                          borderColor: '#14463e',
                          bgcolor: 'rgba(27, 94, 84, 0.05)'
                        }
                      }}
                    >
                      SELF-SERVICE PORTAL
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </Box>

          {/* Floating Action Button (if division is imus) for CI */}
          {division === 'imus' && view === 'login' && (
            <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
              <IconButton
                onClick={() => navigate('/ci')}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: '#1f1f1f',
                  boxShadow: 2,
                  '&:hover': { backgroundColor: '#fff' }
                }}
              >
                <MdRateReview size={20} />
              </IconButton>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}
