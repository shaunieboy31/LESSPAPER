import { Box, Typography } from '@mui/material';

function StatBox({ title, subtitle, content, icon }) {
  const smallerTitles = ['Document Types', 'Offices', 'Units', 'Users', 'All Documents'];

  const getFontSize = title => {
    if (smallerTitles.includes(title)) {
      return '17px';
    }
    return '20px';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        width: '100%',
        textOverflow: 'ellipsis'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          textAlign: 'left',
          height: '100%',
          width: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            textAlign: 'left',
            height: '100%',
            width: '100%'
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: getFontSize(title),
              color: '#7b7d82',
              whiteSpace: 'nowrap',
              fontWeight: 'bold',
              '@media (max-width: 1520px)': {
                fontSize: title.length > 15 ? '13px' : '15px'
              }
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            fontWeight="bold"
            // marginTop={'0.5rem'}
            sx={{
              display: 'flex',
              flexGrow: '1',
              alignItems: 'center',
              color: '#494949',
              '@media (max-width: 1520px)': {
                fontSize: '30px'
              }
            }}
          >
            {content}
          </Typography>
        </Box>
        {icon}
      </Box>
      <Typography
        variant="h4"
        sx={{
          fontSize: title.length > 15 ? '9px' : '13px',
          color: 'gray',
          fontWeight: 'normal',
          '@media (max-width: 1520px)': {
            fontSize: title.length > 15 ? '9px' : '13px'
          }
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
}

export default StatBox;
