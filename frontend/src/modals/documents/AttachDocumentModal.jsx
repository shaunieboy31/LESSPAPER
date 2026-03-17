/* eslint-disable no-param-reassign */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  // CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  // Modal,
  Radio,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import CancelIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useEffect, useState } from 'react';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import LPSModal from 'layouts/ModalLayout';
import DocumentPreviewModal from '../miscellaneous/DocumentPreviewModal';

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

export default function AttachDocumentModal({
  open,
  handleClose,
  loadingState,
  selectedData,
  updateTableFunction
}) {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [file, setFile] = useState();
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [currentFile, setCurrentFile] = useState('');
  const [newFileName, setNewFileName] = useState();
  const [disabled, setDisabled] = useState(false);
  const [rowData, setRowData] = useState();
  const [documentPlacement, setDocumentPlacement] = useState('first');
  const [isReadable, setIsReadable] = useState(0);

  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [error, setError] = useState('');

  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to attach this file document to the existing document?'
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('files', JSON.stringify(rowData.files));
      formData.append('newFileName', `${newFileName}.pdf`);
      formData.append(
        'uploader',
        JSON.stringify(
          auth?.officeId === 1
            ? {
                id: auth?.unitId,
                destination: auth?.unitName,
                type: 'unit'
              }
            : {
                id: auth?.officeId,
                destination: auth?.officeName,
                type: 'office'
              }
        )
      );
      formData.append('documentPlacement', documentPlacement);
      formData.append('isReadable', isReadable);
      formData.append(
        'remarks',
        `Document attached by ${auth?.firstName} ${auth?.lastName} from ${
          auth?.officeId === 1 ? auth?.unitName : auth?.officeName
        }`
      );

      await axiosPrivate
        .put(`/documents/attachDocument/${rowData.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(() => {
          enqueueSnackbar(`File Document Updated`, {
            variant: 'success'
          });
          setFile(null);
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
          // console.log(res?.data?.isReadable, rowData?.isReadable === 0);

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

  useEffect(() => {
    setDisabled(!file);
  }, [file]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

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
    if (Array.isArray(rowData) ? rowData.length !== 0 : rowData) {
      const fileDocuments = rowData?.files.some(dataFile => dataFile !== '') ? rowData.files : [];

      const latestFile = fileDocuments[fileDocuments.length - 1];

      const formattedFilename = latestFile
        ? latestFile.replace(/^\d+-/, '').replace(/\.pdf/g, '')
        : null;

      setCurrentFile(formattedFilename);
      setNewFileName(formattedFilename);
    }
  }, [rowData]);

  useEffect(() => {
    if (file) {
      const formattedFilename = file?.name
        ? file.name.replace(/^\d+-/, '').replace(/\.pdf/g, '')
        : null;

      setNewFileName(formattedFilename);
    }
  }, [file]);

  // console.log({ documentPlacement });

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Attach Document"
      headerColor="#09504a"
      loading={loading}
      error={error}
      withSpacing
      buttons={[
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => handleSubmit()}
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
          Update File
        </Button>
      ]}
    >
      <Box>
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
            background: '#fff',
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
            width: '100%',
            mb: 2,
            p: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              // justifyContent: "space-between",
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 2,
              overflow: 'auto'
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
                  color: selectedData?.fileName ? 'black' : '#757575',
                  py: '8px',
                  px: '12px',
                  mr: 2
                }}
              >
                <Typography>{currentFile || 'No file before'}</Typography>
              </Box>
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
        </Box>

        <Box
          sx={{
            background: '#fff',
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
            width: '100%',
            mb: 2,
            p: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              // justifyContent: "space-between",
              alignItems: 'center',
              flexWrap: 'wrap',
              overflow: 'auto'
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
                New File Name:
              </Typography>
              <TextField
                sx={{ flex: 1, mr: 2 }}
                size="small"
                value={newFileName}
                onChange={evt => setNewFileName(evt.target.value)}
              />
            </Box>
          </Box>
        </Box>

        {file && (
          <Box
            sx={{
              display: 'block',
              justifyContent: 'space-between',
              background: '#fff',
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
              width: '100%',
              mb: 2,
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
              {`Is the SDS's name on the combined document readable? (Is it text-based and not image-based or a scanned document?):`}
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
                  { label: 'Yes', value: 1 },
                  { label: 'No', value: 0 }
                ].map(option => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Radio
                        color="success"
                        checked={isReadable === option.value}
                        onChange={() => {
                          setIsReadable(option.value);
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontWeight: isReadable === option.value ? 'bold' : 'normal',
                          color: isReadable === option.value ? 'green' : 'gray'
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
            display: 'block',
            justifyContent: 'space-between',
            background: '#fff',
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
            Where do you want to place your attached document:
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
                { label: 'First', value: 'first' },
                { label: 'Last', value: 'last' }
              ].map(option => (
                <FormControlLabel
                  key={option.value}
                  control={
                    <Radio
                      color="success"
                      checked={documentPlacement === option.value}
                      onChange={() => {
                        setDocumentPlacement(option.value);
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        fontWeight: documentPlacement === option.value ? 'bold' : 'normal',
                        color: documentPlacement === option.value ? 'green' : 'gray'
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
      </Box>
    </LPSModal>
  );
}
