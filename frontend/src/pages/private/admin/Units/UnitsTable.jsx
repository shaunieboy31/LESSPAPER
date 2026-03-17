import { Box } from "@mui/material";
import EditableTable from "components/Table/EditableTable";
import useAxiosPrivate from "contexts/interceptors/axios";
import ConfirmationModal from "modals/miscellaneous/ConfirmationModal";
import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";

export default function CriteriasTable({
  data,
  setSelectedData,
  loadingState,
  updateTableFunction,
}) {
  const axiosPrivate = useAxiosPrivate();
  const [selectedOffice, setSelectedOffice] = useState();
  const [rowToDelete, setRowToDelete] = useState();

  const [open, setOpen] = useState(false);
  const [promptResponse, setPromptResponse] = useState(null);
  const [submit, setSubmit] = useState(false);
  const [submitKind, setSubmitKind] = useState("");
  const [promptDesc, setPromptDesc] = useState("");

  const [loading, setLoading] = useState(false);

  setSelectedData(selectedOffice);

  useEffect(() => {
    if (rowToDelete) {
      setPromptDesc("Are you sure you want to delete this data?");
      setSubmitKind("delete");
      setOpen(true);
    }
  }, [rowToDelete]);

  useEffect(() => {
    if (!open && submit && promptResponse) {
      setLoading(true);

      axiosPrivate
        .delete(
          `/libraries/deleteUnit/${rowToDelete ? rowToDelete[0]?.id : ""}`
        )
        .then(() => {
          enqueueSnackbar("School/Office deleted", {
            variant: "success",
          });
          setRowToDelete(null);
          setSubmit(false);
          updateTableFunction();
        })
        .catch((err) => {
          enqueueSnackbar(err?.message, {
            variant: "error",
          });
          setRowToDelete(null);
          setSubmit(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [submit, promptResponse]);

  const columns = [
    // { field: "id", headerName: "ID", width: 70 },
    {
      field: "unit",
      headerName: "Unit",
      width: 500,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <ConfirmationModal
        open={open}
        handleClose={() => setOpen(false)}
        setPromptResponse={setPromptResponse}
        setSubmit={setSubmit}
        submitKind={submitKind}
        promptDesc={promptDesc}
      />
      <EditableTable
        data={data}
        columns={columns}
        checkbox
        loading={loading || loadingState}
        singleSelect
        setSelectedData={setSelectedOffice}
        rowToDelete={setRowToDelete}
        height="60vh"
        showSearch
        remove
      />
    </Box>
  );
}
