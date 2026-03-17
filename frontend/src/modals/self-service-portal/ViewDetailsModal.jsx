/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from "react";
import { Box, IconButton, Modal, Typography } from "@mui/material";

import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CancelIcon from "@mui/icons-material/Close";
import DiamondIcon from "@mui/icons-material/Diamond";
import CircleIcon from "@mui/icons-material/Circle";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  height: "80vh",
  width: "70vw",
  bgcolor: "background.paper",
  boxShadow: "3px 2px 20px 3px rgba(0, 0, 0, 0.3)",
  borderRadius: "10px",
  overflowY: "auto",
  p: 4,
  "@media (max-width: 680px)": {
    width: "95vw",
  },
};

export default function ViewDetailsModal({ open, handleClose, rowData }) {
  const [annotations, setAnnotations] = useState([]);
  const [actions, setActions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [primarySources, setPrimarySources] = useState([]);
  const [lastSources, setLastSources] = useState([]);
  const [routedBy, setRoutedBy] = useState([]);
  const [signatories, setSignatories] = useState([]);

  useEffect(() => {
    if (rowData && open) {
      setAnnotations(rowData.annotations);
      setDestinations(rowData.destinations);
      setPrimarySources(rowData.primarySources);
      setLastSources(rowData.lastSource);
      setRoutedBy(rowData.routedBy);
      setActions(rowData.action);

      const docAutoInitials = rowData.autoInitials || [];
      const docManualInitials = rowData.manualInitials || [];

      const combinedSignatories = [...docAutoInitials, ...docManualInitials];

      setSignatories(combinedSignatories);
    }
  }, [rowData]);

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
      }}
    >
      <Box sx={style}>
        <Box
          sx={{
            display: "block",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              zIndex: 100,
              pb: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Poppins",
                fontWeight: "500",
                fontSize: "25px",
              }}
            >
              Document Details
            </Typography>
            <IconButton onClick={handleClose}>
              <CancelIcon />
            </IconButton>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "gray", fontWeight: "bold" }}>
              Title
            </Typography>
            <Box sx={{ mx: 2 }}>
              <Typography sx={{ textWrap: "wrap" }}>
                {rowData?.title}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "gray", fontWeight: "bold" }}>
              Document Type
            </Typography>
            <Box sx={{ mx: 2 }}>
              <Typography sx={{ textWrap: "wrap" }}>
                {rowData?.docType}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "gray", fontWeight: "bold" }}>
              LPS Number
            </Typography>
            <Box sx={{ mx: 2 }}>
              <Typography sx={{ textWrap: "wrap" }}>
                {rowData?.lpsNo}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ color: "gray", fontWeight: "bold" }}>
              Remarks
            </Typography>
            <Box sx={{ mx: 2 }}>
              <Typography sx={{ textWrap: "wrap" }}>
                {rowData?.remarks}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Destinations:
              </Typography>
              {destinations?.map((destination) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <DiamondIcon sx={{ fontSize: "15px", mr: 1 }} />
                  {destination?.destination}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Primary Source:
              </Typography>
              {primarySources?.map((prim) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <DiamondIcon sx={{ fontSize: "15px", mr: 1 }} />
                  {prim?.destination}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Last Sources:
              </Typography>
              {lastSources?.map((last) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <DiamondIcon sx={{ fontSize: "15px", mr: 1 }} />
                  {last?.destination}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Actions:
              </Typography>
              {actions?.action?.map((action) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <CircleIcon sx={{ fontSize: "10px", mr: 1 }} />
                  {action}
                </Box>
              ))}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                  mt: 2,
                }}
              >
                Prepare:
              </Typography>
              {actions?.prepare?.map((req) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <CircleIcon sx={{ fontSize: "10px", mr: 1 }} />
                  {req}
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Signatories:
              </Typography>
              {signatories?.map((signatory) => (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "nowrap",
                    ml: 2,
                  }}
                >
                  <DiamondIcon sx={{ fontSize: "15px", mr: 1 }} />
                  {signatory?.destination}
                </Box>
              ))}
            </Box>
          </Box>

          {routedBy && (
            <Box
              sx={{
                display: "block",
                background: "#ebebeb",
                border: "solid 1px #b6b6b6",
                borderRadius: "4px",
                width: "100%",
                mt: 4,
                p: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: "bold",
                    color: "gray",
                  }}
                >
                  Routed By:
                </Typography>
                {routedBy?.map((router) => (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      ml: 2,
                    }}
                  >
                    <DiamondIcon sx={{ fontSize: "15px", mr: 1 }} />
                    {router?.destination}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              display: "block",
              background: "#ebebeb",
              border: "solid 1px #b6b6b6",
              borderRadius: "4px",
              width: "100%",
              mt: 4,
              p: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: "bold",
                color: "gray",
              }}
            >
              Annotations:
            </Typography>
            {annotations?.map((e) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "nowrap",
                  px: 2,
                }}
              >
                <ArrowForwardIosIcon sx={{ fontSize: "15px" }} />
                <Box sx={{ p: 2 }}>
                  <Typography>{e?.annotation}</Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "gray",
                        mr: 1,
                      }}
                    >
                      Annotated By:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "gray",
                      }}
                    >
                      {e?.annotatedBy}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "gray",
                        mr: 1,
                      }}
                    >
                      Date of Annotation:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "gray",
                      }}
                    >
                      {` ${dayjs(e?.createdAt).format("MM/DD/YYYY - hh:mm A")}`}
                    </Typography>
                  </Box>
                  {e.dateUpdated && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "gray",
                          mr: 1,
                        }}
                      >
                        Date Updated:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "gray",
                        }}
                      >
                        {` ${dayjs(e?.dateUpdated).format(
                          "MM/DD/YYYY - hh:mm A"
                        )}`}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
