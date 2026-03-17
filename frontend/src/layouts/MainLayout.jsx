import React, { useEffect, useRef, useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Fade, IconButton, Tooltip, Typography } from '@mui/material';
import DocLogsModal from 'modals/doc-logs';
import { GrSearchAdvanced } from 'react-icons/gr';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useStateContext } from 'contexts/ContextProvider';
import { MdRateReview } from 'react-icons/md';
import Topbar from '../components/Topbar/MainTopBar';
import Sidebar from '../components/Sidebar';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar
}));

export default function MainLayout() {
  const { openSidebar, setOpenSidebar, division } = useStateContext();

  const navigate = useNavigate();

  const sidePanelRef = useRef(null);
  const sidebarRef = useRef(null);

  const [openPanel, setOpenPanel] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);

  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpenSidebar(true);
  };

  const handleDrawerClose = () => {
    setOpenSidebar(false);
  };

  const [showFeedbackMssg, setShowFeedbackMssg] = useState(false);

  const handleShowFeedback = () => {
    setOpenPanel(true);
    setShowFeedbackMssg(true);
    setTimeout(() => setShowFeedbackMssg(false), 5000); // Hide after 500ms
  };

  useEffect(() => {
    function handleClickOutside(event) {
      const isMobileDevice = () =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768;

      // Close sidebar if click is outside sidebarRef
      if (isMobileDevice() && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenSidebar(false); // close sidebar if clicking outside
      }

      // Closes Panel After 500ms if clicked outside
      setTimeout(() => {
        if (sidePanelRef.current && !sidePanelRef.current.contains(event.target)) {
          setOpenPanel(false);
          setShowFeedbackMssg(false);
        }
      }, [500]);
    }

    if (openSidebar || openPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSidebar, openPanel]);

  return (
    <Box
      sx={{
        display: 'flex',
        // flexDirection: "column",
        minHeight: '100vh',
        backgroundColor: '#ffffff'
        // overflow: "hidden",
      }}
    >
      <DocLogsModal open={openSearchModal} handleClose={() => setOpenSearchModal(false)} />
      <CssBaseline />
      {/* 🆕 Pass the ref to Sidebar wrapper */}
      <Box ref={sidebarRef}>
        <Sidebar
          themeProp={theme}
          drawerWidth={drawerWidth}
          drawerOpenStatus={openSidebar}
          closeDrawerFunction={handleDrawerClose}
        />
      </Box>
      <Topbar
        themeProp={theme}
        drawerWidth={drawerWidth}
        openDrawerFunction={handleDrawerOpen}
        drawerOpenStatus={openSidebar}
      />
      <Box
        component="main"
        sx={{
          display: 'block',
          transition: 'ease-in-out 0.1s',
          width: `calc(100% - 7px)`,
          minWidth: '360px',
          // overflowX: "auto",
          // width: "100%",
          // px: 1,
          // backgroundColor:
          //   location.pathname === "/form" ? "#e5bfa1" : "#f0f0f0",
          ml: openSidebar ? 30 : 7,

          '@media (min-height: 1920px)': {
            mt: 6
          },
          '@media (max-width: 480px)': {
            ml: 0
          }
        }}
      >
        <DrawerHeader theme={theme} />
        <Outlet />
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            width: '100%',
            zIndex: 1000,
            '@media (max-width: 550px)': {
              display: 'none'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex'
              // justifyContent: "center",
              // backgroundColor: "#2f2f2f",
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                // color: "#1f1f1f",
                color: 'gray',
                // color: "#fff",
                fontWeight: 'bold',
                ml: 2
              }}
            >
              © DepEd Imus Division | 2026. All rights reserved
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        ref={sidePanelRef}
        onClick={() => handleShowFeedback()}
        sx={{
          opacity: 0.7,
          background: '#c69f2e',
          py: 0.5,
          px: 3,
          // fontWeight: "bold",
          position: 'fixed',
          right: 0,
          bottom: 25,
          cursor: 'pointer',
          transition: '0.3s ease-in-out',
          transform: `rotate(-90deg) ${openPanel ? 'translateY(420%)' : 'translateY(310%)'}`,
          transformOrigin: 'left top',
          borderTopLeftRadius: '25px',
          borderTopRightRadius: '25px',
          whiteSpace: 'nowrap', // prevent wrapping after rotation
          fontStyle: 'italic',
          '&:hover': {
            opacity: 1
          }
        }}
      >
        Open Panel
      </Box>
      <Box
        // onClick={() => setShowSearch(false)}
        sx={{
          position: 'fixed',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          alignItems: 'start',
          gap: 2,
          p: 2,
          pb: 7,
          // overflow: "hidden",
          height: 'auto',
          transition: 'transform 0.3s ease-in-out',
          width: '130px', // Fixed width for the sliding box
          transform: openPanel ? 'translateX(0)' : 'translateX(100%)',
          bottom: 0,
          right: 0,
          zIndex: 100
        }}
      >
        <Tooltip title="Advanced Search" placement="left">
          <IconButton
            onClick={() => setOpenSearchModal(true)}
            sx={{
              backgroundColor: 'lightgray',
              boxShadow: '2px 1px 15px 5px lightgray',
              border: 'solid 1px gray',
              p: 1.5,
              zIndex: 100,
              transition: '0.5s ease-in-out',
              '&:hover': {
                backgroundColor: '#fff',
                border: 'none',
                boxShadow: '0 -1px 10px 5px #a4a4a4'
              }
            }}
          >
            <GrSearchAdvanced style={{ fontSize: '30px' }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Open DepEd feedback form!" placement="left">
            <IconButton
              onClick={() => window.open('https://csm.depedimuscity.com', '_blank')}
              sx={{
                backgroundColor: 'lightgray',
                boxShadow: '2px 1px 15px 5px lightgray',
                border: 'solid 1px gray',
                p: 1.5,
                zIndex: 100,
                transition: '0.5s ease-in-out',
                '&:hover': {
                  backgroundColor: '#fff',
                  border: 'none',
                  boxShadow: '0 -1px 10px 5px #a4a4a4'
                }
              }}
            >
              <OpenInNewIcon sx={{ fontSize: '30px' }} />
            </IconButton>
          </Tooltip>
        </Box>
        {division === 'imus' && (
          <Box sx={{ position: 'relative' }}>
            <Tooltip title="Give us a feedback!" placement="left">
              <IconButton
                onClick={() => navigate('/ci')}
                sx={{
                  backgroundColor: 'lightgray',
                  boxShadow: '2px 1px 15px 5px lightgray',
                  border: 'solid 1px gray',
                  p: 1.5,
                  zIndex: 100,
                  transition: '0.5s ease-in-out',
                  '&:hover': {
                    backgroundColor: '#fff',
                    border: 'none',
                    boxShadow: '0 -1px 10px 5px #a4a4a4'
                  }
                }}
              >
                <MdRateReview sx={{ fontSize: '30px' }} />
              </IconButton>
            </Tooltip>
            <Fade in={showFeedbackMssg} timeout={{ enter: 1000, exit: 300 }}>
              <Box
                sx={{
                  position: 'absolute',
                  right: '130%', // place it to the left of the IconButton
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#139938',
                  color: '#fff',
                  px: 2,
                  py: 1,
                  // width: "30vw",
                  borderRadius: '10px',
                  // clipPath: "polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%)",
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  boxShadow: '0px 2px 6px rgba(0,0,0,0.3)',
                  '@media (max-width: 600px)': {
                    whiteSpace: 'wrap',
                    width: '50vw'
                  }
                }}
              >
                Give a feedback about the system! 😊
              </Box>
            </Fade>
          </Box>
        )}
      </Box>
    </Box>
  );
}
