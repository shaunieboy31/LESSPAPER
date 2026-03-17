/* eslint-disable no-else-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { Box, Tooltip, Typography } from "@mui/material";

import { PDFDocument } from "pdf-lib"; // or use 'pdfjs-dist'

// Icons
import { AiFillSignature } from "react-icons/ai";
import ChecklistIcon from "@mui/icons-material/Checklist";
// import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { FaRegCircleCheck } from "react-icons/fa6";
import NotInterestedIcon from "@mui/icons-material/NotInterested";
import VisibilityIcon from "@mui/icons-material/Visibility";

import EditableTable from "components/Table/EditableTable";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import useAxiosPrivate from "contexts/interceptors/axios";
import ViewDocumentModal from "modals/documents/ViewDocumentModal";
import ViewDetailsModal from "modals/documents/ViewDetailsModal";
import { useStateContext } from "contexts/ContextProvider";
import ManualSignModal from "modals/documents/SigningModals/ManualSignModal";
import AutoSignPremiumModal from "modals/documents/SigningModals/AutoSignPremiumModal";
// import { enqueueSnackbar } from "notistack";
import RouteDocumentModal from "modals/documents/RouteDocumentModal";
import AutoSignModal from "modals/documents/SigningModals/AutoSignModal";
import PNPKIAutoSignModal from "modals/documents/SigningModals/PNPKIAutoSignModal";
import PNPKIManualSignModal from "modals/documents/SigningModals/PNPKIManualSignModal";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DocumentsTable({
  data,
  selectedData,
  setSelectedData = () => {},
  singleSelect = false,
  showCheckbox = false,
  showMultipleSelection = false,
  loadingState,
  setLoadingState,
  updateTableFunction,
}) {
  const { auth, referenceId, setRoutingDocs } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const location = useLocation();

  const [openViewModal, setOpenViewModal] = useState(false);
  const [openViewDetailsModal, setOpenViewDetailsModal] = useState(false);
  const [openRouteModal, setOpenRouteModal] = useState(false);
  const [openAutoSignPremiumModal, setOpenAutoSignPremiumModal] =
    useState(false);
  const [openAutoSignModal, setOpenAutoSignModal] = useState(false);
  const [openManualSignModal, setOpenManualSignModal] = useState(false);
  const [openPNPKISignModal, setOpenPNPKISignModal] = useState(false);
  const [openPNPKIManualSignModal, setOpenPNPKIManualSignModal] =
    useState(false);

  const [pageToSign, setPageToSign] = useState(null);
  const [pdfUrl, setPdfUrl] = useState();

  const [dataFromActions, setDataFromActions] = useState();

  const [loading, setLoading] = useState(loadingState);
  const [error, setError] = useState("");

  const SDSSecIds = [4];
  const ASDSSecIds = [7];

  const handleUpdateRoutingDocs = () => {
    setLoading(true);
    setError("");

    axiosPrivate
      .get(`/documents/getSpecificDocuments`, {
        params: {
          auth: {
            id: referenceId,
            type: auth?.officeId === 1 ? "unit" : "office",
          },
          category: "forRouting",
        },
      })
      .then((res) => {
        const filteredForRouting = res.data.filter((doc) => {
          const { destinations } = doc;

          if (
            destinations.some(
              (dest) => dest.id === auth.unitId && dest.type === "unit"
            ) &&
            doc.status === 8 &&
            doc.acceptStatus === 1
          ) {
            return true;
          }
          return false;
        });

        // Sort documents by complexity (3 - 1)
        filteredForRouting.sort((a, b) => b.complexity - a.complexity);

        setRoutingDocs(filteredForRouting);
      })
      .catch((err) => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSignDocument = async (signMethod) => {
    setLoading(true);

    const { files } = dataFromActions;

    const fileDocuments = files.some((file) => file !== "") ? files : [];

    const fileName = fileDocuments[fileDocuments.length - 1];

    await axiosPrivate
      .get(`/documents/displayDocumentAsBlob`, {
        params: { fileName },
        responseType: "blob",
      })
      .then(async (res) => {
        const url = window.URL.createObjectURL(
          new Blob([res?.data], { type: "application/pdf" })
        );

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await res.data.arrayBuffer();

        // Load the PDF document using pdf-lib
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const numberOfPages = pdfDoc.getPageCount();

        setPdfUrl(url);
        setDataFromActions({ ...dataFromActions, numberOfPages });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
        if (signMethod === "auto-premium") {
          setOpenAutoSignPremiumModal(true);
        } else if (signMethod === "auto") {
          setOpenAutoSignModal(true);
        } else if (signMethod === "manual") {
          setOpenManualSignModal(true);
        } else if (signMethod === "PNPKI") {
          setOpenPNPKISignModal(true);
        } else if (signMethod === "PNPKIManual") {
          setOpenPNPKIManualSignModal(true);
        }
      });
  };

  const handleViewFile = async (rowData) => {
    setLoading(true);

    const { files } = rowData;

    const fileDocuments = files.some((file) => file !== "") ? files : [];

    const fileName = fileDocuments[fileDocuments.length - 1];

    await axiosPrivate
      .get(`/documents/displayDocumentAsBlob`, {
        params: { fileName },
        responseType: "blob",
      })
      .then(async (res) => {
        const url = window.URL.createObjectURL(
          new Blob([res?.data], { type: "application/pdf" })
        );

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await res.data.arrayBuffer();

        // Load the PDF document using pdf-lib
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const numberOfPages = pdfDoc.getPageCount();

        setPdfUrl(url);
        setDataFromActions({ ...rowData, numberOfPages });
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
        setOpenViewModal(true);
      });
  };

  const handleViewDetails = async (rowData) => {
    if (rowData) {
      setDataFromActions(rowData);
      setOpenViewDetailsModal(true);
    }
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 150,
      getActions: (params) => {
        const { files, isReadable } = params.row;

        const fileDocuments = files?.some((file) => file !== "") ? files : [];

        const actionItems = [];

        actionItems.push(
          <Tooltip
            key="view"
            title={
              fileDocuments.length === 0
                ? "No file attached"
                : location.pathname === "/signature" ||
                  location.pathname === "/signature-to-memo"
                ? "Sign"
                : location.pathname === "/signed"
                ? "Unsign"
                : "View"
            }
            placement="top"
          >
            <GridActionsCellItem
              disabled={fileDocuments.length === 0}
              icon={
                fileDocuments.length ? (
                  location.pathname === "/signature" ||
                  location.pathname === "/signature-to-memo" ? (
                    <AiFillSignature style={{ fontSize: "19px" }} />
                  ) : (
                    <VisibilityIcon
                      sx={{ color: isReadable ? "#0d85ee" : "#2f2f2f" }}
                    />
                  )
                ) : (
                  <NotInterestedIcon sx={{ fontSize: "20px" }} />
                )
              }
              label="View"
              onClick={() => handleViewFile(params.row)}
              color="inherit"
            />
          </Tooltip>,
          <Tooltip key="viewDetails" title="View Details" placement="top">
            <GridActionsCellItem
              icon={<ChecklistIcon />}
              label="View Details"
              onClick={() => handleViewDetails(params.row)}
              color="inherit"
            />
          </Tooltip>
        );

        return actionItems;
      },
    },
    {
      field: "id",
      headerName: "ID",
      width: 80,
    },
    {
      field: "lpsNo",
      headerName: "LPS. No.",
      width: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {params.row.id}
          </Typography>
        </Box>
      ),
    },
    { field: "docType", headerName: "Doc Type", width: 180 },
    { field: "title", headerName: "Doc Title/Details", width: 250 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => {
        const {
          primarySources,
          lastSource,
          destinations,
          acceptStatus,
          autoInitials,
          manualInitials,
          complied,
          routedBy,
          createdAtDateTime,
          complexity,
        } = params.row;

        let chosenLastSource;

        if (lastSource.length === 1) {
          chosenLastSource = lastSource ? lastSource[0] : null;
        } else {
          chosenLastSource = lastSource ? lastSource[1] : null;
        }

        const currentDateTime = new Date();
        const createdAtDateTimeObj = new Date(createdAtDateTime);
        // const lastUpdateDateTimeObj = new Date(lastUpdateDateTime);

        let daysBeforeLapsedInMilliseconds;

        if (complexity === 1) {
          daysBeforeLapsedInMilliseconds = 3 * 24 * 60 * 60 * 1000; // Urgent
        } else if (complexity === 2) {
          daysBeforeLapsedInMilliseconds = 7 * 24 * 60 * 60 * 1000; // Complex
        } else if (complexity === 3) {
          daysBeforeLapsedInMilliseconds = 1 * 24 * 60 * 60 * 1000; // Highly Technical
        } else if (complexity === 4) {
          daysBeforeLapsedInMilliseconds = 20 * 24 * 60 * 60 * 1000; // Simple
        }

        if (params.value === 2) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "red",
              }}
            >
              Returned
            </Typography>
          );
        } else if (location.pathname === "/incoming") {
          return "Incoming";
        } else if (location.pathname === "/outgoing") {
          return "Outgoing";
        } else if (params.value === 1) {
          if (
            destinations.some(
              (dest) =>
                dest.id === chosenLastSource.id || dest.id === referenceId
            )
          ) {
            return "Incoming";
          } else {
            return "Outgoing";
          }
        } else if (params.value === 3) {
          if (createdAtDateTime) {
            if (
              currentDateTime.getTime() >=
                createdAtDateTimeObj.getTime() +
                  daysBeforeLapsedInMilliseconds &&
              !autoInitials &&
              !manualInitials &&
              !complied &&
              !routedBy &&
              destinations.some(
                (dest) =>
                  dest.id === referenceId &&
                  dest.type === (auth?.officeId === 1 ? "unit" : "office")
              )
            ) {
              return (
                <Typography
                  sx={{
                    fontWeight: "bold",
                    color: "red",
                  }}
                >
                  Lapsed
                </Typography>
              );
            }
          }

          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "green",
              }}
            >
              Accepted
            </Typography>
          );
        } else if (params.value === 4) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#0d85ee",
              }}
            >
              Saved
            </Typography>
          );
        } else if (params.value === 5) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#c49019",
              }}
            >
              On-Hold
            </Typography>
          );
        } else if (params.value === 6) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: "green",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  mr: 1,
                }}
              >
                Signed
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
          );
        } else if (params.value === 7) {
          if (acceptStatus === 1) {
            return (
              <Typography
                sx={{
                  fontWeight: "bold",
                }}
              >
                Unsigned
              </Typography>
            );
          } else if (
            destinations.some((dest) => dest.id === chosenLastSource.id)
          ) {
            return "Incoming";
          } else if (
            primarySources.some((prim) => prim?.id === chosenLastSource.id) ||
            chosenLastSource.id === referenceId
          ) {
            return "Outgoing";
          } else {
            return "Incoming";
          }
        } else if (params.value === 8) {
          if (acceptStatus === 1) {
            return (
              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#c49019",
                }}
              >
                Routing
              </Typography>
            );
          } else if (
            destinations.some((dest) => dest.id === chosenLastSource.id)
          ) {
            return "Incoming";
          } else if (
            primarySources.some((prim) => prim?.id === chosenLastSource.id) ||
            chosenLastSource.id === referenceId
          ) {
            return "Outgoing";
          } else {
            return "Incoming";
          }
        } else if (params.value === 9) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#246fc9",
              }}
            >
              Routed
            </Typography>
          );
        } else if (params.value === 10) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#656791",
              }}
            >
              Initialized
            </Typography>
          );
        }
        return null; // Default return if none of the conditions match
      },
    },
    {
      field: "complexity",
      headerName: "Complexity",
      width: 100,
      renderCell: (params) => {
        const complexity = params.value;

        if (complexity === 1) {
          return "Simple";
        } else if (complexity === 2) {
          return (
            <Typography sx={{ color: "#a88921", fontWeight: "bold" }}>
              Complex
            </Typography>
          );
        } else if (complexity === 3) {
          return (
            <Typography sx={{ color: "red", fontWeight: "bold" }}>
              Urgent
            </Typography>
          );
        }

        return null;
      },
    },
    {
      field: "signComplianceStatus",
      headerName: "Sign/Compliance Status",
      width: 200,
      renderCell: (params) => {
        const { autoInitials, manualInitials, complied, signedDateTime } =
          params.row;

        const docAutoInitials = autoInitials || [];
        const docManualInitials = manualInitials || [];
        const docComplied = complied || [];

        const combinedSignatories = [...docAutoInitials, ...docManualInitials];

        const signatoriesIds = combinedSignatories.map(
          (signatory) => signatory?.id
        );

        let isInitialized = false;

        if (SDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (signatoriesIds.includes(1)) {
            isInitialized = true;
          }
        } else if (ASDSSecIds.includes(auth?.unitId) && auth?.officeId === 1) {
          if (signatoriesIds.includes(2)) {
            isInitialized = true;
          }
        } else if (signatoriesIds.includes(auth?.unitId)) {
          isInitialized = true;
        }

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              width: "100%",
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: "6px", // Adjusts the scrollbar height
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888", // Adjusts the scrollbar color
                borderRadius: "4px", // Optional: Rounds the corners of the scrollbar
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#555", // Color on hover
              },
            }}
          >
            {(combinedSignatories.some((signatory) => signatory.id === 1) &&
              signedDateTime) ||
            signedDateTime ? (
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
                  Signed
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
            ) : isInitialized ? (
              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#656791",
                  mr: 1,
                }}
              >
                Initialized
              </Typography>
            ) : null}

            {docComplied.map((unit) => unit.id).includes(referenceId) && (
              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#0d91cb",
                  mr: 1,
                }}
              >
                Complied
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: "classification",
      headerName: "Classification",
      width: 120,
      renderCell: (params) => {
        const classification = params.value;

        if (classification === 1) {
          return "For Signing";
        } else if (classification === 2) {
          return "For Routing"; // routed out
        } else if (classification === 3) {
          return "For Checking";
        } else if (classification === 4) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#246fc9",
              }}
            >
              Routed
            </Typography>
          ); // routed in
        } else if (classification === 5) {
          return (
            <Typography
              sx={{
                fontWeight: "bold",
                color: "#074ccd",
              }}
            >
              Submitted
            </Typography>
          );
        } else {
          return null;
        }
      },
    },
    {
      field: "destinations",
      headerName: "Destination",
      width: 200,
      valueGetter: (params) => {
        const destinations = params.value;

        return destinations
          .map((destination) => destination.destination)
          .join(", ");
      },
    },
    {
      field: "primarySources",
      headerName: "Primary Source",
      width: 200,
      valueGetter: (params) => {
        const primSources = params.value;

        const primaryNames = primSources.map((prim) => prim.destination);

        const primaryString = primaryNames.join(", ");

        return primaryString;
      },
    },
    {
      field: "lastSource",
      headerName: "Last Source",
      width: 200,
      valueGetter: (params) => {
        const lastSources = params.value;

        return lastSources[lastSources.length - 1]?.destination;
      },
    },
    {
      field: "createdAtDateTime",
      headerName: "Date & Time Uploaded",
      width: 180,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
    {
      field: "lastUpdateDateTime",
      headerName: "Last Transaction",
      width: 180,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
    {
      field: "firstAcceptedDateTime",
      headerName: "First Accepted",
      width: 180,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
    {
      field: "lastAcceptedDateTime",
      headerName: "Last Accepted",
      width: 180,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
    {
      field: "signedDateTime",
      headerName: "Date & Time Signed",
      width: 180,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
    {
      field: "duration",
      headerName: "Duration",
      width: 120,
      valueGetter: (params) => {
        const { firstAcceptedDateTime, signedDateTime } = params.row;

        if (!firstAcceptedDateTime) return null;

        // const formattedAcceptTimeStamp = firstAcceptedDateTime
        //   ? dayjs(firstAcceptedDateTime)
        //   : null;
        // const formattedSignedTimeStamp = signedDateTime
        //   ? dayjs(signedDateTime)
        //   : null;

        const firstDate = new Date(firstAcceptedDateTime);
        const endDate = signedDateTime ? new Date(signedDateTime) : new Date();

        const diffInMilliseconds = new Date(endDate) - firstDate;

        const diffInDays = Math.floor(
          diffInMilliseconds / (1000 * 60 * 60 * 24)
        );

        return diffInDays;
      },
    },

    { field: "remarks", headerName: "Remarks", width: 250 },
  ];

  useEffect(() => {
    setLoading(loadingState);
  }, []);

  useEffect(() => {
    setLoadingState(loading);
  }, [loading]);

  return (
    <Box>
      <AutoSignPremiumModal
        open={openAutoSignPremiumModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenAutoSignPremiumModal(false);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        pdfUrl={pdfUrl}
        loadingState={loading}
        setOpenAutoSignModal={setOpenAutoSignPremiumModal}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <AutoSignModal
        open={openAutoSignModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenAutoSignModal(false);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        pdfUrl={pdfUrl}
        loadingState={loading}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <ManualSignModal
        open={openManualSignModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenManualSignModal(false);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        pdfUrl={pdfUrl}
        loadingState={loading}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <PNPKIAutoSignModal
        open={openPNPKISignModal}
        handleClose={() => {
          setOpenPNPKISignModal(false);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        pdfUrl={pdfUrl}
        loadingState={loading}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <PNPKIManualSignModal
        open={openPNPKIManualSignModal}
        handleClose={() => {
          setOpenPNPKIManualSignModal(false);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        pdfUrl={pdfUrl}
        loadingState={loading}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <ViewDocumentModal
        open={openViewModal}
        handleClose={() => {
          setOpenViewModal(false);
          setDataFromActions(null);
        }}
        pageToSign={pageToSign}
        setPageToSign={setPageToSign}
        loadingState={loading}
        setOpenViewModal={setOpenViewModal}
        setOpenRouteModal={setOpenRouteModal}
        handleSignDocument={handleSignDocument}
        dataFromActions={dataFromActions || null}
        setDataFromActions={setDataFromActions}
        updateTableFunction={() => updateTableFunction()}
      />
      <ViewDetailsModal
        open={openViewDetailsModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenViewDetailsModal(false);
        }}
        dataFromActions={dataFromActions || null}
      />
      <RouteDocumentModal
        open={openRouteModal}
        handleClose={() => {
          setDataFromActions(null);
          setOpenRouteModal(false);
          setOpenViewModal(false);
        }}
        loadingState={loading}
        selectedData={[dataFromActions] || null}
        updateTableFunction={() => handleUpdateRoutingDocs()}
      />

      {error}
      <EditableTable
        data={data}
        columns={columns}
        checkbox={showCheckbox}
        multipleSelection={showMultipleSelection}
        // loading={loading || loadingState}
        loading={loadingState}
        // rowToDelete={setRowToDelete}
        singleSelect={singleSelect}
        selectedData={selectedData}
        setSelectedData={setSelectedData}
        height="60vh"
        showSearch
        fieldsToHide={["id", "isReadable"]}
      />
    </Box>
  );
}
