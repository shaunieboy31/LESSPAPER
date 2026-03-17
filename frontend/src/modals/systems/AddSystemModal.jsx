import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import LPSModal from 'layouts/ModalLayout';

const style = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'absolute',
  backgroundColor: '#f0f0f0',
  // background:
  //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
  //   border: "solid 2px #46e3be",
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  overflow: 'auto',
  '@media (min-width: 10px)': {
    height: '90vh',
    width: '85vw'
  },

  '@media (min-width: 480px)': {
    height: '85vh',
    width: '80vw'
  },

  '@media (min-width: 640px)': {
    height: '75vh',
    width: '70vw'
  },

  '@media (min-width: 768px)': {
    height: '75vh',
    width: '70vw'
  },

  '@media (min-width: 1024px)': {
    height: '80vh',
    width: '70vw'
  },

  '@media (min-width: 1082px)': {
    height: '80vh',
    width: '65vw'
  }
};

export default function AddSystemModal({ open, handleClose, updateTableFunction }) {
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: { name: '' },

    validationSchema: object().shape({
      name: string().required('Required')
    }),
    onSubmit: () => {
      setLoading(true);
      setError('');

      axiosPrivate
        .post('/libraries/addSystem', formik.values)
        .then(() => {
          enqueueSnackbar('System Added', {
            variant: 'success'
          });
          updateTableFunction();
          formik.resetForm();
          handleClose();
        })
        .catch(err => {
          setError(err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  useEffect(() => {
    const { locationName, ...otherValues } = formik.values;
    const areAllValuesFilled = Object.values(otherValues).every(value => !!value);

    setDisabled(!areAllValuesFilled);
  }, [formik.values]);

  const components = [
    <TextField
      name="name"
      label="System"
      size="small"
      disabled={loading}
      value={formik.values.name}
      onChange={formik.handleChange}
      onBlur={formik.handleBLur}
      error={formik.touched.name && Boolean(formik.errors.name)}
      helperText={formik.touched.name && formik.errors.name}
      variant="outlined"
      fullWidth
    />
  ];

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Add System"
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
              <AddIcon
                sx={{
                  mr: 1
                }}
              />
              Add System
            </Button>
          </Box>
        </Box>
      </Box>
    </LPSModal>
  );
}
