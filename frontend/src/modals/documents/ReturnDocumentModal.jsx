/* eslint-disable prettier/prettier */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';

// import CancelIcon from "@mui/icons-material/Close";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

import { useEffect, useState } from 'react';
import { object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import SelectDestinations from 'components/Textfields/SelectDestinations';
import LPSModal from 'layouts/ModalLayout';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function ReturnDocumentModal({
  open,
  handleClose,
  updateTableFunction,
  loadingState,
  selectedData
}) {
  const { auth, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [disabled, setDisabled] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const [destination, setDestination] = useState();
  const [option, setOption] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SDSSecIds = [4];
  const ASDSSecIds = [7];

  const formik = useFormik({
    initialValues: {
      annotation: ''
    },

    validationSchema: object().shape({
      annotation: string()
    }),
    onSubmit: values => {
      const confirmed = window.confirm('Are you sure you want to return this document?');

      if (confirmed) {
        setLoading(true);
        setError('');

        // const formattedDestination = {
        //   ...destination,
        //   unit: destination.unitName,
        // };

        axiosPrivate
          .patch(`/documents/returnDocs`, {
            documents: selectedData,
            updateFields: {
              destinations: [destination],
              lastSource: {
                id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              },
              // currentOwner: destination && destination?.id,

              ...(SDSSecIds.includes(auth?.unitId) && destination?.id === 1
                ? {
                    currentOwner: [
                      {
                        id: 4,
                        destination: 'OSDS - Secretary',
                        type: 'unit'
                      }
                    ]
                  }
                : ASDSSecIds.includes(auth?.unitId) && destination?.id === 2
                ? {
                    currentOwner: [
                      {
                        id: 7,
                        destination: 'OASDS - Secretary',
                        type: 'unit'
                      }
                    ]
                  }
                : destination?.id === 2),

              acceptStatus: 0,
              status: 2,
              annotation: {
                annotation: `Returned: ${values.annotation}`,
                annotatedBy: `${auth?.firstName} ${auth?.lastName} from ${
                  auth?.officeId === 1 ? auth?.unitName : auth?.officeName
                }`,
                annotatedByUid: auth?.uid
              },
              remarks: `Returned by ${auth?.firstName} ${auth?.lastName} from ${
                auth?.officeId === 1 ? auth?.unitName : auth?.officeName
              }`
            }
          })
          .then(() => {
            enqueueSnackbar('Document Returned', {
              variant: 'default'
            });
            formik.resetForm();
            updateTableFunction();
            handleClose();
          })
          .catch(err => {
            const errorMessage =
              err?.response?.data ||
              err?.response?.data?.error ||
              err?.response?.data?.message ||
              err?.message ||
              String(err?.response?.data) ||
              'An error has occurred';

            setError(errorMessage);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  });

  useEffect(() => {
    if (!selectedData) return;

    const docs = Array.isArray(selectedData) ? selectedData : [selectedData];

    if (docs.length === 0) return;

    const allLastSources = docs.flatMap(doc => doc?.lastSource || []);

    const uniqueLastSources = Array.from(
      new Map(allLastSources.map(src => [`${src.id}-${src.type}`, src])).values()
    );

    setLastSources(uniqueLastSources);

    // Optional: auto-select most recent source
    setDestination(uniqueLastSources[0] || null);
  }, [selectedData]);

  useEffect(() => {
    setDisabled(
      formik.values.annotation &&
        (destination?.id !== auth?.unitId ||
          destination?.type !== (auth?.officeId === 1 ? 'unit' : 'office'))
    );
  }, [formik.values, destination]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Return Document"
      loading={loading}
      error={error}
      mainBackgroundColor="#a93a3a"
      headerColor="#a93a3a"
      contentBgColor="#792929"
      buttons={[
        <Button
          variant="contained"
          startIcon={<KeyboardReturnIcon />}
          onClick={() => formik.handleSubmit()}
          disabled={!disabled || isCutoffLocked}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: !disabled ? 'lightgray' : '#792929',
            color: '#fff',
            py: 1,
            px: 2,
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          Return
        </Button>
      ]}
    >
      <Box>
        <Box
          sx={{
            backgroundColor: '#792929',
            // backgroundColor: "#fff",
            p: 2,
            mb: 4
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Typography
              sx={{
                fontSize: '15px',
                color: '#fff',
                mr: 2
              }}
            >
              Returning to:
            </Typography>
            <FormControl>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                defaultValue={option}
                onChange={evt => {
                  setOption(Number(evt.target.value));
                }}
                row
                sx={{
                  color: '#fff',
                  gap: 2
                }}
                name="radio-buttons-group"
              >
                <FormControlLabel
                  value={1}
                  control={<Radio />}
                  label="Choose from available options"
                />
                <FormControlLabel value={2} control={<Radio />} label="Choose specific unit" />
              </RadioGroup>
            </FormControl>
          </Box>

          {destination?.id === auth?.unitId &&
            destination?.type === (auth?.officeId === 1 ? 'unit' : 'office') && (
              <Box sx={{ backgroundColor: 'red' }}>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>
                  NOTE: You may not return documents to yourself
                </Typography>
              </Box>
            )}
          <Box
            sx={{
              display: 'block',
              justifyContent: 'space-between',
              // background: "#fff",
              backgroundColor: '#f0f0f0',
              border: 'solid 1px #b6b6b6',
              borderRadius: '4px',
              width: '100%',
              mb: 2,
              p: 2
            }}
          >
            {option === 1 && (
              <Box>
                {lastSources.map(source => (
                  <Box
                    key={`${source.id}-${source.type}`}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Checkbox
                      checked={destination?.id === source.id}
                      onChange={() => setDestination(source)}
                    />
                    <Typography
                      sx={{
                        fontWeight: destination?.id === source.id ? 'bold' : 'normal',
                        color: destination?.id === source.id ? 'black' : 'gray'
                      }}
                    >
                      {source.destination}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {option === 2 && (
              <Box>
                <SelectDestinations
                  label="Destination"
                  disabled={loading}
                  value={destination?.id}
                  onChange={(fieldName, selectedValue) => {
                    setDestination(selectedValue);
                  }}
                  error={option === 2 && Boolean(destination?.id === '')}
                  helperText={
                    <span style={{ color: 'red' }}>
                      {option === 2 && Boolean(destination?.id === '') && 'Destination is required'}
                    </span>
                  }
                  addSpecificUnits={
                    open &&
                    auth?.role?.some(role => ['secretary'].includes(role)) &&
                    auth?.relatedUnits
                  }
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
              </Box>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: '#792929',
            borderRadius: '10px',
            p: 2
          }}
        >
          <TextField
            label="Annotation"
            placeholder="State reason for returning the document..."
            name="annotation"
            variant="filled"
            disabled={loading}
            value={formik.values.annotation}
            onChange={formik.handleChange}
            onBlur={formik.handleBLur}
            error={formik.touched.annotation && Boolean(formik.errors.annotation)}
            helperText={formik.touched.annotation && formik.errors.annotation}
            multiline
            rows={4}
            sx={{
              width: '100%',
              backgroundColor: '#f0f0f0',
              borderRadius: '6px',
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
