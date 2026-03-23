/* eslint-disable no-else-return */
/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unstable-nested-components */
import React, { useEffect, useState } from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";
import { Box, Tooltip, Typography } from "@mui/material";

// Icons
import ChecklistIcon from "@mui/icons-material/Checklist";
import { FaRegCircleCheck } from "react-icons/fa6";
import NotInterestedIcon from "@mui/icons-material/NotInterested";
import VisibilityIcon from "@mui/icons-material/Visibility";

import EditableTable from "components/Table/EditableTable";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function SelfServiceTable({
  data,
  setRowData,
  setOpenViewDocModal,
  setOpenDetails,
  loadingState,
  setLoadingState,
}) {
  const [loading, setLoading] = useState(loadingState);

  const handleViewFile = async (rowDetails) => {
    setRowData(rowDetails);
    setOpenViewDocModal(true);
  };

  const handleViewDetails = async (rowDetails) => {
    if (rowDetails) {
      if (Array.isArray(rowDetails) && rowDetails.length > 0) {
        setRowData(rowDetails);
      } else {
        setRowData(rowDetails);
      }
      setOpenDetails(true);
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
            title={fileDocuments.length === 0 ? "No file attached" : "View"}
            placement="top"
          >
            <span>
              <GridActionsCellItem
                disabled={fileDocuments.length === 0}
                icon={
                  fileDocuments.length ? (
                    <VisibilityIcon
                      sx={{ color: isReadable ? "#1b5e54" : "#2f2f2f" }}
                    />
                  ) : (
                    <NotInterestedIcon sx={{ fontSize: "20px" }} />
                  )
                }
                label="View"
                onClick={() => handleViewFile(params.row)}
                color="inherit"
              />
            </span>
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
      field: "docuId",
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
            ID: {params.row.docuId}
          </Typography>
        </Box>
      ),
    },
    { field: "docType", headerName: "Doc Type", width: 180 },
    { field: "title", headerName: "Doc Title/Details", width: 200 },
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
          // lastUpdateDateTime,
        } = params.row;

        let chosenLastSource;

        if (lastSource.length === 1) {
          chosenLastSource = lastSource ? lastSource[0] : null;
        } else {
          chosenLastSource = lastSource ? lastSource[1] : null;
        }

        const currentDateTime = new Date();
        const createdAtDateTimeObj = new Date(createdAtDateTime);

        const fifteenDaysInMilliseconds = 15 * 24 * 60 * 60 * 1000;

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
        } else if (params.value === 1) {
          if (destinations.some((dest) => dest.id === chosenLastSource.id)) {
            return "Incoming";
          } else if (
            primarySources.some((prim) => prim.id === chosenLastSource.id)
          ) {
            return "Outgoing";
          } else {
            return "Incoming";
          }
        } else if (params.value === 3) {
          if (createdAtDateTime) {
            if (
              currentDateTime.getTime() >=
                createdAtDateTimeObj.getTime() + fifteenDaysInMilliseconds &&
              !autoInitials &&
              !manualInitials &&
              !complied &&
              !routedBy
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
                color: "#dcc36d",
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
            primarySources.some((prim) => prim.id === chosenLastSource.id)
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
            primarySources.some((prim) => prim.id === chosenLastSource.id)
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
      width: 180,
      renderCell: (params) => {
        const { signedDateTime } = params.row;

        if (signedDateTime) {
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
        } else {
          return null;
        }
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

        const diffInMilliseconds =
          dayjs(endDate).add(1, "day").toDate() - firstDate;

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
      <EditableTable
        data={data}
        columns={columns}
        loading={loadingState}
        height="60vh"
        showSearch
        fieldsToHide={["docuId", "isReadable"]}
      />
    </Box>
  );
}
