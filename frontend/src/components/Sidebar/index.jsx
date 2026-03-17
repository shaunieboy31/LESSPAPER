/* eslint-disable no-nested-ternary */
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  styled
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStateContext } from 'contexts/ContextProvider';
import links from './sidebarlinks';
import SidebarActiveIndicator from 'components/CustomUI/SidebarIndicator';
import DepEdLogo from '../../assets/images/deped_logo.png';

const openedMixin = (theme, width) => ({
  width,
  // background: "linear-gradient(60deg, #2b2b2b, #686868, #2b2b2b)",
  // background: "linear-gradient(60deg, #b38a29, #e8ac20, #795f22)",
  background: '#09504a',
  borderRight: '2px solid #ffffff',

  // background: "linear-gradient(40deg, #e963fd, #8233c5, #274b74)",
  // background:
  //   "linear-gradient(40deg, rgba(66, 201, 116, 0.9), rgba(59, 152, 184, 1), rgba(26, 214, 164, 0.9))",
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: 'hidden',
  scrollbarWidth: '0.3rem',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    width: '0.3rem'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'gray'
  }
});

const closedMixin = theme => ({
  background: '#09504a',
  borderRight: '2px solid #ffffff',
  // background: "linear-gradient(60deg, #2b2b2b, #686868, #2b2b2b)",
  // background: "linear-gradient(60deg, #b38a29, #e8ac20, #795f22)",

  // background: "linear-gradient(40deg, #e963fd, #8233c5, #274b74)",
  // background: "linear-gradient(40deg, #1f1f1f, #463168, #482fe6)",
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: 'hidden',
  scrollbarWidth: '0.3rem',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    width: '0.3rem'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'gray'
  },
  width: `calc(${theme.spacing(7)} + 1px)`,
  '@media (max-width: 600px)': {
    width: `calc(${theme.spacing(8)} + 1px)`
  },
  '@media (max-width: 480px)': {
    width: 0
  }
});

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== 'open'
})(({ width, theme, open }) => ({
  width,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  // overflow: 'auto',
  // scrollbarWidth: 'thin',
  // msOverflowStyle: 'none',

  /* 👇 default: scrollbar auto (mobile) */
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    width: '0.5rem'
  },

  /* Desktop: auto-hide scrollbar */
  [theme.breakpoints.up('xl')]: {
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',

    '&:hover': {
      overflowY: 'auto',
      scrollbarWidth: 'thin',

      '&::-webkit-scrollbar': {
        width: '0.4rem'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#53FDFD',
        borderRadius: '8px'
        // backgroundColor: "#f6e247",
      }
    }
  },
  ...(open && {
    ...openedMixin(theme, width),
    '& .MuiDrawer-paper': {
      ...openedMixin(theme, width),

      /* 👇 SAME hover logic for the paper */
      overflowY: 'auto',
      [theme.breakpoints.up('xl')]: {
        overflowY: 'hidden',
        '&:hover': {
          overflowY: 'auto'
        }
      }
    }
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': {
      ...closedMixin(theme),

      overflowY: 'auto',
      [theme.breakpoints.up('xl')]: {
        overflowY: 'hidden',
        '&:hover': {
          overflowY: 'auto'
        }
      }
    }
  })
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar
}));

