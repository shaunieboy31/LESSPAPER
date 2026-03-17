/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from "react";
import {
  MenuItem,
  IconButton,
  Box,
  TextField,
  Menu,
  CircularProgress,
  Checkbox,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function SelectRole({
  label,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  errorFormik,
  helperText,
  error,
  disable,
  sx,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    "Admin",
    "SDS",
    "ASDS",
    "Secretary",
    "Chief",
    "Unit Head", // Unit/Section Heads
    "Unit Employee",
    "School Personnel",
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, [value]);

  const [selectedRole, setSelectedRole] = useState([]);

  useEffect(() => {
    setSelectedRole(
      roles
        ?.map((role) => role.toLowerCase()) // Ensure roles are compared in lowercase
        .filter((role) => value.includes(role)) // Filter roles that are included in the value array
    );
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // if (newValue) {
    //   onChange?.(name, newValue.toLowerCase() || "");
    //   setSelectedRole(newValue);
    // }
  };

  const handleClear = () => {
    onChange?.(name, ""); // Clear the value
    setSelectedRole([]);
  };

  return (
    <Box>
      <TextField
        label={
          // eslint-disable-next-line no-nested-ternary
          error
            ? `${label || placeholder} - ${error}`
            : disable
            ? `${label || placeholder} - Not Applicable`
            : label
        }
        placeholder={
          // eslint-disable-next-line no-nested-ternary
          error
            ? `${placeholder} - ${error}`
            : disable
            ? `${placeholder} - Not Applicable`
            : placeholder
        }
        name={name}
        variant="outlined"
        size="small"
        disabled={error || disable}
        value={selectedRole ? selectedRole.join(", ") : ""}
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
                  {selectedRole.length > 0 && (
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
        {roles.map((role) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={role}
            onClick={() => {
              setSelectedRole((prev) => {
                let newValue = prev;

                if (newValue.includes(role.toLowerCase())) {
                  newValue = newValue.filter((r) => r !== role.toLowerCase());
                } else {
                  newValue = [...newValue, role.toLowerCase()];
                }

                onChange?.(name, newValue);
                return newValue;
              });
            }}
          >
            <Checkbox checked={selectedRole.includes(role.toLowerCase())} />
            {role}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
