/* eslint-disable no-param-reassign */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  // Checkbox,
  // CircularProgress,
  Divider,
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

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import EditOffIcon from '@mui/icons-material/EditOff';
import RemoveIcon from '@mui/icons-material/Remove';
import { RxLetterCaseCapitalize } from 'react-icons/rx';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useEffect, useState } from 'react';
import { number, object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import SelectDocType from 'components/Textfields/SelectDocType';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import SelectDestinations from 'components/Textfields/SelectDestinations';
import SelectDocStatus from 'components/Textfields/SelectDocStatus';
import DocumentPreviewModal from 'modals/miscellaneous/DocumentPreviewModal';
import LPSModal from 'layouts/ModalLayout';
import SelectAllDestinations from 'components/Textfields/SelectAllDestinations';

dayjs.extend(utc);
dayjs.extend(timezone);

// const style = {
//   display: "flex",
//   flexDirection: "column",
//   justifyContent: "space-between",
//   position: "absolute",
//   backgroundColor: "#f0f0f0",
//   height: "80vh",
//   width: "70vw",
//   // background:
//   //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
//   //   border: "solid 2px #46e3be",
//   boxShadow: "3px 2px 20px 3px rgba(0, 0, 0, 0.3)",
//   borderRadius: "10px",
//   top: "50%",
//   left: "50%",
//   transform: "translate(-50%, -50%)",
//   overflow: "auto",

//   "@media (max-width: 680px)": {
//     width: "95vw",
//   },
// };

export default function EditDocumentModal({
  open,
  handleClose,
  loadingState,
  selectedData,
  updateTableFunction
}) {
  const { auth, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [rowData, setRowData] = useState();
  const [disabled, setDisabled] = useState(false);
  const [docType, setDocType] = useState('');
  const [destinations, setDestinations] = useState([{ id: null, destination: null, type: null }]);
  const [currentOwner, setCurrentOwner] = useState([{ id: null, destination: null, type: null }]);

  const [annotations, setAnnotations] = useState([]);
  const [annotationBeingEdited, setAnnotationBeingEdited] = useState(null);

  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [changeFileOnly, setChangeFileOnly] = useState(false);
  const [file, setFile] = useState();
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [latestFile, setLatestFile] = useState('');
  const [isReadable, setIsReadable] = useState(0);

  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [destinationErrorMssg, setDestinationErrorMssg] = useState([]);

  const handleRunApi = data => {
    setLoading(true);
    setError('');

    let docuType;

    if (docType) {
      docuType = docType;
    } else {
      docuType = data.docType;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('changeFileOnly', changeFileOnly ? 1 : 0);
    formData.append('isReadable', isReadable);
    formData.append('docType', docuType);
    formData.append('title', data.title);
    formData.append('complexity', data.complexity);
    formData.append('classification', data.classification);
    formData.append('removeAttachment', removeAttachment);
    formData.append(
      'remarks',
      `${file ? 'File Updated and ' : ''}Revised by ${auth?.firstName} ${auth?.lastName} from ${
        auth?.officeId === 1 ? auth?.unitName : auth?.officeName
      }`
    );

    if (auth?.role?.some(role => ['admin'].includes(role))) {
      formData.append('destinations', JSON.stringify(destinations));
      formData.append('status', data.status);
      formData.append('acceptStatus', data.acceptStatus);
      formData.append('currentOwner', JSON.stringify(currentOwner));
    }

    if (latestFile) {
      formData.set('isReadable', `${data.isReadable}`);
    }

    axiosPrivate
      .put(`/documents/reviseDocument/${rowData?.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(() => {
        enqueueSnackbar('Document Updated', {
          variant: 'success'
        });
        setFile();
        setFileError('');
        setRemoveAttachment(false);
        // eslint-disable-next-line no-use-before-define
        formik.resetForm();
        updateTableFunction();
        handleClose();
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formik = useFormik({
    initialValues: {
      docType: '',
      title: '',
      classification: auth?.officeId === 1 ? 1 : 5,
      complexity: 1
    },

    validationSchema: object().shape({
      docType: string().required('Required'),
      title: string().required('Required'),
      classification: number(),
      complexity: number()
    }),
    onSubmit: values => {
      const confirmed = window.confirm('Are you sure you want to update this document?');

      if (confirmed) {
        if (removeAttachment) {
          const removeFileConfirmation = window.confirm(
            'You are about to remove the attached file. Are you sure you want to continue?'
          );
          if (removeFileConfirmation) {
            handleRunApi(values);
          }
        } else {
          handleRunApi(values);
        }
      }
    }
  });

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

  const handleUpload = async event => {
    try {
      setLoading(true);
      const uploadedFile = event.target.files[0];

      const formData = new FormData();
      formData.append('file', uploadedFile);

      axiosPrivate
        .post('/documents/validateDocument', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(res => {
          if (res?.data?.isReadable) {
            setIsReadable(1);
          } else {
            setIsReadable(0);
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

  const handleUpdateAnnotations = index => {
    const confirm = window.confirm('Are you sure you want to update this annotation?');

    if (confirm) {
      setLoading(true);

      axiosPrivate
        .put(`/documents/updateAnnotation`, {
          docuId: rowData.id,
          annotation: {
            ...annotations[index],
            annotatedBy: `${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          },
          remarks: `Annotation updated by ${auth?.firstName} ${auth?.lastName} from ${
            auth?.officeId === 1 ? auth?.unitName : auth?.officeName
          }`
        })
        .then(res => {
          enqueueSnackbar('Annotation Successfully Updated', {
            variant: 'success'
          });
          setAnnotations(prev => {
            const newAnnotations = prev;

            newAnnotations[index] = res.data;

            return newAnnotations;
          });
          setAnnotationBeingEdited(null);
          updateTableFunction();
        })
        .catch(err => {
          setError(err.response.data.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleDeleteAnnotations = index => {
    const confirm = window.confirm('Are you sure you want to delete this annotation?');

    if (confirm) {
      setLoading(true);

      axiosPrivate
        .delete(`/documents/deleteAnnotation`, {
          params: {
            annotationId: annotations[index].id
          }
        })
        .then(() => {
          enqueueSnackbar('Annotation Successfully Deleted');
          setAnnotations(prev => {
            const newAnnotations = prev.filter((_, i) => i !== index);

            return newAnnotations;
          });
          setAnnotationBeingEdited(null);
          updateTableFunction();
        })
        .catch(err => {
          setError(err.response.data.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    const areAllValuesFilled = Object.values(formik.values).every(value => !!value || value === 0);

    let docTypeIsFilled = false;

    if (formik.values.docType === 'Others') {
      if (docType) {
        docTypeIsFilled = true;
      }
    } else {
      docTypeIsFilled = true;
    }

    setDisabled(!areAllValuesFilled || !docTypeIsFilled || isCutoffLocked);
  }, [formik.values, docType]);

  useEffect(() => {
    if (selectedData) {
      if (Array.isArray(selectedData) && selectedData.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        setRowData(selectedData[0]);
      } else {
        setRowData(selectedData);
      }
    }
  }, [selectedData]);

  useEffect(() => {
    if (rowData) {
      const fileDocuments = rowData?.files?.some(files => files !== '') ? rowData.files : [];

      const lastFile = fileDocuments?.length > 0 ? fileDocuments[fileDocuments.length - 1] : null;

      setLatestFile(lastFile);

      if (rowData.destinations) {
        setDestinations(rowData?.destinations);
      }
      if (rowData.currentOwner) {
        setCurrentOwner(rowData?.currentOwner);
      }

      setAnnotations(rowData?.annotations);

      const initialValues = {
        docType: rowData?.docType || '',
        title: rowData?.title || '',
        complexity: rowData?.complexity || '',
        classification: rowData?.classification || '',
        ...(lastFile && {
          isReadable: rowData?.isReadable || 0
        }),
        ...(auth?.role?.some(role => ['admin'].includes(role)) && {
          status: rowData?.status || '',
          acceptStatus: rowData?.acceptStatus || 0
        })
      };
      formik.setValues(initialValues);
    }

    // if (auth?.role?.some((role) => ["secretary"].includes(role))) {
    //   auth?.relatedUnits.map((unit) => unit.id);
    // }
  }, [rowData]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  const toCamelCase = () => {
    const currentTitle = formik.values.title;

    const formattedTitle = currentTitle.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

    formik.setFieldValue('title', formattedTitle);
  };

  // console.log({ formik: formik?.values });

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Revise Document"
      headerColor="#09504a"
      width="1300px"
      loading={loading}
      error={error}
      withSpacing
      buttons={[
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
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
          Update
        </Button>
      ]}
    >
      <Grid container spacing={0} sx={{ gap: 4, backgroundColor: '#fff' }}>
        {openDocPreviewModal && (
          <DocumentPreviewModal
            description="Document Preview"
            setOpenDocPreviewModal={setOpenDocPreviewModal}
            filePath={filePreviewUrl || null}
          />
        )}
        {fileError && (
          <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{fileError}</Typography>
          </Box>
        )}

        <Box
          sx={{
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
            width: '100%',
            // mb: 2,
            p: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              // justifyContent: "space-between",
              alignItems: 'center',
              flexWrap: 'wrap',
              // background: "red",
              overflow: 'auto',
              mb: 2
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%'
              }}
            >
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'gray',
                  mr: 2
                }}
              >
                Current File:
              </Typography>
              <Box
                sx={{
                  borderRadius: '4px',
                  border: 'solid 1px #b6b6b6',
                  width: '100%',
                  // minWidth: "200px",
                  fontWeight: 'bold',
                  color: removeAttachment ? 'red' : selectedData?.fileName ? 'black' : '#757575',
                  py: '8px',
                  px: '12px',
                  mr: 2
                }}
              >
                <Typography>
                  {removeAttachment ? 'For removal' : latestFile || 'No file before'}
                </Typography>
              </Box>
              <Tooltip
                title={`${removeAttachment ? 'Cancel attachment removal' : 'Remove attachment'}`}
                placement="top"
              >
                <IconButton onClick={() => setRemoveAttachment(prev => !prev)}>
                  {removeAttachment ? <DeleteForeverIcon /> : <DeleteIcon />}
                </IconButton>
              </Tooltip>
            </Box>

            <Divider
              sx={{
                backgroundColor: 'lightgray',
                width: '100%',
                py: 0.1,
                my: 3
              }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'gray',
                  mr: 2
                }}
              >
                Upload new file:
              </Typography>
              <Box
                sx={{
                  borderRadius: '4px',
                  border: 'solid 1px #b6b6b6',
                  width: '25vw',
                  minWidth: '200px',
                  color: file?.name ? 'black' : '#757575',
                  py: '8px',
                  px: '12px',
                  mr: 2
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
                      }}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>

          {/* Search Options */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box htmlFor="changeFileOnly" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="checkbox"
                id="changeFileOnly"
                checked={changeFileOnly}
                onChange={() => setChangeFileOnly(!changeFileOnly)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              <Box>
                <Typography sx={{ fontSize: '12px', fontWeight: 'bold', color: 'gray' }}>
                  Replace File Only, Retain Signature Records
                </Typography>
                <Typography sx={{ fontSize: '10px', fontWeight: 'bold', color: 'gray' }}>
                  (Enable this option if you only want to update or replace the file while keeping
                  all existing signature records and related information intact.)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            width: '100%',
            p: 2
            // mb: 2,
          }}
        >
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
                mb: 2,
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
          <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
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
          {auth?.role?.some(role => ['admin'].includes(role)) && (
            <Grid item xs={12}>
              <SelectDocStatus
                label="Document Status"
                name="status"
                disabled={loading}
                value={formik.values.status}
                onChange={(fieldName, selectedValue) => {
                  formik.setFieldValue('status', selectedValue);
                }}
                onBlur={formik.handleBLur}
                error={formik.touched.status && Boolean(formik.errors.status)}
                helperText={formik.touched.status && formik.errors.status}
                sx={{
                  mt: 2,
                  width: '100%',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'black !important'
                    }
                  }
                }}
              />
            </Grid>
          )}
        </Box>

        {auth?.role?.some(role => ['admin'].includes(role)) && (
          <>
            <Box
              sx={{
                width: '100%',
                // background: "#fff",
                border: 'solid 1px #b6b6b6',
                p: 2
                // mb: 2,
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
                        {auth?.role?.some(role => ['admin'].includes(role)) ? (
                          <SelectAllDestinations
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
                        ) : (
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
                            // restrictOwnUnit
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
                        )}
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
                width: '100%',
                background: '#fff',
                border: 'solid 1px #b6b6b6',
                p: 2
                // mb: 2,
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
                Current Owner:
              </Typography>
              <SelectDestinations
                label="Current Owner"
                disabled={loading}
                value={currentOwner[0]?.id}
                onChange={(fieldName, selectedValue) => {
                  setCurrentOwner([selectedValue]);
                }}
                showSuperintendents
                onBlur={formik.handleBLur}
                error={!currentOwner[0]?.id}
                helperText={!currentOwner[0].id && 'Required'}
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
          </>
        )}

        {auth?.role?.some(role => ['admin'].includes(role)) && (
          <Box
            sx={{
              // background: "#fff",
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
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
              Accept Status:
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
                  { label: 'Accepted', value: 1 },
                  { label: 'Not Accepted', value: 0 }
                ].map(option => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Radio
                        color="success"
                        checked={formik.values.acceptStatus === option.value}
                        onChange={() => {
                          formik.setFieldValue('acceptStatus', option.value);
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontWeight:
                            formik.values.acceptStatus === option.value ? 'bold' : 'normal',
                          color: formik.values.acceptStatus === option.value ? 'green' : 'gray'
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
        )}

        {auth?.officeId === 1 && (
          <Box
            sx={{
              // background: "#fff",
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
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
                  { label: 'For Routing', value: 2 },
                  ...(auth?.role?.some(role => ['admin'].includes(role))
                    ? [
                        { label: 'For Checking', value: 3 },
                        { label: 'Routed', value: 4 }
                      ]
                    : []),
                  { label: 'For Submission', value: 5 }
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
        )}

        <Box
          sx={{
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
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

        {latestFile && (
          <Box
            sx={{
              // background: "#fff",
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
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
              Is the document scanned or an actual PDF:
            </Typography>
            <FormControl>
              <FormGroup
                column
                sx={{
                  p: '16px 0 0 16px',
                  gap: 2
                }}
              >
                {[
                  {
                    label: 'Scanned PDF (Image-Based) (Not Readable)',
                    value: 0
                  },
                  {
                    label: 'Digital PDF (Text-Based) (Readable)',
                    value: 1
                  }
                ].map(option => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Radio
                        color="success"
                        checked={formik.values.isReadable === option.value}
                        onChange={() => {
                          formik.setFieldValue('isReadable', option.value);
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontWeight: formik.values.isReadable === option.value ? 'bold' : 'normal',
                          color: formik.values.isReadable === option.value ? 'green' : 'gray'
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
        )}

        <Box
          sx={{
            // background: "#fff",
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
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
            Annotations:
          </Typography>
          {annotations?.map((e, index) => (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'nowrap',
                px: 2,
                position: 'relative'
              }}
            >
              {/* {annotationBeingEdited === index && (
            <Box sx={{ position: "absolute", top: 0, left: 0 }}>
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  // color: "#2f2f2f",
                  color: "blue",
                }}
              ></Typography>
            </Box>
          )} */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'nowrap'
                }}
              >
                <ArrowForwardIosIcon sx={{ fontSize: '15px' }} />
                <Box sx={{ p: 2 }}>
                  {annotationBeingEdited === index ? (
                    <TextField
                      label="Editing annotation..."
                      value={annotations[index].annotation}
                      onChange={evt => {
                        const newAnnotations = [...annotations];
                        newAnnotations[index] = {
                          ...newAnnotations[index],
                          annotation: evt.target.value
                        };
                        setAnnotations(newAnnotations);
                      }}
                      size="small"
                      fullWidth
                    />
                  ) : (
                    <Typography>{annotations[index].annotation}</Typography>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'gray',
                        mr: 1
                      }}
                    >
                      Annotated By:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: 'gray'
                      }}
                    >
                      {e?.annotatedBy}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap'
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: 'gray',
                        mr: 1
                      }}
                    >
                      Date of Annotation:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: 'gray'
                      }}
                    >
                      {` ${dayjs(e?.createdAt).format('MM/DD/YYYY - hh:mm A')}`}
                    </Typography>
                  </Box>
                  {e.dateUpdated && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap'
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: 'gray',
                          mr: 1
                        }}
                      >
                        Date Updated:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: 'gray'
                        }}
                      >
                        {` ${dayjs(e?.dateUpdated).format('MM/DD/YYYY - hh:mm A')}`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {annotationBeingEdited === index && (
                  <Tooltip title="Save" placement="top">
                    <IconButton onClick={() => handleUpdateAnnotations(index)}>
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {annotationBeingEdited === index && (
                  <Tooltip title="Cancel Editing Annotation" placement="top">
                    <IconButton
                      onClick={() => {
                        setAnnotations(rowData?.annotations);
                        setAnnotationBeingEdited(null);
                      }}
                    >
                      <EditOffIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {annotationBeingEdited === null && annotationBeingEdited !== index && (
                  <Tooltip title="Edit Annotation" placement="top">
                    <IconButton
                      onClick={() => {
                        setAnnotationBeingEdited(index);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {annotationBeingEdited === null && (
                  <Tooltip title="Remove Annotation" placement="top">
                    <IconButton onClick={() => handleDeleteAnnotations(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Grid>
    </LPSModal>
  );
}
