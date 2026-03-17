// import DashboardIcon from "@mui/icons-material/Dashboard";
// import { MdDashboard } from "react-icons/md";
// import { TbPencilCheck } from "react-icons/tb";

// Incoming,
import { HiMiniDocumentArrowDown } from 'react-icons/hi2';
// On-Hold
import { FaHand } from 'react-icons/fa6';
// Outgoing, Lapsed, DocTypes
import { IoIosSend, IoIosWarning } from 'react-icons/io';
// Dashboard, Pending, Feedback
import { MdDashboardCustomize } from 'react-icons/md';
import { MdFeedback, MdOutlineRateReview, MdOutlinePendingActions } from 'react-icons/md';
// Saved
import { FaSave } from 'react-icons/fa';
// Uploaded, All Documents
import { IoDocuments, IoDocumentTextSharp } from 'react-icons/io5';
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

const links = [
  {
    title: 'Home',
    role: 'superadmin',
    links: [
      {
        name: 'Dashboard',
        path: 'dashboard',
        access: [
          'admin',
          'sds',
          'asds',
          'chief',
          'secretary',
          'unit head',
          'unit employee',
          'school personnel'
        ],
        icon: <MdDashboardCustomize style={{ fontSize: '23px', transform: 'scaleY(-1)' }} />
      }
    ]
  },

  {
    title: 'Documents',
    role: 'transmittingUsers',
    links: [
      {
        name: 'Incoming',
        path: 'incoming',
        access: [
          'sds',
          'asds',
          'chief',
          'secretary',
          'unit head',
          'unit employee',
          'school personnel'
        ],
        icon: <HiMiniDocumentArrowDown style={{ fontSize: '23px' }} />
      },
      {
        name: 'Outgoing',
        path: 'outgoing',
        access: [
          'sds',
          'asds',
          'chief',
          'secretary',
          'unit head',
          'unit employee',
          'school personnel'
        ],
        icon: <IoIosSend style={{ fontSize: '23px' }} />
      },
      {
        name: 'Pending',
        path: 'pending',
        access: ['asds', 'chief', 'secretary', 'unit head', 'unit employee', 'school personnel'],
        icon: <MdOutlinePendingActions style={{ fontSize: '23px' }} />
      },
      {
        name: 'For Release',
        path: 'release',
        access: ['secretary'],
        icon: <GiConfirmed style={{ fontSize: '23px' }} />
      },
      {
        name: 'Routed In',
        path: 'routedIn',
        access: [
          'asds',
          'chief',
          'secretary',
          'unit head',
          'unit employee'
          // "school personnel",
        ],
        icon: <TiArrowShuffle style={{ fontSize: '23px', transform: 'scaleX(-1)' }} />
      },
      {
        name: 'Routed Out',
        path: 'routedOut',
        access: ['asds', 'secretary'],
        icon: <TiArrowShuffle style={{ fontSize: '23px' }} />
      },
      {
        name: 'For Routing',
        path: 'routing',
        access: ['sds', 'asds'],
        icon: <MdAltRoute style={{ fontSize: '23px' }} />
      },
      {
        name: 'For Signature',
        path: 'signature',
        access: ['sds', 'asds', 'chief', 'unit head'],
        icon: <AiFillSignature style={{ fontSize: '23px' }} />
      },

      {
        name: 'Routed Out',
        path: 'routedOut',
        access: ['sds'],
        icon: <TiArrowShuffle style={{ fontSize: '23px' }} />
      },
      {
        name: 'Signed',
        path: 'signed',
        access: [
          'sds',
          'asds',
          'chief',
          'secretary',
          'unit head',
          'unit employee',
          'school personnel'
        ],
        icon: <FaFileSignature style={{ fontSize: '23px' }} />
      },
      {
        name: 'Saved',
        path: 'saved',
        access: ['asds', 'chief', 'secretary', 'unit head', 'unit employee', 'school personnel'],
        icon: <FaSave style={{ fontSize: '23px' }} />
      },
      {
        name: 'Lapsed',
        path: 'lapsed',
        access: ['chief', 'secretary', 'unit head', 'unit employee', 'school personnel'],
        icon: <IoIosWarning style={{ fontSize: '23px' }} />
      },
      {
        name: 'On-Hold',
        path: 'onhold',
        access: ['chief', 'secretary', 'unit head', 'unit employee', 'school personnel'],
        icon: <FaHand style={{ fontSize: '23px' }} />
      },
      {
        name: 'Uploaded',
        path: 'uploaded',
        access: ['chief', 'secretary', 'unit head', 'unit employee', 'school personnel'],
        icon: <IoDocuments style={{ fontSize: '23px' }} />
      }

      // {
      //   name: "Incoming (TO, Memo)",
      //   path: "incoming-to-memo",
      //   access: ["sds"],
      //   icon: <FaInbox style={{ fontSize: "23px" }} />,
      // },
      // {
      //   name: "For Signature (TO, Memo)",
      //   path: "signature-to-memo",
      //   access: ["sds"],
      //   icon: <AiFillSignature style={{ fontSize: "23px" }} />,
      // },
    ]
  },

  {
    title: 'Libraries',
    role: 'admin',
    links: [
      {
        name: 'Document Types',
        path: 'doc-types',
        access: ['admin'],
        icon: <IoDocumentTextSharp style={{ fontSize: '23px' }} />
      },
      {
        name: 'Offices',
        path: 'offices',
        access: ['admin'],
        icon: <ImOffice style={{ fontSize: '23px' }} />
      },
      {
        name: 'Units',
        path: 'units',
        access: ['admin'],
        icon: <PiOfficeChairFill style={{ fontSize: '23px' }} />
      },
      {
        name: 'Users',
        path: 'users',
        access: ['admin'],
        icon: <HiUsers style={{ fontSize: '23px' }} />
      },
      {
        name: 'All Documents',
        path: 'all-documents',
        access: ['admin'],
        icon: <IoDocuments style={{ fontSize: '23px' }} />
      }
    ]
  },

  {
    title: 'Feedback',
    role: 'imus-admin',
    links: [
      {
        name: 'System Feedbacks',
        path: 'feedbacks',
        access: ['admin'],
        icon: <MdFeedback style={{ fontSize: '23px' }} />
      },
      {
        name: 'Feedback Criterias',
        path: 'criterias',
        access: ['admin'],
        icon: <MdOutlineRateReview style={{ fontSize: '23px' }} />
      },
      {
        name: 'Divisions',
        path: 'divisions',
        access: ['admin'],
        icon: <ImOffice style={{ fontSize: '23px' }} />
      },
      {
        name: 'Systems',
        path: 'systems',
        access: ['admin'],
        icon: <MdFeedback style={{ fontSize: '23px' }} />
      }
    ]
  }
];

export default links;
