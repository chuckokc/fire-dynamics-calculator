import React from 'react';

const IconGenerator = ({ size = 512 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="256" cy="256" r="256" fill="#3182CE" />
      
      {/* Stylized flame shape */}
      <path
        d="M256 120C200 180 180 240 180 280C180 340 213 380 256 380C299 380 332 340 332 280C332 240 312 180 256 120Z"
        fill="#FFF"
      />
      
      {/* Calculator grid lines */}
      <path
        d="M220 260H292M220 300H292M256 260V340"
        stroke="#3182CE"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default IconGenerator;