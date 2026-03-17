'use client';

import { Calendar, Clock } from 'lucide-react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';
import { useStateContext } from 'contexts/ContextProvider';

export function ClientDateTimeDisplay({ type }) {
  const { serverDate, serverTime, isCutoffLocked } = useStateContext();

  if (!serverTime || !serverDate) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          height: '100%',
          color: '#212121',
          p: 2
        }}
      >
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (type === 'time') {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          color: isCutoffLocked ? '#764ca4' : '#09504a'
        }}
      >
        <Clock size={16} strokeWidth={3} />
        <Typography
          sx={{
            width: 100,
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {serverTime}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      sx={{
        color: isCutoffLocked ? '#764ca4' : '#09504a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      direction="row"
      spacing={1}
      alignItems="center"
    >
      <Calendar size={16} strokeWidth={3} />
      <Typography
        sx={{
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}
      >
        {serverDate}
      </Typography>
    </Stack>
  );
}
