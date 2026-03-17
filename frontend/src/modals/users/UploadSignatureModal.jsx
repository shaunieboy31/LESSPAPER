/* eslint-disable no-param-reassign */
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Modal,
  Tooltip,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';

import CancelIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useEffect, useState } from 'react';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';
import { useStateContext } from 'contexts/ContextProvider';
import ModalHeaderBackground from 'components/CustomUI/ModalHeader';

const style = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  position: 'absolute',
  backgroundColor: '#f0f0f0',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  overflow: 'auto',
  // Mobile first approach
  height: '95vh',
  width: '95vw',
  '@media (min-width: 480px)': {
    height: '90vh',
    width: '90vw'
  },
  '@media (min-width: 640px)': {
    height: '85vh',
    width: '85vw'
  },
  '@media (min-width: 768px)': {
    height: '80vh',
    width: '80vw'
  },
  '@media (min-width: 1024px)': {
    height: '75vh',
    width: '70vw'
  },
  '@media (min-width: 1200px)': {
    height: '70vh',
    width: '65vw'
  }
};

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
      // console.error(err);
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

function ImageUploadSection({ title, imageUrl, onUpload, onRemove, uploadId, loading = false }) {
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
              maxWidth: { xs: '150px', sm: '180px', md: '200px' },
              maxHeight: { xs: '150px', sm: '180px', md: '200px' },
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
                fontWeight: 500,
                fontSize: { xs: '14px', sm: '16px' },
                py: { xs: 1.5, sm: 1 },
                px: { xs: 2, sm: 1.5 }
              }}
            >
              Upload {title}
            </Button>
          </label>
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
                fontWeight: 500,
                fontSize: { xs: '14px', sm: '16px' },
                py: { xs: 1.5, sm: 1 },
                px: { xs: 2, sm: 1.5 }
              }}
            >
              Upload {title}
            </Button>
          </label>
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

function FormSection({ title, subtitle, children, sx = {} }) {
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        p: { xs: 2, sm: 3 },
        mb: { xs: 2, sm: 3 },
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
          fontSize: { xs: '1rem', sm: '1.1rem' },
          pb: 1,
          display: 'inline-block'
        }}
      >
        {title}
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: '#1f1f1f',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              mt: 0.5,
              display: 'block'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}

export default function UploadSignatureModal({
  open,
  handleClose,
  dataFromActions,
  updateTableFunction
}) {
  const { BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [rowData, setRowData] = useState();

  // Image upload hooks
  const signatureUpload = useImageUpload();
  const initialUpload = useImageUpload();

  const PNPKICertUpload = useFileUpload();

  const [pnpkiPassword, setPnpkiPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // const [disabled, setDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUploadSignature = () => {
    setLoading(true);
    setError('');

    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Are you sure you want to set this as the ${rowData?.firstName}'s signature`
    );

    if (confirmed) {
      const formData = new FormData();

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

      axiosPrivate
        .put(`/user/uploadSignature/${rowData?.uid}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(res => {
          const { data } = res;

          enqueueSnackbar('User Signature Updated', {
            variant: 'success'
          });
          handleClose();
          updateTableFunction();

          localStorage.setItem('authInfo', JSON.stringify(data?.data));

          setRowData(null);
        })
        .catch(err => {
          setError(err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (dataFromActions) {
      let data;

      if (Array.isArray(dataFromActions) && dataFromActions.length > 0) {
        [data] = dataFromActions;
      } else {
        data = dataFromActions;
      }

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

      setRowData(data);
    }
  }, [dataFromActions]);

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setError('');
      }}
      aria-labelledby="upload-signature-modal"
      aria-describedby="upload-signature-modal-description"
    >
      <Box sx={style}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              borderRadius: '10px'
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}
        <Box>
          <Box // Fixed Header
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              px: 7,
              mb: 2,
              overflow: 'hidden', // ensures SVG doesn't spill
              height: '80px', // adjust to match SVG shape
              '@media (max-width: 380px)': {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                mr: 0
              }
            }}
          >
            <ModalHeaderBackground />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Poppins',
                  fontSize: { xs: '20px', sm: '22px', md: '25px' },
                  color: '#fff',
                  py: 1
                }}
              >
                Upload Signature
              </Typography>
              <IconButton onClick={handleClose} sx={{ color: '#fff', p: 0, m: 0 }}>
                <CancelIcon />
              </IconButton>
            </Box>
          </Box>
          {error && (
            <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
              <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
            </Box>
          )}
          <Box
            sx={{
              m: { xs: 2, sm: 3, md: 4 }
            }}
          >
            <FormSection
              title="Signatures"
              subtitle="Please upload only png files and keep it to 600px width and 500px height"
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(auto-fit, minmax(280px, 1fr))',
                      md: 'repeat(auto-fit, minmax(300px, 1fr))'
                    },
                    gap: { xs: 2, sm: 3 }
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
                <Box>
                  <PNPKICertificateUploadSection
                    title="PNPKI Certificate"
                    fileUrl={PNPKICertUpload.fileUrl}
                    onUpload={PNPKICertUpload.handleUpload}
                    onRemove={() => {
                      PNPKICertUpload.reset();
                      setPnpkiPassword(''); // Clear password when removing certificate
                    }}
                    uploadId="pnpki-certificate-upload"
                    loading={loading}
                    password={pnpkiPassword}
                    onPasswordChange={e => setPnpkiPassword(e.target.value)}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                </Box>
              </Box>
            </FormSection>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 2, sm: 3 },
            zIndex: 10
          }}
        >
          <Button
            onClick={() => handleUploadSignature()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#09504a',
              color: '#fff',
              py: { xs: 1.5, sm: 1 },
              px: { xs: 3, sm: 2 },
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: '100px' },
              fontSize: { xs: '16px', sm: '14px' },
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
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
