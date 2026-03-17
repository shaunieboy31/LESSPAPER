import { Box, Button, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LPSLogo from '../../assets/images/lps_logo.png';

export default function SearchPage({
  filters,
  loading,
  handleInputChange,
  handleFilterDocLogs,
  onBackToLogin
}) {
  return (
    <Grid
      container
      sx={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Left Side Content - Text */}
      <Grid
        item
        xs={12}
        md={7}
        lg={8}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          pr: 8
        }}
      >
        <Box>
          <Typography
            variant="h1"
            sx={{
              color: '#fff',
              fontWeight: 800,
              fontSize: { md: '3.5rem', lg: '4.5rem' },
              lineHeight: 1.1,
              mb: 3,
              textShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            Streamline <br />
            Your Records, <br />
            Go Paperless.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.9)',
              maxWidth: '600px',
              lineHeight: 1.6,
              fontWeight: 300
            }}
          >
            The DepEd Imus – Less Paper System helps you manage documents with precision, reduce
            paper use, and keep your data protected. Log in to work smarter today.
          </Typography>
        </Box>
      </Grid>

      {/* Right Side - Search Card */}
      <Grid
        item
        xs={12}
        md={5}
        lg={4}
        sx={{
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 450,
            p: 5,
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)',
            '@media (max-width: 600px)': {
              width: '90vw',
              minHeight: 'auto',
              height: 'auto'
            },
            '@media (max-width: 480px)': {
              maxWidth: '85vw'
            },
            '@media (max-height: 600px)': {
              minHeight: 'auto',
              height: 'auto',
              padding: 2
            }
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* PAPER FOLD */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '20%',
                height: '20%',
                backgroundColor: '#fff',
                borderBottom: 'solid 1px black',
                borderLeft: 'solid 1px #c0c0c0',
                boxShadow: '8px 8px 25px rgba(70, 79, 199, 0.3)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }
              }}
            />
            <Box
              component="img"
              draggable="false"
              src={LPSLogo}
              sx={{
                height: { xs: '80px', md: '100px' },
                mb: 2,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#1b5e54',
                mb: 0.5,
                letterSpacing: '-0.5px'
              }}
            >
              Less Paper System
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Self-Service Portal
            </Typography>
          </Box>

          <TextField
            fullWidth
            id="lpsNo"
            name="lpsNo"
            placeholder="Type the LPS Number here"
            variant="outlined"
            disabled={loading}
            value={filters.lpsNo}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleFilterDocLogs();
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: '#1b5e54' }} />,
              endAdornment: loading && <CircularProgress size={20} sx={{ color: '#1b5e54' }} />,
              sx: {
                borderRadius: 2,
                bgcolor: '#eff2f5',
                '& fieldset': { border: 'none' }, // Clean style as per image
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: '1px solid #1b5e54' }
              }
            }}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            onClick={() => handleFilterDocLogs()}
            disabled={!filters.lpsNo || loading}
            variant="contained"
            sx={{
              py: 1.5,
              background: 'radial-gradient(circle at center, #1b5e54 30%, #09504a 90%)',
              boxShadow: '0 3px 5px 2px rgba(77, 182, 172, .3)',
              color: 'white',
              fontSize: '1rem',
              textTransform: 'uppercase', // Match image "SEARCH"
              borderRadius: 2, // Match rounded pill shape in image
              boxShadow: '0 4px 12px rgba(27, 94, 84, 0.4)',
              '&:hover': {
                background: 'radial-gradient(circle at center, #a2cb6b 30%, #9cc266 90%)',
                color: 'black'
              },
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e'
              }
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={onBackToLogin}
            sx={{
              mt: 2,
              py: 1.5,
              borderColor: '#1b5e54',
              color: '#1b5e54',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              borderWidth: 1.5,
              '&:hover': {
                borderWidth: 1.5,
                borderColor: '#14463e',
                bgcolor: 'rgba(27, 94, 84, 0.05)'
              }
            }}
          >
            BACK TO LOGIN
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
}
