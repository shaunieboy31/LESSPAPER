import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingOverlay({ open, message }) {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        borderRadius: "10px",
      }}
    >
      <CircularProgress size={60} sx={{ color: "#fff" }} />
      <Typography
        variant="h6"
        sx={{
          mt: 2,
          color: "#fff",
          fontFamily: "Poppins",
          fontWeight: 500,
        }}
      >
        {message || "Loading..."}
      </Typography>
    </Box>
  );
}
