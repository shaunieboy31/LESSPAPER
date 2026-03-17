/* eslint-disable no-plusplus */
import React, { useEffect, useState, useRef } from "react";
import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Stack,
  Button,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";

export default function MobilePDFViewer({
  pdfUrl,
  viewMode = "mobile",
  modalState,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [PDFImages, setPDFImages] = useState([]);
  const renderTaskRef = useRef(null);
  const [pagesToLoad, setPagesToLoad] = useState("default");

  // Load PDF document
  useEffect(() => {
    if (viewMode === "mobile") {
      setError("");
      setLoading(true);

      const loadingTask = getDocument({ url: pdfUrl });

      loadingTask.promise
        .then(async (pdf) => {
          const totalPagesCount = pdf.numPages;
          setTotalPages(totalPagesCount);

          setLoading(true);
          const imagesContainer = {};

          // Calculate range of pages to load (5 before, 5 after, or as many as possible)
          const endPage =
            pagesToLoad === "default"
              ? Math.min(totalPagesCount, 5)
              : totalPagesCount;

          const pagePromises = [];
          for (let pageNum = 1; pageNum <= endPage; pageNum++) {
            pagePromises.push(
              (async () => {
                const page = await pdf.getPage(pageNum);

                // Get viewport at original scale (no scaling)
                const viewport = page.getViewport({ scale: 1.0 });

                // Create temporary canvas for image generation
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                  canvasContext: context,
                  viewport,
                }).promise;

                // Convert canvas to blob instead of data URL
                return new Promise((resolve) => {
                  canvas.toBlob((blob) => {
                    resolve({ pageNum, blob });
                  }, "image/png");
                });
              })()
            );
          }

          // Execute all page loading promises
          const results = await Promise.all(pagePromises);

          // Build the images container
          results.forEach(({ pageNum, blob }) => {
            imagesContainer[pageNum] = blob;
          });

          // Update state after each page to show progress
          setPDFImages(imagesContainer);
        })
        .catch((err) => {
          console.error("Error loading PDF:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (modalState === false) {
      setPDFImages([]);
    }
  }, [pagesToLoad, pdfUrl, viewMode, modalState]);

  // Navigate to next page
  const nextPage = () => {
    if (currentPage < totalPages && !loading) {
      const nextPageNum = currentPage + 1;
      setCurrentPage(nextPageNum);
    }
  };

  // Navigate to previous page
  const prevPage = () => {
    if (currentPage > 1 && !loading) {
      const prevPageNum = currentPage - 1;
      setCurrentPage(prevPageNum);
    }
  };

  // Handle window resize for responsive scaling
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      if (currentPage && !loading) {
        // Debounce resize events
        clearTimeout(resizeTimeout);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [currentPage, loading]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    },
    []
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 2,
        }}
      >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading PDF...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 2,
        }}
      >
        <Typography variant="body1" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  // Reset PDFImages when modal is closed

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Page Navigation */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          border: "1px solid #ddd",
          bgcolor: "background.paper",
          borderRadius: 1,
          boxShadow: 1,
          p: 1,
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <IconButton
          onClick={prevPage}
          disabled={currentPage <= 1 || loading}
          size="small"
        >
          <NavigateBeforeIcon />
        </IconButton>

        <Typography
          variant="body2"
          sx={{ minWidth: "60px", textAlign: "center" }}
        >
          {currentPage} / {totalPages}
        </Typography>

        <IconButton
          onClick={nextPage}
          disabled={currentPage >= totalPages || loading}
          size="small"
        >
          <NavigateNextIcon />
        </IconButton>

        {pagesToLoad === "default" && (
          <Button onClick={() => setPagesToLoad("all")}>Show All</Button>
        )}
      </Stack>

      {/* Loading indicator for page changes */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {/* PDF Canvas */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          p: 2,
          position: "relative",
        }}
      >
        <img
          src={
            PDFImages[currentPage]
              ? URL.createObjectURL(PDFImages[currentPage])
              : ""
          }
          alt={`Page ${currentPage}`}
          style={{
            maxWidth: "100%",
            height: "auto",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
      </Box>
    </Box>
  );
}
