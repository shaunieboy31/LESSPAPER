import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import EditableTable from "components/Table/EditableTable";
// import useAxiosPrivate from "contexts/interceptors/axios";
// import ConfirmationModal from "modals/miscellaneous/ConfirmationModal";
import ViewSignatureModal from "modals/users/ViewSignatureModal";
// import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadSignatureModal from "modals/users/UploadSignatureModal";
// import { enqueueSnackbar } from "notistack";
import { FaRegCircleCheck } from "react-icons/fa6";

export default function UsersTable({
  data,
  selectedData,
  setSelectedData,
  loadingState,
  updateTableFunction,
}) {
  // const axiosPrivate = useAxiosPrivate();
  const [selectedUser, setSelectedUser] = useState();
  // const [rowToDelete, setRowToDelete] = useState();

  const [openViewSignatureModal, setOpenViewSignatureModal] = useState(false);
  const [openUploadSignatureModal, setOpenUploadSignatureModal] =
    useState(false);
  const [dataFromActions, setDataFromActions] = useState();

  const [hoveredRowId, setHoveredRowId] = useState(null);

  // const [open, setOpen] = useState(false);
  // const [promptResponse, setPromptResponse] = useState(null);
  // const [submit, setSubmit] = useState(false);
  // const [submitKind, setSubmitKind] = useState("");
  // const [promptDesc, setPromptDesc] = useState("");

  // const [loading, setLoading] = useState(false);

  setSelectedData(selectedUser);

  // useEffect(() => {
  //   if (rowToDelete) {
  //     setPromptDesc("Are you sure you want to delete this data?");
  //     setSubmitKind("delete");
  //     setOpen(true);
  //   }
  // }, [rowToDelete]);

  // useEffect(() => {
  //   if (!open && submit && promptResponse) {
  //     setLoading(true);

  //     axiosPrivate
  //       .delete(`/user/delete/${rowToDelete ? rowToDelete[0]?.uid : ""}`)
  //       .then(() => {
  //         enqueueSnackbar("User deleted", {
  //           variant: "success",
  //         });
  //         setRowToDelete(null);
  //         setSubmit(false);
  //         updateTableFunction();
  //       })
  //       .catch((err) => {
  //         enqueueSnackbar(err?.message, {
  //           variant: "error",
  //         });
  //         setRowToDelete(null);
  //         setSubmit(false);
  //       })
  //       .finally(() => {
  //         setLoading(false);
  //       });
  //   }
  // }, [submit, promptResponse]);

  const handleViewDetails = async (rowData) => {
    if (rowData) {
      setDataFromActions(rowData);
      setOpenViewSignatureModal(true);
    }
  };

  const handleUploadSignature = async (rowData) => {
    if (rowData) {
      setDataFromActions(rowData);
      setOpenUploadSignatureModal(true);
    }
  };

  const columns = [
    // { field: "uid", headerName: "ID", width: 70 },
    {
      headerName: "View",
      width: 100,
      align: "center",
      renderCell: (params) => {
        const { signPath, role } = params.row;

        const isHovered = hoveredRowId === params.id;

        return signPath ? (
          <Button
            onClick={() => handleViewDetails(params.row)}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#4b51a8",
              color: "#fff",
              borderRadius: "15px",
              "&:hover": {
                backgroundColor: "#5b63da",
                fontWeight: "bold",
              },
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "10px" }}>View</Typography>
              <Typography sx={{ fontSize: "10px" }}>Signature</Typography>
            </Box>
          </Button>
        ) : (
          <Box
            onMouseEnter={() => setHoveredRowId(params.id)}
            onMouseLeave={() => setHoveredRowId(null)}
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            {isHovered &&
            role?.some((roles) =>
              ["sds", "asds", "chief", "unit head"].includes(roles)
            ) ? (
              <Button onClick={() => handleUploadSignature(params.row)}>
                Upload
              </Button>
            ) : (
              <Typography sx={{ fontSize: "10px" }}>No Signature</Typography>
            )}
          </Box>
        );
      },
    },
    { field: "username", headerName: "Email", width: 300 },
    { field: "firstName", headerName: "First Name", width: 150 },
    { field: "lastName", headerName: "Last Name", width: 150 },
    {
      field: "role",
      headerName: "Role",
      width: 150,
      valueGetter: (params) => {
        const roles = params.value;

        return roles.join(", ");
      },
    },
    {
      field: "officeName",
      headerName: "Office",
      width: 300,
    },
    {
      field: "unitName",
      headerName: "Unit",
      width: 300,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      valueGetter: (params) => {
        const status = params.value;

        return status === 1 ? "Active" : "Inactive";
      },
    },
    {
      field: "faceData",
      headerName: "Face Data",
      width: 150,
      renderCell: (params) => {
        const faceData = params.value;

        return faceData ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: "green",
              mr: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: "bold",
                mr: 1,
              }}
            >
              Registered
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
              }}
            >
              <FaRegCircleCheck />
            </Box>
          </Box>
        ) : (
          "Unregistered"
        );
      },
    },
    {
      field: "fingerprintData",
      headerName: "Fingerprint Data",
      width: 150,
      renderCell: (params) => {
        const fingerprint = params.value;

        return fingerprint ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: "green",
              mr: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: "bold",
                mr: 1,
              }}
            >
              Registered
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
              }}
            >
              <FaRegCircleCheck />
            </Box>
          </Box>
        ) : (
          "Unregistered"
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {/* <ConfirmationModal
        open={open}
        handleClose={() => setOpen(false)}
        setPromptResponse={setPromptResponse}
        setSubmit={setSubmit}
        submitKind={submitKind}
        promptDesc={promptDesc}
      /> */}
      <ViewSignatureModal
        open={openViewSignatureModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenViewSignatureModal(false);
        }}
        dataFromActions={dataFromActions || null}
      />
      <UploadSignatureModal
        open={openUploadSignatureModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenUploadSignatureModal(false);
        }}
        dataFromActions={dataFromActions || null}
        updateTableFunction={() => updateTableFunction()}
      />
      <EditableTable
        data={data}
        columns={columns}
        checkbox
        loading={loadingState}
        singleSelect
        selectedData={selectedData}
        setSelectedData={setSelectedUser}
        // rowToDelete={setRowToDelete}
        height="60vh"
        showSearch
      />
    </Box>
  );
}
