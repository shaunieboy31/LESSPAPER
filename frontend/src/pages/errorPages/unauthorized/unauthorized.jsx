import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(60deg, #2b2b2b, #686868, #2b2b2b)",
        height: "100vh",
        width: "100vw",
      }}
    >
      <Box
        sx={{
          position: "relative",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mt: 2,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Poppins",
              fontSize: "100px",
              color: "#fff",
            }}
          >
            401
          </Typography>
        </Box>
        <Box
          sx={{
            mt: -4,
          }}
        >
          <Typography
            sx={{ fontFamily: "Poppins", fontSize: "30px", color: "#fff" }}
          >
            You are unauthorized
          </Typography>
        </Box>
        <Box
          sx={{
            mt: 4,
          }}
        >
          <Button
            onClick={goBack}
            sx={{
              backgroundColor: "lightgray",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "13px",
              color: "black",
              "&:hover": {
                boxShadow: "0 0 10px 5px rgba(255, 255, 255, 0.7)",
                backgroundColor: "gray",
                color: "#fff",
                transition: "all 0.1s ease-in-out",
                mx: "5px",
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Unauthorized;
