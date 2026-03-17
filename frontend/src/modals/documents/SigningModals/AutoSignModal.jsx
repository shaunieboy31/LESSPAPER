/* eslint-disable no-alert */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Modal,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
  alpha,
  Backdrop
} from '@mui/material';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningIcon from '@mui/icons-material/Warning';
import { AiFillSignature } from 'react-icons/ai';

import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';
import { getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { enqueueSnackbar } from 'notistack';
import SignedDocumentPreviewModal from 'modals/miscellaneous/SignedDocumentPreviewModal';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  height: '98vh',
  width: '98vw',
  bgcolor: 'background.paper',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  borderRadius: '16px',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column'
};

export default function AutoSignModal({
  open,
  handleClose,
  pageToSign,
  setPageToSign,
  pdfUrl,
  loadingState,
  dataFromActions,
  setDataFromActions,
  updateTableFunction
}) {
  const { auth, BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate(null);
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [signPath, setSignPath] = useState();
  const [pdfPageImages, setPdfPageImages] = useState([]);
  const [showSignature, setShowSignature] = useState(false);
  const [signType, setSignType] = useState('sign');

  const [newDocUrl, setNewDocUrl] = useState();
  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const maxPage = dataFromActions?.numberOfPages;

  const reset = () => {
    setOpenDocPreviewModal(false);
    setPageToSign(null);
    setDataFromActions(null);
    setShowUndoConfirm(false);
    updateTableFunction();
    handleClose();
  };

  const handleSignDocu = async () => {
    const confirmed = window.confirm('Are you sure you want to sign this document?');

    if (confirmed) {
      setLoading(true);

      const { id, files, docType, primarySources } = dataFromActions;
      const primarySource = primarySources[0];

      const fileDocuments = files.some(dataFile => dataFile !== '') ? files : [];

      const fileName = fileDocuments[fileDocuments.length - 1];

      let destinations = [];

      if (auth.unitId === 1) {
        if (
          docType === 'Division Memorandum' ||
          docType === 'Office Memorandum' ||
          docType === 'Notice of Meeting- Internal' ||
          docType === 'Notice of Meeting- External' ||
          docType === 'Notice of Distribution' ||
          docType === 'Division Advisory' ||
          docType === 'Authority To Travel' ||
          docType === 'Travel Order' ||
          primarySources?.type !== 'unit'
        ) {
          destinations = [{ id: 12, destination: 'ASU - Records', type: 'unit' }];
        } else {
          destinations = [
            {
              id: primarySource?.id,
              destination: primarySource?.destination,
              type: primarySource?.type
            }
          ];
        }
      } else if (auth.unitId === 2) {
        if (
          docType === 'Division Memorandum' ||
          docType === 'Office Memorandum' ||
          docType === 'Notice of Meeting- Internal' ||
          docType === 'Notice of Meeting- External' ||
          docType === 'Notice of Distribution' ||
          docType === 'Authority To Travel' ||
          docType === 'Travel Order'
        ) {
          destinations = [
            { id: 1, destination: 'Schools Division Superintendent (SDS)', type: 'unit' }
          ];
        } else {
          destinations = [{ id: 7, destination: 'OASDS - Secretary', type: 'unit' }];
        }
      }

      const apiCall =
        auth.unitId === 1 && signType === 'sign'
          ? axiosPrivate.put(`/documents/signDocument/${id}`, {
              fileName,
              page: pageToSign,
              fullName: `${auth?.firstName} ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${
                auth?.lastName
              }`,
              titles: auth?.positions,
              signedBy: { id: auth?.unitId, destination: auth?.unitName },
              signPath,
              status: 1,
              destinations: destinations || null,
              lastSource:
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
                    },
              remarks: `Automatically signed by ${auth?.firstName} ${
                auth?.middleIntl ? `${auth?.middleIntl}. ` : ''
              }${auth?.lastName} from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`
            })
          : axiosPrivate.put(`/documents/initializeDocument/${id}`, {
              fileName,
              page: pageToSign,
              fullName: `${auth?.firstName} ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${
                auth?.lastName
              }`,
              titles: auth?.positions,
              initialBy: { id: auth?.unitId, destination: auth?.unitName },
              signPath,
              signType,
              status: auth?.role?.some(role => ['unit head', 'chief'].includes(role)) ? 3 : 1,
              ...(!auth?.role?.some(role => ['unit head', 'chief'].includes(role)) && {
                destinations: destinations || null,
                lastSource:
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
              }),
              remarks: `Initialized by ${auth?.firstName} ${
                auth?.middleIntl ? `${auth?.middleIntl}. ` : ''
              }${auth?.lastName} from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`
            });

      apiCall
        .then(res => {
          const { data } = res;

          setOpenDocPreviewModal(true);

          setNewDocUrl(
            data.files.length > 0 && data.files[data.files.length - 1]
              ? `${BASE_URL}/pdfUploads/${data.files[data.files.length - 1]}`
              : null
          );
        })
        .catch(err => {
          setError(err.response.data.error || 'Error: Something went wrong');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleAccept = () => {
    enqueueSnackbar('Changes accepted', {
      variant: 'success'
    });
    reset();
  };

  const handleUndo = async () => {
    setLoading(true);

    const { id, lastSource } = dataFromActions;

    await axiosPrivate
      .put(`/documents/undoLastDocumentAction/${id}`, {
        actionBy:
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
              },
        lastSource,
        remarks: `Undone by ${auth?.firstName} ${auth?.lastName} from ${
          auth?.officeId === 1 ? auth?.unitName : auth?.officeName
        }`
      })
      .then(() => {
        enqueueSnackbar('Last Document Action Undone', {
          variant: 'success'
        });
        reset();
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Error: Something went wrong');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  useEffect(() => {
    const signPaths = auth.signPath || null;

    if (auth.unitId === 1 && signType === 'sign') {
      setSignPath(signPaths ? signPaths[0]?.sign : null);
      setSignType('sign');
    } else {
      setSignPath(signPaths ? signPaths[0]?.initial : null);
      setSignType('initial');
    }

    if (open) {
      if (!pdfUrl && !loadingState && !open) {
        setError('PDF URL is undefined.');
        return;
      }
      setError('');

      if (pdfUrl && open) {
        setLoading(true);

        const loadingTask = getDocument({ url: pdfUrl });

        loadingTask.promise
          .then(async pdf => {
            const imagesContainer = [];
            const sizeContainer = {};

            const currentPage = await pdf.getPage(pageToSign);
            const viewport = currentPage.getViewport({ scale: 1 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.width = viewport.width;
            canvas.height = viewport.height;

            sizeContainer[pageToSign] = {
              width: canvas.width,
              height: canvas.height
            };

            await currentPage.render({
              canvasContext: context,
              viewport
            }).promise;

            const imgDataUrl = canvas.toDataURL('image/png');

            imagesContainer.push(imgDataUrl);

            setPdfPageImages(imagesContainer);
          })
          .catch(err => {
            // eslint-disable-next-line no-console
            console.error('Error loading PDF:', err);
            setError('Error loading PDF');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [open, pdfUrl, pageToSign]);

  useEffect(() => {
    const signPaths = auth.signPath || null;

    let selectedSignPath = '';

    if (signType === 'sign') {
      selectedSignPath = signPaths ? signPaths[0]?.sign : null;
    } else if (signType === 'initial') {
      selectedSignPath = signPaths ? signPaths[0]?.initial : null;
    }

    const fetchSignURL = async () => {
      try {
        const response = await fetch(`${BASE_URL}${selectedSignPath}`);

        if (!response.ok) {
          throw new Error('Failed to fetch the sign URL');
        }

        setSignPath(selectedSignPath);
      } catch (err) {
        setSignPath(null);
      }
    };

    if (open) {
      fetchSignURL();
    }
  }, [BASE_URL, signPath, signType, open]);

  const getSignTypeChip = () => {
    if (signType === 'sign') {
      return <Chip label="Signature" color="primary" size="small" />;
    }
    if (signType === 'initial') {
      return <Chip label="Initial" color="secondary" size="small" />;
    }
    return <Chip label="Signature" color="secondary" size="small" />;
  };

  const getActionLabel = () => {
    if (auth.unitId === 1 && signType === 'sign') {
      return 'Sign Document';
    }
    return signType === 'sign' ? 'Sign Document' : 'Affix Initial';
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 0,
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
      }}
    >
      <Box sx={modalStyle}>
        {openDocPreviewModal && (
          <SignedDocumentPreviewModal
            description="Newly Signed Document"
            shortDescription="Review the signed document for accuracy."
            setOpenDocPreviewModal={setOpenDocPreviewModal}
            filePath={newDocUrl}
            loadingState={loading}
            handleAccept={handleAccept}
            handleUndo={handleUndo}
            showUndoConfirm={showUndoConfirm}
            setShowUndoConfirm={setShowUndoConfirm}
            canUndo
          />
        )}
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AutoAwesomeIcon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main
                  }}
                />
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 0.5
                    }}
                  >
                    Auto-Detect Signing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    AI-powered signature placement for text documents
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <IconButton
              onClick={handleClose}
              disabled={loading}
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.error.main, 0.2)
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Paper>

        {/* Document Info */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <DocumentScannerIcon color="action" fontSize="small" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {dataFromActions?.title || 'Untitled Document'}
              </Typography>
            </Box>
            <Chip
              label={`Page ${pageToSign || 1} of ${maxPage || 1}`}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Paper>

        {/* Controls Section */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'center',
                flexWrap: 'wrap',
                flex: 1,
                gap: 2
              }}
            >
              {/* Signature Type */}
              <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 1 }} gap={2}>
                <Typography variant="body2" color="text.secondary">
                  Signature method:
                </Typography>
                {getSignTypeChip()}
                <Tooltip title="Switch signature type">
                  <Button
                    size="small"
                    onClick={() => {
                      setSignType(prev => {
                        if (prev === 'sign') {
                          return 'initial';
                        }
                        return 'sign';
                      });
                    }}
                    sx={{
                      borderRadius: '40%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <CachedIcon fontSize="small" />
                    Change
                  </Button>
                </Tooltip>
              </Stack>

              <Divider orientation="vertical" flexItem sx={{ height: 30 }} />

              {/* Signature Preview Toggle */}
              <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Preview:
                </Typography>
                <Tooltip title="View signature">
                  <IconButton
                    size="small"
                    onClick={() => setShowSignature(!showSignature)}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: showSignature
                        ? alpha(theme.palette.success.main, 0.1)
                        : alpha(theme.palette.grey[500], 0.1),
                      '&:hover': {
                        bgcolor: showSignature
                          ? alpha(theme.palette.success.main, 0.2)
                          : alpha(theme.palette.grey[500], 0.2)
                      }
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* Action Button */}
            <Button
              variant="contained"
              size="medium"
              startIcon={<AiFillSignature />}
              onClick={handleSignDocu}
              disabled={loading || !signPath}
              sx={{
                minWidth: { xs: '100%', sm: 160 },
                backgroundColor: '#1f1f1f',
                '&:hover': {
                  backgroundColor: '#a2cb6b',
                  color: '#1f1f1f'
                },
                '&:disabled': {
                  backgroundColor: alpha(theme.palette.grey[500], 0.3)
                }
              }}
            >
              {getActionLabel()}
            </Button>
          </Box>

          {/* Compact Info Messages */}
          {!signPath && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Chip
                icon={<WarningIcon />}
                label="No signature found"
                color="warning"
                variant="outlined"
                size="small"
              />
            </Stack>
          )}
        </Paper>

        {/* Error Display */}
        {error && (
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              mx: 2,
              mt: 2
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <WarningIcon color="error" />
              <Typography color="error" fontWeight={600}>
                {error}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            p: 2,
            bgcolor: alpha(theme.palette.grey[100], 0.3),
            position: 'relative'
          }}
        >
          {/* PDF Preview */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              overflow: 'auto'
            }}
          >
            {pdfUrl && open && pdfPageImages.length > 0 ? (
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  p: 1,
                  maxWidth: '100%',
                  border: 'solid 1px #000'
                }}
              >
                <img
                  src={pdfPageImages[0]}
                  alt={`Page ${pageToSign}`}
                  draggable="false"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block'
                  }}
                />
              </Paper>
            ) : (
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.grey[100], 0.5)
                }}
              >
                <DocumentScannerIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.grey[400],
                    mb: 1
                  }}
                />
                <Typography variant="body1" color="text.secondary">
                  Loading Document...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please wait while we prepare the document
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Compact Signature Preview Overlay */}
          {showSignature && (
            <Card
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 180,
                zIndex: 10
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Signature Preview
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 80,
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                    border: `1px dashed ${theme.palette.grey[300]}`,
                    borderRadius: 1
                  }}
                >
                  {signPath ? (
                    <img
                      src={`${BASE_URL}${signPath}`}
                      alt="Signature Preview"
                      draggable="false"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={0.5}>
                      <AiFillSignature
                        style={{
                          fontSize: 20,
                          color: theme.palette.grey[400]
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        No signature
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000
            }}
          >
            <CircularProgress sx={{ color: 'white', mb: 2 }} size={48} />
            <Typography variant="body1" sx={{ color: 'white' }}>
              Processing signature...
            </Typography>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
