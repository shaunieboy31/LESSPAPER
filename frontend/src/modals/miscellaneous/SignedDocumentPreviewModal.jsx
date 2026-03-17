/* eslint-disable no-nested-ternary */
import React, { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Modal,
  Paper,
  Stack,
  Typography,
  useTheme,
  alpha,
  Backdrop,
  Button,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import UndoIcon from "@mui/icons-material/Undo";
import WarningIcon from "@mui/icons-material/Warning";
import CheckIcon from "@mui/icons-material/Check";

import MobilePDFViewer from "components/MobilePDFViewer";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  height: "95vh",
  width: "95vw",
  maxWidth: "1200px",
  bgcolor: "background.paper",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
  borderRadius: "16px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export default function SignedDocumentPreviewModal({
  description = "Document Preview",
  shortDescription = "Preview uploaded document",
  setOpenDocPreviewModal,
  filePath,
  loadingState,
  handleAccept,
  handleUndo,
  showUndoConfirm,
  setShowUndoConfirm,
  canUndo,
}) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState("auto");

  useEffect(() => {
    if (filePath) {
      setLoading(true);
      setError("");

      // Simulate loading time for PDF
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
      setError("No file path provided");
    }
  }, [filePath]);

  const handleClose = () => {
    setOpenDocPreviewModal(false);
  };

  const isMobileDevice = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;

  useEffect(() => {
    if (isMobileDevice()) {
      setViewMode("mobile");
    } else {
      setViewMode("iframe");
    }
  }, []);

  return (
    <Modal
      open
      onClose={handleClose}
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 0,
        sx: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
      }}
    >
      <Box sx={modalStyle}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DocumentScannerIcon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                  }}
                />
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {shortDescription}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <IconButton
              onClick={handleClose}
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.1),
                "&:hover": {
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </Paper>

        {canUndo && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            px={2}
          >
            <Button
              variant="contained"
              color="success"
              onClick={() => handleAccept()}
              disabled={loading}
              size="small"
              startIcon={<CheckIcon />}
              sx={{
                minWidth: 120,
                fontWeight: 600,
              }}
            >
              {loading ? "Accepting..." : "Accept"}
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={loading}
              onClick={() => setShowUndoConfirm(true)}
              size="small"
              startIcon={<UndoIcon />}
              sx={{
                minWidth: 120,
                fontWeight: 600,
              }}
            >
              {loading ? "Undoing..." : "Undo"}
            </Button>
          </Stack>
        )}

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 2,
            bgcolor: alpha(theme.palette.grey[100], 0.3),
            overflow: "auto",
          }}
        >
          {loading ? (
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={48} />
              <Typography variant="body1" color="text.secondary">
                Loading document...
              </Typography>
            </Stack>
          ) : error ? (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: alpha(theme.palette.error.main, 0.1),
                border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <WarningIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.error.main,
                  }}
                />
                <Typography variant="h6" color="error">
                  Preview Not Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {error || "Unable to load document preview"}
                </Typography>
              </Stack>
            </Paper>
          ) : filePath ? (
            <Paper
              elevation={3}
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {viewMode === "mobile" && isMobileDevice() ? (
                <Box
                  sx={{
                    height: "100%",
                    width: "100%",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <MobilePDFViewer
                    pdfUrl={filePath}
                    modalState
                    viewMode={viewMode}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    width: "100%",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    src={filePath}
                    title="PDF Viewer"
                    height="100%"
                    width="100%"
                    style={{
                      display: "block",
                      minHeight: "500px",
                    }}
                    allowFullScreen
                    onLoad={() => setLoading(false)}
                  />
                </Box>
              )}
            </Paper>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: alpha(theme.palette.grey[100], 0.5),
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <DocumentScannerIcon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.grey[400],
                  }}
                />
                <Typography variant="h6" color="text.secondary">
                  No Document Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Please select a document to preview
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>

        <Modal
          open={showUndoConfirm}
          onClose={() => setShowUndoConfirm(false)}
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 0,
            sx: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { xs: "90%", sm: 400 },
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              p: 3,
            }}
          >
            <Stack spacing={3}>
              <Box sx={{ textAlign: "center" }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                    mb: 2,
                  }}
                >
                  <UndoIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Confirm Undo Action
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Are you sure you want to undo the last action on this
                  document?
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
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
                  disabled={loading}
                  startIcon={
                    loadingState ? <CircularProgress size={16} /> : <UndoIcon />
                  }
                  sx={{ minWidth: 100 }}
                >
                  {loading ? "Undoing..." : "Confirm Undo"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowUndoConfirm(false)}
                  disabled={loading}
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
