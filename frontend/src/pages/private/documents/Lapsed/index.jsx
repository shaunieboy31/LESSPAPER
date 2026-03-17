/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from "react";
import { useStateContext } from "contexts/ContextProvider";
import useAxiosPrivate from "contexts/interceptors/axios";

import { IoIosWarning } from "react-icons/io";

import PageTemplate from "layouts/PageTemplate";
import DocumentsTable from "../DocumentsTable";

export default function LapsedDocuments() {
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
          category: "lapsed",
        },
      })
      .then((res) => {
        // const filteredLapsed = res.data.filter((doc) => {
        //   const {
        //     createdAtDateTime,
        //     destinations,
        //     status,
        //     acceptStatus,
        //     classification,
        //     complexity,
        //   } = doc;

        //   let daysBeforeLapsedInMilliseconds;

        //   if (complexity === 1) {
        //     daysBeforeLapsedInMilliseconds = 3 * 24 * 60 * 60 * 1000;
        //   } else if (complexity === 2) {
        //     daysBeforeLapsedInMilliseconds = 7 * 24 * 60 * 60 * 1000;
        //   } else if (complexity === 3) {
        //     daysBeforeLapsedInMilliseconds = 1 * 24 * 60 * 60 * 1000;
        //   } else if (complexity === 4) {
        //     daysBeforeLapsedInMilliseconds = 20 * 24 * 60 * 60 * 1000;
        //   }

        //   const currentDateTime = new Date();
        //   const createdAtDateTimeObj = new Date(createdAtDateTime);
        //   // const lastUpdateDateTimeObj = new Date(lastUpdateDateTime);

        //   if (
        //     status === 3 &&
        //     currentDateTime.getTime() >=
        //       createdAtDateTimeObj.getTime() + daysBeforeLapsedInMilliseconds &&
        //     createdAtDateTime &&
        //     acceptStatus &&
        //     classification !== 4 &&
        //     destinations.some(
        //       (dest) =>
        //         dest.id === referenceId &&
        //         dest.type === (auth?.officeId === 1 ? "unit" : "office")
        //     )
        //   ) {
        //     return doc;
        //   }
        //   return null;
        // });

        const filteredLapsed = res?.data;

        setDocuments(filteredLapsed);
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
        <IoIosWarning
          style={{
            fontSize: "40px",
          }}
        />
      }
      header="Lapsed Documents"
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
