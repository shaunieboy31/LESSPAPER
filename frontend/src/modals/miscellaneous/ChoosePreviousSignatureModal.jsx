import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import { useStateContext } from 'contexts/ContextProvider';

export default function ChoosePreviousSignatureModal({
  open,
  description,
  setOpenDocPreviewModal,
  signType,
  changeSignatureFunction
}) {
  const { BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [signatures, setSignatures] = useState([]);
  const [selectedSign, setSelectedSign] = useState();

  const handleGetSignatures = () => {
    const apiToUse =
      signType === 'signature'
        ? axiosPrivate.get(`${BASE_URL}/user/e-signatures`)
        : axiosPrivate.get(`${BASE_URL}/user/e-initials`);

    apiToUse
      .then(e => {
        setSignatures(e?.data);
      })
      .catch(error => enqueueSnackbar('error', error));
  };

  useEffect(() => {
    if (signType) {
      handleGetSignatures();
    }
  }, [open]);

  const handleSelectSign = () => {
    changeSignatureFunction(`${BASE_URL}${selectedSign}`);
    setOpenDocPreviewModal(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'Center',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        height: '100%',
        width: '100%',
        zIndex: 1000
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '98%',
          width: '98%',
          backgroundColor: '#fff',
          overflow: 'auto',
          p: 2,
          borderRadius: '10px',
          boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.4)',
          gap: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Typography sx={{ fontWeight: 'bold' }}>{description}</Typography>
          <IconButton onClick={() => setOpenDocPreviewModal(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Typography sx={{ mr: 2 }}>Selected:</Typography>
          <TextField value={selectedSign} size="small" sx={{ flex: 1, minWidth: '200px' }} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-evenly',
            alignItems: 'space-between',
            overflow: 'auto',
            border: 'solid 1px gray',
            flex: 1,
            gap: 4,
            p: 2
          }}
        >
          {signatures.map((imgData, index) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '180px',
                width: '180px'
              }}
            >
              <Button
                onClick={() => setSelectedSign(imgData)}
                sx={{
                  height: '90%',
                  width: '90%',
                  minHeight: '150px',
                  minWidth: '150px',
                  border: 'solid 1px gray',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'ease-in-out .3s',
                  '&:hover': {
                    height: '100%',
                    width: '100%'
                  }
                }}
              >
                <img
                  src={`${BASE_URL}${imgData}`}
                  alt={`sign${index + 1}`}
                  draggable="false"
                  style={{
                    height: '100%',
                    width: '100%'
                  }}
                />
              </Button>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
          <Button
            onClick={() => handleSelectSign()}
            disabled={!selectedSign}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: !selectedSign ? 'lightgray' : '#1f1f1f',
              color: '#fff',
              py: 1,
              width: '10vw',
              minWidth: '100px',
              '&:hover': {
                backgroundColor: '#a2cb6b',
                color: '#1f1f1f',
                fontWeight: 'bold'
              }
            }}
          >
            Select
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
