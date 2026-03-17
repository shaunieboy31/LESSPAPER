/* eslint-disable no-alert */
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
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

dayjs.extend(utc);
dayjs.extend(timezone);

export default function RouteDocumentModal({
  open,
  handleClose,
  loadingState,
  selectedData,
  updateTableFunction
}) {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);
  const [isOthersChecked, setIsOthersChecked] = useState(false);
  const [otherAction, setOtherAction] = useState('');
  const [destinations, setDestinations] = useState([{ id: null, destination: null, type: null }]);
  const [annotation, setAnnotation] = useState('');
  const [destinationErrorMssg, setDestinationErrorMssg] = useState([]);
  const [checkedItems, setCheckedItems] = useState({
    action: [],
    prepare: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const confirmed = window.confirm('Are you sure you want to route this document?');

    if (confirmed) {
      setLoading(true);
      setError('');

      const destinationNames = destinations.map(dest => dest.destination);

      const destinationsString = destinationNames.join(', ');

      // Unchanged because only SDO people are the only ones who can route
      axiosPrivate
        .patch(`/documents/routeDocuments`, {
          documents: selectedData,
          updateFields: {
            destinations: destinations?.map(dest => ({
              ...dest,
              accepted: false
            })),
            action: isOthersChecked
              ? {
                  action: [...checkedItems.action, otherAction],
                  prepare: checkedItems.prepare
                }
              : checkedItems,
            lastSource: {
              id: auth?.unitId,
              destination: auth?.unitName,
              type: 'unit'
            },
            currentOwner: [
              {
                id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              }
            ],
            status: 1,
            classification: 4,
            acceptStatus: 0,
            remarks: `Routed by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            } to ${destinationsString}`,
            ...(annotation && {
              annotation: {
                annotation,
                annotatedBy: `${auth?.firstName} ${auth?.lastName} from ${
                  auth?.officeId === 1 ? auth?.unitName : auth?.officeName
                }`
              }
            })
          }
        })
        .then(() => {
          enqueueSnackbar(`Document${selectedData.length > 1 ? 's' : ''} Routed`, {
            variant: 'success'
          });
          setOtherAction('');
          setAnnotation('');
          setCheckedItems({
            action: [],
            prepare: []
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
        newDestination[index] = { id: null, destination: null };
        displayDestinationError(index, 'Destination already chosen');
      } else {
        newDestination[index] = value || { id: null, destination: null };
      }
      return newDestination;
    });
  };

  const handleCheckboxChange = (event, category) => {
    const { name, checked } = event.target;
    setCheckedItems(prevState => {
      const updatedCategory = checked
        ? [...prevState[category], name]
        : prevState[category].filter(item => item !== name);
      return {
        ...prevState,
        [category]: updatedCategory
      };
    });
  };

  useEffect(() => {
    const areAllDestinationsFilled = destinations.every(obj =>
      Object.values(obj).every(val => val !== undefined && val !== null && val !== '')
    );

    setDisabled(
      !(
        checkedItems.action.length > 0 ||
        checkedItems.prepare.length > 0 ||
        (isOthersChecked && Boolean(otherAction))
      ) || !areAllDestinationsFilled
    );
  }, [checkedItems, destinations, isOthersChecked, otherAction]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Add Document"
      headerColor="#09504a"
      width="1300px"
      loading={loading}
      error={error}
      withSpacing
      buttons={[
        <Button
          disabled={disabled}
          onClick={() => handleSubmit()}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: disabled ? 'lightgray' : '#1f1f1f',
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
          <ShortcutIcon
            sx={{
              mr: 1
            }}
          />
          Route
        </Button>
      ]}
    >
      <Box>
        <Box
          sx={{
            width: '100%',
            background: '#fff',
            border: 'solid 1px #b6b6b6',
            mb: 2,
            p: 2
          }}
        >
          <Box
            sx={{
              display: 'flex'
            }}
          >
            <Box sx={{ width: '90%' }}>
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
                      restrictOwnDestination={auth?.officeId !== 1 ? 'office' : 'unit'}
                      sx={{
                        width: '100%',
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'end'
              }}
            >
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
        <Box
          sx={{
            display: 'block',
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
            Action:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              width: '100%',
              pb: 2,
              px: '5vw'
            }}
          >
            <FormGroup>
              {[
                'Urgent',
                'Comply',
                'Verify',
                'Encode',
                'Defer',
                'Inform/Disseminate',
                'Reproduce',
                'Study/Comment',
                'Revise/Modify',
                'Note & File',
                'Attend'
              ].map(label => (
                <FormControlLabel
                  key={label}
                  control={
                    <Checkbox
                      name={label}
                      checked={checkedItems?.action?.includes(label)}
                      onChange={e => handleCheckboxChange(e, 'action')}
                    />
                  }
                  label={label}
                />
              ))}
            </FormGroup>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    name="Recommend"
                    checked={checkedItems?.action?.includes('Recommend')}
                    onChange={e => handleCheckboxChange(e, 'action')}
                  />
                }
                label="Recommend"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="For Appropriate Action"
                    checked={checkedItems?.action?.includes('For Appropriate Action')}
                    onChange={e => handleCheckboxChange(e, 'action')}
                  />
                }
                label="For Appropriate Action"
              />

              <Typography
                sx={{
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: 'gray'
                }}
              >
                Prepare:
              </Typography>
              <FormGroup sx={{ ml: 2 }}>
                {[
                  'Division Memorandum',
                  'Advisory',
                  'Indorsement',
                  'Answer to Correspondence',
                  'Travel Order',
                  'Cash Advance',
                  'Letter',
                  'Special Order'
                ].map(label => (
                  <FormControlLabel
                    key={label}
                    control={
                      <Checkbox
                        name={label}
                        checked={checkedItems?.prepare.includes(label)}
                        onChange={e => handleCheckboxChange(e, 'prepare')}
                      />
                    }
                    label={label}
                  />
                ))}
              </FormGroup>
              <FormControlLabel
                control={
                  <Checkbox name="Others" onChange={e => setIsOthersChecked(e.target.checked)} />
                }
                label="Others"
              />
              {isOthersChecked && (
                <TextField
                  label="Specify Other Action"
                  variant="standard"
                  value={otherAction}
                  onChange={e => setOtherAction(e.target.value)}
                />
              )}
            </FormGroup>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: '#fff',
            border: 'solid 1px #b6b6b6',
            borderRadius: '4px',
            p: 2
          }}
        >
          <TextField
            label="Annotation (Optional)"
            name="annotation"
            variant="outlined"
            disabled={loading}
            value={annotation}
            onChange={evt => setAnnotation(evt.target.value)}
            multiline
            rows={4}
            sx={{
              width: '100%',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'black !important'
                }
              }
            }}
          />
        </Box>
      </Box>
    </LPSModal>
  );
}
