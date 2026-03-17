/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { GiConfirmed } from 'react-icons/gi';

import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import ReturnDocumentModal from 'modals/documents/ReturnDocumentModal';
import { enqueueSnackbar } from 'notistack';
import PageTemplate from 'layouts/PageTemplate';
import DocumentsTable from '../DocumentsTable';

export default function ReleaseDocuments() {
  const { auth, referenceId, isCutoffLocked } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openReturnModal, setOpenReturnModal] = useState(false);

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
          category: 'forRelease'
        }
      })
      .then(res => {
        // const filteredForRelease = res?.data?.filter((doc) => {
        //   const docLastSources = doc?.lastSource;
        //   const relatedUnits = auth?.relatedUnits;

        //   if (
        //     !doc.currentOwner.some((owner) => owner.id === referenceId) &&
        //     doc.status === 8 &&
        //     doc.acceptStatus === 0 &&
        //     docLastSources.some((last) =>
        //       relatedUnits.some((unit) => unit.id === last.id)
        //     )
        //   ) {
        //     return true;
        //   }
        //   return false;
        // });

        const filteredForRelease = res?.data;

        setDocuments(filteredForRelease);
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

  const handleRelease = () => {
    const confirmed = window.confirm(
      `Are you sure you want to release ${selectedData?.length > 1 ? 'these' : 'this'} ${
        selectedData?.length > 1 ? 'documents' : 'document'
      }?`
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .patch(`/documents/routeDocuments`, {
          documents: selectedData,
          updateFields: {
            lastSource: {
              id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
              destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
              type: auth?.officeId === 1 ? 'unit' : 'office'
            },
            status: 1,
            classification: 4,
            remarks: `Released by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        })
        .then(() => {
          enqueueSnackbar(`Document${selectedData?.length > 1 ? 's' : ''} Routed`, {
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

  // font "Mont"

  return (
    <PageTemplate
      icon={
        <GiConfirmed
          size={40}
          sx={{
            fontSize: '40px'
          }}
        />
      }
      header="Documents for Release"
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
        />
      ]}
      error={error}
      leftButtons={[
        <Button
          disabled={
            loading || selectedData?.length === 0 || !selectedData || selectedData[0]?.status === 2
          }
          onClick={() => handleRelease()}
          sx={{
            backgroundColor:
              loading ||
              selectedData?.length === 0 ||
              !selectedData ||
              selectedData[0]?.status === 2
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
          <CheckIcon sx={{ mr: 1 }} />
          Release
        </Button>,
        <Button
          disabled={
            loading ||
            selectedData?.length === 0 ||
            selectedData?.length > 1 ||
            !selectedData ||
            selectedData[0]?.status === 2 ||
            isCutoffLocked
          }
          onClick={() => setOpenReturnModal(true)}
          sx={{
            backgroundColor:
              loading ||
              selectedData?.length === 0 ||
              selectedData?.length > 1 ||
              !selectedData ||
              selectedData[0]?.status === 2
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
      ]}
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
