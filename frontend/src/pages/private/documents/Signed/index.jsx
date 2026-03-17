/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { FaFileSignature } from 'react-icons/fa6';

import PageTemplate from 'layouts/PageTemplate';
import DocumentsTable from '../DocumentsTable';

export default function SignedDocuments() {
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
          category: 'signed'
        }
      })
      .then(res => {
        // let filteredSignedDocs = [];

        // if (auth?.unitId === 1 || auth?.unitId === 2) {
        //   filteredSignedDocs = res.data.filter((doc) => {
        //     const autoInitials = doc.autoInitials || [];
        //     const manualInitials = doc.manualInitials || [];

        //     const combinedSignatories = [...autoInitials, ...manualInitials];

        //     if (combinedSignatories.some((sign) => sign?.id === auth?.unitId)) {
        //       return true;
        //     }

        //     return false;
        //   });
        // } else {
        //   filteredSignedDocs = res.data.filter((doc) => {
        //     const docPrimarySources = doc?.primarySources;

        //     if (
        //       doc?.signedDateTime &&
        //       docPrimarySources.some((prim) => {
        //         const isOffice =
        //           auth?.officeId !== 1 && prim?.type === "office";
        //         const isUnit = auth?.officeId === 1 && prim?.type === "unit";
        //         return prim?.id === referenceId && (isOffice || isUnit);
        //       })
        //     ) {
        //       return true;
        //     }
        //     return false;
        //   });
        // }

        const filteredSignedDocs = res.data;

        setDocuments(filteredSignedDocs);
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
        <FaFileSignature
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Signed Documents"
      error={error}
      table={
        <DocumentsTable
          data={documents}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
