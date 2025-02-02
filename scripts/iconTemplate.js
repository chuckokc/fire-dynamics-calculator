export function generateSVGString(size = 512, maskable = false) {
    // For maskable icons, we adjust the content to fit within the safe zone
    const safeZoneInset = maskable ? size * 0.2 : 0;
    const effectiveSize = size - (safeZoneInset * 2);
    
    // Create the SVG string directly without using JSX
    return `<svg
      width="${size}"
      height="${size}"
      viewBox="0 0 ${size} ${size}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      
      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#3182CE" />
      
      <!-- Content group with safe zone adjustment for maskable icons -->
      <g transform="${maskable ? `translate(${safeZoneInset}, ${safeZoneInset})` : ''}">
        <!-- Stylized flame shape -->
        <path
          d="M${size/2} ${effectiveSize * 0.2}
             C${size/2 - effectiveSize * 0.2} ${effectiveSize * 0.4}
              ${size/2 - effectiveSize * 0.15} ${effectiveSize * 0.6}
              ${size/2 - effectiveSize * 0.15} ${effectiveSize * 0.7}
             C${size/2 - effectiveSize * 0.15} ${effectiveSize * 0.85}
              ${size/2 - effectiveSize * 0.08} ${effectiveSize * 0.95}
              ${size/2} ${effectiveSize * 0.95}
             C${size/2 + effectiveSize * 0.08} ${effectiveSize * 0.95}
              ${size/2 + effectiveSize * 0.15} ${effectiveSize * 0.85}
              ${size/2 + effectiveSize * 0.15} ${effectiveSize * 0.7}
             C${size/2 + effectiveSize * 0.15} ${effectiveSize * 0.6}
              ${size/2 + effectiveSize * 0.2} ${effectiveSize * 0.4}
              ${size/2} ${effectiveSize * 0.2}"
          fill="#FFFFFF"
        />
        
        <!-- Calculator grid lines -->
        <g stroke="#3182CE" stroke-width="${effectiveSize * 0.02}" stroke-linecap="round">
          <line
            x1="${size/2 - effectiveSize * 0.15}"
            y1="${effectiveSize * 0.65}"
            x2="${size/2 + effectiveSize * 0.15}"
            y2="${effectiveSize * 0.65}"
          />
          <line
            x1="${size/2 - effectiveSize * 0.15}"
            y1="${effectiveSize * 0.75}"
            x2="${size/2 + effectiveSize * 0.15}"
            y2="${effectiveSize * 0.75}"
          />
          <line
            x1="${size/2}"
            y1="${effectiveSize * 0.65}"
            x2="${size/2}"
            y2="${effectiveSize * 0.85}"
          />
        </g>
      </g>
    </svg>`;
  }