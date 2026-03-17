/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

// Incoming
import { FaInbox } from "react-icons/fa6";

import { useStateContext } from "contexts/ContextProvider";
import useAxiosPrivate from "contexts/interceptors/axios";
import ReturnDocumentModal from "modals/documents/ReturnDocumentModal";
import AcceptDocumentsModal from "modals/documents/AcceptDocumentsModal";
import { enqueueSnackbar } from "notistack";
import PageTemplate from "layouts/PageTemplate";
import socket from "contexts/socket";
import DocumentsTable from "../../DocumentsTable";

export default function IncomingDocuments() {
  const { auth, referenceId } = useStateContext();

  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [openAcceptModal, setOpenAcceptModal] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);

  const [selectedDocType, setSelectedDocType] = useState("all");
  const [specificDocType, setSpecificDocType] = useState("");

  const manyDocuments = selectedData?.length > 1;

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
          category: "incoming",
        },
      })
      .then((res) => {
        let filteredIncoming = res?.data;

        filteredIncoming = filteredIncoming.filter(
          (doc) =>
            doc.docType.toLowerCase() === "travel order" ||
            doc.docType.toLowerCase() === "division memorandum"
        );

        // Sort documents by complexity (3 - 1)
        filteredIncoming.sort((a, b) => b.complexity - a.complexity);

        setDocuments(filteredIncoming);
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

  const handleAccept = () => {
    if (
      selectedData.some((data) => {
        const fileDocuments = data.files;

        return !data.signedDateTime && fileDocuments[0] !== "";
      }) &&
      auth?.role?.some((role) => ["unit head", "chief"].includes(role))
    ) {
      setOpenAcceptModal(true);
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to accept ${manyDocuments ? "these" : "this"} ${
          manyDocuments ? "documents" : "document"
        }?`
      );

      if (confirmed) {
        setLoading(true);
        setError("");

        axiosPrivate
          .patch(`/documents/acceptDocs`, {
            documents: selectedData,
            updateFields: {
              currentOwner: [
                {
                  id: referenceId,
                  destination:
                    auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                  type: auth?.officeId === 1 ? "unit" : "office",
                },
              ],
              remarks: `Accepted by ${auth?.firstName} ${auth?.lastName} from ${auth?.unitName}`,
            },
          })
          .then(() => {
            handleGetAll();
            enqueueSnackbar("Document Accepted", { variant: "success" });
          })
          .catch((err) => {
            setError(err.response.data.error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
      setSelectedData(null);
    }
  };

  useEffect(() => {
    if (auth) {
      socket.on("documentNotif", (data) => {
        if (
          data?.recipient ===
          (auth?.officeId === 1 ? auth?.unitName : auth?.officeName)
        ) {
          handleGetAll();
        }
      });
    } else {
      socket.off("documentNotif");
    }
  }, [socket]);

  const docTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set((documents || []).map((d) => d.docType))
    ).filter(Boolean);
    return ["All", ...types, "Others"];
  }, [documents]);

  const handleDocTypeChange = (e, value) => {
    const resolved = !value || value === "All" ? "all" : value;
    setSelectedDocType(resolved);
    if (resolved !== "Others") setSpecificDocType("");
  };

  const hasActiveFilters = selectedDocType !== "all";

  const filteredDocuments = useMemo(
    () =>
      documents
        .filter((doc) => {
          // docType filter
          if (selectedDocType === "Others") {
            if (
              !doc.docType.toLowerCase().includes(specificDocType.toLowerCase())
            ) {
              return false;
            }
          } else if (
            selectedDocType !== "all" &&
            !doc.docType.toLowerCase().includes(selectedDocType.toLowerCase())
          ) {
            return false;
          }

          return true;
        })
        .sort((a, b) => new Date(b.dateRequested) - new Date(a.dateRequested)),
    [documents, selectedDocType]
  );

  // font "Mont"

  return (
    <PageTemplate
      icon={
        <FaInbox
          style={{
            fontSize: "40px",
          }}
        />
      }
      header="Incoming Documents (TO, Memo)"
      modals={[
        <AcceptDocumentsModal
          open={openAcceptModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenAcceptModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />,
        <ReturnDocumentModal
          open={openReturnModal}
          handleClose={() => {
            setSelectedData(null);
            setOpenReturnModal(false);
          }}
          loadingState={loading}
          selectedData={selectedData || null}
          updateTableFunction={() => handleGetAll()}
        />,
      ]}
      error={error}
      filters={
        auth?.unitId === 1
          ? [
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{
                  flex: 1,
                  minWidth: "100%",
                  alignItems: { xs: "stretch", sm: "center" },
                }}
              >
                <Box sx={{ flex: "1 1 0", width: "100%" }}>
                  <Typography
                    sx={{
                      fontSize: "15px",
                      fontWeight: "bold",
                      color: "gray",
                      mb: 0.5,
                    }}
                  >
                    Document Type
                  </Typography>
                  <Autocomplete
                    size="small"
                    disablePortal
                    options={docTypeOptions}
                    value={selectedDocType === "all" ? "All" : selectedDocType}
                    onChange={handleDocTypeChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select document type"
                      />
                    )}
                    sx={{ width: "100%", flex: 1 }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      border: "1px solid gray",
                      borderRadius: "5px",
                      p: 1,
                      mt: 1,
                      gap: 1,
                    }}
                  >
                    <Button
                      onClick={() => setSelectedDocType("Travel")}
                      sx={{
                        minWidth: "40px",
                        width: selectedDocType.includes("Travel")
                          ? "140px"
                          : "40px",
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid gray",
                        p: 2,
                        "& .button-text": {
                          color: "#2f2f2f",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out 0.1s",
                          opacity: selectedDocType.includes("Travel") ? 1 : 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                        "& .button-letter": {
                          color: "gray",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out",
                          opacity: selectedDocType.includes("Travel") ? 0 : 1,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                      }}
                    >
                      <span className="button-text">Travel Order</span>
                      <span className="button-letter">T</span>
                    </Button>
                    <Button
                      onClick={() => setSelectedDocType("Indorsement")}
                      sx={{
                        minWidth: "40px",
                        width: selectedDocType.includes("Indorsement")
                          ? "120px"
                          : "40px",
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid gray",
                        p: 2,
                        "& .button-text": {
                          color: "#2f2f2f",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out 0.1s",
                          opacity: selectedDocType.includes("Indorsement")
                            ? 1
                            : 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                        "& .button-letter": {
                          color: "gray",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out",
                          opacity: selectedDocType.includes("Indorsement")
                            ? 0
                            : 1,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                      }}
                    >
                      <span className="button-text">Indorsement</span>
                      <span className="button-letter">I</span>
                    </Button>
                    <Button
                      onClick={() => setSelectedDocType("Memorandum")}
                      sx={{
                        minWidth: "40px",
                        width: selectedDocType.includes("Memorandum")
                          ? "130px"
                          : "40px",
                        transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid gray",
                        p: 2,
                        "& .button-text": {
                          color: "#2f2f2f",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out 0.1s",
                          opacity: selectedDocType.includes("Memorandum")
                            ? 1
                            : 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                        "& .button-letter": {
                          color: "gray",
                          position: "absolute",
                          transition: "opacity 0.2s ease-in-out",
                          opacity: selectedDocType.includes("Memorandum")
                            ? 0
                            : 1,
                          left: "50%",
                          transform: "translateX(-50%)",
                        },
                      }}
                    >
                      <span className="button-text">Memorandum</span>
                      <span className="button-letter">M</span>
                    </Button>
                  </Box>
                  {selectedDocType === "Others" && (
                    <TextField
                      name="otherDocTypes"
                      label="Specify Document Type"
                      size="small"
                      disabled={loading}
                      value={specificDocType}
                      onChange={(e) => setSpecificDocType(e.target.value)}
                      variant="standard"
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>

                {hasActiveFilters && (
                  <Button
                    onClick={() => {
                      setSelectedDocType("all");
                      setSpecificDocType("");
                    }}
                    sx={{
                      backgroundColor: "lightgray",
                      color: "black",
                      p: 0,
                      minWidth: 60,
                      height: 36,
                      alignSelf: { xs: "stretch", sm: "center" },
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Stack>,
            ]
          : []
      }
      leftButtons={[
        <Button
          disabled={
            loading ||
            selectedData?.length === 0 ||
            // (selectedData?.length > 1 && auth?.role === "unit head") ||
            !selectedData
          }
          onClick={() => handleAccept()}
          sx={{
            backgroundColor:
              loading ||
              selectedData?.length === 0 ||
              // (selectedData?.length > 1 && auth?.role === "unit head") ||
              !selectedData
                ? "lightgray"
                : "green",
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
          <CheckIcon sx={{ mr: 1 }} />
          Accept
        </Button>,
        <Button
          disabled={loading || selectedData?.length === 0 || !selectedData}
          onClick={() => setOpenReturnModal(true)}
          sx={{
            backgroundColor:
              loading || selectedData?.length === 0 || !selectedData
                ? "lightgray"
                : "#da2c43",
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
          <KeyboardReturnIcon sx={{ mr: 1 }} />
          Return
        </Button>,
      ]}
      table={
        <DocumentsTable
          data={filteredDocuments}
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
