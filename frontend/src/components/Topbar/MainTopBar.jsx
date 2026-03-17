import { useEffect, useRef, useState } from 'react';
import { AppBar, Box, IconButton, styled } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { FaSearch } from 'react-icons/fa';
import SettingsIcon from '@mui/icons-material/Settings';
// import PlagiarismOutlinedIcon from "@mui/icons-material/PlagiarismOutlined";
// import { useNavigate } from "react-router-dom";
import SearchByLPSNo from 'modals/doc-logs/SearchByLPSNo';
import { useStateContext } from 'contexts/ContextProvider';
import LPSLogo from '../../assets/images/lps_logo.png';
import ProfileMenu from '../DropDownMenus/ProfileMenu';
import SystemSettingsModal from '../../modals/miscellaneous/SystemSettingsModal';
import { ClientDateTimeDisplay } from 'components/CustomUI/DateTime';

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: prop => prop !== 'open'
})(({ theme, open, width }) => ({
  p: -2,
  // background: "linear-gradient(180deg, #6e3c72, black, #472a4a)",
  // background: "linear-gradient(180deg, #e8ac20, #a2cb6b, #b38a29)",
  background: '#ffffff',
  boxShadow: 'none',
  borderBottom: 'none',
  // background:
  //   "linear-gradient(40deg, rgba(66, 201, 116, 1), rgba(59, 152, 184, 1), rgba(26, 214, 164, 1))",
  // "linear-gradient(40deg, rgba(56, 56, 56, 1), rgba(80, 80, 80, 1), rgba(105, 105, 105, 0.9))",
  // zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  ...(open && {
    marginLeft: width,
    width: `calc(100% - ${width}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  })
}));

function Topbar({ themeProp, drawerWidth, openDrawerFunction, drawerOpenStatus }) {
  const { auth } = useStateContext();

  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [openSettingsModal, setOpenSettingsModal] = useState(false);
  const [lpsNo, setLpsNo] = useState('');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleShowSearch = () => {
    setShowSearch(true);
    // Wait for render to finish, then focus the input
    setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSearch(false);
    }, 500);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <StyledAppBar position="fixed" theme={themeProp} open={drawerOpenStatus} width={drawerWidth}>
      <SearchByLPSNo
        open={openSearchModal}
        handleClose={() => setOpenSearchModal(false)}
        lpsNo={lpsNo}
      />
      <SystemSettingsModal
        open={openSettingsModal}
        handleClose={() => setOpenSettingsModal(false)}
      />
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          py: 0.5,
          px: 2.5
        }}
      >
        {(!isMobile || (!showSearch && isMobile)) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={openDrawerFunction}
              edge="start"
              sx={{
                color: 'black',
                mr: 5,
                ...(drawerOpenStatus && { display: 'none' }),
                '@media (max-width: 480px)': {
                  mr: 0
                }
              }}
            >
              <MenuIcon sx={{ fontSize: '25px' }} />
            </IconButton>
            <Box
              // onClick={handleNavigate}
              component="img"
              variant="img"
              src={LPSLogo}
              draggable="false"
              sx={{
                ml: drawerOpenStatus ? 2 : 0,
                mr: 1,
                width: '47px',
                '@media (min-height: 1920px)': {
                  width: '100px'
                },
                cursor: 'pointer',
                userSelect: 'none'
              }}
            />
            <Box
              sx={{
                display: 'flex',
                '@media (max-width: 900px)': {
                  display: 'none'
                  // fontSize: "15px",
                }
              }}
            >
              {/* ANIMATION LESS PAPER SYSTEM */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.3,
                  color: '#09504a',
                  fontWeight: 900
                }}
              >
                LESS PAPER SYSTEM
              </Box>
            </Box>
            <Box
              sx={{
                display: 'none',
                gap: 0.3,
                '@media (max-width: 900px)': {
                  display: 'flex'
                  // fontSize: "15px",
                },
                '@media (max-width: 480px)': {
                  display: 'none'
                },
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  backgroundColor: '#09504a',
                  fontWeight: '900',
                  p: '6px 12px'
                }}
              >
                L
              </Box>
              <Box
                sx={{
                  backgroundColor: '#09504a',
                  fontWeight: '900',
                  p: '6px 12px'
                }}
              >
                P
              </Box>
              <Box
                sx={{
                  backgroundColor: '#09504a',
                  fontWeight: '900',
                  p: '6px 12px'
                }}
              >
                S
              </Box>

              {/* <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  color: "black",
                  fontWeight: "bold",
                }}
              >
                Less Paper
              </Typography> */}
            </Box>
          </Box>
        )}

        <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 2 }}>
          <ClientDateTimeDisplay type="date" />
          <ClientDateTimeDisplay type="time" />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'end',
            gap: 2,
            mr: 1.5,
            '@media (max-width: 480px)': {
              mr: '3px'
            }
          }}
        >
          <Box
            onMouseEnter={handleShowSearch}
            sx={{
              height: '100%',
              transition: '0.5s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              width: '100%'
              // position: "relative",
            }}
          >
            {!showSearch && (
              <IconButton
                onClick={() => {
                  if (showSearch) {
                    setOpenSearchModal(true);
                  } else {
                    setShowSearch(true);
                  }
                }}
                sx={{
                  color: 'black',
                  zIndex: 100,
                  transition: '0.3s ease-in-out',
                  p: 1,
                  cursor: 'pointer', // allow click-through when search is showing
                  '&:hover': {
                    backgroundColor: '#fff',
                    border: 'none',
                    boxShadow: '0 -1px 10px 5px #a4a4a4'
                  }
                }}
              >
                <FaSearch size={20} sx={{ fontSize: '24px' }} />
              </IconButton>
            )}
            {/* <TextField
              ref={searchRef}
              onBlur={handleBlur}
              size="small"
              sx={{
                transition: "0.3s ease-in-out",
              }}
            /> */}

            <input
              placeholder="Search by LPS No..."
              type="text"
              ref={searchRef}
              onBlur={handleBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setOpenSearchModal(true); // <-- your API trigger function
                }
              }}
              onChange={evt => setLpsNo(evt.target.value)}
              style={{
                display: showSearch ? 'block' : 'none',
                marginLeft: showSearch ? 0 : '-38px',
                marginRight: showSearch ? 0 : '6px',
                transition:
                  'margin 0.1s ease-in-out, width 0.5s ease-in-out, border-color 0.2s ease-in-out',
                border: showSearch ? '2px solid #09504a' : '1px solid gray', // MUI primary and default border
                width: showSearch ? '300px' : '0',
                height: '40px',
                padding: '8px 14px',
                borderRadius: '4px',
                fontSize: '16px',
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                outline: 'none',
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
                boxShadow: showSearch ? '0 0 0 1px rgba(25, 118, 210, 0.2)' : 'none'
              }}
            />
          </Box>
          <IconButton
            // onClick={() => handleNavigate()}
            sx={{
              color: 'black',
              mr: -1,
              '&:hover': {
                color: '#09504a'
              }
            }}
          >
            <NotificationsIcon
              sx={{
                fontSize: '24px'
              }}
            />
          </IconButton>
          {/* Show settings button only for admin users */}
          {auth?.role.some(role => ['admin', 'sds'].includes(role)) && (
            <IconButton
              onClick={() => setOpenSettingsModal(true)}
              sx={{
                color: 'black',
                mr: -1,
                '&:hover': {
                  color: '#09504a'
                }
              }}
            >
              <SettingsIcon
                sx={{
                  fontSize: '24px'
                }}
              />
            </IconButton>
          )}
          {/* FULL SCREEN */}
          <IconButton
            onClick={() => toggleFullscreen()}
            sx={{
              color: 'black',
              mr: -1,
              '&:hover': {
                color: '#09504a'
              }
            }}
          >
            {isFullscreen ? (
              <FullscreenExitIcon
                sx={{
                  fontSize: '30px'
                }}
              />
            ) : (
              <FullscreenIcon
                sx={{
                  fontSize: '30px'
                }}
              />
            )}
          </IconButton>
          <ProfileMenu />
        </Box>
      </Box>
    </StyledAppBar>
  );
}

export default Topbar;
