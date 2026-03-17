import {
  Box,
  Button,
  CircularProgress,
  // Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Modal,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import BurstModeIcon from '@mui/icons-material/BurstMode';
import CancelIcon from '@mui/icons-material/Close';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SaveIcon from '@mui/icons-material/Save';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { array, number, object, string } from 'yup';
import SelectOffice from 'components/Textfields/SelectOffice';
import SelectRole from 'components/Textfields/SelectRole';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import { useStateContext } from 'contexts/ContextProvider';
import SelectUnit from 'components/Textfields/SelectUnit';
import SelectDestinations from 'components/Textfields/SelectDestinations';
import { arrayBufferToBase64 } from 'lib/helpers';
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
    setImgChanged('delete');
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

const useFileUpload = (initialFile = null) => {
  const [fileUrl, setFileUrl] = useState(initialFile);
  const [fileChanged, setFileChanged] = useState();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async event => {
    try {
      const newFile = event.target.files[0];

      setLoading(true);
      setError('');

      setFileUrl(newFile);
      setFileChanged(newFile);
    } catch (err) {
      setError('Error: Invalid file.');
      setFileChanged(null);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFileUrl('');
    setError('');
    setLoading(false);
    setFileChanged('delete');
  };

  return {
    fileUrl,
    fileChanged,
    error,
    loading,
    handleUpload,
    reset,
    setFileUrl,
    setFileChanged
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

function PNPKICertificateUploadSection({
  title,
  fileUrl,
  onUpload,
  onChoosePrevious,
  onRemove,
  uploadId,
  loading = false,
  password = '',
  onPasswordChange,
  showPassword = false,
  setShowPassword
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

      {fileUrl && (
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
          {/* Password Input Field */}
          <TextField
            label="Certificate Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={onPasswordChange}
            disabled={loading}
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#1f1f1f'
                },
                '&:hover fieldset': {
                  borderColor: '#a2cb6b'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1f1f1f'
                }
              },
              '& .MuiInputLabel-root': {
                color: '#1f1f1f',
                '&.Mui-focused': {
                  color: '#1f1f1f'
                }
              }
            }}
            helperText="Enter the password for your .p12 certificate file"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Typography sx={{ textWrap: 'wrap' }}>{`Selected: ${
            fileUrl?.name || fileUrl.split('/').pop()
          }`}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Upload .p12 file" placement="top">
              <>
                <input
                  accept=".pfx,.p12"
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
            <Tooltip title="Choose Previous .p12 file" placement="top">
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
      {!fileUrl && (
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
            accept=".pfx,.p12"
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

function BiometricSection({
  title,
  enabled,
  onToggle,
  onRegister,
  onRemove,
  hasNewData,
  hasOldData,
  icon: Icon,
  registerText
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
        border: '1px solid #e0e0e0'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ color: '#1f1f1f' }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: '#1f1f1f'
            }}
          >
            {title}
          </Typography>
        </Box>
        <Switch
          checked={enabled}
          onChange={onToggle}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: '#1f1f1f'
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: '#1f1f1f'
            }
          }}
        />
      </Box>

      {enabled && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            onClick={onRegister}
            startIcon={<Icon />}
            sx={{
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
            {registerText}
          </Button>

          {(hasNewData || hasOldData) && (
            <Button
              onClick={onRemove}
              startIcon={<DeleteIcon />}
              sx={{
                backgroundColor: '#d32f2f',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#ffebee',
                  color: '#d32f2f'
                },
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

// Main component
export default function UpdateUserModal({
  open,
  handleClose,
  data,
  setSelectedUser,
  handleRegisterFace,
  updateTableFunction
}) {
  const { BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [openPrevSignaturesModal, setOpenPrevSignaturesModal] = useState(false);
  const [signType, setSignType] = useState('');

  // Image upload hooks
  const signatureUpload = useImageUpload();
  const initialUpload = useImageUpload();
  const PNPKICertUpload = useFileUpload();

  // Password state for PNPKI certificate
  const [pnpkiPassword, setPnpkiPassword] = useState('');

  // Dynamic arrays
  const positions = useDynamicArray();
  const relatedUnits = useDynamicArray([{ id: null, destination: null, type: null }]);

  // Biometric data
  const [fingerprintData, setFingerprintData] = useState();
  const [faceData, setFaceData] = useState();
  const [enableFingerprint, setEnableFingerprint] = useState(false);
  const [enableFaceRecog, setEnableFaceRecog] = useState(false);
  const [fingerprintChanged, setFingerprintChanged] = useState(false);
  const [faceDataChanged, setFaceDataChanged] = useState(false);
  const [showPnpkiPassword, setShowPnpkiPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper functions
  const resetForm = () => {
    positions.reset();
    signatureUpload.reset();
    initialUpload.reset();
    setSelectedUser(null);
    setFingerprintData(null);
    setFingerprintChanged(false);
    setFaceData(null);
    setFaceDataChanged(false);
    setShowPnpkiPassword(false);
  };

  // Form validation and submission
  const formik = useFormik({
    initialValues: {
      username: data?.username || '',
      role: data?.role || [],
      positions: data?.positions || [],
      officeId: data?.officeId || null,
      unitId: data?.unitId || null,
      firstName: data?.firstName || '',
      middleIntl: data?.middleIntl || '',
      lastName: data?.lastName || '',
      password: '',
      status: data?.status || false
    },

    validationSchema: object().shape({
      username: string().required('Required'),
      role: array().required('Required'),
      officeId: number().nullable(),
      unitId: number().nullable()
    }),

    onSubmit: async values => {
      setLoading(true);
      setError('');

      try {
        const formData = new FormData();

        // Handle password
        if (values.password) {
          formData.set('newPassword', values.password);
          formData.set('changePass', 1);
          formData.set('editor', 'admin');
        }

        // Handle positions
        if (positions.items[0] !== '') {
          formData.set('positions', JSON.stringify(positions.items));
        }

        // Handle related units
        if (relatedUnits.items[0]?.id !== null) {
          formData.set('relatedUnits', JSON.stringify(relatedUnits.items));
        }

        // Handle signatures
        if (signatureUpload.imgChanged && signatureUpload.imgChanged !== 'unchanged') {
          formData.set('sign', signatureUpload.imgChanged);
        }
        if (initialUpload.imgChanged && initialUpload.imgChanged !== 'unchanged') {
          formData.set('initial', initialUpload.imgChanged);
        }

        if (PNPKICertUpload.fileChanged && PNPKICertUpload.fileChanged !== 'unchanged') {
          formData.set('pnpkicert', PNPKICertUpload.fileChanged);
          // Include password if provided
          if (pnpkiPassword.trim()) {
            formData.set('pnpkiPassword', pnpkiPassword);
          }
        }

        // Handle biometric data
        if (fingerprintChanged) {
          formData.set('fingerprintData', fingerprintData ? JSON.stringify(fingerprintData) : '');
        }
        if (faceDataChanged) {
          formData.set('faceData', faceData ? JSON.stringify(faceData) : '');
        }

        // Add other form values
        Object.keys(values).forEach(key => {
          if (key === 'role') {
            formData.set(key, JSON.stringify(values[key]));
          } else if (values[key] !== null && values[key] !== undefined && key !== 'password') {
            formData.set(key, values[key]);
          }
        });

        formData.set('enableFingerprint', enableFingerprint);
        formData.set('enableFaceRecog', enableFaceRecog);

        await axiosPrivate.put(`/user/update/${data?.uid}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        enqueueSnackbar('User Updated', { variant: 'success' });
        updateTableFunction();
        handleClose();
        resetForm();
        formik.resetForm();
      } catch (err) {
        setError(err?.message);
      } finally {
        setLoading(false);
      }
    }
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const password = Array.from(
      { length: 10 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    formik.setFieldValue('password', password);
  };

  const handleRegisterFingerprint = async () => {
    try {
      setLoading(true);
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new TextEncoder().encode(data.uid);

      const publicKeyCredential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Less Paper System', id: window.location.hostname },
          user: {
            id: userId,
            name: formik?.values?.username,
            displayName: `${formik?.values?.firstName} ${formik?.values?.lastName}`
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      if (publicKeyCredential) {
        setFingerprintChanged(true);
        const credential = {
          id: publicKeyCredential.id,
          rawId: arrayBufferToBase64(publicKeyCredential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64(publicKeyCredential.response.clientDataJSON),
            attestationObject: arrayBufferToBase64(publicKeyCredential.response.attestationObject)
          },
          type: publicKeyCredential.type
        };
        setFingerprintData(credential);
      }
    } catch (err) {
      console.error('Registration error:', err);
      enqueueSnackbar(err.message || 'Failed to register fingerprint', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (data) {
      relatedUnits.reset(data.relatedUnits || [{ id: null, destination: null, type: null }]);
      positions.reset(data.positions && data.positions[0] !== 'N/A' ? data.positions : ['']);

      setEnableFingerprint(data.enableFingerprint);
      setEnableFaceRecog(data.enableFaceRecog);

      signatureUpload.setImgChanged('unchanged');
      initialUpload.setImgChanged('unchanged');
      PNPKICertUpload.setFileChanged('unchanged');
      signatureUpload.setImageUrl(
        data.signPath?.[0]?.sign ? `${BASE_URL}${data.signPath[0].sign}` : null
      );
      initialUpload.setImageUrl(
        data.signPath?.[0]?.initial ? `${BASE_URL}${data.signPath[0].initial}` : null
      );
      PNPKICertUpload.setFileUrl(
        data.signPath?.[0]?.pnpkicert ? `${BASE_URL}${data.signPath[0].pnpkicert}` : null
      );

      // Initialize PNPKI password if available
      setPnpkiPassword(data.signPath?.[0]?.pnpkiPassword || '');

      formik.setValues({
        firstName: data.firstName || '',
        middleIntl: data.middleIntl || '',
        lastName: data.lastName || '',
        username: data.username || '',
        password: '',
        role: data.role || [],
        officeId: data.officeId || null,
        unitId: data.unitId || null,
        status: data.status || false
      });
    }
  }, [data]);

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
      title="Update User"
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
              <Box
                sx={{
                  backgroundColor: '#ffebee',
                  border: '1px solid #f44336',
                  borderRadius: '8px',
                  m: 2,
                  p: 2
                }}
              >
                <Typography sx={{ color: '#d32f2f', fontWeight: 500 }}>{error}</Typography>
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
                    value={formik?.values?.middleIntl}
                    onChange={e => {
                      const { value } = e.target;
                      // Allow only alphabetic characters and limit to 2 letters
                      if (/^[a-zA-Z]{0,2}$/.test(value)) {
                        formik.setFieldValue('middleIntl', value);
                      }
                    }}
                    onBlur={formik.handleBlur}
                    error={formik?.touched?.middleIntl && Boolean(formik?.errors?.middleIntl)}
                    helperText={formik?.touched?.middleIntl && formik?.errors?.middleIntl}
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
                  <TextField
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    value={formik?.values?.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik?.touched?.password && Boolean(formik?.errors?.password)}
                    helperText={formik?.touched?.password && formik?.errors?.password}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex' }}>
                          <Tooltip title="Generate Password" placement="top">
                            <IconButton
                              onClick={generateRandomPassword}
                              sx={{
                                color: '#1f1f1f',
                                '&:hover': {
                                  backgroundColor: '#a2cb6b',
                                  color: '#1f1f1f'
                                }
                              }}
                            >
                              <ChangeCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            sx={{
                              color: '#1f1f1f',
                              '&:hover': {
                                backgroundColor: '#a2cb6b',
                                color: '#1f1f1f'
                              }
                            }}
                          >
                            {showPassword ? (
                              <VisibilityIcon size={18} />
                            ) : (
                              <VisibilityOffIcon size={18} />
                            )}
                          </IconButton>
                        </Box>
                      ),
                      sx: {
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 3
                        // mb: 2,
                      }}
                    >
                      <ImageUploadSection
                        title="Signature"
                        imageUrl={signatureUpload.imageUrl}
                        onUpload={signatureUpload.handleUpload}
                        onChoosePrevious={() => {
                          setSignType('signature');
                          setOpenPrevSignaturesModal(true);
                        }}
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
                        onChoosePrevious={() => {
                          setSignType('initial');
                          setOpenPrevSignaturesModal(true);
                        }}
                        onRemove={() => {
                          initialUpload.reset();
                        }}
                        uploadId="initial-upload"
                        loading={loading}
                      />

                      {/* <ImageUploadSection
                      title="PNPKI Certificate"
                      imageUrl={PNPKICertificateUpload.imageUrl}
                      onUpload={PNPKICertificateUpload.handleUpload}
                      onRemove={() => {
                        PNPKICertificateUpload.reset();
                      }}
                      uploadId="pnpki-certificate-upload"
                      loading={loading}
                    /> */}
                    </Box>
                    <Box>
                      <PNPKICertificateUploadSection
                        title="PNPKI Certificate"
                        fileUrl={PNPKICertUpload.fileUrl}
                        onUpload={PNPKICertUpload.handleUpload}
                        onChoosePrevious={() => {
                          setSignType('pnpki');
                          // setOpenPrevCertificatesModal(true);
                        }}
                        onRemove={() => {
                          PNPKICertUpload.reset();
                          setPnpkiPassword(''); // Clear password when removing certificate
                        }}
                        uploadId="pnpki-certificate-upload"
                        loading={loading}
                        password={pnpkiPassword}
                        onPasswordChange={e => setPnpkiPassword(e.target.value)}
                        showPassword={showPnpkiPassword}
                        setShowPassword={setShowPnpkiPassword}
                      />
                    </Box>
                  </Box>
                </FormSection>
              )}

              {/* Biometric Sections */}
              <FormSection title="Other Authentication">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2
                  }}
                >
                  <BiometricSection
                    title="Fingerprint"
                    enabled={enableFingerprint}
                    onToggle={e => setEnableFingerprint(e.target.checked)}
                    onRegister={handleRegisterFingerprint}
                    onRemove={() => {
                      setFingerprintData(null);
                      setEnableFingerprint(false);
                      setFingerprintChanged(true);
                    }}
                    hasNewData={fingerprintData}
                    hasOldData={formik?.values?.fingerprintData}
                    icon={FingerprintIcon}
                    registerText="Register Fingerprint"
                  />

                  <BiometricSection
                    title="Face Recognition"
                    enabled={enableFaceRecog}
                    onToggle={e => setEnableFaceRecog(e.target.checked)}
                    onRegister={handleRegisterFace}
                    onRemove={() => {
                      setFaceData(null);
                      setEnableFaceRecog(false);
                      setFaceDataChanged(true);
                    }}
                    hasNewData={faceData}
                    hasOldData={formik?.values?.faceData}
                    icon={SentimentSatisfiedAltIcon}
                    registerText="Register Face"
                  />
                </Box>
              </FormSection>

              {/* Status */}
              <FormSection title="User Status">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        color="primary"
                        checked={formik.values.status}
                        onChange={e => formik.setFieldValue('status', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#1f1f1f'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#1f1f1f'
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#666', fontWeight: 500 }}>
                        {formik.values.status ? 'Active' : 'Inactive'}
                      </Typography>
                    }
                  />
                </Box>
              </FormSection>
            </Box>
          </Box>

          {/* Submit Button */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              p: 3,
              pt: 2,
              borderRadius: '0 0 16px 16px'
            }}
          >
            <Button
              disabled={!isFormValid}
              type="submit"
              startIcon={<SaveIcon />}
              sx={{
                backgroundColor: !isFormValid ? '#e0e0e0' : '#09504a',
                color: !isFormValid ? '#999' : '#fff',
                py: 1,
                px: 2,
                width: '10rem',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: !isFormValid ? '#e0e0e0' : '#a2cb6b',
                  color: !isFormValid ? '#999' : '#1f1f1f'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#999'
                }
              }}
            >
              Update User
            </Button>
          </Box>
        </Box>
      </Box>
    </LPSModal>
  );
}
