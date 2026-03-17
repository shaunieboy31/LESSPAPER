import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function NotificationMenu() {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleGetAll = () => {
    setLoading(true);
    setError('');
    axiosPrivate
      .get(`/documents/recentDocuments`, {
        params: {
          destinations: {
            id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
            type: auth?.officeId === 1 ? 'unit' : 'office'
          }
        }
      })
      .then(res => {
        setRecentDocuments(res?.data || []);
      })
      .catch(err => {
        setError(err?.message || 'Failed to fetch notifications.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (anchorEl) {
      handleGetAll();
    }
  }, [anchorEl, auth]);

  // Generate a unique key for skeletons
  const skeletonKeys = React.useMemo(
    () => Array.from({ length: 3 }, () => Math.random().toString(36).slice(2)),
    []
  );

  let menuContent;
  if (error) {
    menuContent = (
      <MenuItem disabled>
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      </MenuItem>
    );
  } else if (loading) {
    menuContent = skeletonKeys.map(key => (
      <MenuItem key={key}>
        <Skeleton variant="text" width={400} height={24} />
      </MenuItem>
    ));
  } else if (recentDocuments.length > 0) {
    const docsToShow = showAll ? recentDocuments : recentDocuments.slice(0, 3);
    menuContent = [
      ...docsToShow
        .map((doc, idx) => [
          <MenuItem
            key={doc?.id || doc?.remarks || idx}
            sx={{
              display: 'block',
              whiteSpace: 'normal',
              alignItems: 'flex-start',
              wordBreak: 'break-word',
              py: 1.5,
              px: 2,
              minWidth: 0
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5
              }}
            >
              <Typography
                variant="caption"
                color="text.primary"
                sx={{ wordBreak: 'break-all', fontWeight: 500 }}
              >
                {doc?.docuId || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                &middot;
              </Typography>
              <Typography
                variant="caption"
                color="text.primary"
                sx={{ wordBreak: 'break-all', fontWeight: 500 }}
              >
                {doc?.lpsNo || 'N/A'}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
                display: 'block',
                mt: 0.5,
                fontSize: '12px',
                overflow: 'auto'
              }}
            >
              {doc?.remarks || 'No remarks'}
            </Typography>
            <Box sx={{ textAlign: 'end' }}>
              <Typography
                variant="caption"
                color="text.primary"
                sx={{ wordBreak: 'break-all', fontWeight: 500 }}
              >
                {doc.lastUpdateDateTime
                  ? dayjs(doc.lastUpdateDateTime).format('MM/DD/YYYY hh:mm A')
                  : '--'}
              </Typography>
            </Box>
          </MenuItem>,
          idx < docsToShow.length - 1 && <Divider key={doc?.id || doc?.remarks || idx} />
        ])
        .flat()
    ];
    if (recentDocuments.length > 3) {
      menuContent.push(
        <Divider key="showall-divider" />,
        <Box key="showall-btn" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={() => setShowAll(prev => !prev)}
            sx={{ textTransform: 'none' }}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        </Box>
      );
    }
  } else {
    menuContent = (
      <MenuItem disabled>
        <Typography variant="body2" color="text.secondary">
          No new notifications
        </Typography>
      </MenuItem>
    );
  }

  return (
    <Box>
      <IconButton
        aria-label="Show notifications"
        onClick={evt => setAnchorEl(evt.currentTarget)}
        sx={{ color: '#1f1f1f', mr: -1 }}
      >
        <NotificationsIcon sx={{ fontSize: '30px' }} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setShowAll(false);
        }}
        PaperProps={{
          sx: { width: '95vw', maxWidth: 300, borderRadius: '15px' }
        }}
      >
        {menuContent}
      </Menu>
    </Box>
  );
}
