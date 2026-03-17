import React, { useEffect, useState } from 'react';
import { Box, IconButton, Modal, Typography } from '@mui/material';
import CancelIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';

dayjs.extend(utc);
dayjs.extend(timezone);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: '#f7f7fa',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  border: '1.5px solid #e0e0e0',
  borderRadius: '18px',
  p: { xs: 1.5, sm: 3, md: 4 },
  width: { xs: '98vw', sm: '90vw', md: '420px', lg: '500px' },
  maxWidth: '99vw',
  maxHeight: { xs: '95vh', sm: '90vh', md: '85vh' },
  minHeight: '320px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

export default function ViewSignatureModal({ open, handleClose, dataFromActions }) {
  const { BASE_URL } = useStateContext();

  const [rowData, setRowData] = useState();

  const [sign, setSign] = useState();

  const [initial, setInitial] = useState();

  useEffect(() => {
    if (dataFromActions) {
      setRowData(
        Array.isArray(dataFromActions) && dataFromActions.length > 0
          ? dataFromActions[0]
          : dataFromActions
      );
    }
  }, [dataFromActions]);

  useEffect(() => {
    if (rowData) {
      const { signPath } = rowData;

      const signaturePath = signPath?.[0]?.sign || null;
      const initialPath = signPath?.[0]?.initial || null;

      setSign(signaturePath ? `${BASE_URL}${signaturePath}` : null);
      setInitial(initialPath ? `${BASE_URL}${initialPath}` : null);
    }
  }, [rowData]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          <IconButton onClick={handleClose} sx={{ color: 'gray', p: 0 }}>
            <CancelIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            mb: 2,
            px: { xs: 0, sm: 1 }
          }}
        >
          {/* User Name at the Top */}
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#1f1f1f',
              textAlign: 'center',
              wordBreak: 'break-word'
            }}
          >
            {rowData
              ? `${rowData.firstName || ''} ${rowData.middleIntl ? `${rowData.middleIntl}. ` : ''}${
                  rowData.lastName || ''
                }`
              : ''}
          </Typography>
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: '1px solid #ececec',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              width: '100%',
              minHeight: { xs: '220px', sm: '260px' }
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: '#888',
                fontWeight: 500,
                fontSize: '1rem',
                mb: 1,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}
            >
              Signature
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: { xs: '180px', sm: '200px', md: '220px' },
                width: { xs: '180px', sm: '200px', md: '220px' },
                backgroundColor: '#f7f7fa',
                border: '1.5px solid #e0e0e0',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              {sign ? (
                <img
                  src={sign}
                  alt="signature"
                  draggable="false"
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <Typography sx={{ color: '#bbb' }}>No Signature</Typography>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              width: '90%',
              border: '1.5px solid lightgray'
            }}
          />
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '14px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: '1px solid #ececec',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: { xs: 2, sm: 3 },
              width: '100%',
              minHeight: { xs: '220px', sm: '260px' }
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: '#888',
                fontWeight: 500,
                fontSize: '1rem',
                mb: 1,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}
            >
              Initial
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: { xs: '180px', sm: '200px', md: '220px' },
                width: { xs: '180px', sm: '200px', md: '220px' },
                backgroundColor: '#f7f7fa',
                border: '1.5px solid #e0e0e0',
                mb: 2,
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              {initial ? (
                <img
                  src={initial}
                  alt="initial"
                  draggable="false"
                  style={{
                    width: '100%',
                    height: '100%'
                  }}
                />
              ) : (
                <Typography sx={{ color: '#bbb' }}>No Initial</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
