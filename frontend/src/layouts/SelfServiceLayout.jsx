import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Outlet, useLocation } from "react-router-dom";
import { Box, CssBaseline, Typography } from "@mui/material";
import SelfServiceTopbar from "components/Topbar/SelfServiceTopbar";
import { useStateContext } from 'contexts/ContextProvider';

import DepEdImusBg from '../assets/images/DepEdImus.webp';
import DepEdDasmaBg from '../assets/images/DepEdDasma.jpg';
import DepEdGenTriBg from '../assets/images/DepEdGenTri.png';
import DepEdBinanBg from '../assets/images/DepEdBinan.jpg';

const BG_IMAGES = {
  imus: DepEdImusBg,
  dasma: DepEdDasmaBg,
  gentri: DepEdGenTriBg,
  binan: DepEdBinanBg
};

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

export default function SelfServiceLayout() {
  const location = useLocation();
  const { division } = useStateContext();
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${BG_IMAGES[division] || DepEdImusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: location.pathname === "/form" ? "#e5bfa1" : "#ffffff", // Fallback
      }}
    >
      <CssBaseline />
      
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'linear-gradient(to right, rgba(22, 65, 85, 0.95) 0%, rgba(20, 70, 82, 0.85) 20%, rgba(35, 137, 143, 0) 100%)',
          zIndex: 1
        }}
      />

      <SelfServiceTopbar themeProp={theme} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minWidth: "360px",
          mt: 8, // Adjust for Topbar height
          display: "flex",
          flexDirection: "column",
          position: 'relative', // Ensure content is above overlay
          zIndex: 2,
        }}
      >
        <DrawerHeader theme={theme} />
        <Outlet />
        
        {/* Footer */}
        <Box
            sx={{
              mt: "auto",
              py: 2,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)', // Lighter color for better contrast on dark bg
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              © DepEd Imus Division | 2026. All rights reserved
            </Typography>
        </Box>
      </Box>
    </Box>
  );
}
