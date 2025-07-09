
// src/components/dpp-tracker/globe-wrapper.tsx
'use client';

import React, { useEffect, useRef, memo } from 'react';
// No top-level imports from globe.gl at all.

// Use memo to prevent re-renders unless props change
const GlobeWrapper = memo(function GlobeInternal(props: any) {
  const globeEl = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any | null>(null);
  const [Globe, setGlobe] = React.useState<any>(null);

  React.useEffect(() => {
    import('globe.gl').then(module => setGlobe(() => module.default));
  }, []);

  React.useEffect(() => {
    if (globeEl.current && Globe && !globeInstanceRef.current) {
      const globe = Globe()(globeEl.current);
      globeInstanceRef.current = globe;
      if (props.onGlobeReady) {
        props.onGlobeReady(globe);
      }
    }
    return () => {
      if (globeInstanceRef.current?._destructor) {
        globeInstanceRef.current._destructor();
        globeInstanceRef.current = null;
      }
    };
  }, [Globe, props, props.onGlobeReady]);

  React.useEffect(() => {
    if (globeInstanceRef.current && Globe) {
      Object.entries(props).forEach(([prop, val]) => {
        if (typeof globeInstanceRef.current?.[prop] === 'function') {
          globeInstanceRef.current[prop](val);
        }
      });
    }
  }, [props, Globe]);


  return <div ref={globeEl} style={{ width: '100%', height: '100%' }} />;
});

GlobeWrapper.displayName = 'GlobeWrapper';

export default GlobeWrapper;
