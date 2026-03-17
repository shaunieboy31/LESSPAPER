/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
/* eslint-disable no-alert */
import { useState } from 'react';
import { useStateContext } from 'contexts/ContextProvider';
import { Box, Button, IconButton, Modal, Tooltip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ChecklistIcon from '@mui/icons-material/Checklist';
import { FaRegCircleCheck } from 'react-icons/fa6';
import FilterListIcon from '@mui/icons-material/FilterList';

import EditableTable from 'components/Table/EditableTable';
import { GridActionsCellItem } from '@mui/x-data-grid';
import useAxiosPrivate from 'contexts/interceptors/axios';
import DetailsModal from './DetailsModal';
import FilterModal from './FilterModal';
import ModalHeaderBackground from 'components/CustomUI/ModalHeader';
import CloseButton from 'components/CustomUI/CloseButton';
import LoadingOverlay from 'components/LoadingOverlay';

dayjs.extend(utc);
dayjs.extend(timezone);

const initialFilters = {
  docuId: '',
  lpsNo: '',
  docType: '',
  status: '',
  title: '',
  primarySources: '',
  lastSource: '',
  destinations: ''
};


export default function FilterDocLogsModal({ open, handleClose }) {
  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [data, setData] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [docType, setDocType] = useState('');

  const [openDetails, setOpenDetails] = useState(false);
  const [openFilter, setOpenFilter] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SDSSecIds = [4];
  const ASDSSecIds = [7];

  const [filters, setFilters] = useState(initialFilters);

  const resetState = () => {
    setData([]);
    setRowData([]);
    setDocType('');
    setOpenDetails(false);
    setOpenFilter(true);
    setLoading(false);
    setError('');
    setFilters(initialFilters);
  };


  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleViewDetails = async rowDetails => {
    if (rowDetails) {
      if (Array.isArray(rowDetails) && rowDetails.length > 0) {
        setRowData(rowDetails);
      } else {
        setRowData(rowDetails);
      }
      setOpenDetails(true);
    }
  };

  const columns = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: params => {
        const actionItems = [];

        actionItems.push(
          <Tooltip key="viewDetails" title="View Details" placement="top">
            <GridActionsCellItem
              icon={<ChecklistIcon />}
              label="View Details"
              onClick={() => handleViewDetails(params.row)}
              color="inherit"
            />
          </Tooltip>
        );

        return actionItems;
      }
    },
    { field: 'docuId', headerName: 'Document ID', width: 120 },
    {
      field: 'lpsNo',
      headerName: 'LPS. No.',
      width: 120,
      renderCell: params => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.docuId}
          </Typography>
        </Box>
      )
    },
    { field: 'docType', headerName: 'Doc Type', width: 180 },
    { field: 'title', headerName: 'Doc Title/Details', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: params => {
        const {
          primarySources,
          lastSource,
          destinations,
          acceptStatus,
          autoInitials,
          manualInitials,
          complied,
          routedBy,
          createdAtDateTime
          // lastUpdateDateTime,
        } = params.row;

        let chosenLastSource;

        if (lastSource.length === 1) {
          chosenLastSource = lastSource ? lastSource[0] : null;
        } else {
          chosenLastSource = lastSource ? lastSource[1] : null;
        }

        const currentDateTime = new Date();
        const createdAtDateTimeObj = new Date(createdAtDateTime);
        // kung sakaling gusto nila na lastUpdateTime ang gusto nilang pagbasehan
        // const lastUpdateDateTimeObj = new Date(lastUpdateDateTime || createdAtDateTime);

        const fifteenDaysInMilliseconds = 15 * 24 * 60 * 60 * 1000;

        if (params.value === 2) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: 'red'
              }}
            >
              Returned
            </Typography>
          );
        } else if (params.value === 1) {
          if (destinations.some(dest => dest.id === chosenLastSource.id)) {
            return 'Incoming';
          } else if (
            primarySources.some(prim => prim.id === chosenLastSource.id) ||
            chosenLastSource.id === auth.unitId
          ) {
            return 'Outgoing';
          } else {
            return 'Incoming';
          }
        } else if (params.value === 3) {
          if (createdAtDateTime) {
            if (
              currentDateTime.getTime() >=
                createdAtDateTimeObj.getTime() + fifteenDaysInMilliseconds &&
              !autoInitials &&
              !manualInitials &&
              !complied &&
              !routedBy &&
              destinations.some(
                dest =>
                  dest.id === referenceId &&
                  dest.type === (auth?.officeId === 1 ? 'unit' : 'office')
              )
            ) {
              return (
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    color: 'red'
                  }}
                >
                  Lapsed
                </Typography>
              );
            }
          }

          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: 'green'
              }}
            >
              Accepted
            </Typography>
          );
        } else if (params.value === 4) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#0d85ee'
              }}
            >
              Saved
            </Typography>
          );
        } else if (params.value === 5) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#dcc36d'
              }}
            >
              On-Hold
            </Typography>
          );
        } else if (params.value === 6) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'green'
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  mr: 1
                }}
              >
                Signed
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '20px'
                }}
              >
                <FaRegCircleCheck />
              </Box>
            </Box>
          );
        } else if (params.value === 7) {
          if (acceptStatus === 1) {
            return (
              <Typography
                sx={{
                  fontWeight: 'bold'
                }}
              >
                Unsigned
              </Typography>
            );
          } else if (destinations.some(dest => dest.id === chosenLastSource.id)) {
            return 'Incoming';
          } else if (
            primarySources.some(prim => prim.id === chosenLastSource.id) ||
            chosenLastSource.id === auth.unitId
          ) {
            return 'Outgoing';
          } else {
            return 'Incoming';
          }
        } else if (params.value === 8) {
          if (acceptStatus === 1) {
            return (
              <Typography
                sx={{
                  fontWeight: 'bold',
                  color: '#c49019'
                }}
              >
                Routing
              </Typography>
            );
          } else if (destinations.some(dest => dest.id === chosenLastSource.id)) {
            return 'Incoming';
          } else if (
            primarySources.some(prim => prim.id === chosenLastSource.id) ||
            chosenLastSource.id === auth.unitId
          ) {
            return 'Outgoing';
          } else {
            return 'Incoming';
          }
        } else if (params.value === 9) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#246fc9'
              }}
            >
              Routed
            </Typography>
          );
        } else if (params.value === 10) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#656791'
              }}
            >
              Initialized
            </Typography>
          );
        }
        return null; // Default return if none of the conditions match
      }
    },
    {
      field: 'complexity',
      headerName: 'Complexity',
      width: 100,
      renderCell: params => {
        const complexity = params.value;

        if (complexity === 1) {
          return 'Simple';
        } else if (complexity === 2) {
          return <Typography sx={{ color: '#a88921', fontWeight: 'bold' }}>Complex</Typography>;
        } else if (complexity === 3) {
          return <Typography sx={{ color: 'red', fontWeight: 'bold' }}>Urgent</Typography>;
        }

        return null;
      }
    },
    {
      field: 'signComplianceStatus',
      headerName: 'Sign/Compliance Status',
      width: 180,
      renderCell: params => {
        const { autoInitials, manualInitials, complied, signedDateTime } = params.row;

        const docAutoInitials = autoInitials && autoInitials !== 'null' ? autoInitials : [];

        const docManualInitials = manualInitials && manualInitials !== 'null' ? manualInitials : [];

        const parsedComplied = complied || [];

        const combinedSignatories = [...docAutoInitials, ...docManualInitials];

        const signatoriesIds = combinedSignatories.map(signatory => signatory?.id);

        let isInitialized = false;

        if (SDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (signatoriesIds.includes(1)) {
            isInitialized = true;
          }
        } else if (ASDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (signatoriesIds.includes(2)) {
            isInitialized = true;
          }
        } else if (signatoriesIds.includes(auth?.unitId)) {
          isInitialized = true;
        }

        if (signedDateTime) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'green'
              }}
            >
              <Typography
                sx={{
                  fontWeight: 'bold',
                  mr: 1
                }}
              >
                Signed
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '20px'
                }}
              >
                <FaRegCircleCheck />
              </Box>
            </Box>
          );
        } else if (isInitialized) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#656791'
              }}
            >
              Initialized
            </Typography>
          );
        } else if (parsedComplied.map(unit => unit.id).includes(auth?.unitId)) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#656791'
              }}
            >
              Complied
            </Typography>
          );
        } else {
          return null;
        }
      }
    },
    {
      field: 'classification',
      headerName: 'Classification',
      width: 120,
      renderCell: params => {
        const classification = params.value;

        if (classification === 1) {
          return 'For Signing';
        } else if (classification === 2) {
          return 'For Routing'; // routed out
        } else if (classification === 3) {
          return 'For Checking';
        } else if (classification === 4) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#246fc9'
              }}
            >
              Routed
            </Typography>
          ); // routed in
        } else if (classification === 5) {
          return (
            <Typography
              sx={{
                fontWeight: 'bold',
                color: '#074ccd'
              }}
            >
              Submitted
            </Typography>
          );
        } else {
          return null;
        }
      }
    },
    {
      field: 'destinations',
      headerName: 'Destination',
      width: 200,
      valueGetter: params => {
        const destinations = params.value;

        return destinations.map(destination => destination.destination).join(', ');
      }
    },
    {
      field: 'primarySources',
      headerName: 'Primary Source',
      width: 200,
      valueGetter: params => {
        const primSources = params.value;

        const primaryNames = primSources.map(prim => prim.destination);

        const primaryString = primaryNames.join(', ');

        return primaryString;
      }
    },
    {
      field: 'lastSource',
      headerName: 'Last Source',
      width: 200,
      valueGetter: params => {
        const lastSources = params.value;

        return lastSources[lastSources.length - 1]?.destination;
      }
    },
    {
      field: 'createdAtDateTime',
      headerName: 'Date & Time Uploaded',
      width: 180,
      valueGetter: params =>
        params.value ? dayjs(params.value).format('MM/DD/YYYY hh:mm A') : null
    },
    {
      field: 'lastUpdateDateTime',
      headerName: 'Last Transaction',
      width: 180,
      valueGetter: params =>
        params.value ? dayjs(params.value).format('MM/DD/YYYY hh:mm A') : null
    },
    {
      field: 'firstAcceptedDateTime',
      headerName: 'First Accepted',
      width: 180,
      valueGetter: params =>
        params.value ? dayjs(params.value).format('MM/DD/YYYY hh:mm A') : null
    },
    {
      field: 'lastAcceptedDateTime',
      headerName: 'Last Accepted',
      width: 180,
      valueGetter: params =>
        params.value ? dayjs(params.value).format('MM/DD/YYYY hh:mm A') : null
    },
    {
      field: 'signedDateTime',
      headerName: 'Date & Time Signed',
      width: 180,
      valueGetter: params =>
        params.value ? dayjs(params.value).format('MM/DD/YYYY hh:mm A') : null
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 120,
      valueGetter: params => {
        const { firstAcceptedDateTime, signedDateTime } = params.row;

        if (!firstAcceptedDateTime) return null;

        // const formattedAcceptTimeStamp = firstAcceptedDateTime
        //   ? dayjs(firstAcceptedDateTime)
        //   : null;
        // const formattedSignedTimeStamp = signedDateTime
        //   ? dayjs(signedDateTime)
        //   : null;

        const firstDate = new Date(firstAcceptedDateTime);
        const endDate = signedDateTime ? new Date(signedDateTime) : new Date();

        const diffInMilliseconds = dayjs(endDate).add(1, 'day').toDate() - firstDate;

        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

        return diffInDays;
      }
    },
    { field: 'remarks', headerName: 'Remarks', width: 250 }
  ];

  const handleFilterDocLogs = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/documents/filterDocLogs`, {
        params: filters
      })
      .then(res => {
        setFilters(prev => ({
          ...prev,
          primarySources: '',
          lastSource: '',
          destinations: ''
        }));
        setOpenFilter(false);
        setOpenDetails(false);
        setData(res.data);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Modal
      open={open}
      disableAutoFocus
      onClose={() => {
        resetState();
        handleClose();
        // formik.resetForm();
        // setError("");
      }}
    >
      <Box>
        {openDetails && (
          <DetailsModal
            open={openDetails}
            handleClose={() => setOpenDetails(false)}
            rowData={rowData}
          />
        )}
        {openFilter && (
          <FilterModal
            filters={filters}
            loading={loading}
            docType={docType}
            setDocType={setDocType}
            setOpenFilter={setOpenFilter}
            handleInputChange={handleInputChange}
            handleFilterDocLogs={handleFilterDocLogs}
          />
        )}

        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: '95vw',
            maxHeight: '95vh',
            display: 'flex',
            flexDirection: 'column', // ✅ FIXED (important)
            background: 'linear-gradient(180deg, #5d5453, #645d56)',
            borderRadius: 3,
            boxShadow: '3px 2px 20px 3px rgba(0,0,0,0.3)',
            pb: 1,
            px: 1.3
          }}
        >
          {/* ================= HEADER ================= */}
          <Box
            sx={{
              mt: -1.5,
              position: 'relative',
              height: 70
            }}
          >
            <Box
              sx={{
                display: 'flex',
                position: 'absolute',
                background: 'linear-gradient(180deg, #5d5453, #645d56)',
                width: '100%',
                height: '55%',
                zIndex: -1,
                left: '50%',
                borderRadius: 2,
                backdropFilter: 'brightness(1.5) blur(4px)',
                transform: 'translate(-50%, 50%)',
                boxShadow: 'inset 0 -4px 10px rgba(0,0,0, 0.3), 0 4px 20px rgba(0,0,0, 0.2)' // inner shadow
              }}
            />

            <ModalHeaderBackground />

            <Typography
              sx={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: 'Poppins',
                fontSize: { xs: 16, sm: 24, md: 27 },
                color: '#fff',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                textAlign: 'center',
                textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
              }}
            >
              Document Logs
            </Typography>

            <IconButton
              onClick={() => {
                resetState();
                handleClose();
              }}
              sx={{
                position: 'absolute',
                right: 0,
                height: 42,
                top: '55%',
                transform: 'translateY(-50%)',
                color: '#fff',
                borderRadius: 4,
                p: 0
              }}
            >
              <CloseButton />
            </IconButton>
          </Box>

          <Box sx={{ p: 2, backgroundColor: '#fff', borderRadius: 2, flexGrow: 1 }}>
            {loading && <LoadingOverlay open={loading} />}
            {error && (
              <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
                <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
              </Box>
            )}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'end'
              }}
            >
              <Button
                onClick={() => setOpenFilter(true)}
                sx={{
                  backgroundColor: loading ? 'lightgray' : '#09504a',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  padding: '8px 20px',
                  borderRadius: '10px',
                  '&:hover': {
                    backgroundColor: '#a2cb6b',
                    color: '#1f1f1f',
                    fontWeight: 'bold'
                  }
                }}
              >
                <FilterListIcon sx={{ mr: 1 }} />
                Filter
              </Button>
            </Box>
            <EditableTable
              data={data}
              columns={columns}
              // loading={loading || loadingState}
              loading={loading}
              // rowToDelete={setRowToDelete}
              height="60vh"
              fieldsToHide={['docuId', 'id', 'isReadable']}
            />
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
