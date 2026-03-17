import {
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import React, { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import * as LucideIcons from 'lucide-react';
import SearchIcon from '@mui/icons-material/Search';
import LPSModal from 'layouts/ModalLayout';

const style = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'absolute',
  backgroundColor: '#f0f0f0',
  height: '460px',
  width: '1300px',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  overflow: 'auto',
  '@media (max-width: 1367)': {
    width: '95vw',
    height: '740px'
  }
};
export default function UpdateCriteriaModal({ open, handleClose, data, updateTableFunction }) {
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const formik = useFormik({
    initialValues: {
      label: '',
      description: '',
      icon: ''
    },

    validationSchema: object().shape({
      label: string().required('Required'),
      description: string().required('Required'),
      icon: string().required('Required')
    }),
    onSubmit: () => {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/libraries/updateCriteria/${data?.id}`, formik.values)
        .then(() => {
          enqueueSnackbar('Criteria Updated', {
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

  // Popular Lucide icons for selection (verified valid icons)
  const popularIcons = [
    'Smartphone',
    'CheckCircle',
    'User',
    'Users',
    'Settings',
    'Home',
    'File',
    'Folder',
    'Search',
    'Plus',
    'Edit',
    'Trash2',
    'Save',
    'Download',
    'Upload',
    'Star',
    'Heart',
    'Bookmark',
    'Calendar',
    'Clock',
    'Mail',
    'Phone',
    'Map',
    'Globe',
    'Shield',
    'Lock',
    'Unlock',
    'Eye',
    'EyeOff',
    'Check',
    'X',
    'AlertTriangle',
    'Info',
    'HelpCircle',
    'Target',
    'Award',
    'Trophy',
    'Gift',
    'ShoppingCart',
    'CreditCard',
    'DollarSign',
    'TrendingUp',
    'BarChart3',
    'PieChart',
    'Database',
    'Server',
    'Cloud',
    'Wifi',
    'Battery',
    'Camera',
    'Image',
    'Video',
    'Music',
    'Play',
    'Pause',
    'Volume2',
    'MessageSquare',
    'Send',
    'Palette',
    'Code',
    'FileText',
    'Zap'
  ];

  const filteredIcons = popularIcons.filter(iconName =>
    iconName.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleIconSelect = iconName => {
    formik.setFieldValue('icon', iconName);
    setShowIconPicker(false);
    setIconSearch('');
  };

  useEffect(() => {
    if (data) {
      const initialValues = {
        label: data?.label || '',
        description: data?.description || '',
        icon: data?.icon || ''
      };
      formik.setValues(initialValues);
    }
  }, [data]);

  useEffect(() => {
    const areAllValuesFilled = Object.values(formik.values).every(value => !!value);

    setDisabled(!areAllValuesFilled);
  }, [formik.values]);

  const components = [
    <TextField
      name="label"
      label="Criteria"
      size="small"
      disabled={loading}
      value={formik.values.label}
      onChange={formik.handleChange}
      onBlur={formik.handleBLur}
      error={formik.touched.label && Boolean(formik.errors.label)}
      helperText={formik.touched.label && formik.errors.label}
      variant="outlined"
      fullWidth
    />,
    <TextField
      name="description"
      label="Description"
      size="small"
      disabled={loading}
      value={formik.values.description}
      onChange={formik.handleChange}
      onBlur={formik.handleBLur}
      error={formik.touched.description && Boolean(formik.errors.description)}
      helperText={formik.touched.description && formik.errors.description}
      variant="outlined"
      fullWidth
      multiline
      rows={3}
    />,
    <Box key="icon-field" className="icon-picker-container" sx={{ position: 'relative' }}>
      <TextField
        name="icon"
        label="Icon"
        size="small"
        disabled={loading}
        value={formik.values.icon}
        onClick={() => setShowIconPicker(true)}
        error={formik.touched.icon && Boolean(formik.errors.icon)}
        helperText={formik.touched.icon && formik.errors.icon}
        variant="outlined"
        fullWidth
        InputProps={{
          readOnly: true,
          endAdornment:
            formik.values.icon && LucideIcons[formik.values.icon] ? (
              <InputAdornment position="end">
                {React.createElement(LucideIcons[formik.values.icon], {
                  size: 20
                })}
              </InputAdornment>
            ) : null
        }}
      />
      {showIconPicker && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'auto',
            mt: 1,
            p: 2,
            backgroundColor: '#fff',
            border: '1px solid #b6b6b6',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <TextField
            size="small"
            placeholder="Search icons..."
            value={iconSearch}
            onChange={e => setIconSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ mb: 2 }}
            fullWidth
          />
          <Grid container spacing={1}>
            {filteredIcons
              .filter(iconName => LucideIcons[iconName]) // Only show valid icons
              .map(iconName => (
                <Grid item xs={3} sm={2} key={iconName}>
                  <Box
                    onClick={() => handleIconSelect(iconName)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 1,
                      cursor: 'pointer',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      },
                      border:
                        formik.values.icon === iconName
                          ? '2px solid #1f1f1f'
                          : '1px solid transparent'
                    }}
                  >
                    {React.createElement(LucideIcons[iconName], { size: 24 })}
                    <Typography variant="caption" sx={{ mt: 0.5, fontSize: '10px' }}>
                      {iconName}
                    </Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Paper>
      )}
    </Box>
  ];

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Update Criteria"
      headerColor="#09504a"
      width="1300px"
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
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  backgroundColor: '#fff',
                  border: 'solid 1px #b6b6b6',
                  p: 2,
                  gap: 2
                }}
              >
                {components.map((component, index) => {
                  let componentKey;
                  if (index === 0) {
                    componentKey = 'criteria-field';
                  } else if (index === 1) {
                    componentKey = 'description-field';
                  } else {
                    componentKey = 'icon-field';
                  }
                  return (
                    <Box
                      key={componentKey}
                      sx={{
                        width: '100%'
                      }}
                    >
                      {component}
                    </Box>
                  );
                })}
              </Box>
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
