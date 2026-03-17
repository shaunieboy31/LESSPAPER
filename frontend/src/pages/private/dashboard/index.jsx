/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import React, { useEffect, useState } from 'react';
import { useStateContext } from 'contexts/ContextProvider';
import { Box, Button, Divider, IconButton, Tooltip, Typography } from '@mui/material';

// import AddIcon from "@mui/icons-material/Add";
import { TiDocumentAdd } from 'react-icons/ti';

// Incoming, On-Hold
import { HiMiniDocumentArrowDown } from 'react-icons/hi2';
import { FaHand } from 'react-icons/fa6';
// Outgoing, Lapsed, DocTypes, Go back
import { IoDocumentTextSharp } from 'react-icons/io5';
import { IoIosSend, IoIosWarning, IoMdArrowRoundBack } from 'react-icons/io';
// Pending
import { MdOutlinePendingActions } from 'react-icons/md';
// Saved
import { FaSave } from 'react-icons/fa';
// Uploaded, All Documents
import { IoDocuments } from 'react-icons/io5';
// Office
import { ImOffice } from 'react-icons/im';
// Users, Signed
import { FaFileSignature } from 'react-icons/fa6';
import { HiUsers } from 'react-icons/hi2';
// Release
import { GiConfirmed } from 'react-icons/gi';
// For Route
import { MdAltRoute } from 'react-icons/md';
// Routed Out & Routed In (flipped icons)
import { TiArrowShuffle } from 'react-icons/ti';
// For Signature
import { AiFillSignature } from 'react-icons/ai';
// Units
import { PiOfficeChairFill } from 'react-icons/pi';
// Completed
import { FaCheckDouble } from 'react-icons/fa';
// All Ongoing
import { FaHourglassEnd } from 'react-icons/fa';
// All Lapsed
import { FaCalendarTimes } from 'react-icons/fa';
// All Routed
import { FaSquareArrowUpRight } from 'react-icons/fa6';
// import { LuConstruction } from 'react-icons/lu';

import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FileCopyIcon from '@mui/icons-material/FileCopy';

import PersonIcon from '@mui/icons-material/Person';

import useAxiosPrivate from 'contexts/interceptors/axios';
import AddDocumentModal from 'modals/documents/AddDocumentModal';
import ResponsiveCards from 'components/ResponsiveCards';
import socket from 'contexts/socket';
import { enqueueSnackbar } from 'notistack';
import { base64ToArrayBuffer } from 'lib/helpers';
// import FaceRecognitionModal from 'modals/face-recognition/FaceRecognitionModal';
import LoggedInUsersModal from 'modals/miscellaneous/LoggedInUsersModal';
// import DashboardTable from "./DashboardTable";

