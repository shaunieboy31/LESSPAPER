import React from 'react';

const DashboardCardSVG = ({
  backgroundColor = '#B2BAE0',
  innerColor = '#F2F5FE',
  accentColor = '#8CC08D',
  width = 819,
  height = 537
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 819 537"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background with drop shadow */}
    <g opacity="0.44" filter="url(#filter0_d_1_260)">
      <rect x="4" width="811" height="529" rx="80" fill={backgroundColor} />
    </g>

    {/* Inner card with double inner shadow */}
    <g filter="url(#filter1_ii_1_260)">
      <rect x="4" width="811" height="513.77" rx="73" fill={innerColor} />
    </g>

    {/* Accent shape with inner shadow */}
    <g filter="url(#filter2_i_1_260)">
      <path
        d="M776 164.51C776 133.525 815 132.509 815 95.4295V416.957C815 375.305 776 384.956 776 346.353V164.51Z"
        fill={accentColor}
      />
    </g>

    <defs>
      {/* Drop shadow filter */}
      <filter
        id="filter0_d_1_260"
        x="0"
        y="0"
        width="819"
        height="537"
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
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_260" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_260" result="shape" />
      </filter>

      {/* Inner shadow filter for card */}
      <filter
        id="filter1_ii_1_260"
        x="0"
        y="-4"
        width="819"
        height="521.77"
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
        <feOffset dx="-4" dy="-4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_260" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="7" dy="7" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
        <feBlend mode="normal" in2="effect1_innerShadow_1_260" result="effect2_innerShadow_1_260" />
      </filter>

      {/* Inner shadow filter for accent shape */}
      <filter
        id="filter2_i_1_260"
        x="754.968"
        y="95.4434"
        width="71.0321"
        height="332.36"
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
        <feMorphology
          radius="4"
          operator="erode"
          in="SourceAlpha"
          result="effect1_innerShadow_1_260"
        />
        <feOffset dx="11" dy="11" />
        <feGaussianBlur stdDeviation="8" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1_260" />
      </filter>
    </defs>
  </svg>
);

export default DashboardCardSVG;
