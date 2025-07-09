
'use client';

import React, { useEffect, useRef, memo } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';

// Use memo to prevent re-renders unless props change
const GlobeWrapper = memo(function GlobeInternal(props: any) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<GlobeInstance | null>(null);

  // Initialize globe on mount
  useEffect(() => {
    if (globeEl.current && !globeInstanceRef.current) {
      const globe = Globe()(globeEl.current);
      globeInstanceRef.current = globe;
      
      // Pass the instance to the parent component
      if (props.onGlobeReady) {
        props.onGlobeReady(globe);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor();
        globeInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Update globe properties when props change
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;
    
    Object.entries(props).forEach(([prop, val]) => {
      // Check if prop is a function on the globe instance, and call it
      if (typeof (globe as any)[prop] === 'function') {
        (globe as any)[prop](val);
      }
    });
  }, [props]);

  return <div ref={globeEl} style={{ width: '100%', height: '100%' }} />;
});

GlobeWrapper.displayName = 'GlobeWrapper';

export default GlobeWrapper;

    