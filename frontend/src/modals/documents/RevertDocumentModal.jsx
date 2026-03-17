/* eslint-disable no-restricted-globals */
/* eslint-disable no-else-return */
/* eslint-disable no-alert */
import { useEffect, useState } from 'react';
import { Box, Button, Tooltip, Typography, Alert } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ChecklistIcon from '@mui/icons-material/Checklist';
import { FaRegCircleCheck } from 'react-icons/fa6';
import RestoreIcon from '@mui/icons-material/Restore';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotInterestedIcon from '@mui/icons-material/NotInterested';

import EditableTable from 'components/Table/EditableTable';
import { GridActionsCellItem } from '@mui/x-data-grid';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { useStateContext } from 'contexts/ContextProvider';
import DetailsModal from 'modals/doc-logs/DetailsModal';
import LPSModal from 'layouts/ModalLayout';
import DocumentPreviewModal from 'modals/miscellaneous/DocumentPreviewModal';
import { enqueueSnackbar } from 'notistack';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function RevertDocumentModal({
  open,
  handleClose,
  loadingState,
  selectedData,
  updateTableFunction
}) {
  const { auth, BASE_URL } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [data, setData] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [selected, setSelected] = useState([]);
  const [docToView, setDocToView] = useState(null);

  const [openDetails, setOpenDetails] = useState(false);
  const [openViewDocModal, setOpenViewDocModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const SDSSecIds = [4];
  const ASDSSecIds = [7];

  const handleViewFile = async rowDetails => {
    const checkPdfExists = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/pdfUploads/${rowDetails?.files[rowDetails.files.length - 1]}`
        );

        if (!response.ok) {
          enqueueSnackbar('PDF file not found', { variant: 'error' });
          setOpenViewDocModal(false);
        } else {
          setDocToView(
            `${BASE_URL}/pdfUploads/${
              rowDetails.files ? rowDetails?.files[rowDetails.files.length - 1] : null
            }`
          );
          setOpenViewDocModal(true);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error checking PDF:', err);
        enqueueSnackbar('Error loading PDF', { variant: 'error' });
      }
    };

    checkPdfExists();
  };

  const handleViewDetails = async rowDetails => {
    if (rowDetails) {
      try {
        if (Array.isArray(rowDetails) && rowDetails.length > 0) {
          setRowData(rowDetails);
        } else {
          setRowData(rowDetails);
        }
        setOpenDetails(true);
      } catch (err) {
        console.error('Error processing row details:', err);
        setError('Failed to load document details');
      }
    }
  };

  const handleRevertToState = async () => {
    if (!selected || selected.length === 0) {
      setError('Please select a document to revert');
      return;
    }

    if (selected.length > 1) {
      setError('Please select only one document to revert');
      return;
    }

    const confirm = window.confirm(
      'Are you sure you want to revert this document to your selected document state? This action cannot be undone.'
    );

    if (confirm) {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await axiosPrivate.put(
          `/documents/revertDocument/${selected[0]?.docuId}`,
          {
            document: selected[0],
            remarks: `Reverted by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        );

        setOpenDetails(false);
        setData(response.data);
        setSuccess('Document reverted successfully!');
        updateTableFunction();

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to revert document');
      } finally {
        setLoading(false);
      }
    }
  };

  const columns = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: params => {
        const { files, isReadable } = params.row;

        const fileDocuments = files?.some(file => file !== '') ? files : [];

        const actionItems = [];

        actionItems.push(
          <Tooltip
            key="view"
            title={fileDocuments.length === 0 ? 'No file attached' : 'View'}
            placement="top"
          >
            <GridActionsCellItem
              disabled={fileDocuments.length === 0}
              icon={
                fileDocuments.length ? (
                  <VisibilityIcon sx={{ color: isReadable ? '#0d85ee' : '#2f2f2f' }} />
                ) : (
                  <NotInterestedIcon sx={{ fontSize: '20px' }} />
                )
              }
              label="View"
              onClick={() => handleViewFile(params.row)}
              color="inherit"
            />
          </Tooltip>,
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
    {
      field: 'docuId',
      headerName: 'Doc ID',
      width: 80
    },
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
        const { primarySources, lastSource, destinations, acceptStatus, createdAtDateTime } =
          params.row;

        let chosenLastSource;

        if (lastSource.length === 1) {
          chosenLastSource = lastSource ? lastSource[0] : null;
        } else {
          chosenLastSource = lastSource ? lastSource[1] : null;
        }

        const currentDateTime = new Date();
        const createdAtDateTimeObj = new Date(createdAtDateTime);
        // const lastUpdateDateTimeObj = new Date(lastUpdateDateTime);

        const fifteenDaysInMilliseconds = 15 * 24 * 60 * 60 * 1000;

        if (params.value === 1) {
          if (destinations.some(dest => dest.id === chosenLastSource.id)) {
            return 'Incoming';
          } else if (
            primarySources.some(prim => prim?.id === chosenLastSource.id) ||
            chosenLastSource.id === auth.unitId
          ) {
            return 'Outgoing';
          } else {
            return 'Incoming';
          }
        } else if (params.value === 2) {
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
        } else if (params.value === 3) {
          if (createdAtDateTime) {
            if (
              currentDateTime.getTime() >=
              createdAtDateTimeObj.getTime() + fifteenDaysInMilliseconds
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
            primarySources.some(prim => prim?.id === chosenLastSource.id) ||
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
            primarySources.some(prim => prim?.id === chosenLastSource.id) ||
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

        const docAutoInitials = autoInitials || [];
        const docManualInitials = manualInitials || [];
        const docComplied = complied || [];

        const combinedSignatories = [...docAutoInitials, ...docManualInitials];

        // const signatoriesIds = combinedSignatories.map(
        //   (signatory) => signatory?.id
        // );

        let isInitialized = false;

        if (SDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (combinedSignatories.some(signatory => signatory?.id === 1)) {
            isInitialized = true;
          }
        } else if (ASDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (combinedSignatories.some(signatory => signatory?.id === 2)) {
            isInitialized = true;
          }
        } else if (combinedSignatories.some(signatory => signatory?.id === auth?.unitId)) {
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
        } else if (docComplied.map(unit => unit.id).includes(auth?.unitId)) {
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

  const handleFilterDocLogs = async () => {
    if (selectedData[0]?.lpsNo) {
      setLoading(true);
      setError('');
      setSuccess('');

      try {
        const response = await axiosPrivate.get(`/documents/filterDocLogs`, {
          params: { lpsNo: selectedData[0]?.lpsNo }
        });

        setOpenDetails(false);
        setData(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to load document logs');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedData) {
      handleFilterDocLogs();
    }
  }, [selectedData]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  return (
    <>
      <LPSModal
        open={open}
        handleClose={handleClose}
        title="Revert Document"
        headerColor="#09504a"
        width="1400px"
        loading={loading}
        error={error}
        withSpacing
      >
        <Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              mb: 2,
              p: 2,
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, color: '#1f1f1f' }} />
              <Typography variant="body2" color="text.secondary">
                Select a document state to revert to. Only one document can be selected at a time.
              </Typography>

              {selected?.length > 0 && (
                <Alert severity="warning">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">
                      You have selected {selected.length} document
                      {selected.length > 1 ? 's' : ''}.
                      {selected.length > 1 && ' Only one document can be reverted at a time.'}
                    </Typography>
                  </Box>
                </Alert>
              )}
            </Box>

            <Button
              onClick={handleRevertToState}
              disabled={loading || selected?.length === 0 || selected?.length > 1}
              startIcon={<RestoreIcon />}
              sx={{
                backgroundColor:
                  loading || selected?.length === 0 || selected?.length > 1 ? '#e0e0e0' : '#09504a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                padding: '10px 24px',
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  color: '#1f1f1f',
                  backgroundColor:
                    loading || selected?.length === 0 || selected?.length > 1
                      ? '#e0e0e0'
                      : '#a2cb6b'
                },
                '&:disabled': {
                  backgroundColor: '#e0e0e0',
                  color: '#9e9e9e'
                }
              }}
            >
              Revert Document
            </Button>
          </Box>

          <EditableTable
            data={data}
            columns={columns}
            singleSelect
            checkbox
            setSelectedData={setSelected}
            loading={loading}
            height="60vh"
            fieldsToHide={['docuId', 'id', 'isReadable']}
          />
        </Box>
      </LPSModal>

      {/* Separate modal for details to prevent overlapping */}
      {openDetails && (
        <DetailsModal
          open={openDetails}
          handleClose={() => setOpenDetails(false)}
          rowData={rowData}
        />
      )}
      {openViewDocModal && (
        <DocumentPreviewModal
          open={openViewDocModal}
          setOpenDocPreviewModal={setOpenViewDocModal}
          filePath={docToView}
        />
      )}
    </>
  );
}
