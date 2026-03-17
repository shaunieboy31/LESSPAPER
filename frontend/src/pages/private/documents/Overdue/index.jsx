/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from 'react';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { FaCalendarTimes } from 'react-icons/fa';

import PageTemplate from 'layouts/PageTemplate';
import DocumentsTable from '../DocumentsTable';

export default function OverdueDocuments() {
  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);

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
          category: 'overdue'
        }
      })
      .then(res => {
        const filteredLapsed = res?.data;
        setDocuments(filteredLapsed);
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
        <FaCalendarTimes
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Overdue Documents"
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
