import React from 'react';

const SidebarActiveIndicator = () => (
  <svg
    viewBox="0 0 759 387"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      top: -24,
      right: -0.5,
      width: '99%',
      height: '104%',
      zIndex: -1,
      transform: 'scaleY(2.5)', // stretch vertically
      transformOrigin: 'top left'
    }}
  >
    <path
      d="M758 1.4782e-05V303.454C754.751 257.554 713.965 229.58 685.712 229.587C657.46 229.594 112.133 229.587 74.4289 229.587C36.7248 229.587 0 194.291 0 151.727C0 109.163 37.2145 74.111 74.4289 74.111C111.643 74.111 650.149 73.8672 685.712 73.8672C721.275 73.8672 758 35.0525 758 1.4782e-05Z"
      fill="#ffffff"
    />
  </svg>
);

export default SidebarActiveIndicator;
