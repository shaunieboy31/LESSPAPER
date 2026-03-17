/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';

import { MdAltRoute } from 'react-icons/md';

import EditNoteIcon from '@mui/icons-material/EditNote';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import ShortcutIcon from '@mui/icons-material/Shortcut';

import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import RouteDocumentModal from 'modals/documents/RouteDocumentModal';
import AnnotateDocumentModal from 'modals/documents/AnnotateDocumentModal';
import TransmitDocumentModal from 'modals/documents/TransmitDocumentModal';
import ReturnDocumentModal from 'modals/documents/ReturnDocumentModal';
import PageTemplate from 'layouts/PageTemplate';
import SelectSpecificDocType from 'components/Textfields/SelectSpecificDocType';
import DocumentsTable from '../DocumentsTable';

export default function RoutingDocuments() {
  const { auth, referenceId, routingDocs, setRoutingDocs, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [selectedData, setSelectedData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedDocType, setSelectedDocType] = useState('all');
  const [specificDocType, setSpecificDocType] = useState('');

  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [openRouteModal, setOpenRouteModal] = useState(false);
  const [openTransmitModal, setOpenTransmitModal] = useState(false);
  const [openAnnotateModal, setOpenAnnotateModal] = useState(false);

  const hasActiveFilters = selectedDocType !== 'all' || specificDocType !== '';

  const handleGetAll = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/documents/getSpecificDocuments`, {
        params: {
          auth: {
            id: referenceId,
            type: auth?.officeId === 1 ? 'unit' : 'office'
          },
          category: 'forRouting'
        }
      })
      .then(res => {
        // const filteredForRouting = res.data.filter((doc) => {
        //   const docDestinations = doc.destinations;

        //   if (
        //     docDestinations.some(
        //       (dest) => dest.id === auth.unitId && dest.type === "unit"
        //     ) &&
        //     // doc.currentOwner !== auth.unitId &&
        //     doc.status === 8 &&
        //     doc.acceptStatus === 1
        //   ) {
        //     return true;
        //   }
        //   return false;
        // });

        const filteredForRouting = res.data;

        // Sort documents by complexity (3 - 1)
        filteredForRouting.sort((a, b) => b.complexity - a.complexity);

        setRoutingDocs(filteredForRouting);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGetAll();
  }, []);

  const filteredDocuments = useMemo(
    () =>
      routingDocs
        .filter(doc => {
          // docType filter
          if (selectedDocType === 'Others') {
            if (!doc.docType.toLowerCase().includes(specificDocType.toLowerCase())) {
              return false;
            }
          } else if (selectedDocType !== 'all' && doc.docType !== selectedDocType) {
            return false;
          }

          return true;
        })
        .sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested)),
    [routingDocs, selectedDocType, specificDocType]
  );

  // font "Mont"

  return (
    <PageTemplate
      hasActiveFilters={hasActiveFilters}
      setSelectedDocType={setSelectedDocType}
      setSpecificDocType={setSpecificDocType}
      icon={
        <MdAltRoute
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Documents for Routing"
      modals={[
        <ReturnDocumentModal
          open={openReturnModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenReturnModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />,
        <TransmitDocumentModal
          open={openTransmitModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenTransmitModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />,
        <AnnotateDocumentModal
          open={openAnnotateModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenAnnotateModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />,
        <RouteDocumentModal
          open={openRouteModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenRouteModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />
      ]}
      error={error}
      filters={
        auth?.unitId === 1
          ? [
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  flex: 1,
                  minWidth: '300px',
                  gap: 2
                }}
              >
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    ml: 0.5,
                    color: '#2f2f2f',
                    textWrap: 'nowrap'
                  }}
                >
                  Document Type:
                </Typography>
                <Grid container spacing={0} sx={{ gap: 2, flex: 1, minWidth: '200px' }}>
                  <Grid item xs={12} sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
                    <Box
                      sx={{
                        width: selectedDocType === 'Others' ? '50%' : '100%',
                        minWidth: '200px'
                      }}
                    >
                      <SelectSpecificDocType
                        name="docType"
                        disabled={loading}
                        value={selectedDocType === 'all' ? 'All' : selectedDocType}
                        onChange={(fieldName, selectedValue) => {
                          setSelectedDocType(
                            !selectedValue || selectedValue === 'All' ? 'all' : selectedValue
                          );

                          if (selectedValue !== 'Others') {
                            setSpecificDocType('');
                          }
                        }}
                        sx={{
                          width: '100%',
                          pr: selectedDocType === 'Others' ? 3 : 0,
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'black !important'
                            }
                          },
                          '& .MuiOutlinedInput-root': {
                              borderRadius: 6,
                              backgroundColor: '#fff'
                            }
                        }}
                        documents={routingDocs}
                      />
                    </Box>
                    <Box sx={{ width: '50%', minWidth: '200px' }}>
                      {selectedDocType === 'Others' ? (
                        <TextField
                          name="otherDocTypes"
                          label="Specify Document Type"
                          size="small"
                          disabled={loading}
                          value={specificDocType}
                          onChange={e => setSpecificDocType(e.target.value)}
                          variant="standard"
                          fullWidth
                          sx={{
                            mt: -0.5,
                            // ml: -4,
                          }}
                        />
                      ) : (
                        <Box />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ]
          : []
      }
      leftButtons={[
        auth?.unitId === 1 || auth?.unitId === 2 || auth?.unitId === 12 ? (
          <>
            <Button
              disabled={
                loading ||
                selectedData?.length === 0 ||
                !selectedData ||
                selectedData[0]?.status === 2
              }
              onClick={() => setOpenRouteModal(true)}
              sx={{
                backgroundColor:
                  loading ||
                  selectedData?.length === 0 ||
                  !selectedData ||
                  selectedData[0]?.status === 2
                    ? 'lightgray'
                    : '#00a052',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  fontWeight: 'bold'
                }
              }}
            >
              <ShortcutIcon sx={{ mr: 1 }} />
              Route
            </Button>
            <Button
              disabled={
                loading ||
                selectedData?.length === 0 ||
                // selectedData?.length > 1 ||
                !selectedData ||
                selectedData[0]?.status === 2 ||
                selectedData[0]?.signedDateTime
              }
              onClick={() => setOpenReturnModal(true)}
              sx={{
                backgroundColor:
                  loading ||
                  selectedData?.length === 0 ||
                  // selectedData?.length > 1 ||
                  !selectedData ||
                  selectedData[0]?.status === 2 ||
                  selectedData[0]?.signedDateTime
                    ? 'lightgray'
                    : '#da2c43',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)'
                }
              }}
            >
              <KeyboardReturnIcon sx={{ mr: 1 }} />
              Return
            </Button>
          </>
        ) : (
          <>
            <Button
              disabled={
                loading ||
                selectedData?.length === 0 ||
                selectedData?.length > 1 ||
                !selectedData ||
                selectedData[0].status === 2
              }
              onClick={() => setOpenAnnotateModal(true)}
              sx={{
                backgroundColor:
                  loading ||
                  selectedData?.length === 0 ||
                  selectedData?.length > 1 ||
                  !selectedData ||
                  selectedData[0].status === 2
                    ? 'lightgray'
                    : '#4b51b1',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  fontWeight: 'bold'
                }
              }}
            >
              <EditNoteIcon sx={{ mr: 1 }} />
              Annotate
            </Button>
            <Button
              disabled={
                isCutoffLocked ||
                loading ||
                selectedData?.length === 0 ||
                !selectedData ||
                selectedData[0].status === 2
              }
              onClick={() => setOpenTransmitModal(true)}
              sx={{
                backgroundColor:
                  loading ||
                  selectedData?.length === 0 ||
                  !selectedData ||
                  selectedData[0].status === 2
                    ? 'lightgray'
                    : '#0e6b95',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)'
                }
              }}
            >
              <ShortcutIcon sx={{ mr: 1 }} />
              Transmit
            </Button>
          </>
        )
      ]}
      table={
        <DocumentsTable
          data={filteredDocuments}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          showCheckbox
          // singleSelect
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
