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
import { useStateContext } from "contexts/ContextProvider";

export default function SelectSystem({
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
  // eslint-disable-next-line no-unused-vars
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [systems, setSystems] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get("/libraries/getAllSystems")
      .then((e) => {
        const fetchedSystems = e?.data;

        setSystems(fetchedSystems);
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
  }, [auth]);

  const [selectedSystem, setSelectedSystem] = useState(
    systems?.find((system) => system.id === value) || null
  );

  // useEffect(() => {
  //   const destination = destinations?.find((dest) => dest.id === value) || null;

  //   if (destination) {
  //     const { unit, office, ...rest } = destination;
  //     setSelectedDestination({
  //       ...rest,
  //       destination: unit || office,
  //     });
  //   } else {
  //     setSelectedDestination(null);
  //   }
  // }, [destinations]);

  useEffect(() => {
    setSelectedSystem(systems?.find((system) => system.id === value) || null);
  }, [systems]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      // eslint-disable-next-line no-unused-expressions, no-param-reassign
      // delete newValue?.office || newValue?.unit;

      onChange?.(name, newValue.id || "");
      setSelectedSystem(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, "");
    setSelectedSystem(null);
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
        value={selectedSystem && value ? selectedSystem.name : ""}
        onClick={handleClick}
        onBlur={onBlur}
        error={errorFormik}
        helperText={<span style={{ color: "red" }}>{helperText}</span>}
        sx={sx}
        InputProps={{
          endAdornment: (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <>
              {loading ? (
                <CircularProgress color="inherit" size={20} />
              ) : (
                <>
                  {selectedSystem && (
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
        {systems.map((system) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={system.id}
            onClick={() => handleClose(system)}
          >
            {system.name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
