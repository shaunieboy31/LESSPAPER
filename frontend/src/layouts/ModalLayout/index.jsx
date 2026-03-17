/* eslint-disable no-alert */
import { Box, IconButton, Modal, Typography } from '@mui/material';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import LoadingOverlay from 'components/LoadingOverlay';
import ModalHeaderBackground from 'components/CustomUI/ModalHeader';
import CloseButton from 'components/CustomUI/CloseButton';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LPSModal({
  open,
  handleClose,
  title,
  width = '1000px',
  children,
  loading,
  error,
  mainBackgroundColor = 'linear-gradient(180deg, #5d5453, #645d56)',
  headerColor = 'transparent',
  contentBgColor = '#fff',
  withSpacing,
  buttons
}) {
  return (
    <Modal open={open} onClose={handleClose} disableAutoFocus>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width,
          maxWidth: '95vw',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column', // ✅ FIXED (important)
          background: mainBackgroundColor,
          borderRadius: 3,
          boxShadow: '3px 2px 20px 3px rgba(0,0,0,0.3)',
          pb: 1,
          px: 1.3
        }}
      >
        {/* ================= HEADER ================= */}
        <Box
          sx={{
            mt: -1.5,
            position: 'relative',
            height: 70
          }}
        >
          <Box
            sx={{
              display: 'flex',
              position: 'absolute',
              background: { mainBackgroundColor },
              width: '100%',
              height: '55%',
              zIndex: -1,
              left: '50%',
              borderRadius: 2,
              backdropFilter: 'brightness(1.3) blur(4px)',
              transform: 'translate(-50%, 50%)',
              boxShadow: 'inset 0 -4px 10px rgba(0,0,0, 0.3), 0 4px 20px rgba(0,0,0, 0.2)' // inner shadow
            }}
          />

          <ModalHeaderBackground fill={headerColor} />

          <Typography
            sx={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'Poppins',
              fontSize: { xs: 16, sm: 24, md: 27 },
              color: '#fff',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              textAlign: 'center',
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
            }}
          >
            {title}
          </Typography>

          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 0,
              height: 42,
              top: '55%',
              transform: 'translateY(-50%)',
              color: '#fff',
              borderRadius: 4,
              p: 0
            }}
          >
            <CloseButton />
          </IconButton>
        </Box>

        {/* ================= BODY ================= */}
        <Box
          component="form"
          autoComplete="off"
          sx={{
            flex: 1, // ✅ takes remaining height
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            py: 0.5
          }}
        >
          {loading && <LoadingOverlay open={loading} />}

          {error && (
            <Box sx={{ backgroundColor: 'red', mx: 4, px: 1, py: 0.5 }}>
              <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
            </Box>
          )}

          {/* Scrollable Content */}
          <Box
            sx={{
              display: 'flex',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: contentBgColor
            }}
          >
            <Box
              sx={{
                flex: 1,
                overflow: loading ? 'hidden' : 'auto',
                backgroundColor: contentBgColor,
                borderRadius: 2,
                boxShadow: 'inset 0 4px 10px -1px rgba(0,0,0,0.3)',
                p: withSpacing ? 3 : 0
              }}
            >
              {children}
            </Box>
          </Box>

          {/* Buttons */}
          {buttons && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                pt: 1.5,
                pb: 0.5,
                gap: 2
              }}
            >
              {buttons}
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
