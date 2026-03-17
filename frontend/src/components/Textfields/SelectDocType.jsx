import React, { useEffect, useState } from "react";
import {
  Box,
  Menu,
  MenuItem,
  TextField,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import useAxiosPrivate from "contexts/interceptors/axios";

export default function SelectDocType({
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
  const [docTypes, setDocTypes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = async () => {
    setLoading(true);
    setError("");

    await axiosPrivate
      .get("/libraries/getAllDocTypes")
      .then((res) => {
        const sortedDocTypes = res?.data?.sort((a, b) =>
          a?.docType.localeCompare(b?.docType)
        );

        const docTypesList = [...sortedDocTypes, { id: 0, docType: "Others" }];

        setDocTypes(docTypesList);
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

  const [selectedDocType, setSelectedDocType] = useState(
    docTypes?.find((docType) => docType.docType === value) || null
  );

  useEffect(() => {
    setSelectedDocType(
      docTypes?.find((docType) => docType.docType === value) || null
    );
  }, [docTypes]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue) => {
    setAnchorEl(null);
    if (newValue) {
      onChange?.(name, newValue.docType || "");
      setSelectedDocType(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, ""); // Clear the value
    setSelectedDocType(null);
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
        disabled={error || disabled}
        value={selectedDocType && value ? selectedDocType.docType : ""}
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
                  {selectedDocType && (
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
        {docTypes.map((docType) => (
          <MenuItem
            key={docType.id}
            onClick={() => handleClose(docType)}
            sx={{ width: "100%" }}
          >
            {docType.docType}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
