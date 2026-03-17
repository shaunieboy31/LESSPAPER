/* eslint-disable no-param-reassign */
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';

import { useFormik } from 'formik';
import { useState } from 'react';
import { array, number, object, string } from 'yup';
import SelectOffice from 'components/Textfields/SelectOffice';
import SelectRole from 'components/Textfields/SelectRole';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import SelectUnit from 'components/Textfields/SelectUnit';
import SelectDestinations from 'components/Textfields/SelectDestinations';
import LPSModal from 'layouts/ModalLayout';

const style = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'absolute',
  backgroundColor: '#f0f0f0',
  height: '870px',
  width: '1300px',
  // background:
  //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
  //   border: "solid 2px #46e3be",
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

// Custom hooks
const useImageUpload = (initialImage = null) => {
  const [imgChanged, setImgChanged] = useState();
  const [error, setError] = useState();
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [loading, setLoading] = useState(false);

  const handleUpload = async event => {
    try {
      setLoading(true);
      setError('');

      const file = event.target.files[0];

      if (file && file.type === 'image/png') {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
          if (img.height <= 500) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImageUrl(reader.result);
            };
            reader.readAsDataURL(file);

            setImgChanged(file);
            setError('');
          } else {
            setImgChanged(null);
            setError('Image height must be 500px or less.');
            setImageUrl('');
          }
          URL.revokeObjectURL(objectUrl);
        };

        img.onerror = () => {
          setError('Error: Invalid image file.');
          setImgChanged(null);
          URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;
      } else {
        setError('Error: Only PNG files are accepted.');
        setImgChanged(null);
      }
    } catch (err) {
      setError('Error: Invalid PNG file.');
      setImgChanged(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImgChanged();
    setError('');
    setImageUrl('');
  };

  return {
    imgChanged,
    error,
    imageUrl,
    loading,
    handleUpload,
    reset,
    setImgChanged,
    setImageUrl
  };
};

const useDynamicArray = (initialValue = [''], errorTimeout = 3000) => {
  const [items, setItems] = useState(initialValue);
  const [errors, setErrors] = useState({});

  const addItem = () => setItems(prev => [...prev, '']);
  const removeItem = () => setItems(prev => prev.slice(0, -1));
  const updateItem = (index, value) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = value;
      return newItems;
    });
  };

  const setError = (id, text) => {
    setErrors(prev => ({ ...prev, [id]: text }));
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }, errorTimeout);
  };

  const reset = (newValue = ['']) => {
    setItems(newValue);
    setErrors({});
  };

  return { items, errors, addItem, removeItem, updateItem, setError, reset };
};

