/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from "react";
import { useStateContext } from "contexts/ContextProvider";
import useAxiosPrivate from "contexts/interceptors/axios";

import { IoDocuments } from "react-icons/io5";

import PageTemplate from "layouts/PageTemplate";
import DocumentsTable from "../DocumentsTable";

export default function UploadedDocuments() {
  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get(`/documents/getSpecificDocuments`, {
        params: {
          auth: {
            id: referenceId,
            type: auth?.officeId === 1 ? "unit" : "office",
          },
          category: "uploaded",
        },
      })
      .then((res) => {
        // const filteredUploaded = res.data.filter((doc) => {
        //   const docPrimarySources = doc.primarySources;

        //   if (
        //     docPrimarySources.some((prim) => {
        //       const isOffice = auth?.officeId !== 1 && prim?.type === "office";
        //       const isUnit = auth?.officeId === 1 && prim?.type === "unit";
        //       return prim?.id === referenceId && (isOffice || isUnit);
        //     })
        //   ) {
        //     return true;
        //   }
        //   return false;
        // });

        const filteredUploaded = res?.data;

        setDocuments(filteredUploaded);
      })
      .catch((err) => {
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
        <IoDocuments
          style={{
            fontSize: "40px",
          }}
        />
      }
      header="Uploaded Documents"
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
