import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { Button } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30vw',
  minWidth: 400,
  bgcolor: 'background.paper',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  p: 4
};

export default function QuestionModal({
  open,
  handleClose,
  promptDesc,
  setPromptResponse,
  setSubmit,
  options
}) {
  const handleSubmit = res => {
    setPromptResponse(res);
    setSubmit(true);
    handleClose();
  };

  const handleCancel = () => {
    setPromptResponse(null);
    setSubmit(false);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
      }}
    >
      <Box sx={style}>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: '17px' }}>{promptDesc}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
          {options.map(opt => (
            <Button
              onClick={() => handleSubmit(opt)}
              sx={{
                backgroundColor: '#1f1f1f',
                color: '#fff',
                px: 2,
                mr: 2,
                '&:hover': {
                  backgroundColor: '#a2cb6b',
                  color: '#1f1f1f',
                  fontWeight: 'bold'
                }
              }}
            >
              {opt}
            </Button>
          ))}
          <Button onClick={() => handleCancel()}>Cancel</Button>
        </Box>
      </Box>
    </Modal>
  );
}
