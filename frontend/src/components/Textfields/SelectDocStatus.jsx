/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from "react";
import {
  MenuItem,
  IconButton,
  Box,
  TextField,
  Menu,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function SelectDocStatus({
  label,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  errorFormik,
  helperText,
  loadingState,
  error,
  disable,
  sx,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(loadingState || false);

  const docStatus = [
    { id: 1, status: "Outgoing/Incoming" },
    { id: 2, status: "Return" },
    { id: 3, status: "Accepted" },
    { id: 4, status: "Saved" },
    { id: 5, status: "On-Hold" },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, [value]);

  const [selectedStatus, setSelectedStatus] = useState(
    docStatus?.find((stat) => stat.id === value) || null
  );

  useEffect(() => {
    setSelectedStatus(docStatus?.find((stat) => stat.id === value) || null);
  }, [value]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      onChange?.(name, newValue.id || "");
      setSelectedStatus(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, ""); // Clear the value
    setSelectedStatus(null);
  };

  return (
    <Box>
      <TextField
        label={
          // eslint-disable-next-line no-nested-ternary
          error ? `DocType - ${error}` : label
        }
        placeholder={error || placeholder}
        name={name}
        variant="outlined"
        size="small"
        disabled={error || disable}
        value={selectedStatus && value ? selectedStatus.status : ""}
        onClick={handleClick}
        onBlur={onBlur}
        error={errorFormik}
        helperText={helperText}
        sx={sx}
        InputProps={{
          endAdornment: (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
              {loading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <>
                  {selectedStatus && (
                    <IconButton edge="end" onClick={handleClear}>
                      <CloseIcon />
                    </IconButton>
                  )}
                  {!disable && !error && (
                    <IconButton edge="end" onClick={handleClick}>
                      <ArrowDropDownIcon />
                    </IconButton>
                  )}
                </>
              )}
            </>
          ),
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(null)}
      >
        {docStatus.map((stat) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={stat.id}
            onClick={() => handleClose(stat)}
          >
            {stat.status}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