export default function Dashboard() {
  // const storedFingerprintVerificationStatus = localStorage.getItem('fingerprintVerificationStatus');
  // const storedFaceVerificationStatus = localStorage.getItem('faceVerificationStatus');

  // const [fingerprintVerificationStatus, setFingerprintVerificationStatus] = useState(
  //   JSON.parse(storedFingerprintVerificationStatus) || null
  // );
  // const [faceVerificationStatus, setFaceVerificationStatus] = useState(
  //   JSON.parse(storedFaceVerificationStatus) || null
  // );

  // const [openFaceRecog, setOpenFaceRecog] = useState(false);
  const [openLoggedInUsersModal, setOpenLoggedInUsersModal] = useState(false);

  const { auth, referenceId, selectedUserType, setSelectedUserType, isCutoffLocked } =
    useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [userCount, setUserCount] = useState(0);
  const [loggedInUsers, setLoggedInUsers] = useState([]);

  const [allDocuments, setAllDocuments] = useState([]);
  const [forRelease, setForRelease] = useState([]);

  // const [SDSIncoming, setSDSIncoming] = useState([]);
  // const [SDSForSigning, setSDSForSigning] = useState([]);

  const [allCompleted, setAllCompleted] = useState([]);
  const [allOngoing, setAllOngoing] = useState([]);
  const [allLapsed, setAllLapsed] = useState([]);
  const [allRouted, setAllRouted] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [pending, setPending] = useState([]);
  const [saved, setSaved] = useState([]);
  const [lapsed, setLapsed] = useState([]);
  const [onhold, setOnhold] = useState([]);
  const [signed, setSigned] = useState([]);
  const [uploaded, setUploaded] = useState([]);

  const [forSigning, setForSigning] = useState([]);
  const [forRouting, setForRouting] = useState([]);
  const [routedIn, setRoutedIn] = useState([]);
  const [routedOut, setRoutedOut] = useState([]);

  const [docTypes, setDocTypes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openAddModal, setOpenAddModal] = useState(false);

  const [SDSAdditionalContents, setSDSAdditionalContents] = useState([]);
  const [contents, setContents] = useState([]);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  function capitalizeName(name) {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Usage in your component

  // const handleGetSDSContents = () => {
  //   setLoading(true);
  //   setError("");

  //   axiosPrivate
  //     .get(`/documents/getSpecificDocuments`, {
  //       params: {
  //         auth: {
  //           id: referenceId,
  //           type: auth?.officeId === 1 ? "unit" : "office",
  //         },
  //         category: "incoming",
  //       },
  //     })
  //     .then((res) => {
  //       let filteredIncoming = res?.data;

  //       filteredIncoming = filteredIncoming.filter(
  //         (doc) =>
  //           doc.docType.toLowerCase() === "travel order" ||
  //           doc.docType.toLowerCase() === "division memorandum"
  //       );

  //       setSDSIncoming(filteredIncoming);
  //     })
  //     .catch((err) => {
  //       setError(err?.message);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });

  //   axiosPrivate
  //     .get(`/documents/getSpecificDocuments`, {
  //       params: {
  //         auth: {
  //           id: referenceId,
  //           type: auth?.officeId === 1 ? "unit" : "office",
  //         },
  //         category: "forSigning",
  //       },
  //     })
  //     .then((res) => {
  //       let filteredForSigning = res?.data;

  //       filteredForSigning = filteredForSigning.filter(
  //         (doc) =>
  //           doc.docType.toLowerCase() === "travel order" ||
  //           doc.docType.toLowerCase() === "division memorandum"
  //       );

  //       setSDSForSigning(filteredForSigning);
  //     })
  //     .catch((err) => {
  //       setError(err?.message);
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // };

  const handleGetAllDocumentsCount = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/documents/allDocumentsCount`)
      .then(res => {
        setAllDocuments(res?.data);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGetDocumentsCount = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/documents/documentsCount`, {
        params: {
          auth: {
            id: referenceId,
            type: auth.officeId === 1 ? 'unit' : 'office'
          }
        }
      })
      .then(res => {
        const { data } = res;

        setIncoming(data?.incoming);
        setOutgoing(data?.outgoing);
        setPending(data?.pending);
        setSaved(data?.saved);
        setOnhold(data?.onHold);
        setLapsed(data?.lapsed);
        setSigned(data?.signed);
        setUploaded(data?.uploaded);

        setForRelease(data?.forRelease);

        setForSigning(data?.forSigning);
        setForRouting(data?.forRouting);
        setRoutedIn(data?.routedIn);
        setRoutedOut(data?.routedOut);

        setAllRouted(data?.allRouted);
        setAllCompleted(data?.allCompleted);
        setAllOngoing(data?.allOngoing);
        setAllLapsed(data?.allLapsed);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGetAllAdminCount = () => {
    axiosPrivate
      .get(`/documents/allAdminDetailsCount`)
      .then(res => {
        const { data } = res;

        setDocTypes(data?.docTypes);
        setOffices(data?.offices);
        setUnits(data?.units);
        setUsers(data?.users);
      })
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    if (auth?.role?.some(role => ['admin'].includes(role)) && selectedUserType === 'admin') {
      setLoading(true);
      setError('');

      Promise.all([handleGetAllAdminCount(), handleGetAllDocumentsCount()])
        .then(() => setLoading(false))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // if (
      //   auth?.role?.some((role) => ["sds"].includes(role)) &&
      //   selectedUserType === "user"
      // ) {
      //   handleGetSDSContents();
      // }
      handleGetDocumentsCount();
    }
  }, [auth, selectedUserType]);

  useEffect(() => {
    if (selectedUserType === 'user') {
      setContents([
        {
          path: '/incoming',
          value: incoming || 0,
          title: 'Incoming',
          subtitle: 'Documents received and awaiting processing',
          iconColor: '#13ad00',
          accentColor: '#8CC08D',
          // iconColor: "linear-gradient(120deg, #886c1d, #957315, #dbc231)",
          icon: (
            <HiMiniDocumentArrowDown
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/outgoing',
          value: outgoing || 0,
          title: 'Outgoing',
          subtitle: 'Documents dispatched to external recipients',
          iconColor: 'linear-gradient(120deg, #637ffd, #5c2774)',
          accentColor: '#6eb3e3',
          icon: (
            <IoIosSend
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        ...(auth?.role.some(role =>
          [
            'sds',
            'asds',
            'chief',
            'secretary',
            'unit head',
            'unit employee',
            'school personnel'
          ].includes(role)
        )
          ? [
              {
                path: '/pending',
                value: pending || 0,
                title: 'Pending',
                subtitle: 'Awaiting action or decision',
                iconColor: 'linear-gradient(120deg, #f09116, #a8650d)',
                accentColor: '#EFB263',
                icon: (
                  <MdOutlinePendingActions
                    sx={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),
        ...(auth?.role.some(role => ['secretary'].includes(role))
          ? [
              {
                path: '/release',
                value: forRelease || 0,
                title: 'For Release',
                subtitle: 'Documents ready to be released',
                iconColor: 'linear-gradient(120deg, #2959ba, #1ea2df, #171778)',
                accentColor: '#67ccab',
                icon: (
                  <GiConfirmed
                    style={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),
        ...(auth?.role.some(role =>
          [
            'asds',
            'chief',
            'secretary',
            'unit head',
            'unit employee'
            // "school personnel",
          ].includes(role)
        )
          ? [
              {
                path: '/routedIn',
                value: routedIn || 0,
                title: 'Routed In',
                subtitle: 'Documents routed to your office/unit',
                iconColor: 'linear-gradient(120deg, #534f7c, #246fc9, #53c791)',
                accentColor: '#8cc08d',
                icon: (
                  <TiArrowShuffle
                    style={{
                      fontSize: '26px',
                      transform: 'scaleX(-1)' // flips horizontally
                    }}
                  />
                )
              }
            ]
          : []),

        // Just doubled to fix the arrangement of boxes in SDS dashboard
        ...(auth?.role.some(role => ['asds', 'secretary'].includes(role))
          ? [
              {
                path: '/routedOut',
                value: routedOut || 0,
                title: 'Routed Out',
                subtitle: 'Successfully forwarded to designated recipients',
                iconColor: 'linear-gradient(120deg, #534f7c, #246fc9, #53c791)',
                accentColor: '#6eb3e3',
                // iconColor:
                //           "linear-gradient(120deg, #78e8ce, #7061c6, #ff65ba, #ffb359)",
                icon: (
                  <TiArrowShuffle
                    style={{
                      // color: "lightgray",
                      fontSize: '26px'
                    }}
                  />
                )
              }
            ]
          : []),

        ...(auth?.role.some(role => ['sds', 'asds'].includes(role))
          ? [
              {
                path: '/routing',
                value: forRouting || 0,
                title: 'For Routing',
                subtitle: 'Ready to be forwarded to next handler',
                // iconColor: "linear-gradient(120deg, #f09116, #a8650d)",
                iconColor: 'linear-gradient(120deg, #c77d51, #b0451b, #53c791)',
                accentColor: '#ebcb61',
                icon: (
                  <MdAltRoute
                    sx={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),

        ...(auth?.role.some(role => ['sds', 'asds', 'unit head', 'chief'].includes(role))
          ? [
              {
                path: '/signature',
                value: forSigning || 0,
                title: 'For Signature',
                subtitle: 'Awaiting approval or authorization',
                iconColor: 'linear-gradient(120deg, #f09116, #a8650d, #53c791)',
                accentColor: '#DCE066',
                icon: (
                  <AiFillSignature
                    style={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),

        // Just doubled to fix the arrangement of boxes in SDS dashboard
        ...(auth?.role.some(role => ['sds'].includes(role))
          ? [
              {
                path: '/routedOut',
                value: routedOut || 0,
                title: 'Routed Out',
                subtitle: 'Successfully forwarded to designated recipients',
                iconColor: 'linear-gradient(120deg, #534f7c, #246fc9, #53c791)',
                accentColor: '#7b79f6',
                // iconColor:
                //           "linear-gradient(120deg, #78e8ce, #7061c6, #ff65ba, #ffb359)",
                icon: (
                  <TiArrowShuffle
                    style={{
                      // color: "lightgray",
                      fontSize: '26px'
                    }}
                  />
                )
              }
            ]
          : []),
        {
          path: '/signed',
          value: signed || 0,
          title: 'Signed',
          subtitle: 'Completed with official signature',
          iconColor: 'linear-gradient(120deg, #27bf13, #207a14)',
          accentColor: '#e97ed1',
          icon: (
            <FaFileSignature
              style={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },

        ...(auth?.role.some(role =>
          [
            'sds',
            'asds',
            'secretary',
            'chief',
            'unit head',
            'unit employee',
            'school personnel'
          ].includes(role)
        )
          ? [
              {
                path: '/saved',
                value: saved || 0,
                title: 'Saved',
                subtitle: 'Documents completed and stored for future reference',
                iconColor: 'linear-gradient(120deg, #00a8f3, #095b80)',
                accentColor: '#B2E066',
                icon: (
                  <FaSave
                    sx={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),
        ...(auth?.role.some(role => ['sds'].includes(role))
          ? [
              {
                path: '/lapsed',
                value: lapsed || 0,
                title: 'Lapsed',
                subtitle: 'Missed deadline or expired',
                iconColor: 'linear-gradient(120deg, #cf1515, #9319a6)',
                accentColor: '#E06666',
                icon: (
                  <IoIosWarning
                    sx={{
                      // // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              },
              {
                path: '/onhold',
                value: onhold || 0,
                title: 'On-Hold',
                subtitle: 'Paused due to pending conditions',
                iconColor: 'linear-gradient(120deg, #e5bf02, #cda814)',
                accentColor: '#e5bf02',
                icon: (
                  <FaHand
                    sx={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : []),

        ...(auth?.role.some(role =>
          ['chief', 'secretary', 'unit head', 'unit employee', 'school personnel'].includes(role)
        )
          ? [
              {
                path: '/lapsed',
                value: lapsed || 0,
                title: 'Lapsed',
                subtitle: 'Missed deadline or expired',
                iconColor: 'linear-gradient(120deg, #cf1515, #9319a6)',
                accentColor: '#E06666',
                icon: (
                  <IoIosWarning
                    sx={{
                      // // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              },
              {
                path: '/onhold',
                value: onhold || 0,
                title: 'On-Hold',
                subtitle: 'Paused due to pending conditions',
                iconColor: 'linear-gradient(120deg, #e5bf02, #cda814)',
                accentColor: '#e5bf02',
                icon: (
                  <FaHand
                    sx={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              },
              {
                path: '/uploaded',
                value: uploaded || 0,
                title: 'Uploaded',
                subtitle: 'Documents added to the system',
                iconColor: 'linear-gradient(120deg, #ff7979, #936b4d)',
                accentColor: '#7270e5',
                icon: (
                  <IoDocuments
                    style={{
                      // color: "lightgray",
                      fontSize: '30px'
                    }}
                  />
                )
              }
            ]
          : [])
      ]);

      // if (auth?.role?.some((role) => ["sds"].includes(role))) {
      //   setSDSAdditionalContents([
      //     {
      //       path: "/incoming-to-memo",
      //       value: SDSIncoming.length || 0,
      //       title: "Incoming",
      //       iconColor: "#13ad00",
      //       // iconColor: "linear-gradient(120deg, #886c1d, #957315, #dbc231)",
      //       icon: (
      //         <FaInbox
      //           sx={{
      //             // color: "lightgray",
      //             fontSize: "30px",
      //           }}
      //         />
      //       ),
      //     },
      //     {
      //       path: "/signature-to-memo",
      //       value: SDSForSigning.length || 0,
      //       title: "For Signature",
      //       iconColor: "linear-gradient(120deg, #f09116, #a8650d, #53c791)",
      //       icon: (
      //         <AiFillSignature
      //           style={{
      //             // color: "lightgray",
      //             fontSize: "30px",
      //           }}
      //         />
      //       ),
      //     },
      //   ]);
      // }
    }

    // SDS Dashboard Boxes Additional Contents
    if (selectedUserType === 'user' && auth?.role?.some(role => ['sds'].includes(role))) {
      setSDSAdditionalContents([
        {
          path: '/routed',
          value: allRouted || 0,
          title: 'Routed',
          subtitle: 'All Routed Documents',
          iconColor: 'linear-gradient(120deg, #534f7c, #246fc9, #53c791)',
          accentColor: '#3669b9',
          icon: (
            <FaSquareArrowUpRight
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/completed',
          value: allCompleted || 0,
          title: 'Completed',
          subtitle: 'All Completed Documents',
          iconColor: 'linear-gradient(120deg, #27bf13, #207a14)',
          accentColor: '#6eab0c',
          icon: (
            <FaCheckDouble
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/ongoing',
          value: allOngoing || 0,
          title: 'Ongoing',
          subtitle: 'All Ongoing Documents',
          iconColor: 'linear-gradient(120deg, #f09116, #a8650d)',
          accentColor: '#cc8427',
          icon: (
            <FaHourglassEnd
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/overdue',
          value: allLapsed || 0,
          title: 'Overdue',
          subtitle: 'All Lapsed Documents',
          iconColor: 'linear-gradient(120deg, #cf1515, #9319a6)',
          accentColor: '#b54141',
          icon: (
            <FaCalendarTimes
              style={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        }
      ]);
    }

    if (selectedUserType === 'admin' && auth?.role?.some(role => ['admin'].includes(role))) {
      setContents([
        {
          path: '/doc-types',
          value: docTypes || 0,
          title: 'Document Types',
          subtitle: 'Library of all document types in the system',
          iconColor: 'linear-gradient(120deg, #f54848, #621f1f)',
          accentColor: '#7b79f6',
          icon: (
            <IoDocumentTextSharp
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/offices',
          value: offices || 0,
          title: 'Offices',
          subtitle: 'Libary of all offices in the system',
          iconColor: 'linear-gradient(120deg, #27bf13, #207a14)',
          accentColor: '#e86dcd',
          icon: (
            <ImOffice
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/units',
          value: units || 0,
          title: 'Units',
          subtitle: 'Library of all units in the system',
          iconColor: 'linear-gradient(120deg, #f09116, #a8650d)',
          accentColor: '#e5bf02',
          icon: (
            <PiOfficeChairFill
              style={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/users',
          value: users || 0,
          title: 'Users',
          subtitle: 'Manage system users and their roles',
          iconColor: 'linear-gradient(120deg, #00a8f3, #095b80)',
          accentColor: '#6eb3e3',
          icon: (
            <HiUsers
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        },
        {
          path: '/all-documents',
          value: allDocuments || 0,
          title: 'All Documents',
          subtitle: 'Comprehensive list of all documents in the system',
          iconColor: 'linear-gradient(120deg, #65d749, #ff4b4b)',
          accentColor: '#8cc08d',
          icon: (
            <IoDocuments
              sx={{
                // color: "lightgray",
                fontSize: '30px'
              }}
            />
          )
        }
      ]);
    }
  }, [
    allDocuments,
    selectedUserType,
    forRelease,
    incoming,
    outgoing,
    pending,
    saved,
    lapsed,
    onhold,
    signed,
    uploaded,
    forSigning,
    forRouting,
    signed,
    routedIn,
    routedOut,
    docTypes,
    offices,
    units,
    users
  ]);

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
              type: 'public-key'
              // transports: ["internal"], // This tells the browser to use internal (PC) auth only
            }
          ],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (assertion) {
        // Store user data in localStorage (in a real app, you'd use a more secure method)
        localStorage.setItem(
          'fingerprintVerificationStatus',
          JSON.stringify({ fingerprintVerified: true })
        );

        setFingerprintVerificationStatus({ fingerprintVerified: true });

        enqueueSnackbar('Fingerprint Verified!', {
          variant: 'success'
        });
      }
    } catch (err) {
      console.log(err);

      enqueueSnackbar('Fingerprint verification cancelled', {
        variant: 'default'
      });
    } finally {
      isAuthenticating = false;
    }
  };

  // useEffect(() => {
  //   if (
  //     auth?.role?.includes('admin') &&
  //     !fingerprintVerificationStatus &&
  //     auth?.enableFingerprint
  //   ) {
  //     handleVerifyFingerprint();
  //   }
  //   if (auth?.role?.includes('admin') && !faceVerificationStatus && auth?.enableFaceRecog) {
  //     setOpenFaceRecog(true);
  //   }
  // }, [auth]);

  // useEffect(() => {
  //   if (forSigning - SDSForSigning.length === forSigning) {
  //     setForSigning(forSigning - SDSForSigning.length);
  //   }
  // }, [forSigning]);

  useEffect(() => {
    if (!auth?.role?.includes('admin')) {
      // if (auth?.role?.some((role) => ["sds", "asds"].includes(role))) {
      //   setSelectedUserType("receiver");
      // } else {
      //   setSelectedUserType("sender");
      // }
      setSelectedUserType('user');
    }
  }, []);

  useEffect(() => {
    if (auth) {
      // Listen for document notifications
      socket.on('documentNotif', data => {
        if (data?.recipient === (auth?.officeId === 1 ? auth?.unitName : auth?.officeName)) {
          handleGetAllDocumentsCount();
          handleGetDocumentsCount();
        }
      });

      if (auth?.role.some(role => ['admin'].includes(role))) {
        // Request and listen for all room data
        socket.emit('allRoomData'); // Request room data from the server
        socket.on('allRoomData', roomData => {
          setLoggedInUsers(roomData);

          let userCounter = 0;

          roomData.forEach(data => {
            userCounter += data.userCount;
          });

          setUserCount(userCounter);
        });
      }
    }

    // Cleanup listeners on unmount or auth change
    return () => {
      socket.off('documentNotif');
      socket.off('allRoomData');
    };
  }, [auth, socket]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        px: 4,
        py: 2
      }}
    >
      {/* <Divider
        sx={{
          backgroundColor: 'white',
          width: '100%',
          py: 0.1,
          mb: 2
        }}
      /> */}
      {/* <FaceRecognitionModal
        open={openFaceRecog}
        handleClose={() => setOpenFaceRecog(false)}
        setFaceVerificationStatus={setFaceVerificationStatus}
      /> */}
      <AddDocumentModal
        open={openAddModal}
        handleClose={() => setOpenAddModal(false)}
        loadingState={loading}
        updateTableFunction={() => {
          handleGetAllDocumentsCount();
          handleGetDocumentsCount();
        }}
      />
      {error && (
        <Box sx={{ backgroundColor: 'red', width: '100%', mt: 2, px: 1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'top',
          flexWrap: 'wrap',
          width: '100%',
          mb: 2,
          gap: 2
        }}
      >
        <Box>
          <Typography sx={{ textAlign: 'left', fontSize: '30px', fontWeight: 'bold' }}>
            {`${getGreeting()} ${capitalizeName(auth?.firstName)}`}
          </Typography>

          <Typography
            sx={{
              color: 'gray',
              textAlign: 'left',
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            Stay on top of your tasks, monitor progress, and track status.
          </Typography>
          {/* <Typography
            sx={{
              textAlign: 'left',
              fontSize: '15px',
              fontWeight: 'bold'
            }}
          >
            {`${auth?.officeName}`}
          </Typography> */}
        </Box>

        <Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
            {auth?.role?.some(role => ['admin'].includes(role)) &&
              contents &&
              contents.length > 0 && (
                <Tooltip title="Go Back" placement="top">
                  <IconButton
                    sx={{
                      // backgroundColor: "#cccccc",
                      background: '#09504a',
                      cursor: 'pointer',
                      transition: 'all .5s',
                      color: '#ffffff',
                      p: 1,
                      '&:hover': {
                        boxShadow: '3px 3px 10px 5px rgba(0, 0, 0, 0.3)',
                        backgroundColor: '#a2cb6b',
                        color: '#1f1f1f'
                      }
                    }}
                    onClick={() => {
                      setContents([]);
                      setSelectedUserType('');
                    }}
                  >
                    <IoMdArrowRoundBack sx={{ fontSize: '25px' }} />
                  </IconButton>
                </Tooltip>
              )}
            {(!auth?.role?.some(role => ['admin'].includes(role)) ||
              selectedUserType !== 'admin') && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Button
                  disabled={loading || isCutoffLocked}
                  onClick={() => setOpenAddModal(true)}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: loading ? 'lightgray' : '#09504a',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    padding: '8px 20px',
                    borderRadius: '10px',
                    '&:hover': {
                      backgroundColor: '#a2cb6b',
                      color: '#1f1f1f',
                      fontWeight: 'bold'
                    }
                  }}
                >
                  <TiDocumentAdd style={{ fontSize: '23px', marginRight: 5, marginTop: -2 }} />
                  Add Document
                </Button>
              </Box>
            )}
          </Box>

          {auth?.role.some(role => ['admin'].includes(role)) && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'end'
              }}
            >
              <Box
                onClick={() => setOpenLoggedInUsersModal(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'end',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'relative'
                  }}
                >
                  <PersonIcon sx={{ fontSize: '30px' }} />
                  <Box
                    sx={{
                      height: '12px',
                      width: '12px',
                      background: '#0da939',
                      border: 'solid 1px #fff',
                      position: 'absolute',
                      borderRadius: '50%',
                      bottom: 8,
                      right: 0
                    }}
                  />
                </Box>
                {userCount}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {auth?.role?.some(role => ['admin'].includes(role)) && contents.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            my: '2vw'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '4vw'
            }}
          >
            <Box
              onClick={() => {
                setSelectedUserType('admin');
              }}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // backgroundColor: "#cccccc",
                background: '#09504a',
                boxShadow: '5px 5px 5px rgba(0, 0, 0, 0.3)',
                borderRadius: '20px',
                width: '18vw',
                minWidth: '290px',
                cursor: 'pointer',
                transition: 'all .5s',
                color: '#ffffff',
                p: 2,
                '&:hover': {
                  boxShadow: '3px 3px 10px 5px rgba(0, 0, 0, 0.3)',
                  backgroundColor: '#a2cb6b',
                  color: 'black'
                },
                '@media (max-width: 1550px)': {
                  // width: "18vw",
                  minWidth: '230px'
                  // maxWidth: "350px",
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <AdminPanelSettingsIcon
                  sx={{
                    fontSize: '50px',
                    mr: 2
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  Admin Management
                </Typography>
              </Box>
            </Box>

            {auth?.role.length > 1 && (
              <Box
                onClick={() => {
                  setSelectedUserType('user');
                }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // backgroundColor: "#cccccc",
                  background: '#09504a',
                  boxShadow: '5px 5px 5px rgba(0, 0, 0, 0.3)',
                  borderRadius: '20px',
                  width: '18vw',
                  minWidth: '290px',
                  cursor: 'pointer',
                  transition: 'all .5s',
                  p: 2,
                  color: '#ffffff',
                  '&:hover': {
                    boxShadow: '3px 3px 10px 5px rgba(0, 0, 0, 0.3)',
                    backgroundColor: '#a2cb6b',
                    color: 'black'
                  },
                  '@media (max-width: 1550px)': {
                    // width: "18vw",
                    minWidth: '230px'
                    // maxWidth: "350px",
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <FileCopyIcon
                    sx={{
                      fontSize: '50px',
                      mr: 2
                    }}
                  />
                  <Typography sx={{ fontSize: '18px', fontWeight: 'bold' }}>
                    Document Management
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
      {contents && contents.length > 0 && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <ResponsiveCards contents={contents} loadingState={loading} />
        </Box>
      )}

      {SDSAdditionalContents &&
        SDSAdditionalContents.length > 0 &&
        auth?.role.some(role => ['sds'].includes(role)) && (
          <Box
            sx={{
              // display: 'none',
              width: '100%',
              mb: 1
            }}
          >
            <Divider
              sx={{
                // display: 'none',
                backgroundColor: 'white',
                width: '100%',
                py: 0.1,
                mb: 2
              }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '18px',
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: '#374151'
                    }}
                  >
                    Summary of Documents for SDS
                  </Typography>

                  {/* Under Construction Indicator */}
                  {/* <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.25,
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '9999px',
                      backgroundColor: '#fef3c7', // amber-100
                      color: '#92400e', // amber-800
                      border: '1px solid #fde68a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <LuConstruction size={14} />
                    THIS SECTION IS UNDER CONSTRUCTION
                    <LuConstruction size={14} />
                  </Box> */}
                </Box>
              </Box>
            </Box>

            <ResponsiveCards contents={SDSAdditionalContents} loadingState={loading} />
          </Box>
        )}

      {/* Logged In Users Modal */}
      <LoggedInUsersModal
        open={openLoggedInUsersModal}
        onClose={() => setOpenLoggedInUsersModal(false)}
        loggedInUsers={loggedInUsers}
      />
    </Box>
  );
}
