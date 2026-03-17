/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import StatBox from 'components/StatBox';
import { renderToStaticMarkup } from 'react-dom/server';
import DashboardCardSVG from 'components/CustomUI/Card';

export default function ResponsiveCards({ contents, loadingState }) {
  const navigate = useNavigate();

  // const chunkArray = (array, chunkSize) => {
  //   const result = [];
  //   for (let i = 0; i < array.length; i += chunkSize) {
  //     result.push(array.slice(i, i + chunkSize));
  //   }
  //   return result;
  // };

  // const chunkedContents = chunkArray(contents, 2);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: '2vw',

        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',

        '@media (max-width: 1600px)': {
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '1rem'
        },

        '@media (max-width: 1300px)': {
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1rem'
        },

        '@media (max-width: 1090px)': {
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem'
        },

        '@media (max-width: 870px)': {
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: '1rem'
        }
      }}
    >
      {contents.map(content => (
        <Box
          key={content.title}
          onClick={() => navigate(content.path)}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            filter: 'drop-shadow(0px 8px 12px rgba(0,0,0,0.25))',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'scale(1.05)',
              filter: 'drop-shadow(0px 12px 20px rgba(0,0,0,0.35))'
            }
          }}
        >
          {/* SVG background */}
          <DashboardCardSVG
            backgroundColor={content.backgroundColor || '#B2BAE0'}
            innerColor={content.innerColor || '#f2f5fe'}
            accentColor={content.accentColor || '#8CC08D'}
            width="100%"
            height="100%"
          />

          {/* StatBox overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <StatBox
              title={content.title}
              subtitle={content.subtitle}
              content={loadingState ? <CircularProgress /> : content.value}
              breakdown={content.breakdown}
              footer={content.footer}
              icon={
                <Box
                  sx={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    overflow: 'hidden',
                    mt: -3,
                    mr: -1
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      background: content.accentColor || '#8CC08D', // the gradient
                      WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                        renderToStaticMarkup(content.icon)
                      )}")`,
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      WebkitMaskSize: '50%', // adjust to fit the icon
                      maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
                        renderToStaticMarkup(content.icon)
                      )}")`,
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      maskSize: '50%'
                    }}
                  />
                </Box>
              }
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
