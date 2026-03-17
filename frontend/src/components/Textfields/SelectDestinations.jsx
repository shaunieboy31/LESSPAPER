import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, IconButton, Menu, MenuItem, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';

export default function SelectDestinations({
  label,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  errorFormik,
  helperText,
  disabled,
  addSpecificDestinations = null,
  showOnlySpecificDestinations = null,
  showSuperintendents = false,
  restrictOwnDestination,
  sx = { width: '100%' }
}) {
  // eslint-disable-next-line no-unused-vars
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [destinations, setDestinations] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exclusionGroups = {
    SDSSec: [4, 1, 2], // Exclude SDSSec and units with id 1 and 2
    ASDSSec: [7, 1, 2],
    ASUProper: [9, 1, 2], // Sir Ronnie
    LegalServices: [6, 1, 2],
    LegalSecretary: [50, 1, 2],
    LegalAttorneys: [49],
    ICT: [20]
  };

  const handleGetAll = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get('/libraries/getDestinations')
      .then(e => {
        let fetchedUnits = e?.data?.units || [];
        console.log('Fetched Units:', fetchedUnits);

        if (auth?.officeId !== 1) {
          // Restrict to Cavite SDO only
          fetchedUnits = fetchedUnits.filter(unit => unit.id === 12);
        } else if (showOnlySpecificDestinations?.length > 0) {
          // Restrict to specific destinations
          fetchedUnits = fetchedUnits.filter(unit =>
            showOnlySpecificDestinations.includes(unit.id)
          );
        } else if (restrictOwnDestination === 'unit') {
          // Find which exclusion group applies
          const groupKey = Object.keys(exclusionGroups).find(key =>
            exclusionGroups[key].includes(auth.unitId)
          );

          if (groupKey) {
            fetchedUnits = fetchedUnits.filter(
              unit => !exclusionGroups[groupKey].includes(unit.id)
            );
          } else {
            // General case: exclude unit 2 (and optionally own unit)
            fetchedUnits = fetchedUnits.filter(unit => unit.id !== 2);
            // If you want to exclude own unit too:
            // fetchedUnits = fetchedUnits.filter(unit => unit.id !== 2 && unit.id !== auth.unitId);
          }
        } else if (showSuperintendents) {
          // Show all units (or filter to superintendent IDs if needed)
          fetchedUnits = e?.data?.units;
        }
        // else {
        //   // General case: exclude units with id 2
        //   fetchedUnits = fetchedUnits.filter(
        //     // unit => unit.id !== 2
        //     unit => unit.id !== auth.unitId
        //   );
        // }

        // Filter units to get the top managements and their secretaries
        const upperManagement = fetchedUnits.filter(
          unit => unit.id < 8 || unit.id === 49 || unit.id === 50
        );

        // Filter units aside from top managements and their secretaries and sort them alphabetically
        const sortedUnits = fetchedUnits
          .filter(unit => unit.id < 1 || (unit.id > 7 && unit.id !== 49 && unit.id !== 50))
          .sort((a, b) => a.destination.localeCompare(b.destination));

        // Exclude the office with id 1 (SDO - Imus) to get only the schools
        const fetchedOffices = e?.data?.offices.filter(office => office.id !== 1);

        let sortedOffices = fetchedOffices.sort((a, b) =>
          a?.destination.localeCompare(b?.destination)
        );
        // If restrictOwnDestination is set to "office", exclude the user's own office
        if (restrictOwnDestination === 'office') {
          sortedOffices = sortedOffices.filter(office => office.id !== auth.officeId);
        }

        // Combine destinations in the order: upper management, sorted units, and (if unitId is 12) sorted offices
        let combinedDestinations = [
          ...upperManagement,
          ...sortedUnits,
          ...(auth?.unitId === 12 ? [...sortedOffices] : [])
        ];

        if (addSpecificDestinations) {
          combinedDestinations = [...addSpecificDestinations, ...combinedDestinations];
        }

        // If the user belongs to unitId 1 (SDO - Cavite), filter destinations to a specific set and sort them in a custom order
        if (auth?.unitId === 1) {
          const filteredSDSUnits = e?.data?.units
            ?.filter(unit => [2, 4, 7, 9, 13, 18, 19, 20, 21, 49, 50].includes(unit?.id))
            ?.sort((a, b) => {
              const order = [2, 13, 21, 4, 7, 49, 50, 8, 9, 10, 11, 12, 47, 18, 19, 20];
              return order.indexOf(a.id) - order.indexOf(b.id);
            });
          setDestinations(filteredSDSUnits);
        } else {
          setDestinations(combinedDestinations);
        }
        // setUnits(fetchedUnits);
      })
      .catch(err => {
        setError(err.message || 'Error: Something went wrong');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGetAll();
  }, [auth]);

  const [selectedDestination, setSelectedDestination] = useState(
    destinations?.find(dest => dest.id === value) || null
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
    setSelectedDestination(destinations?.find(dest => dest.id === value) || null);
  }, [destinations]);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = newValue => {
    setAnchorEl(null);
    if (newValue) {
      // eslint-disable-next-line no-unused-expressions, no-param-reassign
      delete newValue?.office || newValue?.unit;

      onChange?.(name, newValue || '');
      setSelectedDestination(newValue);
    }
  };

  const handleClear = () => {
    onChange?.(name, '');
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
        value={selectedDestination && value ? selectedDestination.destination : ''}
        onClick={handleClick}
        onBlur={onBlur}
        error={errorFormik}
        helperText={<span style={{ color: 'red' }}>{helperText}</span>}
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
          )
        }}
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleClose(null)}>
        {destinations.map(destination => (
          <MenuItem
            sx={{ width: '100%' }}
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
