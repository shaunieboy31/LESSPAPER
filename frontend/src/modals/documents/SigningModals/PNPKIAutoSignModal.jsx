/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
/* eslint-disable no-alert */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Modal,
  Paper,
  Stack,
  Typography,
  useTheme,
  alpha,
  Backdrop,
  Divider,
  Tooltip
} from '@mui/material';

import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AiFillSignature } from 'react-icons/ai';

import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';
import { getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import { enqueueSnackbar } from 'notistack';

// Import PKI libraries
import * as forge from 'node-forge';
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

export default function PNPKIAutoSignModal({
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

  // const storedPNPKIInputs = localStorage.getItem("pnpkiInputs");

  // const [PNPKIInputs, setPNPKIInputs] = useState(
  //   JSON.parse(storedPNPKIInputs) || null
  // );

  // File upload states
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  // const [certificatePassword, setCertificatePassword] = useState(
  //   PNPKIInputs?.certificatePassword || ""
  // );
  const [certificateInfo, setCertificateInfo] = useState(null);
  const [isValidCertificate, setIsValidCertificate] = useState(false);
  // const [showPassword, setShowPassword] = useState(false);

  const [signType, setSignType] = useState('sign');
  const [signPath, setSignPath] = useState();
  const [signatureImage, setSignatureImage] = useState();

  // PDF and signing states
  const [PDFImgPages, setPDFImgPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signingProgress, setSigningProgress] = useState(0);

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

  // const fileInputRef = useRef(null);

  // Handle certificate file selection
  // const handleFileSelect = (event) => {
  //   const file = event.target.files[0];
  //   if (file && file.name.toLowerCase().endsWith(".p12")) {
  //     setCertificateFile(file);
  //     setCertificateInfo(null);
  //     setIsValidCertificate(false);
  //     setError("");
  //   } else {
  //     setError("Please select a valid .p12 certificate file");
  //   }
  // };

  // Extract certificate information
  const extractCertificateInfo = async () => {
    setError('');

    if (!certificateFile || !certificatePassword) {
      setError('Please provide both certificate file and password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const arrayBuffer = await certificateFile.arrayBuffer();
      const p12Der = forge.util.createBuffer(arrayBuffer);

      // Parse P12 file
      const p12Asn1 = forge.asn1.fromDer(p12Der.getBytes());
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certificatePassword);

      // Extract private key and certificate
      const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag
      });

      if (bags[forge.pki.oids.certBag] && bags[forge.pki.oids.certBag].length > 0) {
        const { cert } = bags[forge.pki.oids.certBag][0];
        const { key: privateKey } = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];

        // Extract certificate information
        const { subject, issuer, validity, serialNumber } = cert;
        const { notBefore: validFrom, notAfter: validTo } = validity;

        const certInfo = {
          subject: {
            commonName: subject.getField('CN')?.value || 'N/A',
            organization: subject.getField('O')?.value || 'N/A',
            organizationalUnit: subject.getField('OU')?.value || 'N/A',
            country: subject.getField('C')?.value || 'N/A'
          },
          issuer: {
            commonName: issuer.getField('CN')?.value || 'N/A',
            organization: issuer.getField('O')?.value || 'N/A'
          },
          validFrom,
          validTo,
          serialNumber,
          fingerprint: forge.md.sha1
            .create()
            .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
            .digest()
            .toHex()
        };

        setCertificateInfo(certInfo);
        setIsValidCertificate(true);

        // Store private key and certificate for signing
        window.currentPrivateKey = privateKey;
        window.currentCertificate = cert;

        enqueueSnackbar('Certificate loaded successfully', {
          variant: 'success'
        });
        // setPNPKIInputs({
        //   ...PNPKIInputs,
        //   certificatePassword,
        //   pnpkiStatus: true,
        // });

        // localStorage.setItem(
        //   "pnpkiInputs",
        //   JSON.stringify({ pnpkiStatus: true, certificatePassword })
        // );
      } else {
        setError('No valid certificate found in the P12 file');
        // setPNPKIInputs(true);

        // localStorage.setItem(
        //   "pnpkiInputs",
        //   JSON.stringify({ pnpkiStatus: false })
        // );
      }
    } catch (err) {
      console.error('Certificate extraction error:', err);
      setError('Failed to extract certificate. Please check your password and file format.');
      setIsValidCertificate(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF hash and create signature
  const generatePDFHash = async pdfBuffer => {
    try {
      // Create a hash of the PDF content
      const md = forge.md.sha256.create();
      md.update(pdfBuffer);
      return md.digest().toHex();
    } catch (err) {
      console.error('Hash generation error:', err);
      throw new Error('Failed to generate PDF hash');
    }
  };

  // Create CMS/PKCS#7 signature
  const createCMSSignature = async (pdfHash, privateKey, certificate) => {
    try {
      // Create CMS SignedData
      const cms = forge.pkcs7.createSignedData();
      cms.content = forge.util.createBuffer(pdfHash, 'hex');

      // Add signer info
      cms.addSigner({
        key: privateKey,
        certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
          {
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data
          },
          {
            type: forge.pki.oids.messageDigest,
            value: forge.util.hexToBytes(pdfHash)
          },
          {
            type: forge.pki.oids.signingTime,
            value: new Date()
          }
        ]
      });

      // Sign the data
      cms.sign({ detached: true });

      // Convert to DER format
      const der = forge.asn1.toDer(cms.toAsn1()).getBytes();
      return forge.util.encode64(der);
    } catch (err) {
      console.error('CMS signature creation error:', err);
      throw new Error('Failed to create CMS signature');
    }
  };

  // Create a visual signature image from certificate info
  // const createSignatureImage = async (certInfo) => {
  //   try {
  //     // Create a canvas to draw the signature
  //     const canvas = document.createElement("canvas");
  //     const ctx = canvas.getContext("2d");

  //     // Set canvas size
  //     canvas.width = 250;
  //     canvas.height = 120;

  //     // Set background
  //     ctx.fillStyle = "#ffffff";
  //     ctx.fillRect(0, 0, canvas.width, canvas.height);

  //     // Draw vertical divider line (only in the upper area)
  //     ctx.strokeStyle = "#cccccc";
  //     ctx.lineWidth = 1;
  //     ctx.beginPath();
  //     ctx.moveTo(canvas.width / 2, 10);
  //     ctx.lineTo(canvas.width / 2, 60);
  //     ctx.stroke();

  //     // LEFT HALF - Signature area
  //     ctx.fillStyle = "#000000";
  //     ctx.font = "bold 14px Arial";
  //     ctx.textAlign = "center";

  //     // RIGHT HALF - Digital signature info
  //     ctx.textAlign = "left";
  //     ctx.font = "bold 12px Arial";

  //     // Helper function to wrap text
  //     const wrapText = (text, maxWidth, x, y, lineHeight = 15) => {
  //       const words = text.split(" ");
  //       let line = "";
  //       let currentY = y;

  //       for (let n = 0; n < words.length; n++) {
  //         const testLine = `${line + words[n]} `;
  //         const metrics = ctx.measureText(testLine);
  //         const testWidth = metrics.width;

  //         if (testWidth > maxWidth && n > 0) {
  //           ctx.fillText(line, x, currentY);
  //           line = `${words[n]} `;
  //           currentY += lineHeight;
  //         } else {
  //           line = testLine;
  //         }
  //       }
  //       ctx.fillText(line, x, currentY);
  //       return currentY + lineHeight;
  //     };

  //     // Draw "Digitally signed by" text with wrapping
  //     const signedByText = `Digitally signed by ${certInfo.subject.commonName}`;
  //     const rightHalfWidth = canvas.width / 2 - 20; // Available width for right half
  //     let currentY = 30;
  //     currentY = wrapText(
  //       signedByText,
  //       rightHalfWidth,
  //       canvas.width / 2 + 10,
  //       currentY,
  //       12
  //     );

  //     // Draw date in specified format with wrapping
  //     const now = new Date();
  //     const year = now.getFullYear();
  //     const month = String(now.getMonth() + 1).padStart(2, "0");
  //     const day = String(now.getDate()).padStart(2, "0");
  //     const hours = String(now.getHours()).padStart(2, "0");
  //     const minutes = String(now.getMinutes()).padStart(2, "0");
  //     const seconds = String(now.getSeconds()).padStart(2, "0");
  //     const timezone = "+08:00"; // Fixed timezone as requested

  //     const dateText = `${year}.${month}.${day} ${hours}:${minutes}:${seconds} ${timezone}`;
  //     ctx.font = "10px Arial";
  //     currentY = wrapText(
  //       dateText,
  //       rightHalfWidth,
  //       canvas.width / 2 + 10,
  //       currentY,
  //       10
  //     );

  //     // Calculate the position for the horizontal line and serial number
  //     // Add some padding below the right half content
  //     const separatorY = Math.max(currentY, 65); // Ensure minimum position but adjust if content is longer

  //     // Draw horizontal line to separate serial number area
  //     ctx.strokeStyle = "#cccccc";
  //     ctx.lineWidth = 1;
  //     ctx.beginPath();
  //     ctx.moveTo(10, separatorY);
  //     ctx.lineTo(canvas.width - 10, separatorY);
  //     ctx.stroke();

  //     // Draw serial number below both columns (full width)
  //     ctx.textAlign = "center";
  //     ctx.font = "10px Arial";
  //     ctx.fillText(certInfo.serialNumber, canvas.width / 2, separatorY + 15);

  //     // Add border
  //     ctx.strokeStyle = "#000000";
  //     ctx.lineWidth = 1;
  //     ctx.strokeRect(0, 0, canvas.width, canvas.height);

  //     // Convert canvas to data URL
  //     return canvas.toDataURL("image/png");
  //   } catch (err) {
  //     console.error("Signature image creation error:", err);
  //     throw new Error("Failed to create signature image");
  //   }
  // };

  // Create a visual signature image from certificate info
  const createSignatureImage = async certInfo => {
    try {
      // Create a canvas to draw the signature
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set high resolution for better quality with device pixel ratio support
      const displayWidth = 200;
      const displayHeight = 80;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const pixelRatio = Math.max(4, devicePixelRatio * 2); // At least 4x, but higher for high-DPI displays

      canvas.width = displayWidth * pixelRatio;
      canvas.height = displayHeight * pixelRatio;

      // Scale the context to match the pixel ratio for crisp rendering
      ctx.scale(pixelRatio, pixelRatio);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Clear canvas to make it transparent (no background fill)
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // LEFT HALF - Load and draw actual signature
      try {
        if (signPath) {
          const userSignatureImage = new Image();
          userSignatureImage.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            userSignatureImage.onload = () => {
              try {
                // Calculate dimensions for appropriate signature size (45% of canvas width)
                const leftHalfWidth = displayWidth * 0.45 - 5; // 45% width with small padding
                const leftHalfHeight = displayHeight - 15; // Most of canvas height

                // Calculate scaling to maintain aspect ratio but keep it reasonable
                const scaleX = leftHalfWidth / userSignatureImage.width;
                const scaleY = leftHalfHeight / userSignatureImage.height;
                const scale = Math.min(scaleX, scaleY);

                const scaledWidth = userSignatureImage.width * scale;
                const scaledHeight = userSignatureImage.height * scale;

                // Center the signature in the left 45% space
                const x = (displayWidth * 0.45 - scaledWidth) / 2;
                const y = (displayHeight - scaledHeight) / 2; // Center vertically in the canvas

                ctx.drawImage(userSignatureImage, x, y, scaledWidth, scaledHeight);
                resolve();
              } catch (drawError) {
                // eslint-disable-next-line no-console
                console.error('Error drawing signature:', drawError);
                reject(drawError);
              }
            };

            userSignatureImage.onerror = () => {
              // eslint-disable-next-line no-console
              console.warn('Failed to load signature image, using fallback');
              resolve(); // Continue with fallback
            };

            userSignatureImage.src = `${BASE_URL}${signPath}`;
          });
        } else {
          // Fallback: Draw placeholder text
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Signature', displayWidth * 0.225, 40);
        }
      } catch (signatureError) {
        // eslint-disable-next-line no-console
        console.error('Error loading signature:', signatureError);
        // Fallback: Draw placeholder text
        ctx.fillStyle = '#000000';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Signature', displayWidth * 0.225, 40);
      }

      // RIGHT HALF - Digital signature info
      ctx.fillStyle = '#000000'; // Ensure text color is black
      ctx.textAlign = 'left';
      ctx.font = '11px Arial';

      // Helper function to wrap text
      const wrapText = (text, maxWidth, x, y, lineHeight = 15) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
          const testLine = `${line + words[n]} `;
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = `${words[n]} `;
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight;
      };

      // Draw "Digitally signed by" text with wrapping
      const signedByText = `Digitally signed by ${certInfo.subject.commonName}`;
      const rightHalfWidth = displayWidth * 0.55; // Available width for right half (55%)
      let currentY = 20; // Start higher to accommodate maximized signature space
      currentY = wrapText(
        signedByText,
        rightHalfWidth,
        displayWidth * 0.45 + 10, // Start text after the 45% divider
        currentY,
        11
      );

      // Draw date in specified format with wrapping
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timezone = '+08:00'; // Fixed timezone as requested

      const dateText = `Date: ${year}.${month}.${day} ${hours}:${minutes}:${seconds} ${timezone}`;
      ctx.fillStyle = '#000000'; // Ensure text color is black
      ctx.font = '11px Arial';
      currentY = wrapText(
        dateText,
        rightHalfWidth,
        displayWidth * 0.45 + 10, // Start text after the 45% divider
        currentY,
        11
      );

      // Calculate the position for the horizontal line
      // Add some padding below the right half content
      const separatorY = Math.max(currentY, 90); // Ensure minimum position but adjust if content is longer (adjusted for maximized signature)

      // Draw horizontal line to separate serial number area
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, separatorY);
      ctx.lineTo(displayWidth - 10, separatorY);
      ctx.stroke();

      // Convert canvas to data URL
      return canvas.toDataURL('image/png');
    } catch (err) {
      console.error('Signature image creation error:', err);
      throw new Error('Failed to create signature image');
    }
  };

  // Sign PDF with PKI
  const handleSignDocu = async () => {
    if (!isValidCertificate || !window.currentPrivateKey || !window.currentCertificate) {
      setError('Please load a valid certificate first');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to sign this document with your PKI certificate?'
    );

    if (!confirmed) return;

    setLoading(true);
    setSigningProgress(0);

    // Step 1: Download PDF
    setSigningProgress(10);
    const response = await fetch(pdfUrl);

    const pdfBuffer = await response.arrayBuffer();

    // Step 2: Generate PDF hash
    setSigningProgress(30);

    const pdfHash = await generatePDFHash(pdfBuffer);

    // Step 3: Create CMS signature
    setSigningProgress(50);
    const cmsSignature = await createCMSSignature(
      pdfHash,
      window.currentPrivateKey,
      window.currentCertificate
    );

    // Step 4: Create visual signature image
    setSigningProgress(60);

    // Step 6: Send data to server (let server handle PDF modification)
    setSigningProgress(70);

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
      .put(`/documents/autoSignPNPKI/${id}`, {
        fileName,
        page: pageToSign,
        fullName: `${auth?.firstName} ${auth?.middleIntl ? `${auth?.middleIntl}. ` : ''}${
          auth?.lastName
        }`,
        titles: auth?.positions,
        signedBy: { id: auth?.unitId, destination: auth?.unitName },
        signature: cmsSignature,
        signatureImage, // Send the visual signature image
        certificateInfo,
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
        remarks: `Auto signed using PNPKI by ${auth?.firstName} ${
          auth?.middleIntl ? `${auth?.middleIntl}. ` : ''
        }${auth?.lastName} from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`
      })
      .then(res => {
        const { data } = res;

        setOpenDocPreviewModal(true);
        setNewDocUrl(
          data.files.length > 0 && data.files[data.files.length - 1]
            ? `${BASE_URL}/pdfUploads/${data.files[data.files.length - 1]}`
            : null
        );

        enqueueSnackbar('Document signed successfully with PKI certificate', {
          variant: 'success'
        });
        setSigningProgress(100);
      })
      .catch(err => {
        console.error('PKI signing error:', err);
        setError(err.response?.data?.error || 'Failed to sign document with PKI certificate');
      })
      .finally(() => {
        setLoading(false);
        setSigningProgress(0);
      });
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
    const selectedSignPath = auth.signPath || null;

    if (auth.unitId === 1 && signType === 'sign') {
      setSignPath(selectedSignPath ? selectedSignPath[0]?.sign : null);
      setSignType('sign');
    } else {
      setSignPath(selectedSignPath ? selectedSignPath[0]?.initial : null);
      setSignType('initial');
    }

    if (open) {
      if (!pdfUrl && !loadingState && !open) {
        setError('PDF URL is undefined.');
        return;
      }
      setError('');

      if (open && pdfUrl) {
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

            setPDFImgPages(imagesContainer);
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
    if (certificateInfo) {
      const fetchSignatureImage = async () => {
        const signatureImageDataUrl = await createSignatureImage(certificateInfo);

        const signatureImageBase64 = signatureImageDataUrl.split(',')[1];

        setSignatureImage(signatureImageBase64);
      };

      if (open) {
        fetchSignatureImage();
      }
    }
  }, [BASE_URL, open, auth, certificateInfo]);

  const getSignTypeChip = () => {
    if (signType === 'sign') {
      return <Chip label="Signature" color="primary" size="small" />;
    }
    if (signType === 'initial') {
      return <Chip label="Initial" color="secondary" size="small" />;
    }
    return <Chip label="Signature" color="secondary" size="small" />;
  };

  const isCertificateValid = () => {
    if (!certificateInfo) return false;
    const now = new Date();
    const validFrom = new Date(certificateInfo.validFrom);
    const validTo = new Date(certificateInfo.validTo);
    return now >= validFrom && now <= validTo;
  };

  const fetchCertificateFile = async () => {
    try {
      const certPath = auth?.signPath?.[0]?.pnpkicert;
      if (!certPath) {
        throw new Error('No certificate path found');
      }

      const fullUrl = `${BASE_URL}${certPath}`;

      const res = await fetch(fullUrl);
      if (!res.ok) {
        console.error('Failed to fetch certificate:', res.status, res.statusText);
        throw new Error(`Failed to fetch certificate: ${res.status} ${res.statusText}`);
      }
      return res;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (open && !certificateFile && auth?.signPath?.[0]?.pnpkicert) {
      (async () => {
        try {
          const response = await fetchCertificateFile();

          setCertificateFile(response);
          setCertificateInfo(null);
          setIsValidCertificate(false);
          setCertificatePassword(auth?.signPath?.[0]?.pnpkiPassword);
          setError('');
        } catch (err) {
          console.error('Certificate loading error:', err);
          setError(`Unable to load certificate: ${err.message}`);
          setCertificateFile(null);
        }
      })();
    } else {
      setCertificateFile(null);
    }
  }, [open, auth?.signPath]);

  useEffect(() => {
    if (open && certificatePassword && certificateFile && !certificateInfo) {
      extractCertificateInfo();
    }
  }, [open, certificatePassword, certificateFile, certificateInfo]);

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
            backgroundColor: alpha(theme.palette.secondary.main, 0.02)
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SecurityIcon
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
                    PKI Certificate Signing
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign documents using your digital certificate (.p12)
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

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'auto'
          }}
        >
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
              </Box>

              {/* Action Button */}
              <Button
                variant="contained"
                size="medium"
                startIcon={<AiFillSignature />}
                onClick={handleSignDocu}
                disabled={loading || !signPath || !isValidCertificate || !isCertificateValid()}
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
                {loading ? 'Signing...' : 'Sign Document'}
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
              {!isValidCertificate && (
                <Chip
                  icon={<WarningIcon />}
                  label="Load certificate to enable signing"
                  color="warning"
                  variant="outlined"
                />
              )}
              {isValidCertificate && !isCertificateValid() && (
                <Chip
                  icon={<WarningIcon />}
                  label="Certificate expired or invalid"
                  color="error"
                  variant="outlined"
                />
              )}
              {isValidCertificate && isCertificateValid() && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Ready to sign"
                  color="success"
                  variant="outlined"
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
              {pdfUrl && open && PDFImgPages.length > 0 ? (
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
                    src={PDFImgPages[0]}
                    alt={`Page ${pageToSign}`}
                    style={{
                      marginBottom: '10px',
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
              {certificateInfo
                ? 'Signing document...'
                : `Loading certificate...  ${signingProgress}%`}
            </Typography>
          </Box>
        )}
      </Box>
    </Modal>
  );
}
