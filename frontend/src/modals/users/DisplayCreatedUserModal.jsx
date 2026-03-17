import * as React from "react";
import PropTypes from "prop-types";
import DialogTitle from "@mui/material/DialogTitle";
import { Box, Divider, IconButton, Modal, Typography } from "@mui/material";
import CancelIcon from "@mui/icons-material/Close";

const style = {
  display: "flex",
  flexDirection: "column",
  // justifyContent: "space-between",
  position: "absolute",
  backgroundColor: "#f0f0f0",
  // background:
  //   "linear-gradient(40deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8))",
  //   border: "solid 2px #46e3be",
  boxShadow: "3px 2px 20px 3px rgba(0, 0, 0, 0.3)",
  borderRadius: "10px",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  overflow: "auto",
};

export default function DisplayCreatedUserModal({ open, handleClose, data }) {
  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        // formik.resetForm();
        // setError("");
      }}
    >
      <Box sx={style}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <DialogTitle>Created User Data</DialogTitle>
          <IconButton onClick={() => handleClose()} sx={{ mr: 2 }}>
            <CancelIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2 }}>
          <Box sx={{ flex: "1 0 100px", mx: 2 }}>
            {open &&
              Object.keys(data).map((key) =>
                [
                  "firstName",
                  "middleIntl",
                  "lastName",
                  "username",
                  "password",
                ].includes(key) ? (
                  <Box key={key}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ flex: "1 0 100px" }}>
                        <Typography sx={{ fontWeight: "bold", mr: 2 }}>
                          {`${key}:`}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 0 100px" }}>
                        <Typography>{data[key]}</Typography>
                      </Box>
                    </Box>
                    <Divider
                      sx={{ background: "lightgray", width: "100%", my: 2 }}
                    />
                  </Box>
                ) : null
              )}
          </Box>
          <Box sx={{ height: "auto" }}>
            <Divider
              orientation="vertical"
              sx={{ height: "100%", backgroundColor: "gray" }}
            />
          </Box>
          <Box sx={{ flex: "1 0 100px", mx: 2 }}>
            {open &&
              Object.keys(data).map((key) =>
                ["role", "positions", "unitName", "officeName"].includes(
                  key
                ) ? (
                  <Box key={key}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ flex: "1 0 100px" }}>
                        <Typography sx={{ fontWeight: "bold", mr: 2 }}>
                          {`${key}:`}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: "1 0 100px" }}>
                        <Typography>{data[key]}</Typography>
                      </Box>
                    </Box>
                    <Divider
                      sx={{ background: "lightgray", width: "100%", my: 2 }}
                    />
                  </Box>
                ) : null
              )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

DisplayCreatedUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.object.isRequired,
};
