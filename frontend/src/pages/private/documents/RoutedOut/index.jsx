/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { TiArrowShuffle } from 'react-icons/ti';

import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import PageTemplate from 'layouts/PageTemplate';
import DocumentsTable from '../DocumentsTable';

export default function RoutedOutDocuments() {
  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);

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
          category: 'routedOut'
        }
      })
      .then(res => {
        // const filteredRoutedOut = res?.data?.filter((doc) => {
        //   const routedBy = doc.routedBy || [];

        //   if (SDSSecIds.includes(auth.unitId)) {
        //     if (
        //       routedBy.some(
        //         (router) => router.id === 1 && doc.classification === 4
        //       )
        //     ) {
        //       return true;
        //     }
        //   } else if (ASDSSecIds.includes(auth.unitId)) {
        //     if (
        //       routedBy.some(
        //         (router) => router.id === 2 && doc.classification === 4
        //       )
        //     ) {
        //       return true;
        //     }
        //   } else if (
        //     routedBy.some(
        //       (router) => router.id === auth.unitId && doc.classification === 4
        //     )
        //   ) {
        //     return true;
        //   }

        //   return false;
        // });

        const filteredRoutedOut = res?.data;

        setDocuments(filteredRoutedOut);
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

  return (
    <PageTemplate
      icon={
        <Box sx={{ mx: 0.5 }}>
          <TiArrowShuffle
            style={{
              fontSize: '33px'
            }}
          />
        </Box>
      }
      header="Routed Out Documents"
      error={error}
      table={
        <DocumentsTable
          data={documents}
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
