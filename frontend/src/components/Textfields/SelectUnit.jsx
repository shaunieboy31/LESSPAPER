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

export default function SelectUnit({
  label,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  errorFormik,
  helperText,
  disabled,
  addSpecificUnits = null,
  showOnlySpecificUnits = null,
  showSuperintendents = false,
  restrictOwnUnit,
  sx = { width: "100%" },
}) {
  // eslint-disable-next-line no-unused-vars
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [units, setUnits] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SDSSecIds = [4];
  const ASDSSecIds = [7];

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get("/libraries/getAllUnits")
      .then((e) => {
        let fetchedUnits;

        if (showOnlySpecificUnits && showOnlySpecificUnits.length > 0) {
          fetchedUnits = e.data.filter((unit) =>
            showOnlySpecificUnits.includes(unit.id)
          );
        } else if (restrictOwnUnit) {
          if (SDSSecIds.includes(auth.unitId) && auth?.officeId === 1) {
            fetchedUnits = e.data.filter(
              (unit) =>
                !SDSSecIds.includes(unit.id) && unit.id !== 1 && unit.id !== 2
            );
          } else if (ASDSSecIds.includes(auth.unitId) && auth?.officeId === 1) {
            fetchedUnits = e.data.filter(
              (unit) =>
                !ASDSSecIds.includes(unit.id) && unit.id !== 1 && unit.id !== 2
            );
          } else {
            fetchedUnits = e.data.filter(
              (unit) =>
                unit.id !== auth.unitId && unit.id !== 1 && unit.id !== 2
              // (unit) => unit.id !== auth.unitId
            );
          }
        } else if (SDSSecIds.includes(auth.unitId) && auth?.officeId === 1) {
          fetchedUnits = e.data.filter(
            (unit) => unit.id !== 1 && unit.id !== 2
          );
        } else if (ASDSSecIds.includes(auth.unitId) && auth?.officeId === 1) {
          fetchedUnits = e.data.filter(
            (unit) => unit.id !== 1 && unit.id !== 2
          );
        } else if (showSuperintendents) {
          fetchedUnits = e.data;
        } else {
          fetchedUnits = e.data.filter(
            (unit) => unit.id !== 1 && unit.id !== 2
            // (unit) => unit.id !== auth.unitId
          );
        }

        if (addSpecificUnits) {
          fetchedUnits = [...addSpecificUnits, ...fetchedUnits];
        }

        const upperManagement = fetchedUnits.filter((unit) => unit.id < 8);

        const sortedUnits = fetchedUnits
          .filter((unit) => unit.id < 1 || unit.id > 7)
          .sort((a, b) => a.unit.localeCompare(b.unit));

        setUnits([...upperManagement, ...sortedUnits]);
        // setUnits(fetchedUnits);
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

  const [selectedUnit, setSelectedUnit] = useState(
    units?.find((unit) => unit.id === value) || null
  );

  useEffect(() => {
    setSelectedUnit(units?.find((unit) => unit.id === value) || null);
  }, [units]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      onChange?.(name, newValue || "");
      setSelectedUnit(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, "");
    setSelectedUnit(null);
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
        value={selectedUnit && value ? selectedUnit.unit : ""}
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
                  {selectedUnit && (
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
        {units.map((unit) => (
          <MenuItem
            sx={{ width: "100%" }}
            key={unit.id}
            onClick={() => handleClose(unit)}
          >
            {unit.unit}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
