/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
import { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function PageTemplate({
  icon,
  header,
  modals,
  error,
  filters,
  leftButtons,
  rightButtons,
  table,
  hasActiveFilters = () => {},
  setSelectedDocType = () => {},
  setSpecificDocType = () => {},
  setSelectedOffice = () => {},
  setSelectedClassification = () => {}
}) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(() => { 
    // Load initial value from localStorage (default true if not set) 
    const saved = localStorage.getItem('isFiltersVisible'); 
    return saved !== null ? JSON.parse(saved) : true; 
  }); 
  
  // Whenever isFiltersVisible changes, save it 
  useEffect(() => {
    localStorage.setItem('isFiltersVisible', JSON.stringify(isFiltersVisible)); 
  }, [isFiltersVisible]);

  return (
    <Box
      sx={{
        overflowX: 'auto',
        px: 4,
        py: 2,
        height: 'auto',
        width: '100%'
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
      {modals}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {icon}
          <Typography
            sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: '25px'
            }}
          >
            {header}
          </Typography>
        </Box>
      </Box>

      {filters && filters.length !== 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            overflow: 'auto',
            backgroundColor: '#09504a',
            borderRadius: 4,
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            width: '100%',
            mt: -1,
            p: 1,
            pt: 0,
            pb: isFiltersVisible ? 1 : 0,
            mb: 3
          }}
        >
          {/* ============= Filter Header Container ============= */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* ============= Hide/Show Filters ============= */}
            <Button
              onClick={() => {
                setIsFiltersVisible(prev => !prev);
              }}
              sx={{
                borderRadius: '999px',
                height: 40,
                textTransform: 'none',
                fontWeight: 600,
                color: '#fff',
                minWidth: 0 // prevents default min-width
              }}
            >
              {isFiltersVisible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Button>

            <Typography
              sx={{
                textAlign: 'center',
                color: '#fcfdfd',
                textWrap: 'nowrap',
                fontSize: 18,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Filters
            </Typography>

            {/* ================= CLEAR BUTTON ================= */}
            <Box sx={{ width: 74 }}>
              {hasActiveFilters && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setSelectedClassification('all');
                    setSelectedDocType('all');
                    setSelectedOffice('all');
                    setSpecificDocType('');
                  }}
                  sx={{
                    borderRadius: '999px',
                    px: 2,
                    height: 30,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          {isFiltersVisible && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                flex: 1,
                gap: 2,
                p: 1,
                borderRadius: 3,
                backgroundColor: '#ffff'
              }}
            >
              {filters}
            </Box>
          )}
        </Box>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          mt: -0.5,
          minWidth: '30%',
          // border: "solid 1px black",
          gap: 2
          // right: 280,
          // zIndex: 1000,
        }}
      >
        {leftButtons && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            {leftButtons}
          </Box>
        )}
        {rightButtons && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            {rightButtons}
          </Box>
        )}
      </Box>
      {error && (
        <Box
          sx={{
            backgroundColor: 'red',
            width: '100%',
            px: 1
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 'bold' }}>{error}</Typography>
        </Box>
      )}
      <Box
        sx={{
          minWidth: '100%'
        }}
      >
        {table}
      </Box>
    </Box>
  );
}
