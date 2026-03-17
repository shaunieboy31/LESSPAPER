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

export default function SelectAllDestinations({
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

  const [destinations, setDestinations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get("/libraries/getDestinations")
      .then((e) => {
        const fetchedUnits = e?.data?.units;

        const upperManagement = fetchedUnits.filter((unit) => unit.id < 8);

        const sortedUnits = fetchedUnits
          .filter((unit) => unit.id < 1 || unit.id > 7)
          .sort((a, b) => a.destination.localeCompare(b.destination));

        const fetchedOffices = e?.data?.offices.filter(
          (office) => office.id !== 1
        );

        const sortedOffices = fetchedOffices.sort((a, b) =>
          a?.destination.localeCompare(b?.destination)
        );

        const combinedDestinations = [
          ...upperManagement,
          ...sortedUnits,
          ...sortedOffices,
        ];

        setDestinations(combinedDestinations);
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

  const [selectedDestination, setSelectedDestination] = useState(
    destinations?.find((dest) => dest.id === value) || null
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
    setSelectedDestination(
      destinations?.find((dest) => dest.id === value) || null
    );
  }, [destinations]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      // eslint-disable-next-line no-unused-expressions, no-param-reassign
      delete newValue?.office || newValue?.unit;

      onChange?.(name, newValue || "");
      setSelectedDestination(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, "");
    setSelectedDestination(null);
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
        value={
          selectedDestination && value ? selectedDestination.destination : ""
        }
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
                  {selectedDestination && (
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
        {destinations.map((destination) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={destination.id}
            onClick={() => handleClose(destination)}
          >
            {destination.destination}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
