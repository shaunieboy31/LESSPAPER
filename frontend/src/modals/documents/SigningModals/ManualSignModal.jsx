/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
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

import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import EditIcon from '@mui/icons-material/Edit';
import HeightIcon from '@mui/icons-material/Height';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
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
  display: 'flex',
  flexDirection: 'column'
};

export default function ManualSignModal({
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

  // Signature positioning and sizing state
  const [signaturePosition, setSignaturePosition] = useState({
    x: 0,
    y: 0,
    width: 80,
    height: 70
  });

  // const [emphasize, setEmphasize] = useState(false);
  const [signType, setSignType] = useState('sign');
  const [signURL, setSignURL] = useState();
  const [signPath, setSignPath] = useState();
  const [signSize, setSignSize] = useState('large');

  const [isDragging, setIsDragging] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isTouchResizing, setIsTouchResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pdfPageImages, setPdfPageImages] = useState([]);

  const docRef = useRef(null);

  const [newDocUrl, setNewDocUrl] = useState();
  const [openDocPreviewModal, setOpenDocPreviewModal] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const maxPage = dataFromActions?.numberOfPages;

  const reset = () => {
    // setNewDocUrl(null);
    setOpenDocPreviewModal(false);
    setPageToSign(null);
    setSignaturePosition({
      x: 0,
      y: 0,
      width: 80,
      height: 70
    });
    setDataFromActions(null);
    setShowUndoConfirm(false);
    updateTableFunction();
    handleClose();
  };

  const handleSignDocu = async () => {
    if (signaturePosition) {
      // eslint-disable-next-line no-alert
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

        await axiosPrivate
          .put(`/documents/signWithCoordinates/${id}`, {
            fileName,
            page: pageToSign,
            signaturePosition,
            signedBy: { id: auth?.unitId, destination: auth?.unitName },
            signPath,
            // eslint-disable-next-line no-nested-ternary
            status: auth?.unitId === 1 || auth?.unitId === 2 ? 1 : 3,
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
            remarks: `Manually ${signType === 'sign' ? 'Signed' : 'Initialized'} by ${
              auth?.firstName
            } ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          })
          .then(res => {
            const { data } = res;

            enqueueSnackbar('Document Signed', {
              variant: 'success'
            });

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
    const selectedSignPath = auth.signPath || null;

    if (auth.unitId === 1 && signType === 'sign') {
      setSignPath(selectedSignPath ? selectedSignPath[0]?.sign : null);
      setSignType('sign');
      setSignSize('large');
    } else {
      setSignPath(selectedSignPath ? selectedSignPath[0]?.initial : null);
      setSignType('initial');
      setSignSize('small');
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

  // Mouse event handlers for dragging
  const handleMoveSign = e => {
    const rect = docRef.current.getBoundingClientRect();

    const getClientCoordinates = event => {
      if (event.type.includes('touch')) {
        setIsTouched(true);

        return {
          x: event.touches[0].clientX - rect.left,
          y: event.touches[0].clientY - rect.top
        };
      }
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    };

    const { x, y } = getClientCoordinates(e);

    // Check if clicking on signature area
    if (
      x >= signaturePosition.x &&
      x <= signaturePosition.x + signaturePosition.width &&
      y >= signaturePosition.y &&
      y <= signaturePosition.y + signaturePosition.height
    ) {
      setIsDragging(true);
      setDragStart({
        x: x - signaturePosition.x,
        y: y - signaturePosition.y
      });
    }
  };

  const handleMouseMove = e => {
    if (!isDragging && !isTouched) return;

    const rect = docRef.current.getBoundingClientRect();
    let x;
    let y;

    if (isDragging && e.clientX !== undefined) {
      x = e.clientX - rect.left - dragStart.x;
      y = e.clientY - rect.top - dragStart.y;
    } else if (isTouched && e.touches && e.touches[0]) {
      x = e.touches[0].clientX - rect.left - dragStart.x;
      y = e.touches[0].clientY - rect.top - dragStart.y;
    }

    if (x !== undefined && y !== undefined) {
      // Immediate update for responsive dragging
      setSignaturePosition(prev => ({
        ...prev,
        x: Math.max(0, Math.min(x, rect.width - prev.width)),
        y: Math.max(0, Math.min(y, rect.height - prev.height))
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsTouched(false);
    setIsResizing(false);
    setIsTouchResizing(false);
  };

  // Resize handlers
  const handleResizeMouseDown = e => {
    e.stopPropagation();
    e.preventDefault();

    // Handle both mouse and touch events
    let clientX;
    let clientY;
    if (e.clientX !== undefined) {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
      setIsResizing(true);
      setIsTouchResizing(false);
    } else if (e.touches && e.touches[0]) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      setIsTouchResizing(true);
      setIsResizing(false);
    }
    setIsResizing(true);
    setResizeStart({
      x: clientX,
      y: clientY,
      width: signaturePosition.width,
      height: signaturePosition.height
    });
  };

  const handleResizeMouseMove = e => {
    if (!isResizing && !isTouchResizing) return;

    e.preventDefault();
    let deltaX;
    let deltaY;

    if (e.clientX !== undefined) {
      deltaX = e.clientX - resizeStart.x;
      deltaY = e.clientY - resizeStart.y;
    } else if (e.touches && e.touches[0]) {
      deltaX = e.touches[0].clientX - resizeStart.x;
      deltaY = e.touches[0].clientY - resizeStart.y;
    }

    if (deltaX !== undefined && deltaY !== undefined) {
      // Immediate update for responsive resizing
      setSignaturePosition(prev => ({
        ...prev,
        width: Math.max(10, resizeStart.width + deltaX),
        height: Math.max(10, resizeStart.height + deltaY)
      }));
    }
  };

  // useEffect(() => {
  //   if (open) {
  //     setEmphasize(true);
  //     setTimeout(() => {
  //       setEmphasize(false);
  //     }, 2000);
  //   }
  // }, [open]);

  useEffect(() => {
    const handleGlobalMouseMove = e => {
      if (isDragging || isTouched) {
        handleMouseMove(e);
      } else if (isResizing || isTouchResizing) {
        handleResizeMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isTouched || isResizing || isTouchResizing) {
        handleMouseUp();
      }
    };

    if (isDragging || isTouched || isResizing || isTouchResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalMouseMove, {
        passive: false
      });
      document.addEventListener('touchend', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalMouseMove);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, isTouched, isResizing, isTouchResizing]);

  useEffect(() => {
    const signPaths = auth.signPath || null;

    let selectedSignPath = '';

    if (signType === 'sign') {
      selectedSignPath = signPaths ? signPaths[0]?.sign : null;
      setSignSize('large');
    } else if (signType === 'initial') {
      selectedSignPath = signPaths ? signPaths[0]?.initial : null;
      setSignSize('small');
    }

    const fetchSignURL = async () => {
      try {
        const response = await fetch(`${BASE_URL}${selectedSignPath}`);

        if (!response.ok) {
          throw new Error('Failed to fetch the sign URL');
        }

        setSignPath(selectedSignPath);
        setSignURL(`${BASE_URL}${selectedSignPath}`);
      } catch (err) {
        setSignPath(null);
      }
    };

    if (open) {
      fetchSignURL();
    }
  }, [BASE_URL, signPath, signType, open, auth]);

  const getSignTypeChip = () => {
    if (signType === 'sign') {
      return <Chip label="Signature" color="primary" size="small" />;
    }
    if (signType === 'initial') {
      return <Chip label="Initial" color="secondary" size="small" />;
    }
    return <Chip label="Signature" color="secondary" size="small" />;
  };

  const getSignSizeChip = () => (
    <Chip
      label={signSize === 'large' ? 'Large' : 'Small'}
      color={signSize === 'large' ? 'success' : 'info'}
      size="small"
    />
  );

  const isMobileDevice = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;

  const getActionLabel = () => {
    if (auth.unitId === 1 && signType === 'sign') {
      return 'Sign Document';
    }
    return signType === 'sign' ? 'Sign Document' : 'Affix Initial';
  };

  // Global touch event listener for resize
  useEffect(() => {
    const handleGlobalTouchMove = e => {
      if (isTouchResizing) {
        e.preventDefault();
        e.stopPropagation();

        const deltaX = e.touches[0].clientX - resizeStart.x;
        const deltaY = e.touches[0].clientY - resizeStart.y;

        setSignaturePosition(prev => ({
          ...prev,
          width: Math.max(10, resizeStart.width + deltaX),
          height: Math.max(10, resizeStart.height + deltaY)
        }));
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isTouchResizing) {
        handleMouseUp();
      }
    };

    if (isTouchResizing) {
      document.addEventListener('touchmove', handleGlobalTouchMove, {
        passive: false
      });
      document.addEventListener('touchend', handleGlobalTouchEnd, {
        passive: false
      });
    }

    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isTouchResizing, resizeStart]);

  useEffect(() => {
    setSignaturePosition({
      x: 0,
      y: 0,
      width: signSize === 'large' ? 80 : 50,
      height: signSize === 'large' ? 70 : 40
    });
  }, [signSize]);

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
      <Box
        sx={{
          ...modalStyle,
          overflow: isDragging || isTouched ? 'hidden' : 'auto'
        }}
      >
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
            backgroundColor: alpha(theme.palette.secondary.main, 0.02)
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EditIcon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.secondary.main
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
                    Manual Signing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Drag and position your signature precisely
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
          {/* Compact Controls Row */}
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
                      gap: 0.5,
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

              {/* Signature Size */}
              <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Size:
                </Typography>
                {getSignSizeChip()}
                <Tooltip title="Toggle signature size">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSignSize(signSize === 'large' ? 'small' : 'large');
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.info.main, 0.2)
                      }
                    }}
                  >
                    <HeightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider orientation="vertical" flexItem sx={{ height: 30 }} />

              {/* Reset Signature Position */}
              <Stack direction="row" alignItems="center" spacing={{ xs: 0, sm: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Reset signature position:
                </Typography>
                <Tooltip title="Switch signature type">
                  <Button
                    size="small"
                    onClick={() => {
                      setSignaturePosition({
                        x: 0,
                        y: 0,
                        width: signSize === 'large' ? 80 : 50,
                        height: signSize === 'large' ? 70 : 40
                      });
                    }}
                    sx={{
                      gap: 0.5,
                      borderRadius: '40%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  >
                    <CachedIcon fontSize="small" />
                    Reset
                  </Button>
                </Tooltip>
              </Stack>
            </Box>

            {/* Action Button */}
            <Button
              variant="contained"
              size="medium"
              startIcon={<AiFillSignature />}
              onClick={handleSignDocu}
              disabled={loading || !signaturePosition.x || !signPath}
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

          {/* Info Messages */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 1 }}>
            {!signPath && (
              <Chip
                icon={<WarningIcon />}
                label="No signature found"
                color="warning"
                variant="outlined"
                size="small"
              />
            )}
            {!signaturePosition.x && (
              <Chip
                icon={<InfoIcon />}
                label="Drag signature to position"
                color="info"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
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
            position: 'relative',
            '@media (max-width: 625px)': {
              justifyContent: 'flex-start'
            }
          }}
        >
          {/* PDF Preview with Draggable Signature */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: isMobileDevice() ? 'start' : 'center',
              alignItems: 'flex-start',
              overflow: isDragging || isTouched ? 'hidden' : 'auto'
            }}
          >
            {pdfUrl && open && pdfPageImages.length > 0 ? (
              <Box
                sx={{
                  height: '100%',
                  position: 'relative'
                }}
              >
                <Box
                  ref={docRef}
                  sx={{
                    width: '100%',
                    position: 'relative',
                    overflow: 'auto'
                  }}
                >
                  {/* Draggable Signature */}

                  {/* PDF Image */}
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
                      style={{
                        marginBottom: '10px',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                    {/* Draggable Signature Overlay */}
                    {signURL && signPath && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: signaturePosition.x,
                          top: signaturePosition.y,
                          width: signaturePosition.width,
                          height: signaturePosition.height,
                          cursor: isDragging || isTouched ? 'grabbing' : 'grab',
                          border: '2px dashed #1976d2',
                          backgroundColor: 'rgba(25, 118, 212, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 212, 0.2)'
                          }
                        }}
                        onMouseDown={handleMoveSign}
                        onTouchStart={handleMoveSign}
                      >
                        <img
                          src={signURL}
                          alt="Signature Preview"
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%'
                          }}
                        />

                        {/* Resize handle */}
                        <Box
                          onMouseDown={handleResizeMouseDown}
                          onTouchStart={handleResizeMouseDown}
                          sx={{
                            position: 'absolute',
                            width: 20,
                            height: 20,
                            bgcolor: '#1976d2',
                            borderRadius: '50%',
                            cursor: 'nw-resize',
                            right: -10,
                            bottom: -10,
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            zIndex: 10,
                            touchAction: 'none',
                            '&:hover': {
                              bgcolor: '#1565c0',
                              transform: 'scale(1.1)'
                            },
                            '&:active': {
                              bgcolor: '#0d47a1',
                              transform: 'scale(1.2)'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
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
