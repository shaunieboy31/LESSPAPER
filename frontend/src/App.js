/* eslint-disable no-new */
import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import RequireAuth from 'contexts/RequireAuth';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import socket from 'contexts/socket';
import axios from 'axios';
import AdminLayout from './layouts/MainLayout';
import {
  Missing,
  Unauthorized,
  Dashboard,
  Login,
  DocTypes,
  Units,
  Offices,
  Users,
  Outgoing,
  Incoming,
  Pending,
  Saved,
  Lapsed,
  Onhold,
  Signed,
  Uploaded,
  Routing,
  Signature,
  Release,
  RoutedIn,
  RoutedOut,
  AllDocuments,
  FeedbackCriterias,
  Feedbacks,
  FeedbackForm,
  Divisions,
  Systems,
  Profile
} from './pages';
import OverdueDocuments from 'pages/private/documents/Overdue';
import OngoingDocuments from 'pages/private/documents/Ongoing';
import CompletedDocuments from 'pages/private/documents/Completed';
import RoutedDocuments from 'pages/private/documents/Routed';
import CutOffModal from 'modals/miscellaneous/CutOffModal';

function App() {
  const axiosPrivate = useAxiosPrivate();
  const {
    auth,
    isCutoffLocked,
    sessionExpired,
    setUsersRelatedUnits,
    division,
    setDivision,
    setMaxNumberOfSignatories,
    setEnableLimitNumberOfSignatories,
    BASE_URL
  } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [cutOffEnabled, setCutOffEnabled] = useState(false);
  const [cutOffModalOpen, setCutOffModalOpen] = useState(false);

  const [dontShowCutoff, setDontShowCutoff] = useState(() => {
    const stored = localStorage.getItem('dontShowCutoff');
    if (!stored) return false;

    const { value, expiresAt } = JSON.parse(stored);
    const now = Date.now();

    if (expiresAt && now > expiresAt) {
      localStorage.removeItem('dontShowCutoff');
      return false;
    }
    return value;
  });

  // Watch for expiration in real time
  useEffect(() => {
    if (!dontShowCutoff) return;

    const stored = localStorage.getItem('dontShowCutoff');
    if (!stored) return;

    const { expiresAt } = JSON.parse(stored);
    const delay = expiresAt - Date.now();

    if (delay > 0) {
      const timeout = setTimeout(() => {
        localStorage.removeItem('dontShowCutoff');
        setDontShowCutoff(false); // trigger re-render
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      // Already expired
      localStorage.removeItem('dontShowCutoff');
      setDontShowCutoff(false);
    }
  }, [dontShowCutoff]);

  useEffect(() => {
    const excludedPaths = ['/', '/ci'];
    if (
      !excludedPaths.includes(location.pathname) &&
      cutOffEnabled &&
      isCutoffLocked &&
      !dontShowCutoff
    ) {
      // console.log('excludedPaths:', !excludedPaths.includes(location.pathname));
      // console.log('cutOffEnabled:', cutOffEnabled);
      // console.log('isCutoffLocked:', isCutoffLocked);
      // console.log('dontShowCutoff:', !dontShowCutoff);
      // console.log('Cutoff conditions met, opening modal');
      setCutOffModalOpen(true);
    } else {
      setCutOffModalOpen(false);
    }
  }, [location, cutOffEnabled, isCutoffLocked, dontShowCutoff]);

  // Remind me again later
  const handleDontShowAgain = () => {
    const expiresAt = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
    localStorage.setItem('dontShowCutoff', JSON.stringify({ value: true, expiresAt }));
    setDontShowCutoff(true);
    setCutOffModalOpen(false);
  };

  useEffect(() => {
    if (auth && location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [auth]);

  const mainUsersRole = [
    'admin',
    'sds',
    'asds',
    'secretary',
    'chief',
    'unit head', // Unit/Section Heads
    'unit employee',
    'school personnel'
  ];

  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    // const refreshTokenExists = checkRefreshTokenInCookie();
    // if (!refreshTokenExists) {
    //   console.log(refreshTokenExists);
    // }

    // console.log(refreshTokenExists);
    if (sessionExpired) {
      alert('Session has expired. Please log in again');
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [sessionExpired]);

  const handleGetAllUsers = () => {
    axiosPrivate
      .get(`/user/getAllUsers`)
      .then(e => {
        const usersWithRelatedUnits = e?.data
          ?.filter(user => user.relatedUnits)
          .map(user => user.relatedUnits);

        setUsersRelatedUnits(usersWithRelatedUnits);
      })
      .catch(err => {
        enqueueSnackbar(err?.message, {
          variant: 'error'
        });
      });
  };

  const handleGetSettings = async () => {
    try {
      const response = await axiosPrivate.get('/documents/system-settings');

      const settings = response.data;

      const divisionSetting = settings.find(setting => setting.key === 'division');
      const maxNumberOfSignatoriesSetting = settings.find(
        setting => setting.key === 'maxNumberOfSignatories'
      );
      const enableLimitNumberOfSignatoriesSetting = settings.find(
        setting => setting.key === 'enableLimitNumberOfSignatories'
      );

      const cutoffEnabledSetting = settings.find(setting => setting.key === 'cutoffEnabled');

      setDivision(divisionSetting?.value || 'imus');
      setMaxNumberOfSignatories(parseInt(maxNumberOfSignatoriesSetting?.value, 10) || 4);
      setEnableLimitNumberOfSignatories(
        enableLimitNumberOfSignatoriesSetting?.value === 'true' || false
      );

      setCutOffEnabled(cutoffEnabledSetting?.value === 'true' || false);
    } catch (err) {
      console.log(err);

      enqueueSnackbar(err?.message, {
        variant: 'error'
      });
    }
  };

  useEffect(() => {
    handleGetAllUsers();
    handleGetSettings();
  }, []);

  // Fallback function to play system beep sound
  const playSystemBeep = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play system beep:', error);
      enqueueSnackbar('Could not play system beep');
    }
  };

  useEffect(() => {
    if (auth) {
      socket.on('documentNotif', data => {
        if (data?.recipient === (auth?.officeId === 1 ? auth?.unitName : auth?.officeName)) {
          alert(data?.message);

          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.7; // Set volume to 70%
            audio.play().catch(error => {
              console.log('Could not play notification sound:', error);
              // Fallback: play system beep sound
              playSystemBeep();
            });
          } catch (error) {
            console.log('Could not create audio:', error);
            playSystemBeep();
          }
        }
      });
    } else {
      socket.off('documentNotif');
    }
  }, [socket]);

  useEffect(() => {
    if (auth) {
      // socket.emit("joinRoom", `room-${auth?.unitId}`, () => {
      //   console.log(
      //     `User ${auth?.firstName} ${auth?.lastName} joined room ${auth?.unitName}`
      //   );
      // });
      // join room
      socket.emit('joinRoom', auth?.officeId === 1 ? auth?.unitName : auth?.officeName);
    }
  }, []);

  const handleRefresh = () => {
    axios
      .post(
        `${BASE_URL}/user/refresh`,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      )
      .then(e => {
        const usersWithRelatedUnits = e?.data
          ?.filter(user => user.relatedUnits)
          .map(user => user.relatedUnits);

        setUsersRelatedUnits(usersWithRelatedUnits);
      })
      .catch(() => {
        console.log('LOGOUT');
      });
  };

  useEffect(() => {
    if (auth) {
      const interval = setInterval(async () => {
        handleRefresh();
      }, 60 * 1000); // every 60 seconds

      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    const titles = {
      imus: 'SDO Imus - Less Paper System',
      gentri: 'SDO Gen. Trias - Less Paper System',
      dasma: 'eGov SDO Dasmariñas City',
      binan: 'SDO Biñan - Less Paper System'
    };

    document.title = titles[division] || 'Less Paper System';
  }, [division]);

  // console.log(auth);

  return (
    <Box>
      <Box
        sx={{
          width: { xs: isLandingPage ? '95%' : 'auto', xl: isLandingPage ? '87%' : 'auto' },
          position: 'fixed',
          zIndex: 1001,
          left: isLandingPage ? '50%' : 'auto',
          right: isLandingPage ? 'auto' : 15,
          transform: isLandingPage ? 'translateX(-50%)' : 'none',
          bottom: 0,
          top: 'auto',
          textAlign: isLandingPage ? 'left' : 'right',
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '11px',
            fontWeight: isLandingPage ? 500 : 400,
            color: isLandingPage ? 'rgba(255,255,255,0.6)' : '#2f2f2f'
          }}
        >
          {isLandingPage && '© DepEd Imus Division | 2026. All rights reserved | '}
          {'Version '}
          {process.env.REACT_APP_VERSION}
        </Typography>
      </Box>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/self-service" element={<Navigate to="/" replace />} />
        <Route path="/" element={<Login />} />
        <Route path="/ci" element={<FeedbackForm />} />

        <Route element={<RequireAuth allowedRoles={mainUsersRole} />}>
          <Route path="/" element={<AdminLayout />}>
            <Route path="/profile" element={<Profile />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/outgoing" element={<Outgoing />} />
            <Route path="/incoming" element={<Incoming />} />
            <Route path="/pending" element={<Pending />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/lapsed" element={<Lapsed />} />
            <Route path="/onhold" element={<Onhold />} />
            <Route path="/uploaded" element={<Uploaded />} />

            <Route path="/routing" element={<Routing />} />
            <Route path="/signature" element={<Signature />} />
            <Route path="/signed" element={<Signed />} />
            <Route path="/routedIn" element={<RoutedIn />} />
            <Route path="/routedOut" element={<RoutedOut />} />

            {/* secretary */}
            <Route path="/release" element={<Release />} />

            {/* sds only */}

            <Route element={<RequireAuth allowedRoles={['sds']} />}>
              {/* <Route path="/incoming-to-memo" element={<IncomingTOMemo />} /> */}
              {/* <Route path="/signature-to-memo" element={<SignatureTOMemo />} /> */}
              <Route path="/routed" element={<RoutedDocuments />} />
              <Route path="/completed" element={<CompletedDocuments />} />
              <Route path="/ongoing" element={<OngoingDocuments />} />
              <Route path="/overdue" element={<OverdueDocuments />} />
            </Route>
          </Route>

          <Route element={<RequireAuth allowedRoles={['admin']} />}>
            <Route path="/" element={<AdminLayout />}>
              <Route path="/doc-types" element={<DocTypes />} />
              <Route path="/units" element={<Units />} />
              <Route path="/offices" element={<Offices />} />
              <Route path="/users" element={<Users />} />
              <Route path="/all-documents" element={<AllDocuments />} />
              <Route path="/criterias" element={<FeedbackCriterias />} />
              <Route path="/feedbacks" element={<Feedbacks />} />
              <Route path="/divisions" element={<Divisions />} />
              <Route path="/systems" element={<Systems />} />
            </Route>
          </Route>
        </Route>

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Missing />} />
      </Routes>
      <CutOffModal
        open={cutOffModalOpen}
        onClose={() => setCutOffModalOpen(false)}
        dontShowAgain={handleDontShowAgain}
      />
    </Box>
  );
}

export default App;
