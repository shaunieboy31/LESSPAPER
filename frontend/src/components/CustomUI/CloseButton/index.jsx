// components/ModalHeaderBackground.js
import React from 'react';

const CloseButton = ({ fill = '#09504a' }) => (
  <svg
    width="464"
    height="450"
    viewBox="0 0 464 450"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'abolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -10
    }}
  >
    <g filter="url(#filter0_iii_24_8)">
      <rect x="8.5" y="8.5" width="447" height="433" rx="92" fill="url(#paint0_linear_24_8)" />
    </g>
    <rect x="8.5" y="8.5" width="447" height="433" rx="92" stroke="#0F0E0A" strokeWidth="17" />
    <g filter="url(#filter1_d_24_8)">
      <path
        d="M180.891 220.597L135.714 120.5H202.795L229.668 167.334L256.541 120.5H332.021L274.586 220.597L336.5 328.5H256.541L229.668 281.666L202.795 328.5H127.5L180.891 220.597Z"
        fill="#FEFEFE"
      />
      <path
        d="M207.718 112L210.167 116.27L229.668 150.255L249.169 116.27L251.618 112H346.698L339.394 124.73L284.386 220.597L343.872 324.27L351.177 337H251.618L249.169 332.73L229.668 298.744L210.167 332.73L207.718 337H113.811L119.882 324.73L171.489 220.43L127.967 123.997L122.552 112H207.718Z"
        stroke="black"
        strokeWidth="17"
      />
    </g>
    <defs>
      <filter
        id="filter0_iii_24_8"
        x="-20"
        y="-30"
        width="504"
        height="500"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="40" dy="31" />
        <feGaussianBlur stdDeviation="10" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.807843 0 0 0 0 0.0901961 0 0 0 0 0.0980392 0 0 0 1 0"
        />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_24_8" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="-208" />
        <feGaussianBlur stdDeviation="15" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.807843 0 0 0 0 0.0901961 0 0 0 0 0.0980392 0 0 0 1 0"
        />
        <feBlend mode="normal" in2="effect1_innerShadow_24_8" result="effect2_innerShadow_24_8" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="-40" dy="31" />
        <feGaussianBlur stdDeviation="10" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.807843 0 0 0 0 0.0901961 0 0 0 0 0.0980392 0 0 0 1 0"
        />
        <feBlend mode="normal" in2="effect2_innerShadow_24_8" result="effect3_innerShadow_24_8" />
      </filter>
      <filter
        id="filter1_d_24_8"
        x="85.7211"
        y="96.1"
        width="300.533"
        height="276.8"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="3" dy="10" />
        <feGaussianBlur stdDeviation="8.7" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_24_8" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_24_8" result="shape" />
      </filter>
      <linearGradient
        id="paint0_linear_24_8"
        x1="232"
        y1="8.50002"
        x2="232"
        y2="441.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FC8C94" />
        <stop offset="1" stopColor="#EE2A2B" />
      </linearGradient>
    </defs>
  </svg>
);

export default CloseButton;
