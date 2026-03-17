import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import useAxiosPrivate from "contexts/interceptors/axios";

export default function SelectOffice({
  label,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  errorFormik,
  helperText,
  disabled,
  sx = { width: "100%" },
}) {
  const axiosPrivate = useAxiosPrivate();

  const [offices, setOffices] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get("/libraries/getAllOffices")
      .then((e) => {
        setOffices(e.data);
      })
      .catch((err) => {
        setError(err.message || "Error: Something went wrong");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGetAll();
  }, []);

  const [selectedOffice, setSelectedOffice] = useState(
    offices?.find((office) => office.id === value) || null
  );

  useEffect(() => {
    setSelectedOffice(offices?.find((office) => office.id === value) || null);
  }, [offices]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      onChange?.(name, newValue.id || "");
      setSelectedOffice(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, "");
    setSelectedOffice(null);
  };

  return (
    <Box>
      <TextField
        label={error ? `${label} - ${error}` : label}
        placeholder={error ? `${placeholder} - ${error}` : placeholder}
        name={name}
        variant="outlined"
        size="small"
        disabled={error || disabled}
        value={selectedOffice && value ? selectedOffice.office : ""}
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
                  {selectedOffice && (
                    <IconButton edge="end" onClick={handleClear}>
                      <CloseIcon />
                    </IconButton>
                  )}
                  {!disabled && !error && (
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
        {offices.map((office) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={office.id}
            onClick={() => handleClose(office)}
          >
            {office.office}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