function SideBar({ themeProp, drawerWidth, drawerOpenStatus, closeDrawerFunction }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth, division } = useStateContext();
  const [openSections, setOpenSections] = useState({
    Home: true,
    Documents: true,
    Libraries: false,
    Feedback: false
  });

  const handleClick = title => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleNavigate = link => {
    navigate(`/${link}`);
  };

  const sdoDivision = {
    imus: 'SDO Imus City',
    gentri: 'SDO Gen. Trias',
    dasma: 'SDO Dasmariñas eGov',
    binan: 'SDO Biñan City'
  };

  return (
    <Box
      sx={{
        backgroundColor: 'blue',
        zIndex: 100,
        position: 'fixed',
        overflow: 'auto',
        scrollbarWidth: 'thin',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          width: '0.5rem'
        },
        '&::-webkit-scrollbar-thumb': {
          // backgroundColor: "#53FDFD",
          backgroundColor: '#f6e247'
        }
      }}
    >
      <StyledDrawer
        variant="permanent"
        width={drawerWidth}
        theme={themeProp}
        open={drawerOpenStatus}
      >
        <DrawerHeader
          theme={themeProp}
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              mr: -5,
              alignItems: 'center',
              px: 2,
              gap: 1
            }}
          >
            {/* DepEd Logo */}
            <Box
              component="img"
              src={DepEdLogo}
              alt="DepEd"
              sx={{
                height: 36,
                width: 'auto',
                mr: 1
              }}
            />
            {/* Office Name */}
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '15px',
                fontWeight: 'bold',
                color: '#fff'
              }}
            >
              {sdoDivision[division]}
            </Typography>
          </Box>
          <IconButton onClick={closeDrawerFunction}>
            {themeProp.direction === 'rtl' ? (
              <ChevronRightIcon sx={{ color: '#fff' }} />
            ) : (
              <ChevronLeftIcon sx={{ color: '#fff' }} />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider
          sx={{
            backgroundColor: '#317d74'
          }}
        />
        {drawerOpenStatus ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              mt: 2,
              // mx: 2,
              color: '#fff',
              textAlign: 'center'
              // border: "solid 1px #fff",
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>
              {`${auth?.firstName} ${auth?.lastName}`}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                wordBreak: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {auth?.officeId === 1 ? auth?.unitName : auth?.officeName}
            </Typography>
            <Typography
              sx={{
                fontSize: '10px',
                wordBreak: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {auth?.role
                ?.map(
                  role =>
                    role === 'admin'
                      ? 'Administrator'
                      : role === 'sds' || role === 'asds'
                      ? ''
                      : role?.toLowerCase().replace(/\b\w/g, match => match.toUpperCase()) // Capitalizes the first letter of each word
                )
                .join(', ')}
            </Typography>
          </Box>
        ) : (
          <Box />
        )}
        <List
          sx={{
            '@media (min-height: 1920px)': {
              mt: 6
            }
          }}
        >
          {links.map(
            item =>
              (item.role === 'superadmin' || // Display items for superadmin to all users
                (auth?.role?.some(role => ['admin'].includes(role)) && item.role === 'admin') || // Display items for admin to admin users
                item.role === 'transmittingUsers' ||
                (item.role === 'imus-admin' && division === 'imus')) && (
                <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
                  {auth?.role?.some(role =>
                    item?.links?.some(link => link?.access?.includes(role))
                  ) && (
                    <Box
                      onClick={() => drawerOpenStatus && handleClick(item.title)}
                      sx={{
                        // ml: drawerOpenStatus ? 2 : 0,
                        px: drawerOpenStatus ? 2 : 0,
                        my: 2,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: drawerOpenStatus ? 'pointer' : 'default'
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 'bold'
                        }}
                      >
                        {drawerOpenStatus ? item.title : <Box />}
                      </Typography>
                      {drawerOpenStatus &&
                        (openSections[item.title] ? <ExpandLess /> : <ExpandMore />)}
                    </Box>
                  )}
                  {/* "&::-webkit-scrollbar-thumb": {
                    // backgroundColor: "#53FDFD",
                    backgroundColor: "#f6e247",
                  }, */}
                  <Collapse
                    in={!drawerOpenStatus || openSections[item.title]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.links.map(
                        link =>
                          ((auth?.unitId === 12 &&
                            auth?.role?.some(role => link?.access?.includes(role))) ||
                            auth?.role?.some(role => link?.access?.includes(role))) && (
                            <Tooltip
                              title={!drawerOpenStatus && link.name}
                              placement="right"
                              key={link.path}
                            >
                              <Box sx={{ position: 'relative', height: 48 }}>
                                {location.pathname === `/${link.path}` && (
                                  <SidebarActiveIndicator />
                                )}
                                <ListItemButton
                                  onClick={() => handleNavigate(link.path)}
                                  sx={{
                                    py: 0.3,
                                    px: 2.5,
                                    mx: 0.5,
                                    justifyContent: drawerOpenStatus ? 'initial' : 'center',
                                    borderRadius: '25px',
                                    color:
                                      location.pathname === `/${link.path}` ? '#1f1f1f' : '#fff',
                                    fontWeight:
                                      location.pathname === `/${link.path}` ? 'bold' : 'normal',
                                    background: 'transparent',
                                    '&:hover': {
                                      backgroundColor: '#a2cb6b',
                                      color: '#1f1f1f',
                                      fontWeight: 'bold'
                                    }
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      color: 'inherit',
                                      minWidth: 0,
                                      mr: drawerOpenStatus ? 3 : 'auto',
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <Typography sx={{ fontSize: '30px' }}>{link.icon}</Typography>
                                  </ListItemIcon>
                                  <ListItemText
                                    sx={{
                                      opacity: drawerOpenStatus ? 1 : 0,
                                      color: 'inherit'
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: '14px',
                                        color: 'inherit',
                                        fontWeight:
                                          location.pathname === `/${link.path}` ? 'bold' : 'normal'
                                      }}
                                    >
                                      {link.name}
                                    </Typography>
                                  </ListItemText>
                                </ListItemButton>
                              </Box>
                            </Tooltip>
                          )
                      )}
                    </List>
                  </Collapse>
                </ListItem>
              )
          )}
        </List>
      </StyledDrawer>
    </Box>
  );
}

export default SideBar;
