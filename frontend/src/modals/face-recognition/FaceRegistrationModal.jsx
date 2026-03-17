import { Box, IconButton, Modal, Typography, LinearProgress } from '@mui/material';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import CancelIcon from '@mui/icons-material/Close';
import { enqueueSnackbar } from 'notistack';
import useAxiosPrivate from 'contexts/interceptors/axios';
import Swal from 'sweetalert2';
// import LoadingOverlay from "components/LoadingOverlay";
import { Face, ArrowBack, ArrowForward, KeyboardArrowUp } from '@mui/icons-material';

dayjs.extend(utc);
dayjs.extend(timezone);

// Define the angles to capture
const ANGLES = [
  { name: 'center', label: 'Center', icon: <Face /> },
  { name: 'left', label: 'Left', icon: <ArrowBack /> },
  { name: 'right', label: 'Right', icon: <ArrowForward /> },
  { name: 'up', label: 'Up', icon: <KeyboardArrowUp /> }
];

export default function FaceRegistrationModal({ open, handleClose, data, onSuccess }) {
  const axiosPrivate = useAxiosPrivate();

  const webcamRef = useRef();
  const canvasRef = useRef();

  const streamRef = useRef();
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);

  // Multi-angle state management
  const [capturedAngles, setCapturedAngles] = useState({});
  const [currentAngleIndex, setCurrentAngleIndex] = useState(null);
  const [detectedAngle, setDetectedAngle] = useState();
  const [captureProgress, setCaptureProgress] = useState(0);

  const [loading, setLoading] = useState(false);

  const [intervalId, setIntervalId] = useState(null);
  const [faceDetectionIntervalId, setFaceDetectionIntervalId] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const [statusMessage, setStatusMessage] = useState('Click an angle to start capturing');
  const [isDetecting, setIsDetecting] = useState(false);

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // optional, better accuracy
  };

  const detectFaceAngle = async detection => {
    if (!detection || !detection.landmarks) return 'center';

    const landmarks = detection.landmarks.positions;
    const leftEye = landmarks[36]; // Left eye
    const rightEye = landmarks[45]; // Right eye

    // Calculate face orientation based on eye positions
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const videoCenterX = webcamRef.current.videoWidth / 2;

    // Calculate vertical position
    const videoCenterY = webcamRef.current.videoHeight / 2;
    const faceCenterY = (leftEye.y + rightEye.y) / 2;

    // Determine horizontal angle (swapped due to camera inversion)
    let horizontalAngle = 'center';
    const horizontalThreshold = eyeDistance * 0.3;

    // Since camera is inverted, we need to swap left/right detection
    if (eyeCenterX < videoCenterX - horizontalThreshold) {
      horizontalAngle = 'right'; // Was "left" before inversion
    } else if (eyeCenterX > videoCenterX + horizontalThreshold) {
      horizontalAngle = 'left'; // Was "right" before inversion
    }

    // Determine vertical angle
    let verticalAngle = 'center';
    const verticalThreshold = eyeDistance * 0.3;

    if (faceCenterY < videoCenterY - verticalThreshold) {
      verticalAngle = 'up';
    } else if (faceCenterY > videoCenterY + verticalThreshold) {
      verticalAngle = 'down';
    }

    // Combine horizontal and vertical angles
    if (horizontalAngle !== 'center' && verticalAngle !== 'center') {
      // For diagonal angles, prioritize the more pronounced one
      const horizontalOffset = Math.abs(eyeCenterX - videoCenterX);
      const verticalOffset = Math.abs(faceCenterY - videoCenterY);

      return horizontalOffset > verticalOffset ? horizontalAngle : verticalAngle;
    }

    return horizontalAngle !== 'center' ? horizontalAngle : verticalAngle;
  };

  const drawFaceDetectionBox = detection => {
    if (!canvasRef.current || !detection) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = webcamRef.current;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get the bounding box
    const { box } = detection.detection;

    // Flip the canvas horizontally to match the video flip
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    // Draw the target vertical lines in the center
    const centerX = canvas.width / 2;
    const lineSpacing = Math.min(canvas.width, canvas.height) * 0.5; // 50% of smaller dimension (increased from 30%)
    const leftLineX = centerX - lineSpacing / 2;
    const rightLineX = centerX + lineSpacing / 2;

    // Draw target vertical lines
    ctx.strokeStyle = '#ffffff'; // White color
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line

    // Left vertical line
    ctx.beginPath();
    ctx.moveTo(leftLineX, 0);
    ctx.lineTo(leftLineX, canvas.height);
    ctx.stroke();

    // Right vertical line
    ctx.beginPath();
    ctx.moveTo(rightLineX, 0);
    ctx.lineTo(rightLineX, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]); // Reset to solid line

    // Check if face size is appropriate (width should fit between lines)
    const faceWidth = box.width;
    const targetWidth = lineSpacing;
    const sizeDifference = Math.abs(faceWidth - targetWidth);
    const sizeTolerance = targetWidth * 0.3; // 30% tolerance
    const isProperlySized = sizeDifference <= sizeTolerance;

    // Check if face is centered horizontally between the lines
    const faceCenterX = box.x + box.width / 2;
    const isCenteredHorizontally = faceCenterX >= leftLineX && faceCenterX <= rightLineX;

    // Choose color based on face size and horizontal position
    const faceColor = isProperlySized && isCenteredHorizontally ? '#00ff00' : '#0066ff'; // Green if properly sized AND centered, blue otherwise

    // Draw the face detection rectangle
    ctx.strokeStyle = faceColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Add a semi-transparent fill
    ctx.fillStyle = 'transparent';
    ctx.fillRect(box.x, box.y, box.width, box.height);

    // Draw corner indicators
    const cornerSize = 10;
    ctx.strokeStyle = faceColor; // Use the same color as the rectangle
    ctx.lineWidth = 2;

    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + cornerSize);
    ctx.lineTo(box.x, box.y);
    ctx.lineTo(box.x + cornerSize, box.y);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerSize, box.y);
    ctx.lineTo(box.x + box.width, box.y);
    ctx.lineTo(box.x + box.width, box.y + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(box.x, box.y + box.height - cornerSize);
    ctx.lineTo(box.x, box.y + box.height);
    ctx.lineTo(box.x + cornerSize, box.y + box.height);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(box.x + box.width - cornerSize, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height);
    ctx.lineTo(box.x + box.width, box.y + box.height - cornerSize);
    ctx.stroke();

    // Restore the canvas context
    ctx.restore();
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const checkFaceCriteria = async (detection, targetAngle) => {
    if (!detection) return { isValid: false, reason: 'No face detected' };

    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const lineSpacing = Math.min(canvas.width, canvas.height) * 0.5; // 50% of smaller dimension
    const leftLineX = centerX - lineSpacing / 2;
    const rightLineX = centerX + lineSpacing / 2;
    const { box } = detection.detection;

    // Check angle
    const angleDetected = await detectFaceAngle(detection);

    // console.log(angleDetected);

    if (angleDetected !== targetAngle) {
      return {
        isValid: false,
        reason: `Wrong angle. Expected: ${targetAngle}, Got: ${angleDetected}`
      };
    }

    // Check size (face width should fit between lines)
    const targetWidth = lineSpacing;
    const faceWidth = box.width;
    const sizeDifference = Math.abs(faceWidth - targetWidth);
    const sizeTolerance = targetWidth * 0.3; // 30% tolerance
    const isProperlySized = sizeDifference <= sizeTolerance;
    if (!isProperlySized) {
      return { isValid: false, reason: 'Face size not optimal' };
    }

    // Check horizontal center position (face should be between the lines)
    const faceCenterX = box.x + box.width / 2;
    const isCenteredHorizontally = faceCenterX >= leftLineX && faceCenterX <= rightLineX;
    if (!isCenteredHorizontally) {
      return { isValid: false, reason: 'Face not centered between lines' };
    }

    return { isValid: true, reason: 'All criteria met' };
  };

  const startContinuousFaceDetection = () => {
    if (faceDetectionIntervalId) {
      clearInterval(faceDetectionIntervalId);
    }

    const interval = setInterval(async () => {
      const isVideoReady = () => {
        const video = webcamRef.current;
        return (
          video &&
          video.tagName === 'VIDEO' &&
          video.readyState === 4 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        );
      };

      if (!isModelsLoaded || !isVideoReady()) {
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(webcamRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          drawFaceDetectionBox(detection);
        } else {
          clearCanvas();
        }
      } catch (error) {
        console.error('Error in continuous face detection:', error);
        clearCanvas();
      }
    }, 500); // Check every 500ms

    setFaceDetectionIntervalId(interval);
  };

  const stopContinuousFaceDetection = () => {
    if (faceDetectionIntervalId) {
      clearInterval(faceDetectionIntervalId);
      setFaceDetectionIntervalId(null);
    }
    clearCanvas();
  };

  // Save all captured angles as JSON
  const saveAllAnglesToDatabase = async newCapturedAngles => {
    setLoading(true);

    // Send the capturedAngles object directly, let the server handle JSON parsing
    await axiosPrivate
      .put(`/user/registerFaceData/${data?.uid}`, {
        faceData: newCapturedAngles
      })
      .then(() => {
        setStatusMessage('Face detected!');
        Swal.fire({
          icon: 'success',
          title: 'Face Detected!',
          text: 'All face angles have been registered successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        handleClose();
        onSuccess(newCapturedAngles);
      })
      .catch(err => {
        enqueueSnackbar(err?.message || 'An error occurred while capturing face', {
          variant: 'error'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const stopCapturing = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    setCurrentAngleIndex(null);
    setStatusMessage('Click an angle to start capturing');
  };

  const captureSpecificAngle = async angleIndex => {
    if (isDetecting) return; // Prevent overlap
    setIsDetecting(true);

    const currentAngle = ANGLES[angleIndex];

    try {
      const detection = await faceapi
        .detectSingleFace(webcamRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const angleDetected = await detectFaceAngle(detection);
        const descriptor = Array.from(detection.descriptor);

        setDetectedAngle(angleDetected);

        // Draw face detection box
        drawFaceDetectionBox(detection);

        // Check all criteria: correct angle, centered, and properly sized
        const criteriaCheck = await checkFaceCriteria(detection, currentAngle.name);

        if (criteriaCheck.isValid) {
          const newCapturedAngles = {
            ...capturedAngles,
            [currentAngle.name]: descriptor
          };

          setCapturedAngles(newCapturedAngles);

          setStatusMessage(
            `${currentAngle.label} angle captured! Click another angle to continue.`
          );

          // Stop capturing this angle immediately
          if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
          }
          setCurrentAngleIndex(null);

          // Update progress
          const capturedCount = Object.keys(newCapturedAngles).length;
          setCaptureProgress((capturedCount / ANGLES.length) * 100);

          // Check if all angles are captured
          if (capturedCount === ANGLES.length) {
            setStatusMessage('All angles captured! Saving to database...');
            saveAllAnglesToDatabase(newCapturedAngles);
          }
        } else {
          setStatusMessage(`Please adjust: ${criteriaCheck.reason}`);
        }

        setAttempts(prev => prev + 1);
      } else {
        setAttempts(prev => prev + 1);
        setStatusMessage('No face detected, retrying...');
      }
    } catch (error) {
      console.error('Error during face detection:', error);
      setAttempts(prev => prev + 1);
      setStatusMessage('No face detected, retrying...');
    } finally {
      setIsDetecting(false);
    }
  };

  const startCapturingAngle = angleIndex => {
    if (capturedAngles[ANGLES[angleIndex].name]) {
      enqueueSnackbar(`${ANGLES[angleIndex].label} angle already captured`, {
        variant: 'info'
      });
      return;
    }

    // Stop any existing capture first
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    setCurrentAngleIndex(angleIndex);
    setAttempts(0);
    setStatusMessage(`Capturing ${ANGLES[angleIndex].label} angle...`);

    // Start the capture interval
    const id = setInterval(() => {
      // Check if this angle is still the current one and not already captured
      // if (currentAngleIndex !== angleIndex) {
      //   console.log("Angle changed, stopping capture");
      //   clearInterval(id);
      //   setIntervalId(null);
      //   return;
      // }

      if (capturedAngles[ANGLES[angleIndex].name]) {
        // console.log("Angle already captured, stopping");
        clearInterval(id);
        setIntervalId(null);
        setCurrentAngleIndex(null);
        stopCapturing();
        return;
      }

      captureSpecificAngle(angleIndex);
    }, 2000);
    setIntervalId(id);
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
    // Stop capturing if no angle is selected
    if (currentAngleIndex === null) {
      stopCapturing();
    }
  }, [currentAngleIndex]);

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
      // Start continuous face detection after camera is enabled
      setTimeout(() => {
        startContinuousFaceDetection();
      }, 1000); // Small delay to ensure video is loaded
    } else {
      disableCamera();
      stopContinuousFaceDetection();
    }

    // Stop camera on unmount too (optional safety)
    return () => {
      disableCamera();
      stopContinuousFaceDetection();
    };
  }, [open, isModelsLoaded]);

  useEffect(() => {
    if (attempts >= 20) {
      // Stop capturing if too many attempts
      stopCapturing();
      enqueueSnackbar('Face not detected after multiple attempts. Try again.', {
        variant: 'error'
      });
    }
  }, [attempts]);

  useEffect(() => {
    if (open) {
      setAttempts(0);
      setCapturedAngles({});
      setCurrentAngleIndex(null);
      setCaptureProgress(0);
      setStatusMessage('Click an angle to start capturing');
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    // Stop continuous face detection when modal closes
    if (!open) {
      stopContinuousFaceDetection();
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      stopContinuousFaceDetection();
    };
  }, [open]);

  const getAngleIndicatorStyle = (angle, index) => {
    let bgcolor = 'grey.200';
    let color = 'text.secondary';
    let cursor = 'pointer';

    if (capturedAngles[angle.name]) {
      bgcolor = 'success.light';
      color = 'success.contrastText';
      cursor = 'default';
    } else if (currentAngleIndex === index) {
      bgcolor = 'primary.light';
      color = 'primary.contrastText';
      cursor = 'default';
    }

    return { bgcolor, color, cursor };
  };

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
          maxWidth: '98vw',
          '@media (max-width: 600px)': {
            height: '80vh'
          }
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
                zIndex: 10,
                bgcolor: 'white',
                '&:hover': {
                  background: 'white'
                }
              }}
            >
              <CancelIcon />
            </IconButton>

            {/* Progress indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                zIndex: 2,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 1,
                p: 1
              }}
            >
              <Typography variant="caption" display="block">
                Captured angles: {Object.keys(capturedAngles).length}/{ANGLES.length} (
                {Math.round(captureProgress)}%)
              </Typography>
              <LinearProgress variant="determinate" value={captureProgress} sx={{ mt: 0.5 }} />
            </Box>

            {/* Angle indicators */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'center',
                gap: 1,
                zIndex: 2
              }}
            >
              {ANGLES.map((angle, index) => {
                const { bgcolor, color, cursor } = getAngleIndicatorStyle(angle, index);
                return (
                  <Box
                    key={angle.name}
                    onClick={() => !capturedAngles[angle.name] && startCapturingAngle(index)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor,
                      color,
                      width: '60px',
                      minWidth: '60px',
                      fontSize: '0.8rem',
                      cursor,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: cursor === 'pointer' ? 'scale(1.05)' : 'none',
                        boxShadow: cursor === 'pointer' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: '1.2rem' }}>
                      {angle.icon}
                    </Typography>
                    <Typography variant="caption">{angle.label}</Typography>
                  </Box>
                );
              })}
            </Box>

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
                pointerEvents: 'none'
              }}
            />

            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                bottom: 80,
                left: 16,
                right: 16,
                textAlign: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 1,
                borderRadius: 1,
                zIndex: 2
              }}
            >
              Status: {statusMessage}
            </Typography>

            {detectedAngle && (
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: 80,
                  left: 16,
                  right: 16,
                  textAlign: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  p: 1,
                  borderRadius: 1,
                  zIndex: 2
                }}
              >
                Detected Angle: {detectedAngle}
              </Typography>
            )}

            {loading && (
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  top: 80,
                  left: 16,
                  right: 16,
                  textAlign: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  p: 1,
                  borderRadius: 1,
                  zIndex: 2
                }}
              >
                Saving to database...
              </Typography>
            )}
          </Box>
        ) : (
          <p>Loading models...</p>
        )}
      </Box>
    </Modal>
  );
}
