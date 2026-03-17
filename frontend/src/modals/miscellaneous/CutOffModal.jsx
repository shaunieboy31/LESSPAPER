'use client';

import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';

export default function CutOffModal({ open = true, onClose, dontShowAgain }) {
  const [checked, setChecked] = useState(false);

  const handleClose = () => {
    if (checked) {
      dontShowAgain?.();
    }
    onClose?.();
  };


  return (
    <Modal
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      disableAutoFocus
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          mx: 'auto',
          borderRadius: 3
        }}
      >
        <Paper
          elevation={20}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: 0,
            position: 'relative'
          }}
        >
          {/* Close Button */}
          {/* <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              },
              zIndex: 10
            }}
          >
            <CloseIcon />
          </IconButton> */}

          {/* Content */}
          <Box
            sx={{
              padding: 4,
              textAlign: 'center',
              minHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2
            }}
          >
            {/* Icon Container */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                mb: 1
              }}
            >
              <LightModeIcon
                sx={{
                  fontSize: 56,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 }
                  }
                }}
              />
              <EmojiEmotionsIcon
                sx={{
                  fontSize: 56,
                  animation: 'bounce 1.5s infinite',
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' }
                  }
                }}
              />
            </Box>

            {/* Heading */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: 24, sm: 28 },
                mb: 1,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              Time to Recharge!
            </Typography>

            {/* Business Hours Info */}
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                padding: 2,
                my: 1,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  mb: 1,
                  opacity: 0.95
                }}
              >
                Our business hours are:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: 0.5
                }}
              >
                Weekdays: 6 AM – 5 PM
              </Typography>
            </Box>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                fontSize: 15,
                lineHeight: 1.6,
                opacity: 0.9,
                mt: 2
              }}
            >
              All document transactions are closed for now. Less Paper System will resume operations
              during business hours. In the meantime, take some well-deserved rest and enjoy your
              day!
            </Typography>

            {/* Action Button */}
            <Button
              onClick={handleClose}
              variant="contained"
              sx={{
                mt: 3,
                px: 4,
                py: 1.2,
                backgroundColor: '#fff',
                color: '#667eea',
                fontWeight: 700,
                fontSize: 15,
                textTransform: 'none',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  backgroundColor: '#a2cb6b',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
                }
              }}
            >
              Dismiss
            </Button>
            <FormControlLabel
              sx={{
                justifyContent: 'center',
                '& .MuiFormControlLabel-label': {
                  color: '#fff',
                  fontSize: 14
                }
              }}
              control={
                <Checkbox
                  checked={checked}
                  onChange={e => setChecked(e.target.checked)}
                  sx={{
                    color: '#fff',
                    '&.Mui-checked': {
                      color: '#fff'
                    }
                  }}
                />
              }
              label="Remind me again later"
            />
          </Box>

          {/* Decorative Elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 200,
              height: 200,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -60,
              left: -60,
              width: 250,
              height: 250,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />
        </Paper>
      </Box>
    </Modal>
  );
}
