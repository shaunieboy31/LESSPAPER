/* eslint-disable prettier/prettier */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Radio,
  Tooltip,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
// import CancelIcon from "@mui/icons-material/Close";
import RemoveIcon from '@mui/icons-material/Remove';
import ShortcutIcon from '@mui/icons-material/Shortcut';

import { useEffect, useState } from 'react';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import SelectDestinations from 'components/Textfields/SelectDestinations';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import LPSModal from 'layouts/ModalLayout';
import { toast } from 'react-toastify';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function TransmitDocumentModal({
  open,
  handleClose,
  updateTableFunction,
  loadingState,
  selectedData
}) {
  const { auth, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);
  const [destinations, setDestinations] = useState([{ id: null, destination: null, type: null }]);
  const [classification, setClassification] = useState(4);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [destinationErrorMssg, setDestinationErrorMssg] = useState([]);

  const handleSubmit = () => {
    if (
      selectedData?.some(doc => doc?.classification && doc?.classification === 5) &&
      destinations?.some(dest => ['sds', 'asds'].includes(dest?.destination.toLowerCase()))
    ) {
      toast.error(
        "Documents not transmitted. Only documents classified as 'For signing' or 'For routing' are allowed to be transmitted to SDS and ASDS.",
        {
          position: 'top-right',
          autoClose: 10000, // Auto-close after 10 seconds
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false,
          progress: undefined,
          theme: 'light'
        }
      );
    } else {
      const confirmed = window.confirm('Are you sure you want to transmit this document?');

      if (confirmed) {
        setLoading(true);
        setError('');

        const destinationNames = destinations.map(dest => dest.destination);

        const destinationsString = destinationNames.join(', ');

        axiosPrivate
          .patch(`/documents/transmitDocs`, {
            documents: selectedData,
            updateFields: {
              destinations,
              lastSource:
                auth?.officeId === 1
                  ? {
                      id: auth?.unitId,
                      destination: auth?.unitName,
                      type: 'unit'
                    }
                  : {
                      id: auth?.officeId,
                      destination: auth?.officeName,
                      type: 'office'
                    },
              status: 1,
              acceptStatus: 0,
              ...(selectedData?.some(doc => doc?.classification === 4) &&
                classification !== 4 && {
                  classification,
                  routedBy: null
                }),
              remarks: `Transmitted by ${auth?.firstName} ${auth?.lastName} from ${
                auth?.officeId === 1 ? auth?.unitName : auth?.officeName
              } to ${destinationsString}`
            }
          })
          .then(() => {
            enqueueSnackbar(`Document${selectedData?.length > 1 ? 's' : ''} Transmitted`, {
              variant: 'success'
            });
            setDestinations([{ id: null, destination: null, type: null }]);
            updateTableFunction();
            handleClose();
          })
          .catch(err => {
            setError(err?.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  };

  const displayDestinationError = (id, text) => {
    setDestinationErrorMssg(prevErrors => ({
      ...prevErrors,
      [id]: text
    }));
    setTimeout(() => {
      setDestinationErrorMssg(prevErrors => ({
        ...prevErrors,
        [id]: ''
      }));
    }, 3000);
  };

  const handleDestinations = (index, value) => {
    setDestinations(prevResponse => {
      const newDestination = [...prevResponse];

      if (!value.id || !value.destination || !value.type) {
        displayDestinationError(index, 'Destination Required');
      }

      if (newDestination.some(dest => dest.id === value?.id && dest.type === value?.type)) {
        newDestination[index] = { id: null, destination: null, type: null };
        displayDestinationError(index, 'Destination already chosen');
      } else {
        newDestination[index] = value || {
          id: null,
          destination: null,
          type: null
        };
      }
      return newDestination;
    });
  };

  useEffect(() => {
    const areAllDestinationsFilled = destinations.every(obj =>
      Object.values(obj).every(val => val !== undefined && val !== null && val !== '')
    );

    setDisabled(
      auth?.role?.some(role => ['secretary'].includes(role)) &&
        selectedData &&
        selectedData?.some(doc => !doc.signedDateTime)
        ? true
        : areAllDestinationsFilled
    );
  }, [destinations]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Transmit Documents"
      headerColor="#09504a"
      loading={loading}
      error={error}
      withSpacing
      modalSize="small"
      buttons={[
        <Button
          variant="contained"
          startIcon={<ShortcutIcon />}
          onClick={() => handleSubmit()}
          disabled={!disabled || isCutoffLocked}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: !disabled ? 'lightgray' : '#09504a',
            color: '#fff',
            py: 1,
            px: 2,
            // width: "10vw",
            // minWidth: "100px",
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          Transmit
        </Button>
      ]}
    >
      <Box>
        <Box
          sx={{
            width: '100%',
            background: '#fff',
            // border: "solid 1px #b6b6b6",
            // p: 2,
            mb: 2
          }}
        >
          <Box
            sx={{
              display: 'flex'
            }}
          >
            <Box
              sx={{
                width: '100%'
              }}
            >
              <Typography
                sx={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'gray',
                  mb: 2
                }}
              >
                Destination/s:
              </Typography>
              <Grid
                container
                spacing={2}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                {destinations?.map((destination, index) => (
                  <Grid item xs={destinations.length > 1 ? 6 : 12}>
                    <SelectDestinations
                      label={`Destination ${index + 1}`}
                      disabled={loading}
                      value={destination?.id}
                      onChange={(fieldName, selectedValue) => {
                        handleDestinations(index, selectedValue);
                      }}
                      error={Boolean(destination?.id === '')}
                      helperText={
                        <span style={{ color: 'red' }}>{destinationErrorMssg[index]}</span>
                      }
                      // Add related units as destination if the user is a secretary
                      addSpecificDestinations={
                        open &&
                        auth?.role?.some(role => ['secretary'].includes(role)) &&
                        auth?.relatedUnits
                      }
                      // showOnlySpecificUnits={
                      //   auth?.role === "secretary" &&
                      //   selectedData &&
                      //   selectedData.some((doc) => !doc.signedDateTime)
                      //     ? SDSSecIds.includes(auth.unitId)
                      //       ? [1]
                      //       : ASDSSecIds.includes(auth.unitId)
                      //       ? [2]
                      //       : null
                      //     : null
                      // }
                      restrictOwnDestination={auth?.officeId !== 1 ? 'office' : 'unit'}
                      sx={{
                        width: '100%',
                        pr: 3,
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'black !important'
                          }
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box sx={{ textAlign: 'end' }}>
              <Tooltip title="Add Destination" placement="right">
                <IconButton
                  onClick={() =>
                    setDestinations(prev => [...prev, { id: '', destination: '', type: '' }])
                  }
                  sx={{
                    backgroundColor: '#4ea82b',
                    color: '#fff',
                    mb: 1,
                    '&:hover': {
                      backgroundColor: '#0ed145'
                    }
                  }}
                >
                  <AddIcon sx={{ fontWeight: 'bold' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove Destination" placement="right">
                <IconButton
                  disabled={destinations.length < 2}
                  onClick={() => setDestinations(prev => prev.slice(0, -1))}
                  sx={{
                    backgroundColor: destinations.length < 2 ? 'lightgray' : 'red',
                    border: destinations.length < 2 && 'solid 1px #f28c8c',
                    color: destinations.length < 2 ? 'black' : '#fff',
                    '&:hover': {
                      backgroundColor: '#e54c51'
                    }
                  }}
                >
                  <RemoveIcon sx={{ fontWeight: 'bold' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {selectedData?.some(doc => doc?.classification === 4) && (
          <Box
            sx={{
              display: 'block',
              justifyContent: 'space-between',
              background: '#fff',
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
              width: '100%',
              mb: 2,
              p: 2
            }}
          >
            <Typography
              sx={{
                fontSize: '15px',
                fontWeight: 'bold',
                color: 'gray'
              }}
            >
              Classification:
            </Typography>
            <FormControl>
              <FormGroup
                row
                sx={{
                  p: '16px 0 0 16px',
                  gap: 2
                }}
              >
                {[
                  { label: 'For Signing', value: 1 },
                  { label: 'For Routing', value: 2 },
                  { label: 'Routed', value: 4 }
                ].map(option => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Radio
                        color="success"
                        checked={classification === option.value}
                        onChange={() => {
                          setClassification(option.value);
                        }}
                      />
                    }
                    label={
                      <Typography
                        sx={{
                          fontWeight: classification === option.value ? 'bold' : 'normal',
                          color: classification === option.value ? 'green' : 'gray'
                        }}
                      >
                        {option.label}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        )}
      </Box>
    </LPSModal>
  );
}
