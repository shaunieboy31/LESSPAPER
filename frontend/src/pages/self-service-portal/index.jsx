/* eslint-disable no-else-return */
import React, { useState } from 'react';

import useAxiosPrivate from 'contexts/interceptors/axios';

import { Box, Button, Typography } from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ViewDetailsModal from 'modals/documents/ViewDetailsModal';
import ViewDocumentModal from 'modals/documents/ViewDocumentModal';
import SelfServiceTable from './SelfServiceTable';
import SearchPage from './SearchPage';

export default function SelfServicePortal({ onBackToLogin }) {
  const axiosPrivate = useAxiosPrivate();

  const [data, setData] = useState([]);
  const [rowData, setRowData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [openFilter, setOpenFilter] = useState(true);
  const [openViewDocModal, setOpenViewDocModal] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [filters, setFilters] = useState({
    lpsNo: ''
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleFilterDocLogs = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/documents/filterDocLogs`, {
        params: filters
      })
      .then(res => {
        setOpenFilter(false);
        setOpenDetails(false);
        setOpenViewDocModal(false);
        setData(res.data);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <ViewDetailsModal
        open={openDetails}
        handleClose={() => setOpenDetails(false)}
        dataFromActions={rowData || null}
      />
      <ViewDocumentModal
        open={openViewDocModal}
        handleClose={() => {
          setRowData(null);
          setOpenViewDocModal(false);
        }}
        loadingState={loading}
        dataFromActions={rowData || null}
      />

      {openFilter ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 4
          }}
        >
          <SearchPage
            filters={filters}
            loading={loading}
            handleInputChange={handleInputChange}
            handleFilterDocLogs={handleFilterDocLogs}
            onBackToLogin={onBackToLogin}
          />
        </Box>
      ) : (
        <Box sx={{ maxWidth: '1800px', mx: 'auto', width: '100%' }}>
          {/* Header Section */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileCopyIcon sx={{ color: '#fff', fontSize: '32px' }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}
              >
                SELF-SERVICE PORTAL
              </Typography>
            </Box>

            {/* Search Bar in Header */}
            <Box
              sx={{
                bgcolor: '#fff',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 0.5
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                LPS No:
              </Typography>
              <Typography variant="caption" sx={{ ml: 1, color: '#666', fontWeight: 600 }}>
                {filters.lpsNo}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => setOpenFilter(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  color: '#09504a',
                }
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Error Message */}
          {error && (
            <Box
              sx={{
                bgcolor: '#ffebee',
                color: '#c62828',
                p: 2,
                borderRadius: 2,
                mb: 2,
                border: '1px solid #ef9a9a',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography fontWeight="500">{error}</Typography>
            </Box>
          )}

          {/* Table Section */}
          <Box
            sx={{
              bgcolor: 'white',
              px: 2,
              borderRadius: 4, // Sharper corners as per image
              overflow: 'hidden',
              minHeight: '60vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            {/* Toolbar mimics the one in image 2 */}
            <Box sx={{ p: 0, display: 'flex', gap: 1 }}>
              {/* Placeholders for toolbar items if needed, or just let Table handle it if it has one */}
            </Box>

            <SelfServiceTable
              data={data}
              setRowData={setRowData}
              setOpenViewDocModal={setOpenViewDocModal}
              setOpenDetails={setOpenDetails}
              loadingState={loading}
              setLoadingState={setLoading}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
