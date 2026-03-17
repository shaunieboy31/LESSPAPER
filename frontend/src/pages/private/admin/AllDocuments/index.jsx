/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import useAxiosPrivate from "contexts/interceptors/axios";

import { IoDocuments } from "react-icons/io5";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";

import EditDocumentModal from "modals/documents/ReviseDocumentModal";
import RevertDocumentModal from "modals/documents/RevertDocumentModal";
import PageTemplate from "layouts/PageTemplate";
import DocumentsTable from "../../documents/DocumentsTable";

export default function AllDocuments() {
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [openRevertModal, setOpenRevertModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAll = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get(`/documents/getAllDocuments`)
      .then((res) => {
        setDocuments(res.data);
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

  const handleDeleteDocument = () => {
    if (!selectedData || selectedData.length === 0) {
      setError("No document selected for deletion.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        selectedData.length > 1 ? "these" : "this"
      } document`
    );

    if (confirmed) {
      setLoading(true);
      setError("");

      axiosPrivate
        .post(`/documents/deleteDocuments`, {
          documents: selectedData.map((doc) => ({
            id: doc?.id,
            files: doc?.files,
          })),
        })
        .then(() => {
          handleGetAll();
        })
        .catch((err) => {
          setError(err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <PageTemplate
      icon={
        <IoDocuments
          style={{
            fontSize: "40px",
          }}
        />
      }
      header="All Documents"
      modals={[
        <RevertDocumentModal
          open={openRevertModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenRevertModal(false);
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
        />,
      ]}
      error={error}
      leftButtons={[
        <Button
          disabled={
            loading || selectedData?.length === 0 || selectedData?.length > 1
          }
          onClick={() => setOpenRevertModal(true)}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || selectedData?.length > 1
                ? "lightgray"
                : "#4b51b1",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "5px 20px",
            borderRadius: "15px",
            "&:hover": {
              backgroundColor: "lightgray",
              color: "#2f2f2f",
              fontWeight: "bold",
            },
          }}
        >
          <RestoreIcon sx={{ mr: 1 }} />
          Revert
        </Button>,
        <Button
          disabled={
            loading || selectedData?.length === 0 || selectedData?.length > 1
          }
          onClick={() => setOpenEditModal(true)}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || selectedData?.length > 1
                ? "lightgray"
                : "#00a8f3",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "5px 20px",
            borderRadius: "15px",
            "&:hover": {
              backgroundColor: "lightgray",
              color: "#2f2f2f",
              boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <EditIcon sx={{ mr: 1 }} />
          Revise
        </Button>,
        <Button
          disabled={loading || !selectedData || selectedData.length === 0}
          onClick={() => handleDeleteDocument()}
          sx={{
            backgroundColor:
              loading || !selectedData || selectedData.length === 0
                ? "lightgray"
                : "red",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "bold",
            padding: "5px 20px",
            borderRadius: "15px",
            "&:hover": {
              backgroundColor: "lightgray",
              color: "#2f2f2f",
              fontWeight: "bold",
            },
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </Button>,
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
