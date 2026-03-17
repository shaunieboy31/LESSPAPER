import { Box } from "@mui/material";
import EditableTable from "components/Table/EditableTable";
import useAxiosPrivate from "contexts/interceptors/axios";
import ConfirmationModal from "modals/miscellaneous/ConfirmationModal";
import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";

export default function CriteriasTable({
  data,
  setSelectedData,
  loadingState,
  updateTableFunction,
}) {
  const axiosPrivate = useAxiosPrivate();
  const [selectedCriteria, setSelectedCriteria] = useState();
  const [rowToDelete, setRowToDelete] = useState();

  const [open, setOpen] = useState(false);
  const [promptResponse, setPromptResponse] = useState(null);
  const [submit, setSubmit] = useState(false);
  const [submitKind, setSubmitKind] = useState("");
  const [promptDesc, setPromptDesc] = useState("");

  const [loading, setLoading] = useState(false);

  setSelectedData(selectedCriteria);

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
          `/libraries/deleteCriteria/${rowToDelete ? rowToDelete[0]?.id : ""}`
        )
        .then(() => {
          enqueueSnackbar("Criteria deleted", {
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
      field: "label",
      headerName: "Criteria",
      width: 300,
    },
    {
      field: "description",
      headerName: "Description",
      width: 700,
    },
    {
      field: "icon",
      headerName: "Icon",
      width: 100,
      renderCell: (params) => {
        const IconComponent = LucideIcons[params.row.icon];
        return IconComponent ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#999", fontSize: "12px" }}>No icon</span>
          </Box>
        );
      },
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
        setSelectedData={setSelectedCriteria}
        rowToDelete={setRowToDelete}
        height="60vh"
        showSearch
        remove
      />
    </Box>
  );
}
