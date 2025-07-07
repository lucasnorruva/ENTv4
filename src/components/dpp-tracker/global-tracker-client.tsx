// src/components/dpp-tracker/global-tracker-client.tsx
'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import dynamic from 'next/dynamic';
import type { GlobeMethods } from 'react-globe.gl';
import { MeshPhongMaterial } from 'three';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { GeoJsonFeature } from 'geojson';

import type { Product, CustomsAlert, User } from '@/types';
import { mockCountryCoordinates } from '@/lib/country-coordinates';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-globe-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-muted-foreground">Loading Globe...</p>
    </div>
  ),
});

interface GlobalTrackerClientProps {
  products: Product[];
  alerts: CustomsAlert[];
  user: User;
  roleSlug: string;
}

export default function GlobalTrackerClient({
  products,
  alerts,
  user,
  roleSlug,
}: GlobalTrackerClientProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const { theme } = useTheme();

  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [globeReady, setGlobeReady] = useState(false);
  
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [isClientMounted, setIsClientMounted] = useState(false);
  
  useEffect(() => {
    setIsClientMounted(true);
  }, []);
  
  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({
        color: theme === 'dark' ? '#0f172a' : '#e0f2fe',
        transparent: true,
        opacity: 1,
    }),
    [theme],
  );

  useEffect(() => {
    fetch(
        'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
      ).then(res => res.json())
      .then(geoJsonData => {
        setLandPolygons(geoJsonData.features);
      })
      .catch(err => console.error('Error fetching globe data:', err));
  }, []);

  const getPointColorForStatus = useCallback(
    (status: Product['verificationStatus']) => {
        const isDark = theme === 'dark';
        switch (status) {
        case 'Verified':
            return isDark ? '#22c55e' : '#16a34a'; // green
        case 'Pending':
            return isDark ? '#f59e0b' : '#d97706'; // amber
        case 'Failed':
            return isDark ? '#ef4444' : '#b91c1c'; // red
        default:
            return isDark ? '#64748b' : '#94a3b8'; // slate
        }
    },
    [theme],
  );

  useEffect(() => {
    if (!isClientMounted) return;

    const newArcs: any[] = [];
    const newPoints: any[] = [];

    products.forEach(product => {
        if(product.transit) {
            const { origin, destination } = product.transit;
            const originCoords = mockCountryCoordinates[origin];
            const destCoords = mockCountryCoordinates[destination];
            if(originCoords && destCoords) {
                const color = getPointColorForStatus(product.verificationStatus);
                newPoints.push({ lat: originCoords.lat, lng: originCoords.lng, size: 0.3, color: color, name: `Origin: ${origin}` });
                newPoints.push({ lat: destCoords.lat, lng: destCoords.lng, size: 0.5, color: color, name: `Destination: ${destination}` });
                newArcs.push({
                    startLat: originCoords.lat,
                    startLng: originCoords.lng,
                    endLat: destCoords.lat,
                    endLng: destCoords.lng,
                    color: [color, color]
                })
            }
        }
    });

    setArcsData(newArcs);
    setPointsData(newPoints);
  }, [isClientMounted, products, theme, getPointColorForStatus]);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || !globeReady) return;
    const controls = globe.controls() as any;
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
    }
  }, [globeReady]);

  const globeComponent = isClientMounted ? (
    <Globe
      ref={globeEl}
      backgroundColor="rgba(0,0,0,0)"
      globeMaterial={globeMaterial}
      polygonsData={landPolygons}
      polygonCapColor={() => (theme === 'dark' ? '#334155' : '#e2e8f0')}
      polygonSideColor={() => 'rgba(0, 100, 0, 0.05)'}
      polygonStrokeColor={() => (theme === 'dark' ? '#475569' : '#94a3b8')}
      arcsData={arcsData}
      arcColor={'color'}
      pointsData={pointsData}
      pointColor={'color'}
      pointAltitude={0}
      pointRadius={'size'}
      onGlobeReady={() => setGlobeReady(true)}
    />
  ) : (
    <div className="flex items-center justify-center h-full w-full bg-globe-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-muted-foreground">Loading Globe...</p>
    </div>
  );


  return (
    <div className="absolute inset-0">
      {globeComponent}
    </div>
  );
}
