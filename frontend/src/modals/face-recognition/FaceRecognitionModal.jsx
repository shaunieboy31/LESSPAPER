/* eslint-disable no-alert */
import { Box, IconButton, Modal } from '@mui/material';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
// import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CancelIcon from '@mui/icons-material/Close';
import { enqueueSnackbar } from 'notistack';
import { useStateContext } from 'contexts/ContextProvider';
import Swal from 'sweetalert2';
// import LoadingOverlay from "components/LoadingOverlay";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function FaceRecognitionModal({ open, handleClose, setFaceVerificationStatus }) {
  const { auth } = useStateContext();

  const webcamRef = useRef();
  const canvasRef = useRef();

  const streamRef = useRef();
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);

  const [faceDescriptor, setFaceDescriptor] = useState(false);

  const [intervalId, setIntervalId] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const [statusMessage, setStatusMessage] = useState('Waiting...');

  const [isDetecting, setIsDetecting] = useState(false);

  const validateFaceQuality = detection => {
    const video = webcamRef.current;
    if (!video) return { valid: false, reason: 'Camera not ready' };

    const { box } = detection.detection;

    // 1. Face size check
    const faceArea = box.width * box.height;
    const frameArea = video.videoWidth * video.videoHeight;

    if (faceArea / frameArea < 0.08) {
      return { valid: false, reason: 'Face too far from camera' };
    }

    // 2. Head tilt (roll)
    const landmarks = detection.landmarks;
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();

    const dx = rightEye[0].x - leftEye[0].x;
    const dy = rightEye[0].y - leftEye[0].y;
    const roll = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));

    if (roll > 15) {
      return { valid: false, reason: 'Please keep your head straight' };
    }

    return { valid: true };
  };

  // const [loading, setLoading] = useState(false);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // optional, better accuracy
  };

  const drawFaceBox = (detection, isValid) => {
    if (!canvasRef.current || !detection) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = webcamRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { box } = detection.detection;

    // Mirror canvas to match video
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    ctx.strokeStyle = isValid ? '#00ff00' : '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    ctx.restore();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  useEffect(() => {
    if (open) {
      const load = async () => {
        await loadModels();
        setIsModelsLoaded(true);
      };

      load();
    }
  }, [open]);

  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error('Failed to access webcam:', err);
      }
    };

    const disableCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    if (open && isModelsLoaded) {
      enableCamera();
    } else {
      disableCamera();
    }

    // Stop camera on unmount too (optional safety)
    return () => disableCamera();
  }, [open, isModelsLoaded]);

  const autoCaptureFace = async () => {
    if (isDetecting) return; // Prevent overlap
    setIsDetecting(true);

    // setStatusMessage("Detecting face...");
    if (!webcamRef.current || webcamRef.current.readyState !== 4) {
      setIsDetecting(false);
      return;
    }

    try {
      const detection = await faceapi
        .detectSingleFace(
          webcamRef.current,
          new faceapi.SsdMobilenetv1Options({
            minConfidence: 0.7
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (detection) {
        const quality = validateFaceQuality(detection);

        // DRAW BOX (green or red)
        drawFaceBox(detection, quality.valid);

        if (!quality.valid) {
          setAttempts(prev => prev + 1);
          setStatusMessage(quality.reason);
          return;
        }

        // GOOD FACE
        const descriptor = Array.from(detection.descriptor);
        setFaceDescriptor(descriptor);
        setAttempts(prev => prev + 1);
        setStatusMessage('Face detected');
      } else {
        clearCanvas();
        setAttempts(prev => prev + 1);
        setStatusMessage('No face detected');
      }
    } catch (error) {
      console.error('Error during face detection:', error);
      setAttempts(prev => prev + 1);
      setStatusMessage('No face detected, retrying...');
      clearCanvas();
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (faceDescriptor) {
      // Parse saved descriptors for all angles
      let savedFaceData;
      try {
        savedFaceData =
          typeof auth?.faceData === 'string' ? JSON.parse(auth.faceData) : auth.faceData;
      } catch (e) {
        enqueueSnackbar('Invalid face data format', { variant: 'error' });
        return;
      }

      try {
        let recognized = false;
        let minDistance = Infinity;
        let matchedAngle = null;

        // Compare against all stored angles
        Object.keys(savedFaceData).forEach(angle => {
          if (Array.isArray(savedFaceData[angle])) {
            const savedDescriptor = new Float32Array(savedFaceData[angle]);
            const distance = faceapi.euclideanDistance(savedDescriptor, faceDescriptor);
            if (distance < minDistance) {
              minDistance = distance;
              matchedAngle = angle;
            }
            console.log({ distance, angle });
            if (distance < 0.45) {
              recognized = true;
            }
          }
        });

        if (recognized) {
          localStorage.setItem('faceVerificationStatus', JSON.stringify({ faceVerified: true }));

          setFaceVerificationStatus(true);
          handleClose();
          Swal.fire({
            icon: 'success',
            title: 'Face match!',
            text: `Face recognized! (Matched angle: ${matchedAngle})`,
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          setFaceVerificationStatus(false);
          setStatusMessage('Face does not match');
        }
      } catch (error) {
        enqueueSnackbar('Face not registered. Please sign up first.', { variant: 'error' });
      }
    }
  }, [faceDescriptor]);

  useEffect(() => {
    if (attempts >= 50) {
      clearInterval(intervalId);
      setIntervalId(null);
      enqueueSnackbar('Face not detected after multiple attempts', {
        variant: 'error'
      });
      handleClose();
    }
  }, [attempts]);

  // console.log({
  //   capturedFaceImage: capturedFaceImage.length,
  //   faceDescriptor: faceDescriptor.length,
  // });

  useEffect(() => {
    if (open && isModelsLoaded) {
      setStatusMessage('Starting face detection...');
      const id = setInterval(() => {
        autoCaptureFace();
      }, 1000);
      setIntervalId(id);

      return () => {
        clearInterval(id);
        setIntervalId(null);
        setStatusMessage('Detection stopped.');
      };
    }

    return undefined;
  }, [open, isModelsLoaded]);

  useEffect(() => {
    if (open) {
      setAttempts(0);
      setFaceDescriptor(false);
      setStatusMessage('Waiting...');
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    };
  }, [open]);

  return (
    <Modal open={open} onClose={() => handleClose()}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: '#fff',
          p: 2,
          boxShadow: 24,
          borderRadius: 2,
          width: '800px',
          maxWidth: '98vw'
        }}
      >
        {isModelsLoaded ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: '1px solid lightgray',
              borderRadius: '20px',
              height: '100%'
              // minHeight: "60vh",
            }}
          >
            {/* Close button (top-right, optional) */}
            <IconButton
              onClick={handleClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                bgcolor: 'white',
                '&:hover': {
                  background: 'white'
                }
              }}
            >
              <CancelIcon />
            </IconButton>

            {/* Video */}
            <video
              ref={webcamRef}
              autoPlay
              muted
              playsInline
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                transform: 'scaleX(-1)' // Flip horizontally to fix inversion
                // maxHeight: "500px",
              }}
            />

            {/* Canvas overlay */}
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none' // prevent blocking video interaction
              }}
            />

            <p>Status: {statusMessage}</p>
            {/* Bottom-center button */}
            {/* <IconButton
              onClick={handleCapture}
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                background: "white",
                height: "4vw",
                width: "4vw",
                "&:hover": {
                  background: "white",
                },
              }}
            >
              {loading ? <CircularProgress /> : <CameraAltIcon />}
            </IconButton> */}
          </Box>
        ) : (
          <p>Loading models...</p>
        )}
      </Box>
    </Modal>
  );
}
