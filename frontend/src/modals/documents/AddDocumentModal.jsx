/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  // CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  // Modal,
  Radio,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { RxLetterCaseCapitalize } from 'react-icons/rx';

import { useEffect, useState, useRef } from 'react';
import { number, object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import SelectDocType from 'components/Textfields/SelectDocType';
import { useStateContext } from 'contexts/ContextProvider';
import SelectDestinations from 'components/Textfields/SelectDestinations';

import { toast } from 'react-toastify';
import LPSModal from 'layouts/ModalLayout';
import { Info as InfoIcon } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import DocumentPreviewModal from '../miscellaneous/DocumentPreviewModal';

dayjs.extend(utc);
dayjs.extend(timezone);

// const style = {
//   display: "flex",
//   flexDirection: "column",
//   justifyContent: "space-between",
//   position: "absolute",
//   backgroundColor: "#f0f0f0",
//   height: "90vh",
//   width: "80vw",
//   gap: 2,
//   // background:
//   //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
//   //   border: "solid 2px #46e3be",
//   boxShadow: "3px 2px 20px 3px rgba(0, 0, 0, 0.3)",
//   borderRadius: "10px",
//   top: "50%",
//   left: "50%",
//   transform: "translate(-50%, -50%)",

//   "@media (max-width: 680px)": {
//     width: "95vw",
//   },
// };

export default function AddDocumentModal({ open, handleClose, updateTableFunction, loadingState }) {
  const { auth, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [file, setFile] = useState();
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [docType, setDocType] = useState('');
  const [destinations, setDestinations] = useState([{ id: null, destination: null, type: null }]);

  const [isReadable, setIsReadable] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  const [destinationErrorMssg, setDestinationErrorMssg] = useState([]);

  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);
  const [systemSettings, setSystemSettings] = useState({});

  const fileInputRef = useRef();

  // const SDSSecIds = [4];
  // const ASDSSecIds = [7];

  const displayDestinationError = (id, text) => {
    setDestinationErrorMssg(prevErrors => ({
      ...prevErrors,
      [id]: text
    }));
    setTimeout(() => {
      setDestinationErrorMssg(prevErrors => ({
        ...prevErrors,
        [id]: ''
      }));
    }, 3000);
  };

  const handleDestinations = (index, value) => {
    setDestinations(prevResponse => {
      const newDestination = [...prevResponse];

      if (!value.id || !value.destination) {
        displayDestinationError(index, 'Destination Required');
      }

      if (newDestination.some(dest => dest.id === value?.id && dest.type === value?.type)) {
        newDestination[index] = { id: null, destination: null };
        displayDestinationError(index, 'Destination already chosen');
      } else {
        newDestination[index] = value || {
          id: null,
          destination: null,
          type: null
        };
      }
      return newDestination;
    });
  };

  const formik = useFormik({
    initialValues: {
      docType: '',
      title: '',
      annotation: '',
      classification: auth?.officeId === 1 ? 1 : 5,
      complexity: 1
    },

    validationSchema: object().shape({
      docType: string().required('Required'),
      title: string().required('Required'),
      annotation: string(),
      classification: number(),
      complexity: number()
    }),
    onSubmit: values => {
      if (
        values?.classification &&
        values?.classification === 5 &&
        destinations?.some(dest => ['sds', 'asds'].includes(dest?.destination.toLowerCase()))
      ) {
        toast.error(
          "Documents not uploaded. Only documents classified as 'For signing' or 'For routing' are allowed to be submitted to SDS and ASDS.",
          {
            position: 'top-right',
            autoClose: 10000, // Auto-close after 10 seconds
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: 'light'
          }
        );
      } else {
        const confirmed = window.confirm('Are you sure you want to upload this document?');

        if (confirmed) {
          setLoading(true);
          setError('');

          const formData = new FormData();
          formData.append('file', file);

          if (destinations?.map(dest => dest.id).includes(auth?.unitId)) {
            formData.append('acceptStatus', 1);
            formData.append('status', 7);
          } else {
            formData.append('status', 1);
          }

          formData.append(
            'primarySources',
            JSON.stringify(
              auth?.officeId === 1
                ? [
                    {
                      id: auth?.unitId,
                      destination: auth?.unitName,
                      type: 'unit'
                    }
                  ]
                : [
                    {
                      id: auth?.officeId,
                      destination: auth?.officeName,
                      type: 'office'
                    }
                  ]
            )
          );
          formData.append(
            'lastSource',
            JSON.stringify(
              auth?.officeId === 1
                ? [
                    {
                      id: auth?.unitId,
                      destination: auth?.unitName,
                      type: 'unit'
                    }
                  ]
                : [
                    {
                      id: auth?.officeId,
                      destination: auth?.officeName,
                      type: 'office'
                    }
                  ]
            )
          );
          formData.append(
            'remarks',
            `Uploaded by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          );
          formData.append(
            'currentOwner',
            JSON.stringify([
              {
                id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId !== 1 ? 'office' : 'unit'
              }
            ])
          );
          formData.append('destinations', JSON.stringify(destinations));
          formData.append(
            'uploadedBy',
            JSON.stringify({
              id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
              destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
              type: auth?.officeId !== 1 ? 'office' : 'unit'
            })
          );
          formData.append('isReadable', isReadable);

          // const action = [
          //   ...checkedItems.action,
          //   { prepare: checkedItems.prepare },
          // ];

          formData.append(
            'action',
            JSON.stringify({
              action: [],
              prepare: []
            })
          );

          Object.keys(values).forEach(key => {
            if (key === 'docType') {
              if (docType) {
                return formData.append(key, docType);
              }
              return formData.append(key, values[key]);
            }
            if (key === 'annotation') {
              return formData.append(
                key,
                JSON.stringify({
                  annotation: values[key],
                  annotatedBy: `${auth?.firstName} ${auth?.lastName} from ${
                    auth?.officeId === 1 ? auth?.unitName : auth?.officeName
                  }`
                })
              );
            }
            if (values[key]) {
              return formData.append(key, values[key]);
            }
            return null;
          });

          axiosPrivate
            .post('/documents/addDocument', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            .then(res => {
              const generatedDocument = res?.data;

              // Show success toast that auto-closes after 5 seconds
              toast.success(`Uploaded: ${generatedDocument?.lpsNo}`, {
                position: 'top-right',
                autoClose: 10000, // Auto-close after 10 seconds
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: false,
                progress: undefined,
                theme: 'light'
              });

              enqueueSnackbar('Document Added', {
                variant: 'success'
              });
              formik.resetForm();
              setFile(null);
              updateTableFunction();
              handleClose();
              setIsReadable(0);

              if (auth?.officeId !== 1) {
                setDestinations([
                  {
                    id: 12,
                    destination: 'ASU - Records',
                    type: 'unit'
                  }
                ]);
              } else {
                setDestinations([{ id: null, destination: null, type: null }]);
              }
            })
            .catch(err => {
              setError(err?.message);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      }
    }
  });

  const handleUpload = async event => {
    try {
      setLoading(true);
      const uploadedFile = event.target.files[0];

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('classification', formik.values.classification);

      axiosPrivate
        .post('/documents/validateDocument', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(res => {
          if (res?.data?.isReadable) {
            setIsReadable(1);
          }

          const url = URL.createObjectURL(uploadedFile);
          setFilePreviewUrl(url);

          setFile(uploadedFile);
          setFileError('');
        })
        .catch(err => {
          setFileError(
            err.response?.data?.message ||
              err.response?.data?.error ||
              'Error: Uploaded file invalid'
          );
          setFile(null);
          event.target.value = null;
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      setFileError('Error: Invalid PDF file.');
      setFile(null);
      event.target.value = null;
      setLoading(false);
    }
  };

  const toCamelCase = () => {
    const currentTitle = formik.values.title;

    const formattedTitle = currentTitle.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

    formik.setFieldValue('title', formattedTitle);
  };

  const loadSystemSettings = async () => {
    try {
      const response = await axiosPrivate.get('/documents/system-settings');
      const settingsMap = {};

      response.data.forEach(setting => {
        if (setting.value === 'true' || setting.value === 'false') {
          settingsMap[setting.key] = setting.value === 'true';
        } else {
          settingsMap[setting.key] = setting.value;
        }
      });

      setSystemSettings(settingsMap);
    } catch (err) {
      console.error('Error loading system settings:', err);
    }
  };

  // Load system settings on modal open
  useEffect(() => {
    if (open) {
      loadSystemSettings();
    }
  }, [open]);

  useEffect(() => {
    const { annotation, ...otherValues } = formik.values;
    const areAllValuesFilled = Object.values(otherValues).every(value => !!value);

    let docTypeIsFilled = false;

    if (formik.values.docType === 'Others') {
      if (docType) {
        docTypeIsFilled = true;
      }
    } else {
      docTypeIsFilled = true;
    }

    const areAllDestinationsFilled = destinations.every(obj =>
      Object.values(obj).every(val => val !== undefined && val !== null && val !== '')
    );

    setDisabled(
      !areAllValuesFilled || !docTypeIsFilled || !areAllDestinationsFilled || isCutoffLocked
    );
  }, [formik.values, file, docType, destinations]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (auth?.officeId !== 1) {
      setDestinations([{ id: 12, destination: 'ASU - Records', type: 'unit' }]);
    }
  }, [auth]);

  useEffect(() => {
    if (formik.values.classification === 1) {
      setFileError('');
      setFile(null);
      setFilePreviewUrl(null);
      setIsReadable(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    }
  }, [formik.values.classification]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Add Document"
      width="1300px"
      headerColor="#09504a"
      loading={loading}
      error={error}
      withSpacing
      buttons={[
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => formik.handleSubmit()}
          disabled={disabled}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: disabled ? 'lightgray' : '#09504a',
            color: '#fff',
            py: 1,
            px: 2,
            // width: "10vw",
            // minWidth: "100px",
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          Add Document
        </Button>
      ]}
    >
      <Grid container spacing={0} sx={{ gap: 2, backgroundColor: '#fff' }}>
        {openDocPreviewModal && (
          <DocumentPreviewModal
            description="Document Preview"
            setOpenDocPreviewModal={setOpenDocPreviewModal}
            filePath={filePreviewUrl || null}
          />
        )}

        <Box
          sx={{
            border: 'solid 1px #b6b6b6',
            borderRadius: 4,
            width: '100%',
            p: 2
          }}
        >
          <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', mb: 2 }}>
            <Box
              sx={{
                width: formik.values.docType === 'Others' ? '50%' : '100%',
                minWidth: '200px'
              }}
            >
              <SelectDocType
                label="Document Type"
                name="docType"
                disabled={loading}
                value={formik.values.docType}
                onChange={(fieldName, selectedValue) => {
                  formik.setFieldValue('docType', selectedValue);

                  if (selectedValue !== 'Others') {
                    setDocType('');
                  }
                }}
                onBlur={formik.handleBLur}
                error={formik.touched.docType && Boolean(formik.errors.docType)}
                helperText={formik.touched.docType && formik.errors.docType}
                sx={{
                  width: '100%',
                  pr: formik.values.docType === 'Others' ? 3 : 0,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black !important'
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ width: '50%', minWidth: '200px' }}>
              {formik.values.docType === 'Others' ? (
                <TextField
                  name="otherDocTypes"
                  label="Specify Document Type"
                  size="small"
                  disabled={loading}
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  variant="standard"
                  fullWidth
                  sx={{
                    mt: -0.5
                    // ml: -4,
                  }}
                />
              ) : (
                <Box />
              )}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Document Title/Details"
              variant="outlined"
              disabled={loading}
              size="small"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBLur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
              multiline
              rows={4}
              sx={{
                width: '100%',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'black !important'
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <Tooltip title="Camel Case" placement="top">
                    <IconButton onClick={() => toCamelCase()}>
                      <RxLetterCaseCapitalize />
                    </IconButton>
                  </Tooltip>
                )
              }}
            />
          </Grid>
        </Box>
        {destinations?.map(dest => dest.id).includes(auth?.unitId) &&
          destinations.some(dest => !!dest.id) && (
            <Typography sx={{ color: 'red' }}>
              NOTE: This document will automatically be for your initial/signature
            </Typography>
          )}
        <Box
          sx={{
            width: '100%',
            background: '#fff',
            border: 'solid 1px #b6b6b6',
            borderRadius: 4,
            p: 2
          }}
        >
          <Box
            sx={{
              display: 'flex'
            }}
          >
            <Box
              sx={{
                width: '100%'
              }}
            >
              <Typography
                sx={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'gray',
                  mb: 2
                }}
              >
                Destination/s:
              </Typography>
              <Grid
                container
                spacing={2}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                {destinations?.map((destination, index) => (
                  <Grid item xs={destinations.length > 1 ? 6 : 12}>
                    <SelectDestinations
                      label={`Destination ${index + 1}`}
                      disabled={loading}
                      value={destination?.id}
                      onChange={(fieldName, selectedValue) => {
                        handleDestinations(index, selectedValue);
                      }}
                      onBlur={formik.handleBLur}
                      error={Boolean(destination?.id === '')}
                      helperText={
                        <span style={{ color: 'red' }}>{destinationErrorMssg[index]}</span>
                      }
                      addSpecificDestinations={
                        open &&
                        auth?.role?.some(role => ['secretary'].includes(role)) &&
                        auth?.relatedUnits
                      }
                      restrictOwnDestination={auth?.officeId !== 1 ? 'office' : 'unit'}
                      sx={{
                        width: '100%',
                        pr: 3,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'black !important'
                          }
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ textAlign: 'end' }}>
              <Tooltip title="Add Destination" placement="right">
                <IconButton
                  onClick={() =>
                    setDestinations(prev => [...prev, { id: '', destination: '', type: '' }])
                  }
                  sx={{
                    backgroundColor: '#4ea82b',
                    color: '#fff',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: '#0ed145'
                    }
                  }}
                >
                  <AddIcon sx={{ fontWeight: 'bold' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Destination" placement="right">
                <IconButton
                  disabled={destinations.length < 2}
                  onClick={() => setDestinations(prev => prev.slice(0, -1))}
                  sx={{
                    backgroundColor: destinations.length < 2 ? 'lightgray' : 'red',
                    border: destinations.length < 2 && 'solid 1px #f28c8c',
                    color: destinations.length < 2 ? 'black' : '#fff',
                    '&:hover': {
                      backgroundColor: '#e54c51'
                    }
                  }}
                >
                  <RemoveIcon sx={{ fontWeight: 'bold' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'block',
            justifyContent: 'space-between',
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            borderRadius: 4,
            width: '100%',
            p: 2
          }}
        >
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: 'gray'
            }}
          >
            Classification:
          </Typography>
          <FormControl>
            <FormGroup
              row
              sx={{
                p: '16px 0 0 16px',
                gap: 2
              }}
            >
              {[
                { label: 'For Signing', value: 1 },
                ...(auth?.officeId === 1 ? [{ label: 'For Routing', value: 2 }] : []),
                {
                  label: 'For Submission',
                  value: 5
                }
              ].map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Radio
                      color="success"
                      checked={formik.values.classification === option.value}
                      onChange={() => {
                        formik.setFieldValue('classification', option.value);
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontWeight:
                          formik.values.classification === option.value ? 'bold' : 'normal',
                        color: formik.values.classification === option.value ? 'green' : 'gray'
                      }}
                    >
                      {option.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>

        <Box
          sx={{
            display: 'block',
            justifyContent: 'space-between',
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            borderRadius: 4,
            width: '100%',
            p: 2
          }}
        >
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: 'gray'
            }}
          >
            Complexity:
          </Typography>
          <FormControl>
            <FormGroup
              row
              sx={{
                p: '16px 0 0 16px',
                gap: 2
              }}
            >
              {[
                { label: 'Simple', value: 1 },
                { label: 'Complex', value: 2 },
                // { label: "Urgent", value: 3 },
                ...(auth?.officeId === 1 ? [{ label: 'Urgent', value: 3 }] : []),
                { label: 'Highly Technical', value: 4 }
              ].map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Radio
                      color="success"
                      checked={formik.values.complexity === option.value}
                      onChange={() => {
                        formik.setFieldValue('complexity', option.value);
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontWeight: formik.values.complexity === option.value ? 'bold' : 'normal',
                        color: formik.values.complexity === option.value ? 'green' : 'gray'
                      }}
                    >
                      {option.label}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>

        {fileError && (
          <Box sx={{ backgroundColor: 'red', width: '100%', px: 1 }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{fileError}</Typography>
          </Box>
        )}
        <Box
          sx={{
            background: '#fff',
            border: 'solid 1px #b6b6b6',
            borderRadius: 4,
            width: '100%',
            // mb: 2,
            p: 2
          }}
        >
          <Typography
            sx={{
              fontSize: '15px',
              fontWeight: 'bold',
              color: 'gray'
            }}
          >
            Upload File (Optional):
          </Typography>

          {/* System Settings Indicator */}
          {formik.values.classification === 1 && !file && systemSettings.restrictDocsWithoutSDS && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 1,
                p: 1,
                backgroundColor: systemSettings.restrictDocsWithoutSDS ? '#e8f5e8' : '#fff3cd',
                border: `1px solid ${
                  systemSettings.restrictDocsWithoutSDS ? '#4caf50' : '#ffc107'
                }`,
                borderRadius: '4px'
              }}
            >
              <InfoIcon
                sx={{
                  color: systemSettings.restrictDocsWithoutSDS ? '#4caf50' : '#ffc107',
                  fontSize: '20px'
                }}
              />
              <Typography variant="body2" sx={{ color: '#1f1f1f' }}>
                {`Documents must contain the Superintendent's name to be
                  uploaded.`}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              display: 'flex',
              // justifyContent: "space-between",
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 2,
              gap: 2
            }}
          >
            <Box
              sx={{
                borderRadius: '4px',
                border: 'solid 1px #b6b6b6',
                width: '25vw',
                minWidth: '200px',
                color: file?.name ? 'black' : '#757575',
                py: '8px',
                px: '12px'
                // mr: 2,
              }}
            >
              <Typography>{file?.name || 'No file chosen'}</Typography>
            </Box>
            <Button
              htmlFor={loading ? null : 'docUpload'}
              sx={{
                backgroundColor: loading ? '#1f1f1f' : '#2f2f2f',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '5px',
                '&:hover': {
                  boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)',
                  backgroundColor: '#a2cb6b',
                  color: '#1f1f1f',
                  fontWeight: 'bold'
                }
              }}
            >
              <Typography
                variant="label"
                component="label"
                htmlFor={loading ? null : 'docUpload'}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 'small'
                }}
              >
                <UploadIcon sx={{ mr: 1 }} />
                CHOOSE FILE
              </Typography>
              <input
                id="docUpload"
                type="file"
                name="doc_upload"
                accept=".pdf,application/pdf"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: 'none' }}
              />
            </Button>

            {file && filePreviewUrl && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="View Uploaded Document" placement="top">
                  <IconButton onClick={() => setOpenDocPreviewModal(true)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Remove Attachment" placement="top">
                  <IconButton
                    onClick={() => {
                      setFile(null);
                      setFilePreviewUrl(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = null;
                      }
                    }}
                  >
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            // background: "#fff",
            width: '100%',
            borderRadius: 4,
            border: 'solid 1px #b6b6b6'
            // p: 2,
          }}
        >
          <TextField
            label="Annotation (Optional)"
            name="annotation"
            variant="outlined"
            disabled={loading}
            value={formik.values.annotation}
            onChange={formik.handleChange}
            onBlur={formik.handleBLur}
            error={formik.touched.annotation && Boolean(formik.errors.annotation)}
            helperText={formik.touched.annotation && formik.errors.annotation}
            multiline
            rows={4}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent !important'
              },
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent !important'
                }
              }
            }}
          />
        </Box>
      </Grid>
    </LPSModal>
  );
}
