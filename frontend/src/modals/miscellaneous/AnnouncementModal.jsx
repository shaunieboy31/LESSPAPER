import React from 'react';
import { Box, IconButton, Modal, Typography } from '@mui/material';

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CancelIcon from '@mui/icons-material/Close';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '40vw',
  minWidth: '500px',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#f0f0f0',
  boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
  borderRadius: '12px',
  overflow: 'hidden'
};

export default function AnnouncementModal({ open, handleClose }) {
  const announcements = [
    { id: 1, message: 'ASD' },
    { id: 2, message: 'ASDS' }
  ];

  return (
    <Modal open={open} onClose={handleClose}>
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
            Announcements
          </Typography>

          <IconButton onClick={handleClose}>
            <CancelIcon />
          </IconButton>
        </Box>

        <Box sx={{ padding: '24px' }}>
          {announcements.map(announce => (
            <Box sx={{ display: 'flex', flexWrap: 'nowrap' }}>
              <ArrowForwardIosIcon mr={2} /> {announce?.message}
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );
}