function FormSection({ title, children, sx = {} }) {
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        p: 3,
        mb: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e8e8e8',
        ...sx
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: '#1f1f1f',
          mb: 2,
          fontSize: '1.1rem',
          pb: 1,
          display: 'inline-block'
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function DynamicArrayField({
  items,
  onAdd,
  onRemove,
  renderField,
  minItems = 1,
  addButtonText = 'Add',
  removeButtonText = 'Remove'
}) {
  return (
    <Box sx={{ width: '100%' }}>
      {items.map((item, index) => (
        <Box
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            p: 2,
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}
        >
          <Box sx={{ flex: 1 }}>{renderField(item, index)}</Box>
          {items.length > minItems && (
            <Tooltip title={removeButtonText} placement="top">
              <IconButton
                onClick={() => onRemove(index)}
                sx={{
                  color: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#ffebee'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ))}
      <Button
        onClick={onAdd}
        startIcon={<AddIcon />}
        sx={{
          mt: 1,
          backgroundColor: '#1f1f1f',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#a2cb6b',
            color: '#1f1f1f'
          },
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500
        }}
      >
        {addButtonText}
      </Button>
    </Box>
  );
}

function ImageUploadSection({
  title,
  imageUrl,
  onUpload,
  onChoosePrevious,
  onRemove,
  uploadId,
  loading = false
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '2px dashed #e0e0e0'
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          color: '#1f1f1f',
          textAlign: 'center'
        }}
      >
        {title}
      </Typography>

      {imageUrl && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            sx={{
              maxWidth: '200px',
              maxHeight: '200px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0'
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Upload Sign" placement="top">
              <>
                <input
                  accept="image/png"
                  id={uploadId}
                  type="file"
                  onChange={onUpload}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
                <IconButton
                  component="label"
                  htmlFor={uploadId}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#1f1f1f',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#a2cb6b',
                      color: '#1f1f1f'
                    }
                  }}
                >
                  <UploadIcon />
                </IconButton>
              </>
            </Tooltip>
            <Tooltip title="Choose Previous" placement="top">
              <IconButton
                onClick={onChoosePrevious}
                disabled={loading}
                sx={{
                  backgroundColor: '#1f1f1f',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#a2cb6b',
                    color: '#1f1f1f'
                  }
                }}
              >
                <BurstModeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove" placement="top">
              <IconButton
                onClick={onRemove}
                disabled={loading}
                sx={{
                  backgroundColor: '#d32f2f',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#ffebee',
                    color: '#d32f2f'
                  }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {!imageUrl && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <input
            accept="image/png"
            id={uploadId}
            type="file"
            onChange={onUpload}
            style={{ display: 'none' }}
            disabled={loading}
          />
          <label htmlFor={uploadId}>
            <Button
              component="span"
              variant="outlined"
              startIcon={<UploadIcon />}
              disabled={loading}
              sx={{
                borderColor: '#1f1f1f',
                color: '#1f1f1f',
                '&:hover': {
                  borderColor: '#a2cb6b',
                  backgroundColor: '#a2cb6b',
                  color: '#1f1f1f'
                },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Upload {title}
            </Button>
          </label>
          <Button
            onClick={onChoosePrevious}
            variant="outlined"
            disabled={loading}
            sx={{
              borderColor: '#1f1f1f',
              color: '#1f1f1f',
              '&:hover': {
                borderColor: '#a2cb6b',
                backgroundColor: '#a2cb6b',
                color: '#1f1f1f'
              },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Choose Previous
          </Button>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} sx={{ color: '#1f1f1f' }} />
        </Box>
      )}
    </Box>
  );
}

export default function AddUserModal({ open, handleClose, setCreatedUser, updateTableFunction }) {
  const axiosPrivate = useAxiosPrivate();

  // Image upload hooks
  const signatureUpload = useImageUpload();
  const initialUpload = useImageUpload();

  // Dynamic arrays
  const positions = useDynamicArray();
  const relatedUnits = useDynamicArray([{ id: null, destination: null, type: null }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper functions
  const resetForm = () => {
    positions.reset();
    signatureUpload.reset();
    initialUpload.reset();
  };

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      role: [],
      officeId: '',
      unitId: '',
      status: 1
    },

    validationSchema: object().shape({
      firstName: string().required('Required'),
      lastName: string().required('Required'),
      username: string().required('Required'),
      role: array().required('Required'),
      officeId: number().nullable(),
      unitId: number().nullable(),
      status: number().required('Required')
    }),
    onSubmit: values => {
      setLoading(true);
      setError('');

      const formData = new FormData();

      // Handle positions
      if (positions.items[0] !== '') {
        formData.set('positions', JSON.stringify(positions.items));
      }

      // Handle related units
      if (relatedUnits.items[0]?.id && relatedUnits.items[0]?.id !== null) {
        formData.set('relatedUnits', JSON.stringify(relatedUnits.items));
      }

      // Handle signatures
      if (signatureUpload.imgChanged) {
        formData.set('sign', signatureUpload.imgChanged);
      }
      if (initialUpload.imgChanged) {
        formData.set('initial', initialUpload.imgChanged);
      }

      Object.keys(values).forEach(key => {
        if (key === 'role') {
          return formData.append(key, JSON.stringify(values[key]));
        }
        if (values[key]) {
          return formData.append(key, values[key]);
        }

        return null;
      });

      axiosPrivate
        .post('/user/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(res => {
          const createdUser = res?.data?.data;

          setCreatedUser(createdUser);

          enqueueSnackbar('User Added', {
            variant: 'success'
          });
          updateTableFunction();
          handleClose();
          resetForm();
          formik.resetForm();

          // if (createdUser?.role?.includes("sds"))) {

          // }
        })
        .catch(err => {
          setError(err?.response?.data?.error || err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  });

  // Computed values
  const { middleIntl, password, status, officeId, unitId, ...otherValues } = formik.values;
  const isFormValid = Object.values(
    officeId === 1 ? { ...otherValues, officeId, unitId } : { ...otherValues, officeId }
  ).every(value => !!value);
  const isSignUploadDisabled = !formik?.values?.role?.some(role =>
    ['sds', 'asds', 'chief', 'unit head'].includes(role)
  );

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Add User"
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
        <Box component="form" onSubmit={formik.handleSubmit} autoComplete="off">
          <Box>
            {error && (
              <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
              </Box>
            )}
            <Box sx={{ m: 3, flex: 1, overflow: 'auto' }}>
              {/* Personal Information */}
              <FormSection title="Personal Information">
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    color: '#666',
                    mb: 2,
                    fontStyle: 'italic'
                  }}
                >
                  (Please type the name as it is written in the documents)
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 2
                  }}
                >
                  <TextField
                    name="firstName"
                    label="First Name"
                    size="small"
                    disabled={loading}
                    value={formik?.values?.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik?.touched?.firstName && Boolean(formik?.errors?.firstName)}
                    helperText={formik?.touched?.firstName && formik?.errors?.firstName}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        }
                      }
                    }}
                  />
                  <TextField
                    name="middleIntl"
                    label="Middle Initial"
                    size="small"
                    disabled={loading}
                    value={formik.values.middleIntl}
                    onChange={e => {
                      const { value } = e.target;
                      // Allow only alphabetic characters and limit to 2 letters
                      if (/^[a-zA-Z]{0,2}$/.test(value)) {
                        formik.setFieldValue('middleIntl', value);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.middleIntl && Boolean(formik.errors.middleIntl)}
                    helperText={formik.touched.middleIntl && formik.errors.middleIntl}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        }
                      }
                    }}
                  />

                  <TextField
                    name="lastName"
                    label="Last Name"
                    size="small"
                    disabled={loading}
                    value={formik?.values?.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik?.touched?.lastName && Boolean(formik?.errors?.lastName)}
                    helperText={formik?.touched?.lastName && formik?.errors?.lastName}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        }
                      }
                    }}
                  />
                </Box>
              </FormSection>

              {/* Account Information */}
              <FormSection title="Account Information">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 2
                  }}
                >
                  <TextField
                    name="username"
                    label="Email"
                    size="small"
                    disabled={loading}
                    value={formik?.values?.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik?.touched?.username && Boolean(formik?.errors?.username)}
                    helperText={formik?.touched?.username && formik?.errors?.username}
                    variant="outlined"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1f1f1f'
                        }
                      }
                    }}
                  />
                </Box>
              </FormSection>

              {/* Role and Office */}
              <FormSection title="Role and Office">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 2
                  }}
                >
                  <SelectRole
                    label="Role"
                    name="role"
                    value={formik?.values?.role}
                    onChange={(fieldName, selectedValue) => {
                      formik.setFieldValue('role', selectedValue);
                    }}
                    error={formik?.touched?.role && Boolean(formik?.errors?.role)}
                    helperText={formik?.touched?.role && formik?.errors?.role}
                    disabled={loading}
                    sx={{
                      width: '100%'
                    }}
                  />
                  <SelectOffice
                    label="Office"
                    name="officeId"
                    value={formik?.values?.officeId}
                    onChange={(fieldName, selectedValue) => {
                      if (selectedValue !== 1) {
                        formik.setFieldValue('unitId', null);
                        relatedUnits.reset([{ id: null, destination: null, type: null }]);

                        signatureUpload.reset();
                        initialUpload.reset();
                      }
                      formik.setFieldValue('officeId', selectedValue);
                    }}
                    error={formik?.touched?.officeId && Boolean(formik?.errors?.officeId)}
                    helperText={formik?.touched?.officeId && formik?.errors?.officeId}
                    disabled={loading}
                    sx={{
                      width: '100%'
                    }}
                  />
                </Box>
              </FormSection>

              {/* Unit and Related Units */}
              <FormSection title="Unit and Related Units">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 2,
                    mb: 2
                  }}
                >
                  <SelectUnit
                    label="Unit"
                    name="unitId"
                    width="100%"
                    disabled={formik.values.officeId !== 1}
                    value={formik.values.unitId}
                    onChange={(fieldName, selectedValue) => {
                      formik.setFieldValue('unitId', selectedValue.id);
                    }}
                    error={formik?.touched?.unitId && Boolean(formik?.errors?.unitId)}
                    helperText={formik?.touched?.unitId && formik?.errors?.unitId}
                    showSuperintendents
                    sx={{
                      width: '100%',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'black !important'
                        }
                      }
                    }}
                  />
                </Box>

                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: '#1f1f1f',
                    mb: 2
                  }}
                >
                  Related Units
                </Typography>
                <DynamicArrayField
                  items={relatedUnits.items}
                  onAdd={() => relatedUnits.addItem()}
                  onRemove={index => relatedUnits.removeItem(index)}
                  onUpdate={(index, value) => {
                    if (!value.id || !value.destination || !value.type) {
                      relatedUnits.setError(index, 'Unit Required');
                    } else if (
                      relatedUnits?.items?.some(
                        dest => dest.id === value?.id && dest.type === value?.type
                      )
                    ) {
                      relatedUnits?.updateItem(index, {
                        id: null,
                        destination: null,
                        type: null
                      });
                      relatedUnits?.setError(index, 'Unit already chosen');
                    } else {
                      relatedUnits?.updateItem(
                        index,
                        value || { id: null, destination: null, type: null }
                      );
                    }
                  }}
                  renderField={(item, index) => (
                    <SelectDestinations
                      label={`Related Unit ${index + 1}`}
                      width="100%"
                      value={item.id}
                      onChange={(fieldName, selectedValue) => {
                        relatedUnits?.updateItem(index, selectedValue);
                      }}
                      error={Boolean(relatedUnits?.errors[index])}
                      helperText={
                        <span style={{ color: 'red' }}>{relatedUnits?.errors[index]}</span>
                      }
                      disabled={loading}
                      showSuperintendents
                    />
                  )}
                  minItems={1}
                  addButtonText="Add Related Unit"
                  removeButtonText="Remove Unit"
                />
              </FormSection>

              {/* Positions */}
              <FormSection title="Positions">
                <DynamicArrayField
                  items={positions.items}
                  onAdd={() => positions.addItem()}
                  onRemove={index => positions.removeItem(index)}
                  onUpdate={(index, value) => {
                    if (positions.items.includes(value)) {
                      positions.setError(index, 'Position already exists');
                    } else {
                      positions.updateItem(index, value || '');
                    }
                  }}
                  renderField={(position, index) => (
                    <TextField
                      label={`Position ${index + 1}`}
                      size="small"
                      disabled={loading}
                      value={position}
                      onChange={e => {
                        positions.updateItem(index, e.target.value);
                      }}
                      error={Boolean(positions.errors[index])}
                      helperText={<span style={{ color: 'red' }}>{positions.errors[index]}</span>}
                      variant="outlined"
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1f1f1f'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1f1f1f'
                          }
                        }
                      }}
                    />
                  )}
                  minItems={1}
                  addButtonText="Add Position"
                  removeButtonText="Remove Position"
                />
              </FormSection>

              {/* Signatures */}
              {!isSignUploadDisabled && (
                <FormSection title="Signatures">
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                      gap: 3
                    }}
                  >
                    <ImageUploadSection
                      title="Signature"
                      imageUrl={signatureUpload.imageUrl}
                      onUpload={signatureUpload.handleUpload}
                      onRemove={() => {
                        signatureUpload.reset();
                      }}
                      uploadId="signature-upload"
                      loading={loading}
                    />

                    <ImageUploadSection
                      title="Initial"
                      imageUrl={initialUpload.imageUrl}
                      onUpload={initialUpload.handleUpload}
                      onRemove={() => {
                        initialUpload.reset();
                      }}
                      uploadId="initial-upload"
                      loading={loading}
                    />
                  </Box>
                </FormSection>
              )}
            </Box>
          </Box>

          {/* Submit Button */}
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
              disabled={!isFormValid}
              type="submit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: !isFormValid ? 'lightgray' : '#09504a',
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
              Add User
            </Button>
          </Box>
        </Box>
      </Box>
    </LPSModal>
  );
}
