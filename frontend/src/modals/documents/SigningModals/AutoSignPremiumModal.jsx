/* eslint-disable no-await-in-loop */
import React, { useEffect, useState } from 'react';
import { Box, Button, Divider, IconButton, Modal, Tooltip, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CachedIcon from '@mui/icons-material/Cached';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';
import { getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { enqueueSnackbar } from 'notistack';
import Tesseract from 'tesseract.js';
import LoadingOverlay from 'components/LoadingOverlay';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  height: '98vh',
  width: '98vw',
  bgcolor: 'background.paper',
  boxShadow: '3px 2px 20px 3px rgba(0, 0, 0, 0.3)',
  borderRadius: '10px',
  overflowY: 'auto',
  p: 2
};

export default function AutoSignPremiumModal({
  open,
  handleClose,
  pageToSign,
  setPageToSign,
  pdfUrl,
  loadingState,
  setOpenAutoSignModal,
  dataFromActions,
  setDataFromActions,
  updateTableFunction
}) {
  const { auth, BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loadingMssg, setLoadingMssg] = useState('');
  const [PDFImgPages, setPDFImgPages] = useState([]);
  const [showSignature, setShowSignature] = useState(false);
  const [signType, setSignType] = useState('sign');
  const [signURL, setSignURL] = useState();
  const [sign, setSign] = useState();

  const maxPage = dataFromActions?.numberOfPages;

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
        // destinations = [
        //   { id: 1, destination: 'Schools Division Superintendent (SDS)', type: 'unit' }
        // ];
      }

      const imgDataUrl = PDFImgPages[pageToSign - 1];

      const { data } = await Tesseract.recognize(imgDataUrl, 'eng', {
        logger: m => {
          setLoadingMssg(m.status);
        },
        oem: 1, // Use LSTM engine
        psm: 6 // Assume a single block of text
      });

      const items = [];

      data.words.forEach(word => {
        if (
          ['HOMER', 'Homer', auth?.firstName, auth?.firstName?.toUpperCase()].some(name =>
            word.text.includes(name)
          )
        ) {
          items.push({
            page: pageToSign,
            x: word.bbox.x0, // X coordinate
            y: word.bbox.y0, // Y coordinate
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
            str: word.text
          });
        }
      });

      const coordinates = items[items.length < 0 ? 0 : items.length - 1];

      try {
        if (!coordinates) {
          throw new Error('Unable to scan the PDF Document Properly');
        }
        if (auth?.unitId === 1) {
          await axiosPrivate.put(`/documents/premiumSignPdf/${id}`, {
            fileName,
            page: pageToSign,
            fullName: `${auth?.firstName} ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${
              auth?.lastName
            }`,
            coordinates,
            // titles: positions,
            signedBy: { id: auth?.unitId, destination: auth?.unitName },
            signPath: sign,
            status: 1,
            destinations: destinations || null, // added
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
                  }, // added
            remarks: `Signed by ${auth?.firstName} ${
              auth?.middleIntl ? `${auth?.middleIntl}. ` : ''
            }${auth?.lastName} from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`
          });
        } else {
          await axiosPrivate.put(`/documents/premiumInitializeDocument/${id}`, {
            fileName,
            page: pageToSign,
            fullName: `${auth?.firstName} ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${
              auth?.lastName
            }`,
            coordinates,
            initialBy: { id: auth?.unitId, destination: auth?.unitName },
            signPath: sign,
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
        }
        enqueueSnackbar('Document Signed', {
          variant: 'success'
        });
        setPageToSign(null);
        updateTableFunction();
        setOpenAutoSignModal(false);
        setShowSignature(false);
        setDataFromActions(null);
      } catch (err) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Error: Something went wrong';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (open) {
      const signPath = auth.signPath || null;

      if (auth.unitId === 1) {
        setSign(signPath ? signPath[0]?.sign : null);
        setSignType('sign');
      } else {
        setSign(signPath ? signPath[0]?.initial : null);
        setSignType('initial');
      }

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
            const viewport = currentPage.getViewport({ scale: 2 });
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

            // put to array all pages
            imagesContainer.push(imgDataUrl);

            setPDFImgPages(imagesContainer);
          })
          .catch(err => {
            console.error('Error loading PDF:', err);
            setError('Error loading PDF');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [open, pdfUrl, dataFromActions]);

  useEffect(() => {
    const signPath = auth.signPath || null;

    if (signType === 'sign') {
      setSign(signPath ? signPath[0]?.sign : null);
    } else if (signType === 'initial') {
      setSign(signPath ? signPath[0]?.initial : null);
    }
  }, [signType]);

  useEffect(() => {
    const fetchSignURL = async () => {
      // if (!BASE_URL || !sign) {
      //   console.error("BASE_URL or sign is missing.");
      //   return;
      // }

      try {
        const response = await fetch(`${BASE_URL}${sign}`);

        if (!response.ok) {
          throw new Error('Failed to fetch the sign URL');
        }

        setSignURL(`${BASE_URL}${sign}`);
      } catch (err) {
        enqueueSnackbar('Signature not found', {
          variant: 'error'
        });
      }
    };

    if (open) {
      fetchSignURL();
    }
  }, [BASE_URL, sign, signType, open]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ ...style, overflow: loading ? 'hidden' : 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 'solid 1px black',
            mb: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>
              Auto Signing (Premium) (Select a page to sign)
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {loading && <LoadingOverlay open={loading} message={loadingMssg} />}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            mb: 2
          }}
        >
          <Typography sx={{ fontWeight: 'bold', mr: 1 }}>Title:</Typography>
          <Typography>{dataFromActions?.title}</Typography>
        </Box>

        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 'bold', mr: 2 }}>Page: </Typography>
            <Box
              sx={{
                borderRadius: '4px',
                border: 'solid 1px #b6b6b6',
                width: '5vw',
                minWidth: '80px',
                py: '8px',
                px: '12px',
                mr: 2
              }}
            >
              <Typography>{`${pageToSign || 'undefined'} / ${maxPage || '0'}`}</Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Typography sx={{ fontWeight: 'bold', mr: 2 }}>Sign with:</Typography>
            <Tooltip title="View Signature" placement="top">
              <Box
                onClick={() => {
                  if (showSignature) {
                    setShowSignature(false);
                  } else {
                    setShowSignature(true);
                  }
                }}
                sx={{
                  borderRadius: '4px',
                  border: 'solid 1px #b6b6b6',
                  width: '5vw',
                  minWidth: '80px',
                  color: pageToSign ? 'black' : '#757575',
                  py: '8px',
                  px: '12px',
                  mr: 2,
                  cursor: 'pointer'
                }}
              >
                <Typography>{`${signType}` || 'Undefined'}</Typography>
              </Box>
            </Tooltip>
            <Tooltip title="Change sign" placement="top">
              <IconButton
                sx={{
                  backgroundColor: 'gray',
                  color: '#fff',
                  mr: 2,
                  '&:hover': {
                    backgroundColor: 'green'
                  }
                }}
                onClick={() => {
                  if (signType === 'initial') {
                    setSignType('sign');
                  } else {
                    setSignType('initial');
                  }
                }}
              >
                <CachedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* <TextField
            label="Specify Page"
            type="number"
            size="small"
            value={page}
            onChange={handlePageChange}
            sx={{ width: "10vw", minWidth: "100px" }}
          /> */}
          <Button
            onClick={handleSignDocu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1f1f1f',
              color: '#fff',
              py: 1,
              width: '10vw',
              minWidth: '200px',
              mr: 2,
              '&:hover': {
                backgroundColor: '#a2cb6b',
                color: '#1f1f1f',
                fontWeight: 'bold'
              }
            }}
          >
            {auth.unitId === 1 ? 'Sign Document' : 'Affix Initial'}
          </Button>
        </Box>
        {error && (
          <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
            <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
          </Box>
        )}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            mt: 2,
            position: 'relative'
          }}
        >
          {pdfUrl && open ? (
            <Box
              style={{
                height: '100%',
                position: 'relative'
              }}
            >
              <img
                src={PDFImgPages[0]}
                alt={`Page ${pageToSign}`}
                draggable="false"
                style={{
                  border: 'solid 1px black',
                  marginBottom: '10px',
                  width: '100%'
                }}
              />
            </Box>
          ) : (
            <Typography>No PDF available</Typography>
          )}
          <Box
            sx={{
              display: showSignature ? 'block' : 'none',
              transition: 'ease-in-out 5s',
              textAlign: 'center',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            <Typography>Signature Preview</Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                width: '200px',
                backgroundColor: '#fff',
                border: 'solid 1px gray',
                mr: 2,
                mb: 2
              }}
            >
              {sign && !loadingState ? (
                <img
                  src={signURL}
                  alt="Sign Preview"
                  draggable="false"
                  style={{
                    width: '100%'
                  }}
                />
              ) : (
                <p>No Signature</p>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
