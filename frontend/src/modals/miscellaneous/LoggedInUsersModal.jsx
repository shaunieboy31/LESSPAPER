/* eslint-disable react/no-array-index-key */
import React from "react";
import {
  Box,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function LoggedInUsersModal({ open, onClose, loggedInUsers }) {
  if (!open) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        height: "100%",
        width: "100%",
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "80%",
          width: "90%",
          maxWidth: "600px",
          backgroundColor: "#fff",
          overflow: "auto",
          p: 3,
          borderRadius: "10px",
          boxShadow: "3px 2px 20px 3px rgba(0, 0, 0, 0.4)",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e0",
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Logged In Users
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loggedInUsers && loggedInUsers.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Room Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      User Count
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loggedInUsers.map((room, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                        "&:hover": { backgroundColor: "#f0f0f0" },
                      }}
                    >
                      <TableCell>{room?.roomName || "N/A"}</TableCell>
                      <TableCell>{room?.userCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No users currently logged in
              </Typography>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            borderTop: "1px solid #e0e0e0",
            pt: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total Users:
            {loggedInUsers.reduce((acc, room) => acc + room.userCount, 0) || 0}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
