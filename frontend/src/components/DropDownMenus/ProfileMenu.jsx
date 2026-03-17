import React, { useEffect, useState } from 'react';
import { Box, Divider, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useStateContext } from 'contexts/ContextProvider';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import LogoutIcon from '@mui/icons-material/Logout';
import ChangePasswordModal from 'modals/miscellaneous/ChangePasswordModal';
import './marquee.css';
import socket from 'contexts/socket';
import { useNavigate } from 'react-router-dom';

export default function ProfileMenu() {
  const navigate = useNavigate();

  const { auth, setAuth } = useStateContext();
  const [anchorEl, setAnchorEl] = useState(null);

  const [openChangePassword, setOpenChangePassword] = useState(false);

  const menuItemStyle = {
    fontSize: '14px',
    px: 2,
    py: 1,
    mx: 0.5,
    borderRadius: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    color: '#111827',
    '&:hover': {
      backgroundColor: '#f3f4f6'
    }
  };

  const iconStyle = {
    fontSize: 18,
    color: '#6b7280'
  };

  // const handleOpen = () => {
  //   setOpen(true);
  // };

  // const handleClose = () => {
  //   setOpen(false);
  // };

  const handleLogout = () => {
    // socket.emit("leaveRoom", `room-${auth?.unitId}`, () => {
    //   console.log(
    //     `User ${auth?.firstName} ${auth?.lastName} left the room ${auth?.unitName}`
    //   );
    // });
    socket.emit('leaveRoom', `${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`);

    setAuth(null);
    localStorage.clear();
  };

  useEffect(() => {
    if (auth && auth.changePass === 1) {
      setOpenChangePassword(true);
    }
  }, []);

  const getInitials = () => {
    const first = auth?.firstName?.charAt(0) || '';
    const last = auth?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Box>
      <ChangePasswordModal
        open={openChangePassword}
        handleClose={() => setOpenChangePassword(false)}
      />
      {/* <ViewSignatureModal
        open={openViewSignatureModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenViewSignatureModal(false);
        }}
        dataFromActions={dataFromActions || null}
      /> */}
      <IconButton
        onClick={evt => setAnchorEl(evt.currentTarget)}
        sx={{
          color: '#1f1f1f'
        }}
      >
        <IconButton
          onClick={evt => setAnchorEl(evt.currentTarget)}
          sx={{
            p: 0
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '9999px', // full circle (shadcn style)
              backgroundColor: '#e5e7eb', // zinc-200
              color: '#111827', // zinc-900
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              border: '2px solid #aaaeb2', // subtle border
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: '#d1d5db'
              }
            }}
          >
            {getInitials()}
          </Box>
        </IconButton>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            boxShadow: '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)'
          }
        }}
      >
        {/* Header (username marquee retained) */}
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5
          }}
        >
          {/* Avatar */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '9999px',
              backgroundColor: '#e5e7eb',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
              border: '1px solid #d1d5db'
            }}
          >
            {getInitials()}
          </Box>

          {/* Name + email */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1.2
              }}
              noWrap
            >
              {auth?.firstName} {auth?.lastName}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: '#6b7280'
              }}
              noWrap
            >
              {auth?.username}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Menu items */}
        <MenuItem onClick={() => navigate('/profile')} sx={menuItemStyle}>
          <PersonIcon sx={iconStyle} />
          Profile
        </MenuItem>

        <MenuItem onClick={() => setOpenChangePassword(true)} sx={menuItemStyle}>
          <LockIcon sx={iconStyle} />
          Change Password
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleLogout}
          sx={{
            ...menuItemStyle,
            color: '#dc2626',
            '&:hover': {
              backgroundColor: '#fee2e2'
            }
          }}
        >
          <LogoutIcon sx={{ ...iconStyle, color: '#dc2626' }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
