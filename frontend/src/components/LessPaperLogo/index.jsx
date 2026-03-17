import React from 'react';
import { Box, Typography } from '@mui/material';
import { useStateContext } from 'contexts/ContextProvider';

export default function LessPaperLogo() {
  const { division } = useStateContext();

  const labels = {
    imus: 'DepEd SDO - Imus City',
    gentri: 'DepEd SDO - General Trias City',
    dasma: 'eGov DepEd SDO Dasmariñas City',
    binan: 'DepEd SDO - Biñan City'
  };

  return (
    <Box
      sx={{
        display: 'block',
        textAlign: 'center'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ height: '1px', backgroundColor: 'gray', flex: 1 }} />
        <Typography
          sx={{
            // "8px", "10px",
            color: 'gray',
            fontSize: ['12px', '12px', '12px', '14px', '15px'], // Corresponds to xs, sm, md, lg, xl etc.
            fontWeight: 'bold',
            mx: 2,
            '@media (max-height: 600px)': {
              fontSize: '12px'
            },
            '@media (max-height: 570px)': {
              fontSize: '10px'
            }
          }}
          // fontSize: "15px",
        >
          {labels[division] || 'DepEd SDO'}
        </Typography>
        <Box sx={{ height: '1px', backgroundColor: 'gray', flex: 1 }} />
      </Box>
    </Box>
  );
}
