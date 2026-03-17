/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { FaHand } from 'react-icons/fa6';
import TurnLeftIcon from '@mui/icons-material/TurnLeft';

import { enqueueSnackbar } from 'notistack';
import PageTemplate from 'layouts/PageTemplate';
import DocumentsTable from '../DocumentsTable';

export default function OnHoldDocuments() {
  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          category: 'onHold'
        }
      })
      .then(res => {
        // const filteredOnhold = res.data.filter((doc) => {
        //   const destinations = doc?.destinations;

        //   if (
        //     destinations.some(
        //       (dest) =>
        //         dest.id === referenceId &&
        //         dest.type === (auth?.officeId === 1 ? "unit" : "office")
        //     ) &&
        //     doc.status === 5 &&
        //     doc.currentOwner.some((owner) => owner.id === referenceId)
        //   ) {
        //     return doc;
        //   }

        //   return null;
        // });

        const filteredOnhold = res?.data;

        setDocuments(filteredOnhold);
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

  const handleReRoute = () => {
    const confirmed = window.confirm('Are you sure you want to re-route this document?');

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .put(`/documents/rerouteDocuments`, {
          documents: selectedData,
          updateFields: {
            // lastAcceptedDateTime: new Date(),
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
        <FaHand
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="On-Hold Documents"
      error={error}
      leftButtons={[
        <Button
          disabled={loading || selectedData?.length === 0 || !selectedData}
          onClick={() => handleReRoute()}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || !selectedData ? 'lightgray' : '#184c8c',
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
