/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useStateContext } from "contexts/ContextProvider";

import { AiFillSignature } from "react-icons/ai";
import CheckIcon from "@mui/icons-material/Check";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

import useAxiosPrivate from "contexts/interceptors/axios";
import ReturnDocumentModal from "modals/documents/ReturnDocumentModal";
import { enqueueSnackbar } from "notistack";
import PageTemplate from "layouts/PageTemplate";
import { base64ToArrayBuffer } from "lib/helpers";
import FaceRecognitionModal from "modals/face-recognition/FaceRecognitionModal";
// import socket from "contexts/socket";
import DocumentsTable from "../DocumentsTable";

export default function SignatureDocuments() {
  const storedFingerprintVerificationStatus = localStorage.getItem(
    "fingerprintVerificationStatus"
  );
  const storedFaceVerificationStatus = localStorage.getItem(
    "faceVerificationStatus"
  );

  const [fingerprintVerificationStatus, setFingerprintVerificationStatus] =
    useState(JSON.parse(storedFingerprintVerificationStatus) || null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState(
    JSON.parse(storedFaceVerificationStatus) || null
  );

  const [openFaceRecog, setOpenFaceRecog] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const { auth, referenceId } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [documents, setDocuments] = useState([]);
  const [selectedData, setSelectedData] = useState(null);

  const [openReturnModal, setOpenReturnModal] = useState(false);

  const [selectedDocType, setSelectedDocType] = useState("all");
  const [specificDocType, setSpecificDocType] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("all");

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
          category: "forSigning",
        },
      })
      .then((res) => {
        // const filteredForSigning = res.data.filter((doc) => {
        //   const docDestinations = doc.destinations;

        //   if (
        //     docDestinations.some(
        //       (dest) => dest.id === referenceId && dest.type === "unit"
        //     ) &&
        //     doc.status === 7 &&
        //     doc.acceptStatus === 1
        //   ) {
        //     return true;
        //   }
        //   return false;
        // });

        const filteredForSigning = res?.data;

        // if (auth?.role?.some((role) => ["sds"].includes(role))) {
        //   filteredForSigning = filteredForSigning.filter(
        //     (doc) =>
        //       doc.docType.toLowerCase() !== "travel order" &&
        //       doc.docType.toLowerCase() !== "division memorandum"
        //   );
        // }

        // Sort documents by complexity (3 - 1)
        filteredForSigning.sort((a, b) => b.complexity - a.complexity);

        setDocuments(filteredForSigning);
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

  const handleMoveToIncoming = () => {
    const confirmed = window.confirm(
      `Are you sure you want to move ${
        selectedData?.length > 1 ? "these" : "this"
      } ${
        selectedData?.length > 1 ? "documents" : "document"
      } to your Incoming?`
    );

    if (confirmed) {
      setLoading(true);
      setError("");

      axiosPrivate
        .patch(`/documents/patchUpdate`, {
          documents: selectedData,
          updateFields: {
            status: 1,
            acceptStatus: 0,
            currentOwner: [
              {
                id: 0,
                destination: 0,
                type: 0,
              },
            ],
            remarks: `Moved to Incoming by ${auth?.firstName} ${
              auth?.lastName
            } from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`,
          },
        })
        .then(() => {
          handleGetAll();
          enqueueSnackbar("Document Moved to Incoming", {
            variant: "success",
          });
        })
        .catch((err) => {
          setError(err.response.data.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setSelectedData(null);
  };

  const handleAccept = () => {
    const confirmed = window.confirm(
      `Are you sure you want to move ${selectedData > 1 ? "these" : "this"} ${
        selectedData > 1 ? "documents" : "document"
      } to your Pending?`
    );

    if (confirmed) {
      setLoading(true);
      setError("");

      axiosPrivate
        .patch(`/documents/patchUpdate`, {
          documents: selectedData,
          updateFields: {
            status: 3,
            acceptStatus: 1,
            remarks: `Moved to Pending by ${auth?.firstName} ${
              auth?.lastName
            } from ${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`,
          },
        })
        .then(() => {
          handleGetAll();
          enqueueSnackbar(
            `${selectedData > 1 ? "Documents" : "Document"} Moved`,
            {
              variant: "success",
            }
          );
        })
        .catch((err) => {
          setError(err.response.data.error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    setSelectedData(null);
  };

  let isAuthenticating = false;

  const handleVerifyFingerprint = async () => {
    if (isAuthenticating) return; // prevent double trigger
    isAuthenticating = true;

    try {
      // Convert base64 to ArrayBuffer
      const challenge = new Uint8Array(32);

      const credentialId = base64ToArrayBuffer(auth?.fingerprintData?.rawId);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: credentialId,
              type: "public-key",
              // transports: ["internal"], // This tells the browser to use internal (PC) auth only
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        // Store user data in localStorage (in a real app, you'd use a more secure method)
        localStorage.setItem(
          "fingerprintVerificationStatus",
          JSON.stringify({ fingerprintVerified: true })
        );

        setFingerprintVerificationStatus({ fingerprintVerified: true });

        enqueueSnackbar("Fingerprint Verified!", {
          variant: "success",
        });
      }
    } catch (err) {
      console.log(err);

      enqueueSnackbar("Fingerprint verification cancelled", {
        variant: "default",
      });
    } finally {
      isAuthenticating = false;
    }
  };

  useEffect(() => {
    // if (auth?.enableFingerprint) {
    //   setVerifications((prev) => ({ ...prev, fingerprint: false }));
    // }
    // if (auth?.enableFaceRecog) {
    //   setVerifications((prev) => ({ ...prev, faceData: false }));
    // }
    if (!fingerprintVerificationStatus && auth?.enableFingerprint) {
      handleVerifyFingerprint();
    }
    if (!faceVerificationStatus && auth?.enableFaceRecog) {
      setOpenFaceRecog(true);
    }
  }, [auth]);

  useEffect(() => {
    const allVerified =
      (!auth?.enableFingerprint || fingerprintVerificationStatus) &&
      (!auth?.enableFaceRecog || faceVerificationStatus);

    // console.log(fingerprintVerificationStatus);
    // console.log(faceVerificationStatus);
    setShowDocuments(Boolean(allVerified));
    if (allVerified) {
      handleGetAll();
    }
  }, [fingerprintVerificationStatus, faceVerificationStatus]);

  const handleClearFingerprint = () => {
    setFingerprintVerificationStatus(null);

    localStorage.removeItem("fingerprintVerificationStatus");

    handleVerifyFingerprint();
  };

  const handleClearFaceData = () => {
    setFaceVerificationStatus(null);

    localStorage.removeItem("faceVerificationStatus");

    setOpenFaceRecog(true);
  };

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

  const hasActiveFilters =
    selectedDocType !== "all" || selectedOffice !== "all" || specificDocType !== "";

  const filteredDocuments = useMemo(
    () =>
      documents
        .filter((doc) => {
          // office filter
          if (
            selectedOffice !== "all" &&
            !doc?.primarySources[0]?.destination
              ?.toLowerCase()
              .includes(selectedOffice.toLowerCase())
          ) {
            return false;
          }

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
    [documents, selectedOffice, selectedDocType, specificDocType]
  );

  // Periodic face verification check every 30 seconds
  // useEffect(() => {
  //   // const checkFaceVerification = () => {
  //   //   const faceVerificationStatusCheck = localStorage.getItem(
  //   //     "faceVerificationStatus"
  //   //   );
  //   //   if (faceVerificationStatusCheck) {
  //   //     handleClearFaceData();
  //   //   }
  //   // };

  //   const handleLogout = () => {
  //     socket.emit(
  //       "leaveRoom",
  //       `${auth?.officeId === 1 ? auth?.unitName : auth?.officeName}`
  //     );

  //     setAuth(null);
  //     localStorage.clear();
  //   };

  //   // Set up interval to run every 30 seconds (180,000 milliseconds)
  //   const intervalId = setInterval(handleLogout, 30 * 1000);

  //   // Cleanup interval on component unmount
  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []); // Empty dependency array means this effect runs once on mount

  // font "Mont"

  return (
    <PageTemplate
      hasActiveFilters={hasActiveFilters}
      setSelectedDocType={setSelectedDocType}
      setSelectedOffice={setSelectedOffice}
      setSpecificDocType={setSpecificDocType}
      icon={
        <AiFillSignature
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Documents for Signature"
      modals={[
        <FaceRecognitionModal
          open={openFaceRecog}
          handleClose={() => setOpenFaceRecog(false)}
          setFaceVerificationStatus={setFaceVerificationStatus}
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
        />
      ]}
      error={error}
      filters={
        auth?.unitId === 1
          ? [
              <Grid
                container
                spacing={2}
                sx={{
                  alignItems: 'stretch'
                }}
              >
                {/* ================= DOCUMENT TYPE ================= */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        ml: 1,
                        mb: 1.5,
                        color: '#2f2f2f'
                      }}
                    >
                      Document Type
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        flexDirection: 'column',
                        backgroundColor: '#ffffff',
                        borderRadius: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        p: 1,
                        mt: 1,
                        gap: 1
                      }}
                    >
                      <Autocomplete
                        size="small"
                        disablePortal
                        options={docTypeOptions}
                        value={selectedDocType === 'all' ? 'All' : selectedDocType}
                        onChange={handleDocTypeChange}
                        renderInput={params => (
                          <TextField
                            {...params}
                            placeholder="Select document type"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 6,
                                backgroundColor: '#fff'
                              }
                            }}
                          />
                        )}
                      />
                      {selectedDocType !== 'Others' && (
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            borderRadius: 3,
                            p: 1,
                            gap: 1
                          }}
                        >
                          {/* Travel */}
                          <Button
                            onClick={() => setSelectedDocType('Travel')}
                            sx={{
                              minWidth: '40px',
                              width: selectedDocType.includes('Travel') ? '140px' : '40px',
                              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #9d9d9d',
                              borderRadius: '999px',
                              background: selectedDocType.includes('Travel')
                                ? '#a2cb6b'
                                : 'transparent',
                              p: 2,
                              '&:hover': {
                                backgroundColor: selectedDocType.includes('Travel')
                                  ? '#9cc266'
                                  : '#f3f4f6'
                              },
                              '& .button-text': {
                                color: '#2f2f2f',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out 0.1s',
                                opacity: selectedDocType.includes('Travel') ? 1 : 0,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              },
                              '& .button-letter': {
                                color: 'gray',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out',
                                opacity: selectedDocType.includes('Travel') ? 0 : 1,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              }
                            }}
                          >
                            <span className="button-text">Travel Order</span>
                            <span className="button-letter">T</span>
                          </Button>

                          {/* Indorsement */}
                          <Button
                            onClick={() => setSelectedDocType('Indorsement')}
                            sx={{
                              minWidth: '40px',
                              width: selectedDocType.includes('Indorsement') ? '120px' : '40px',
                              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',

                              border: '1px solid #9d9d9d',
                              borderRadius: '999px',
                              background: selectedDocType.includes('Indorsement')
                                ? '#a2cb6b'
                                : 'transparent',
                              p: 2,
                              '&:hover': {
                                backgroundColor: selectedDocType.includes('Indorsement')
                                  ? '#9cc266'
                                  : '#f3f4f6'
                              },
                              '& .button-text': {
                                color: '#2f2f2f',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out 0.1s',
                                opacity: selectedDocType.includes('Indorsement') ? 1 : 0,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              },
                              '& .button-letter': {
                                color: 'gray',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out',
                                opacity: selectedDocType.includes('Indorsement') ? 0 : 1,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              }
                            }}
                          >
                            <span className="button-text">Indorsement</span>
                            <span className="button-letter">I</span>
                          </Button>

                          {/* Memorandum */}
                          <Button
                            onClick={() => setSelectedDocType('Memorandum')}
                            sx={{
                              minWidth: '40px',
                              width: selectedDocType.includes('Memorandum') ? '130px' : '40px',
                              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #9d9d9d',
                              borderRadius: '999px',
                              p: 2,
                              background: selectedDocType.includes('Memorandum')
                                ? '#a2cb6b'
                                : 'transparent',
                              '&:hover': {
                                backgroundColor: selectedDocType.includes('Memorandum')
                                  ? '#9cc266'
                                  : '#f3f4f6'
                              },
                              '& .button-text': {
                                color: '#2f2f2f',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out 0.1s',
                                opacity: selectedDocType.includes('Memorandum') ? 1 : 0,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              },
                              '& .button-letter': {
                                color: 'gray',
                                position: 'absolute',
                                transition: 'opacity 0.2s ease-in-out',
                                opacity: selectedDocType.includes('Memorandum') ? 0 : 1,
                                left: '50%',
                                transform: 'translateX(-50%)'
                              }
                            }}
                          >
                            <span className="button-text">Memorandum</span>
                            <span className="button-letter">M</span>
                          </Button>
                        </Box>
                      )}

                      {selectedDocType === 'Others' && (
                        <TextField
                          name="otherDocTypes"
                          label="Specify Document Type"
                          size="small"
                          disabled={loading}
                          value={specificDocType}
                          onChange={e => setSpecificDocType(e.target.value)}
                          variant="standard"
                          fullWidth
                          sx={{ px: 2 }}
                          InputLabelProps={{ sx: { ml: 2 } }}
                        />
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* ================= OFFICE ================= */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 16,
                        fontWeight: 600,
                        ml: 1,
                        mb: 1.5,
                        color: '#2f2f2f'
                      }}
                    >
                      Office
                    </Typography>

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        borderRadius: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        p: 1,
                        mt: 1,
                        gap: 1
                      }}
                    >
                      {['all', 'OSDS', 'OASDS', 'ICT', 'SGOD', 'CID', 'ASU', 'FSU'].map(office => (
                        <Button
                          key={office}
                          onClick={() => setSelectedOffice(office)}
                          sx={{
                            width: office === 'all' ? '80px' : '50px',
                            py: 1,
                            borderRadius: '999px',
                            textTransform: 'none',
                            fontWeight: 600,
                            backgroundColor: selectedOffice === office ? '#a2cb6b' : '#ffffff',
                            color: selectedOffice === office ? '#000' : '#757575',
                            boxShadow:
                              selectedOffice === office
                                ? '0 4px 12px rgba(47,111,173,0.4)'
                                : '0 2px 6px rgba(0,0,0,0.08)',
                            border: '1px solid #e0e0e0',
                            transition: 'all 0.25s ease',
                            '&:hover': {
                              backgroundColor: selectedOffice === office ? '#9cc266' : '#f3f4f6'
                            }
                          }}
                        >
                          {office === 'all' ? 'All' : office}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            ]
          : []
      }
      leftButtons={[
        auth?.unitId !== 1 &&
          auth?.unitId !== 2 && [
            <Button
              disabled={loading || selectedData?.length === 0}
              onClick={() => handleAccept()}
              sx={{
                backgroundColor: loading || selectedData?.length === 0 ? 'lightgray' : 'green',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)'
                }
              }}
            >
              <CheckIcon sx={{ mr: 1 }} />
              Move to Pending
            </Button>,
            <Button
              disabled={loading || selectedData?.length === 0}
              onClick={() => handleMoveToIncoming()}
              sx={{
                backgroundColor: loading || selectedData?.length === 0 ? 'lightgray' : '#184c8c',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '5px 20px',
                borderRadius: '15px',
                '&:hover': {
                  backgroundColor: 'lightgray',
                  color: '#2f2f2f',
                  boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)'
                }
              }}
            >
              <ShortcutIcon sx={{ mr: 1 }} />
              Move to Incoming
            </Button>
          ],
        (auth?.unitId === 1 || auth?.unitId === 2) && (
          <Button
            disabled={
              loading ||
              selectedData?.length === 0 ||
              // selectedData?.length > 1 ||
              !selectedData ||
              selectedData[0]?.status === 2
            }
            onClick={() => setOpenReturnModal(true)}
            sx={{
              backgroundColor:
                loading ||
                selectedData?.length === 0 ||
                // selectedData?.length > 1 ||
                !selectedData ||
                selectedData[0]?.status === 2 ||
                selectedData[0]?.signedDateTime
                  ? 'lightgray'
                  : '#da2c43',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: '5px 20px',
              borderRadius: '15px',
              '&:hover': {
                backgroundColor: 'lightgray',
                color: '#2f2f2f',
                boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            <KeyboardReturnIcon sx={{ mr: 1 }} />
            Return
          </Button>
        )
      ]}
      rightButtons={[
        fingerprintVerificationStatus && auth?.enableFingerprint
          ? [<Button onClick={() => handleClearFingerprint()}>Clear verification data</Button>]
          : [],

        faceVerificationStatus?.faceVerified && auth?.enableFaceRecog
          ? [<Button onClick={() => handleClearFaceData()}>Clear verification data</Button>]
          : []
      ]}
      table={
        <DocumentsTable
          data={showDocuments ? filteredDocuments : []}
          selectedData={selectedData}
          setSelectedData={setSelectedData}
          showCheckbox
          showMultipleSelection
          // singleSelect
          loadingState={loading}
          setLoadingState={setLoading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
