/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Modal,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  alpha,
  Backdrop
} from '@mui/material';

import { AiFillSignature } from 'react-icons/ai';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import useAxiosPrivate from 'contexts/interceptors/axios';
import MobilePDFViewer from 'components/MobilePDFViewer';
import DocumentPreviewModal from '../miscellaneous/DocumentPreviewModal';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  height: '98vh',
  width: '98vw',
  // maxWidth: "1400px",
  bgcolor: 'background.paper',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  borderRadius: '16px',
  overflow: 'overflow',
  display: 'flex',
  flexDirection: 'column'
};

function SigningOption({ icon, title, subtitle, onClick, color = 'primary', disabled = false }) {
  const theme = useTheme();

  return (
    <Card
      onClick={disabled ? undefined : onClick}
      sx={{
        minWidth: { xs: 'calc(100% - 16px)', sm: 200, md: 250 },
        maxWidth: { xs: 'calc(100% - 16px)', sm: 250 },
        minHeight: { xs: 120, sm: 160, md: 180 },
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `2px solid ${alpha(theme.palette[color].main, 0.2)}`,
        borderRadius: { xs: '12px', sm: '16px' },
        backgroundColor: disabled ? alpha(theme.palette.grey[500], 0.1) : 'background.paper',
        mx: { xs: 1, sm: 0 },
        '&:hover': disabled
          ? {}
          : {
              transform: { xs: 'none', sm: 'translateY(-4px)' },
              boxShadow: `0 8px 25px ${alpha(theme.palette[color].main, 0.25)}`,
              border: `2px solid ${theme.palette[color].main}`
            },
        '&:active': disabled
          ? {}
          : {
              transform: { xs: 'scale(0.98)', sm: 'translateY(-2px)' }
            }
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          p: { xs: 1.5, sm: 2.5, md: 3 }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: { xs: 40, sm: 56, md: 64 },
            height: { xs: 40, sm: 56, md: 64 },
            borderRadius: '50%',
            backgroundColor: disabled
              ? alpha(theme.palette.grey[500], 0.2)
              : alpha(theme.palette[color].main, 0.1),
            color: disabled ? theme.palette.grey[500] : theme.palette[color].main,
            mb: { xs: 1, sm: 2 }
          }}
        >
          {React.cloneElement(icon, {
            sx: { fontSize: { xs: 20, sm: 28, md: 32 } }
          })}
        </Box>
        <Typography
          variant="h6"
          sx={{
            textWrap: 'wrap',
            fontWeight: { xs: 500, sm: 400 },
            mb: { xs: 0.25, sm: 1 },
            color: disabled ? 'text.disabled' : 'text.primary',
            fontSize: { xs: '0.9rem', sm: '1.25rem' },
            lineHeight: { xs: 1.2, sm: 1.3 }
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color={disabled ? 'text.disabled' : 'text.secondary'}
          sx={{
            textWrap: 'wrap',
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            lineHeight: { xs: 1.3, sm: 1.4 }
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ViewDocumentModal({
  open,
  handleClose,
  pageToSign = 1,
  setPageToSign = () => {},
  loadingState,
  setOpenViewModal,
  setOpenRouteModal,
  handleSignDocument,
  dataFromActions,
  setDataFromActions,
  updateTableFunction
}) {
  const { auth, BASE_URL, enableLimitNumberOfSignatories, maxNumberOfSignatories } =
    useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const theme = useTheme();

  const [rowData, setRowData] = useState();
  const [isSelecting, setIsSelecting] = useState(false);
  const [combinedSignatories, setCombinedSignatories] = useState([]);
  const [viewMode, setViewMode] = useState('auto');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [disableSigning, setDisableSigning] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [fileDocuments, setFileDocuments] = useState([]);

  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);

  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const [isPdfAvailable, setIsPdfAvailable] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const userRolesWithSignature = ['sds', 'asds', 'chief', 'unit head'];

  const maxPage = dataFromActions?.numberOfPages || 1;

  const location = useLocation();
  const isIncomingRoute = location.pathname === '/incoming';

  const pdfSrc = `${BASE_URL}/pdfUploads/${fileDocuments[fileDocuments.length - 1]}${
    isIncomingRoute ? '#toolbar=0' : ''
  }`;

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (dataFromActions) {
      if (Array.isArray(dataFromActions) && dataFromActions.length > 0) {
        setRowData(dataFromActions[0]);
      } else {
        setRowData(dataFromActions);
      }
    }
  }, [dataFromActions]);

  useEffect(() => {
    if (rowData) {
      const docAutoInitials = rowData?.autoInitials || [];
      const docManualInitials = rowData?.manualInitials || [];
      const docDestinations = rowData?.destinations || [];
      const docFileDocuments = rowData?.files?.some(file => file !== '') ? rowData.files : [];

      const autoAndManualSignatories = [...docAutoInitials, ...docManualInitials];

      // const signatoriesIds = autoAndManualSignatories.map(
      //   (signatory) => signatory?.id
      // );

      setCombinedSignatories(autoAndManualSignatories);
      setDestinations(docDestinations);
      setFileDocuments(docFileDocuments);

      setDisableSigning(
        auth?.unitId !== 1 &&
          ((enableLimitNumberOfSignatories &&
            autoAndManualSignatories.length >= maxNumberOfSignatories) ||
            loadingState)
      );
    }
  }, [rowData, loadingState, enableLimitNumberOfSignatories, maxNumberOfSignatories]);

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
        updateTableFunction();
        setOpenViewModal(false);
        setDataFromActions(null);
        setShowUndoConfirm(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Error: Something went wrong');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const checkPdfExists = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/pdfUploads/${fileDocuments[fileDocuments.length - 1]}`
        );

        if (!response.ok) {
          setIsPdfAvailable(false);
          enqueueSnackbar('PDF file not found', { variant: 'error' });
        } else {
          setIsPdfAvailable(true);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error checking PDF:', err);
        enqueueSnackbar('Error loading PDF', { variant: 'error' });
      }
    };

    if (fileDocuments.length > 0 && open && fileDocuments[fileDocuments.length - 1]) {
      checkPdfExists();
    }
  }, [fileDocuments, open, rowData]);

  const getStatusChip = status => {
    const statusConfig = {
      7: { label: 'For Signing', color: 'warning' },
      8: { label: 'For Routing', color: 'info' },
      3: { label: 'Signed', color: 'success' }
    };

    const config = statusConfig[status] || null;

    return config ? <Chip label={config.label} color={config.color} size="small" /> : null;
  };

  const canSign =
    auth?.role?.some(role => userRolesWithSignature.includes(role)) &&
    destinations?.some(dest => dest?.id === auth?.unitId) &&
    dataFromActions?.status === 7 &&
    dataFromActions?.acceptStatus === 1;

  const canRoute =
    (auth?.role?.some(role => ['sds', 'asds'].includes(role)) ||
      (auth?.role?.some(role => ['unit head'].includes(role)) && auth?.unitId === 12)) &&
    destinations?.some(dest => dest?.id === auth?.unitId) &&
    dataFromActions?.status === 8 &&
    dataFromActions?.acceptStatus === 1;

  const canUndo =
    combinedSignatories.map(signatories => signatories.id).includes(auth?.unitId) &&
    (dataFromActions?.status === 3 ||
      dataFromActions?.lastSource[dataFromActions.lastSource.length - 1]?.id === auth?.unitId);

  const isMobileDevice = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;

  useEffect(() => {
    if (isMobileDevice()) {
      setViewMode('mobile');
    } else {
      setViewMode('iframe');
    }
  }, []);

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setIsSelecting(false);
        setPageToSign(null);
      }}
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 0,
        sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
      }}
    >
      <Box sx={modalStyle}>
        {/* Signing Selection Overlay */}
        {isSelecting &&
          pageToSign &&
          auth?.role?.some(role => ['sds', 'asds', 'chief', 'unit head'].includes(role)) &&
          dataFromActions?.status === 7 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                p: { xs: 1, sm: 3, md: 4 },
                overflow: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                zIndex: 1000,
                minHeight: '100vh',
                py: { xs: 2, sm: 0 }
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: 'white',
                  mb: { xs: 2, sm: 3, md: 4 },
                  fontWeight: { xs: 400, sm: 300 },
                  textAlign: 'center',
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                }}
              >
                Choose Signing Method
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  flexWrap: 'wrap',
                  gap: { xs: 1.5, sm: 2 },
                  mb: { xs: 2, sm: 4 },
                  width: '100%',
                  maxWidth: { xs: '100%', sm: '800px' },
                  px: { xs: 0.5, sm: 2 },
                  pb: { xs: 2, sm: 0 }
                }}
              >
                {rowData?.isReadable !== 0 && (
                  <SigningOption
                    icon={<AutoAwesomeIcon />}
                    title="Auto-Detect Signing"
                    subtitle="For text-based documents only"
                    onClick={() => {
                      setOpenViewModal(false);
                      setIsSelecting(false);
                      handleSignDocument('auto');
                    }}
                    color="primary"
                  />
                )}

                <SigningOption
                  icon={<EditIcon />}
                  title="Manual Signing"
                  subtitle="Drag signature to place"
                  onClick={() => {
                    setOpenViewModal(false);
                    setIsSelecting(false);
                    handleSignDocument('manual');
                  }}
                  color="secondary"
                />

                {auth?.role?.some(role => ['sds'].includes(role)) && [
                  <SigningOption
                    icon={<EditIcon />}
                    title="PNPKI Signing"
                    subtitle="Use PNPKI to sign"
                    onClick={() => {
                      setOpenViewModal(false);
                      setIsSelecting(false);
                      handleSignDocument('PNPKI');
                    }}
                    color="primary"
                  />,
                  <SigningOption
                    icon={<EditIcon />}
                    title="PNPKI Manual Signing"
                    subtitle="Use PNPKI to sign manually"
                    onClick={() => {
                      setOpenViewModal(false);
                      setIsSelecting(false);
                      handleSignDocument('PNPKIManual');
                    }}
                    color="secondary"
                  />
                ]}

                <SigningOption
                  icon={<CloseIcon />}
                  title="Cancel"
                  subtitle="Go back to document"
                  onClick={() => setIsSelecting(false)}
                  color="error"
                />
              </Box>
            </Box>
          )}

        {/* Document Preview Modal */}
        {openDocPreviewModal && (
          <DocumentPreviewModal
            description="Preview of document once unsigned"
            setOpenDocPreviewModal={setOpenDocPreviewModal}
            filePath={
              fileDocuments.length > 0 && fileDocuments[fileDocuments.length - 2]
                ? `${BASE_URL}/pdfUploads/${fileDocuments[fileDocuments.length - 2]}}${
                    isIncomingRoute ? '#toolbar=0' : ''
                  }`
                : null
            }
          />
        )}

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <DocumentScannerIcon
              sx={{
                fontSize: 32,
                color: theme.palette.primary.main
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.5,
                  cursor: 'pointer',
                  maxWidth: expanded ? 'none' : 'calc(100% - 60px)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: 'primary.main'
                  },
                  ...(expanded && {
                    textOverflow: 'unset',
                    overflow: 'visible',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    lineHeight: 1.3,
                    maxWidth: 'none'
                  })
                }}
                onClick={() => {
                  setExpanded(!expanded);
                }}
                title={expanded ? 'Click to collapse' : 'Click to expand'}
              >
                {dataFromActions?.title || ''}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                {getStatusChip(dataFromActions?.status)}
                <Typography variant="body2" color="text.secondary">
                  {dataFromActions?.docType}
                </Typography>
              </Stack>
            </Box>

            <IconButton
              onClick={handleClose}
              disabled={loadingState}
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

        {/* Controls Bar */}
        {(canSign || canUndo || canRoute || isMobileDevice()) && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
            >
              {/* Page Controls */}
              {canSign && (
                <Card variant="outlined" sx={{ px: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" fontWeight={600}>
                      Page to sign:
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={pageToSign || ''}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 1 && val <= maxPage) {
                          setPageToSign(val);
                        } else if (!val) {
                          setPageToSign(null);
                        }
                      }}
                      InputProps={{
                        sx: {
                          '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button':
                            {
                              '-webkit-appearance': 'none',
                              margin: 0
                            }
                        }
                      }}
                      sx={{ width: '80px' }}
                    />
                    <Stack>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (pageToSign < maxPage) {
                            setPageToSign((pageToSign || 0) + 1);
                          }
                        }}
                      >
                        <KeyboardArrowUpIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          if (pageToSign > 1) {
                            setPageToSign(pageToSign - 1);
                          }
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={2}>
                {canRoute && (
                  <Button
                    variant="contained"
                    startIcon={<ShortcutIcon />}
                    onClick={() => setOpenRouteModal(true)}
                    sx={{
                      bgcolor: theme.palette.success.main,
                      '&:hover': {
                        bgcolor: theme.palette.success.dark
                      }
                    }}
                  >
                    Route Document
                  </Button>
                )}

                {canSign && (
                  <Button
                    variant="contained"
                    startIcon={<AiFillSignature />}
                    disabled={disableSigning || (pageToSign || 0) < 1}
                    onClick={() => setIsSelecting(true)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: disableSigning || pageToSign < 1 ? 'lightgray' : '#1f1f1f',
                      color: disableSigning || pageToSign < 1 ? 'black' : '#fff',
                      py: 1,
                      minWidth: '200px',
                      '&:hover': {
                        backgroundColor: '#a2cb6b',
                        color: '#1f1f1f',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    {auth?.unitId === 1 ? 'Sign Document' : 'Initialize Document'}
                  </Button>
                )}

                {canUndo && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.05)
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        variant="contained"
                        color="error"
                        disabled={loadingState}
                        onClick={() => setShowUndoConfirm(true)}
                        size="small"
                        startIcon={<UndoIcon />}
                        sx={{
                          minWidth: 120,
                          fontWeight: 600
                        }}
                      >
                        {loadingState ? 'Undoing...' : 'Undo'}
                      </Button>

                      <Tooltip title="Preview document before undoing">
                        <IconButton
                          onClick={() => setOpenDocPreviewModal(true)}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            '&:hover': {
                              bgcolor: alpha(theme.palette.info.main, 0.2)
                            }
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}

                {/* View Mode Toggle (only show on mobile) */}
                {isMobileDevice() && (
                  <Button
                    variant={viewMode === 'iframe' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setViewMode(viewMode === 'iframe' ? 'mobile' : 'iframe')}
                  >
                    {viewMode === 'iframe' ? 'Blob View' : 'Web View'}
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Warning Messages */}
            {disableSigning && canSign && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={<WarningIcon />}
                  label="Either you already signed this document or the total number of signatories is reached"
                  color="warning"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}

            {canSign && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={<InfoIcon />}
                  label={
                    rowData?.isReadable === 1
                      ? 'This document is NOT SCANNED. You can use auto or manual signing'
                      : 'This document is SCANNED. You can only sign it manually'
                  }
                  // color="info"
                  variant="outlined"
                  size="small"
                />
              </Box>
            )}
          </Paper>
        )}

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

        {isIncomingRoute && (
          <Box
            sx={{
              position: 'relative',
              width: '100%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 0.5,
                mt: 2,
                position: 'absolute',
                bottom: -10,
                left: 30,
                right: 30,
                zIndex: 10
              }}
            >
              <Chip
                icon={<WarningIcon />}
                label="You need to accept this document before downloading or printing."
                color="warning"
                variant="outlined"
                size="small"
                sx={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(40, 40, 40, 1)'
                }}
              />
              <Chip
                icon={<InfoIcon />}
                label="Tip: Use Ctrl + scroll wheel to zoom in or out."
                color="info"
                variant="outlined"
                size="small"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(40, 40, 40, 1)'
                }}
              />
            </Box>
          </Box>
        )}

        {/* PDF Viewer */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            p: 2,
            overflow: 'auto'
          }}
        >
          {dataFromActions &&
          open &&
          fileDocuments.length > 0 &&
          fileDocuments[fileDocuments.length - 1] &&
          isPdfAvailable ? (
            <>
              {/* PDF Content */}
              {viewMode === 'mobile' && isMobileDevice() ? (
                <Box
                  sx={{
                    height: '100%',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <MobilePDFViewer pdfUrl={pdfSrc} modalState={open} viewMode={viewMode} />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <iframe
                    src={pdfSrc}
                    title="PDF Viewer"
                    height="100%"
                    width="100%"
                    style={{
                      display: 'block',
                      minHeight: '500px'
                    }}
                    allowFullScreen
                    onError={() =>
                      enqueueSnackbar('PDF not found', {
                        variant: 'error'
                      })
                    }
                  />
                </Box>
              )}
            </>
          ) : (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.grey[100], 0.5)
              }}
            >
              <DocumentScannerIcon
                sx={{
                  fontSize: 64,
                  color: theme.palette.grey[400],
                  mb: 2
                }}
              />
              <Typography variant="h6" color="text.secondary">
                No PDF Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The document could not be loaded
              </Typography>
            </Paper>
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
              Processing...
            </Typography>
          </Box>
        )}

        {/* Unsign Confirmation Dialog */}
        <Modal
          open={showUndoConfirm}
          onClose={() => setShowUndoConfirm(false)}
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 0,
            sx: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 400 },
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              p: 3
            }}
          >
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    mb: 2
                  }}
                >
                  <UndoIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Confirm Undo Action
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Are you sure you want to undo the last action on this document?
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: theme.palette.info.main }}
                  >
                    📥 Document will be moved to: <br /> Incoming Documents
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleUndo}
                  disabled={loadingState}
                  startIcon={loadingState ? <CircularProgress size={16} /> : <UndoIcon />}
                  sx={{ minWidth: 100 }}
                >
                  {loadingState ? 'Undoing...' : 'Confirm Undo'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowUndoConfirm(false)}
                  disabled={loadingState}
                  sx={{ minWidth: 100 }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Modal>
      </Box>
    </Modal>
  );
}
