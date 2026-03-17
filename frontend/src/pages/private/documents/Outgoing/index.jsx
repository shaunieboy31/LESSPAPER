/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';

import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import TurnLeftIcon from '@mui/icons-material/TurnLeft';
import { IoIosSend } from 'react-icons/io';

import { enqueueSnackbar } from 'notistack';
import PageTemplate from 'layouts/PageTemplate';
import EditDocumentModal from 'modals/documents/ReviseDocumentModal';
import DocumentsTable from '../DocumentsTable';

export default function OutgoingDocuments() {
  const { auth, referenceId, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [openEditModal, setOpenEditModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const SDSSecIds = [4];
  // const ASDSSecIds = [7];

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
          category: 'outgoing'
        }
      })
      .then(res => {
        // const ownedDocs = res.data.filter((doc) =>
        //   doc.currentOwner.some((owner) => owner.id === referenceId)
        // );

        // const filteredOutgoing = ownedDocs.filter((doc) => {
        //   const docPrimarySources = doc?.primarySources;
        //   const docLastSources = doc?.lastSource;
        //   const docDestinations = doc?.destinations;

        //   let lastSource;

        //   if (docLastSources.length === 1) {
        //     lastSource = docLastSources ? docLastSources[0] : null;
        //   } else {
        //     lastSource = docLastSources ? docLastSources[1] : null;
        //   }

        //   if (SDSSecIds.includes(auth?.unitId)) {
        //     if (
        //       docDestinations.some(
        //         (dest) => dest.id === 1 && dest.type === "unit"
        //       ) &&
        //       doc.currentOwner.some((owner) => SDSSecIds.includes(owner.id)) &&
        //       (doc.status === 1 || doc.status === 8)
        //     ) {
        //       return true;
        //     }
        //     if (
        //       (docPrimarySources.some(
        //         (prim) => prim?.id === auth?.unitId && prim?.type === "unit"
        //       ) ||
        //         (lastSource?.id === auth?.unitId &&
        //           lastSource?.type === "unit")) &&
        //       (doc.status === 1 || doc.status === 8) &&
        //       docDestinations.some((dest) => dest.id !== auth?.unitId)
        //     ) {
        //       return true;
        //     }

        //     return false;
        //   }
        //   if (ASDSSecIds.includes(auth?.unitId)) {
        //     if (
        //       docDestinations.some(
        //         (dest) => dest.id === 2 && dest.type === "unit"
        //       ) &&
        //       doc.currentOwner.some((owner) => ASDSSecIds.includes(owner.id)) &&
        //       (doc.status === 1 || doc.status === 8)
        //     ) {
        //       return true;
        //     }

        //     if (
        //       (docPrimarySources.some(
        //         (prim) => prim?.id === auth?.unitId && prim?.type === "unit"
        //       ) ||
        //         (lastSource?.id === auth?.unitId &&
        //           lastSource?.type === "unit")) &&
        //       (doc.status === 1 || doc.status === 8) &&
        //       docDestinations.some((dest) => dest.id !== auth?.unitId)
        //     ) {
        //       return true;
        //     }
        //   }
        //   if (
        //     (docPrimarySources.some(
        //       (prim) =>
        //         prim?.id === referenceId &&
        //         prim?.type === (auth?.officeId === 1 ? "unit" : "office")
        //     ) ||
        //       (lastSource?.id === referenceId &&
        //         lastSource?.type ===
        //           (auth?.officeId === 1 ? "unit" : "office"))) &&
        //     (doc.status === 1 || doc.status === 8)
        //   ) {
        //     return true;
        //   }

        //   return false;
        // });

        const filteredOutgoing = res.data;

        // Sort documents by complexity (3 - 1)
        filteredOutgoing.sort((a, b) => b.complexity - a.complexity);

        setDocuments(filteredOutgoing);
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

  const handleSaveDocument = () => {
    const confirm = window.confirm(
      `Are you sure you want to save ${selectedData.length > 1 ? 'these' : 'this'} document${
        selectedData.length > 1 ? 's' : ''
      }`
    );

    if (confirm) {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/documents/saveDocument`, {
          documents: selectedData,
          // Watch out for this
          updateFields: {
            destinations: [
              {
                id: referenceId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              }
            ],
            currentOwner: [
              {
                id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              }
            ],
            remarks: `Saved by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        })
        .then(() => {
          handleGetAll();

          enqueueSnackbar('Document Saved', {
            variant: 'info'
          });
        })
        .catch(err => {
          setError(err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleReRoute = () => {
    const confirmed = window.confirm(
      `Are you sure you want to re-route ${selectedData.length > 1 ? 'these' : 'this'} ${
        selectedData.length > 1 ? 'documents' : 'document'
      }?`
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/documents/rerouteDocuments`, {
          documents: selectedData,
          updateFields: {
            destinations: [
              {
                id: referenceId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              }
            ],
            lastAcceptedDateTime: new Date(),
            remarks: `Re-routed by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        })
        .then(() => {
          enqueueSnackbar(`Document${selectedData.length > 1 ? 's' : ''} Re-routed`, {
            variant: 'success'
          });
          handleGetAll();
        })
        .catch(err => {
          setError(err.response.data.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setSelectedData(null);
  };

  return (
    <PageTemplate
      icon={
        <IoIosSend
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Outgoing Documents"
      modals={[
        <EditDocumentModal
          open={openEditModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenEditModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />
      ]}
      error={error}
      leftButtons={[
        ![1, 2].some(id => id === auth?.unitId)
          ? [
              <Button
                disabled={loading || !selectedData || selectedData.length === 0}
                onClick={() => handleSaveDocument()}
                sx={{
                  backgroundColor:
                    loading || !selectedData || selectedData.length === 0 ? 'lightgray' : '#00a8f3',
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
                <SaveIcon sx={{ mr: 1 }} />
                Save
              </Button>,
              <Button
                disabled={
                  loading ||
                  selectedData?.length === 0 ||
                  selectedData?.length > 1 ||
                  isCutoffLocked
                }
                onClick={() => setOpenEditModal(true)}
                sx={{
                  backgroundColor:
                    loading || selectedData?.length === 0 || selectedData?.length > 1
                      ? 'lightgray'
                      : '#184c8c',
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
                <EditIcon sx={{ mr: 1 }} />
                Revise
              </Button>
            ]
          : null
      ]}
      rightButtons={[
        ![1, 2].some(id => id === auth?.unitId)
          ? [
              <Button
                disabled={loading || selectedData?.length === 0 || !selectedData}
                onClick={() => handleReRoute()}
                sx={{
                  backgroundColor:
                    loading || selectedData?.length === 0 || !selectedData
                      ? 'lightgray'
                      : '#184c8c',
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
                <TurnLeftIcon sx={{ mr: 1 }} />
                Re-route
              </Button>
            ]
          : null
      ]}
      table={
        <DocumentsTable
          data={documents}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          showCheckbox={auth?.unitId !== 1 || auth?.unitId !== 2}
          showMultipleSelection={auth?.unitId !== 1 || auth?.unitId !== 2}
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
