import { Box } from "@mui/material";

function ProgressCircle({ progress, size }) {
  const angle = progress * 360;
  return (
    <Box
      sx={{
        background: `radial-gradient(yellow 55%, transparent 56%),
            conic-gradient(transparent 0deg ${angle}deg, blue ${angle}deg 360deg),
           green`,
        borderRadius: "50%",
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}

export default ProgressCircle;
