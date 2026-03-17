import React from "react";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  styled,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LoginIcon from "@mui/icons-material/Login";
import { useStateContext } from "contexts/ContextProvider";
import LPSLogo from "../../assets/images/lps_logo.png";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: "#1b5e54",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
}));

export default function SelfServiceTopbar({ themeProp }) {
  const { division } = useStateContext();

  const headers = {
    imus: "SDO Imus - Less Paper System | Self-Service Portal",
    gentri: "SDO Gen. Trias - Less Paper System | Self-Service Portal",
    dasma: "SDO Dasmariñas eGov - LPS | Self-Service Portal",
    binan: "SDO Biñan City -Less Paper System | Self-Service Portal",
  };

  const navigate = useNavigate();

  return (
    <StyledAppBar position="fixed" theme={themeProp}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Box
            // onClick={handleNavigate}
            component="img"
            variant="img"
            src={LPSLogo}
            draggable="false"
            sx={{
              mr: 2,
              width: "50px",
              "@media (min-height: 1920px)": {
                width: "100px",
              },
            }}
          />
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                color: "#fff",
                fontWeight: "bold",
                "@media (max-width: 480px)": {
                  fontSize: "15px",
                },
              }}
            >
              {headers[division]}
            </Typography>
          </Box>
        </Box>
        <Button
          onClick={() => navigate("/login")}
          sx={{
            backgroundColor: "lightgray",
            color: "black",
            fontSize: "15px",
            fontWeight: "bold",
            // padding: "8px 20px",
            borderRadius: "20px",
            "&:hover": {
              backgroundColor: "#fff",
              fontWeight: "bold",
            },
          }}
        >
          <LoginIcon sx={{ mr: 1 }} />
          Login
        </Button>
      </Toolbar>
    </StyledAppBar>
  );
}
