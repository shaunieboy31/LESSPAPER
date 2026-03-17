import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './style.css';

export default function Missing() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#09504a',
        overflow: 'hidden'
      }}
    >
      <Box className="text">
        <Typography sx={{ fontSize: '50vh', color: 'rgba(19, 36, 44, 0.5)', fontWeight: 900 }}>
          404
        </Typography>
      </Box>
      <div className="container">
        <div className="caveman" style={{ animationDelay: '0s' }}>
          <div className="leg">
            <div className="foot">
              <div className="fingers" />
            </div>
          </div>
          <div className="leg">
            <div className="foot">
              <div className="fingers" />
            </div>
          </div>
          <div className="shape">
            <div className="circle" />
            <div className="circle" />
          </div>
          <div className="head">
            <div className="eye">
              <div className="nose" />
            </div>
            <div className="mouth" />
          </div>
          <div className="arm-right">
            <div className="club" />
          </div>
        </div>
        <div className="caveman" style={{ animationDelay: '0s' }}>
          <div className="leg">
            <div className="foot">
              <div className="fingers" />
            </div>
          </div>
          <div className="leg">
            <div className="foot">
              <div className="fingers" />
            </div>
          </div>
          <div className="shape">
            <div className="circle" />
            <div className="circle" />
          </div>
          <div className="head">
            <div className="eye">
              <div className="nose" />
            </div>
            <div className="mouth" />
          </div>
          <div className="arm-right">
            <div className="club" />
          </div>
        </div>
      </div>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          mt: '450px',
          gap: 2
        }}
      >
        <Typography
          sx={{
            fontSize: '50px',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
            mt: '10px'
          }}
        >
          Page Not Found
        </Typography>
        <Button
          onClick={goBack}
          sx={{
            backgroundColor: 'lightgray',
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '13px',
            color: 'black',
            '&:hover': {
              boxShadow: '0 0 10px 5px rgba(246, 226, 71, 0.7)',
              backgroundColor: '#a2cb6b',
              color: '#black',
              transition: 'all 0.1s ease-in-out',
              mx: '5px'
            }
          }}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
}
