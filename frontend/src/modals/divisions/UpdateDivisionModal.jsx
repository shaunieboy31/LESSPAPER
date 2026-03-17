import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Modal,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import ModalHeaderBackground from 'components/CustomUI/ModalHeader';
import LPSModal from 'layouts/ModalLayout';

const style = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'absolute',
  backgroundColor: '#f0f0f0',
  height: '270px',
  width: '800px',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  overflow: 'auto',
  '@media (max-width: 841px)': {
    width: '95vw'
  }
};

export default function UpdateDivisionModal({ open, handleClose, data, updateTableFunction }) {
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      name: data?.name || ''
    },

    validationSchema: object().shape({
      name: string().required('Required')
    }),
    onSubmit: () => {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/libraries/updateDivision/${data?.id}`, formik.values)
        .then(() => {
          enqueueSnackbar('Division Updated', {
            variant: 'success'
          });
          updateTableFunction();
          handleClose();
        })
        .catch(err => {
          setError(err?.response?.data?.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  useEffect(() => {
    if (data) {
      const initialValues = {
        name: data?.name || ''
      };
      formik.setValues(initialValues);
    }
  }, [data]);

  useEffect(() => {
    setDisabled(!formik.values.name);
  }, [formik.values]);

  const components = [
    <TextField
      name="name"
      label="Division"
      size="small"
      disabled={loading}
      value={formik?.values?.name}
      onChange={formik?.handleChange}
      onBlur={formik?.handleBLur}
      error={formik?.touched?.name && Boolean(formik?.errors?.name)}
      helperText={formik?.touched?.name && formik?.errors?.name}
      variant="outlined"
      fullWidth
    />
  ];

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Update Division"
      headerColor="#09504a"
      width="800px"
      loading={loading}
      error={error}
      withSpacing
    >
      <Box>
        {loading && (
          <Box
            sx={{
              ...style,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}
        <Box variant="form" component="form" onSubmit={formik.handleSubmit} autoComplete="off">
          <Box>
            {error && (
              <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
              </Box>
            )}
            <Box
              sx={{
                m: 2
              }}
            >
              {components.map((component, index) => (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    minWidth: '200px'
                  }}
                >
                  {component}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'end',
              alignItems: 'center',
              p: 2,
              zIndex: 10
            }}
          >
            <Button
              disabled={disabled}
              type="submit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: disabled ? 'lightgray' : '#09504a',
                color: '#fff',
                py: 1,
                px: 2,
                width: '10rem',
                minWidth: '100px',
                '&:hover': {
                  backgroundColor: '#a2cb6b',
                  color: '#1f1f1f',
                  fontWeight: 'bold'
                }
              }}
            >
              <SaveIcon
                sx={{
                  mr: 1
                }}
              />
              Update
            </Button>
          </Box>
        </Box>
      </Box>
    </LPSModal>
  );
}
