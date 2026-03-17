/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { Box, Button, Tooltip } from '@mui/material';

// Pending
import { MdOutlinePendingActions } from 'react-icons/md';

import { AiFillSignature } from 'react-icons/ai';
import EditIcon from '@mui/icons-material/Edit';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PanToolIcon from '@mui/icons-material/PanTool';
import SaveIcon from '@mui/icons-material/Save';
import ShortcutIcon from '@mui/icons-material/Shortcut';
import UploadIcon from '@mui/icons-material/Upload';

import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import TransmitDocumentModal from 'modals/documents/TransmitDocumentModal';
import AnnotateDocumentModal from 'modals/documents/AnnotateDocumentModal';
import { enqueueSnackbar } from 'notistack';
import EditDocumentModal from 'modals/documents/ReviseDocumentModal';
import PageTemplate from 'layouts/PageTemplate';
import AttachDocumentModal from 'modals/documents/AttachDocumentModal';
import DocumentsTable from '../DocumentsTable';

export default function PendingDocuments() {
  const {
    auth,
    referenceId,
    enableLimitNumberOfSignatories,
    maxNumberOfSignatories,
    isCutoffLocked
  } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openTransmitModal, setOpenTransmitModal] = useState(false);
  const [openAnnotateModal, setOpenAnnotateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openAttachDocModal, setOpenAttachDocModal] = useState(false);

  const [disableSigning, setDisableSigning] = useState(false);

  // const SDSSecIds = [4];

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
          category: 'pending'
        }
      })
      .then(res => {
        // const filteredPending = res.data.filter((doc) => {
        //   const docDestinations = doc?.destinations;

        //   if (auth?.officeId !== 1) {
        //     if (
        //       doc.status === 3 &&
        //       doc.classification !== 4 &&
        //       doc.currentOwner.some((owner) => owner.id === referenceId) &&
        //       docDestinations.some(
        //         (dest) =>
        //           dest?.type === (auth?.officeId === 1 ? "unit" : "office")
        //       )
        //     ) {
        //       return true;
        //     }
        //   } else if (auth?.officeId === 1) {
        //     if (SDSSecIds.includes(referenceId)) {
        //       if (
        //         doc.status === 3 &&
        //         doc.classification !== 4 &&
        //         doc.currentOwner.some((owner) => owner.id === 4) &&
        //         docDestinations.some((dest) => dest?.type === "unit")
        //       ) {
        //         return true;
        //       }
        //     }

        //     if (
        //       doc.status === 3 &&
        //       doc.classification !== 4 &&
        //       doc.currentOwner.some((owner) => owner.id === referenceId) &&
        //       docDestinations.some(
        //         (dest) =>
        //           dest?.type === (auth?.officeId === 1 ? "unit" : "office")
        //       )
        //     ) {
        //       return true;
        //     }
        //   }

        //   return false;
        // });

        const filteredPending = res?.data;

        // Sort documents by complexity (3 - 1)
        filteredPending.sort((a, b) => b.complexity - a.complexity);

        setDocuments(filteredPending);
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
    const confirmed = window.confirm(
      `Are you sure you want to save ${selectedData > 1 ? 'these' : 'this'} ${
        selectedData > 1 ? 'documents' : 'document'
      }?`
    );

    if (confirmed) {
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

  const handleHoldDocument = () => {
    const confirmed = window.confirm(
      `Are you sure you want to put ${selectedData > 1 ? 'these' : 'this'} ${
        selectedData > 1 ? 'documents' : 'document'
      } on-hold?`
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/documents/holdDocument`, {
          documents: selectedData,
          remarks: `Hold by ${auth?.firstName} ${auth?.lastName} from ${
            auth?.officeId === 1 ? auth?.unitName : auth?.officeName
          }`
        })
        .then(() => {
          handleGetAll();
          enqueueSnackbar('Document is now On-Hold', {
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

  const handleMoveToForSigning = () => {
    const confirmed = window.confirm(
      `Are you sure you want to sign ${selectedData > 1 ? 'these' : 'this'} ${
        selectedData > 1 ? 'documents' : 'document'
      }? ${selectedData > 1 ? 'these' : 'this'} ${
        selectedData > 1 ? 'documents' : 'document'
      } will be moved to 'For Signature' page.`
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .patch(`/documents/patchUpdate`, {
          documents: selectedData,
          updateFields: {
            status: 7,
            acceptStatus: 1,
            remarks: `Moved to 'For Signing' by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        })
        .then(() => {
          handleGetAll();
          enqueueSnackbar('Document Moved', {
            variant: 'success'
          });
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

  useEffect(() => {
    let parsedSelectedData = [];

    if (selectedData && selectedData.length > 0) {
      parsedSelectedData = selectedData.map(rowData => {
        const { autoInitials, manualInitials } = rowData;

        const docAutoInitials = autoInitials && autoInitials !== 'null' ? autoInitials : [];

        const docManualInitials = manualInitials && manualInitials !== 'null' ? manualInitials : [];

        const autoAndManualSignatories = [...docAutoInitials, ...docManualInitials];

        const signatoriesIds = autoAndManualSignatories.map(signatory => signatory?.id);

        return { ...rowData, signatoriesIds };
      });
    }

    setDisableSigning(
      referenceId === 1 ||
        parsedSelectedData.length < 1 ||
        // parsedSelectedData.some((data) =>
        //   data?.signatoriesIds.includes(referenceId)
        // ) ||
        (enableLimitNumberOfSignatories &&
          parsedSelectedData.some(data => data?.signatoriesIds.length >= maxNumberOfSignatories)) ||
        loading
    );
  }, [selectedData]);

  return (
    <PageTemplate
      icon={
        <MdOutlinePendingActions
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Pending Documents"
      modals={[
        <AttachDocumentModal
          open={openAttachDocModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenAttachDocModal(false);
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
        <Button
          disabled={
            loading || selectedData?.length === 0 || !selectedData || selectedData[0].status === 2
          }
          onClick={() => handleSaveDocument()}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || !selectedData || selectedData[0].status === 2
                ? 'lightgray'
                : '#00a8f3',
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
            loading || selectedData?.length === 0 || !selectedData || selectedData[0].status === 2
          }
          onClick={() => handleHoldDocument()}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || !selectedData || selectedData[0].status === 2
                ? 'lightgray'
                : '#c49019',
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
          <PanToolIcon sx={{ mr: 1 }} />
          Hold
        </Button>,
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
        </Button>,

        !auth?.role.some(role => ['sds'].includes(role))
          ? [
              <Box>
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
              </Box>
            ]
          : null,
        auth?.role.some(role => ['sds', 'asds', 'chief', 'unit head'].includes(role))
          ? [
              <Tooltip
                title={
                  selectedData?.length !== 0 &&
                  disableSigning &&
                  'Either you already signed this document or the total number of signatories is reached'
                }
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: 'lightgray',
                      color: 'red', // Set text color inside the tooltip
                      boxShadow: 1,
                      fontSize: '14px', // Optional: Adjust font size
                      fontWeight: 'bold'
                    }
                  }
                }}
              >
                <Box>
                  <Button
                    disabled={disableSigning}
                    onClick={() => handleMoveToForSigning()}
                    sx={{
                      backgroundColor: disableSigning ? 'lightgray' : '#184c8c',
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
                    <AiFillSignature style={{ marginRight: '10px', fontSize: '23px' }} />
                    Sign Documents
                  </Button>
                </Box>
              </Tooltip>
            ]
          : null,
        !auth?.role.some(role => ['sds'].includes(role))
          ? [
              <Box>
                <Button
                  disabled={
                    loading ||
                    selectedData?.length === 0 ||
                    selectedData?.length > 1 ||
                    !selectedData
                  }
                  onClick={() => setOpenAttachDocModal(true)}
                  sx={{
                    backgroundColor:
                      loading ||
                      selectedData?.length === 0 ||
                      selectedData?.length > 1 ||
                      !selectedData
                        ? 'lightgray'
                        : 'green',
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
                  <UploadIcon sx={{ mr: 1 }} />
                  Attach a document
                </Button>
              </Box>
            ]
          : null
      ]}
      rightButtons={
        <Button
          disabled={
            isCutoffLocked ||
            loading ||
            selectedData?.length === 0 ||
            !selectedData ||
            selectedData[0].status === 2 ||
            // test
            !selectedData.every(item => item.status === selectedData[0].status)
          }
          onClick={() => setOpenTransmitModal(true)}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || !selectedData || selectedData[0].status === 2
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
      }
      table={
        <DocumentsTable
          data={documents}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          showCheckbox
          showMultipleSelection
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
