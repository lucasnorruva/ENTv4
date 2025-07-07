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
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import GlobeControls from './GlobeControls';
import ClickedCountryInfoCard from './ClickedCountryInfoCard';
import SelectedProductCustomsInfoCard from './SelectedProductCustomsInfoCard';

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

interface CountryProperties {
  ADMIN: string;
  ADM0_A3: string;
  REGION_WB?: string;
}

const EU_COUNTRIES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
  'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
  'Spain', 'Sweden'
]);


export default function GlobalTrackerClient({
  products,
  alerts,
  user,
  roleSlug,
}: GlobalTrackerClientProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const { theme } = useTheme();

  // State
  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [clickedCountry, setClickedCountry] = useState<CountryProperties | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [countryFilter, setCountryFilter] = useState<'all' | 'eu' | 'supplyChain'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [showFactories, setShowFactories] = useState(false);
  const [showCustomsAlerts, setShowCustomsAlerts] = useState(true);

  useEffect(() => setIsClientMounted(true), []);

  const globeMaterial = useMemo(() => new MeshPhongMaterial({
    color: theme === 'dark' ? '#0f172a' : '#e0f2fe',
    transparent: true,
    opacity: 1,
  }), [theme]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(geoJsonData => setLandPolygons(geoJsonData.features))
      .catch(err => console.error('Error fetching globe data:', err));
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [selectedProductId, products]);

  const onProductSelect = (productId: string | null) => {
    setSelectedProductId(productId);
    setClickedCountry(null);
    if(productId) {
      setCountryFilter('supplyChain');
    }
  };
  
  const handleCountryClick = useCallback((polygon: any) => {
    setClickedCountry(polygon.properties);
    setSelectedProductId(null);
  }, []);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || !globeReady) return;

    if (selectedProduct?.transit) {
      const origin = mockCountryCoordinates[selectedProduct.transit.origin];
      const dest = mockCountryCoordinates[selectedProduct.transit.destination];
      if (origin && dest) {
        globe.pointOfView({
          lat: (origin.lat + dest.lat) / 2,
          lng: (origin.lng + dest.lng) / 2,
          altitude: 1.5,
        }, 1500);
      }
    } else if (clickedCountry) {
        const countryName = clickedCountry.ADMIN;
        const coords = mockCountryCoordinates[countryName];
        if (coords) {
            globe.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 2 }, 1000);
        }
    } else {
        // Reset view
        globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1500);
    }
  }, [selectedProduct, clickedCountry, globeReady]);

  useEffect(() => {
    const globe = globeEl.current;
    if (globe) {
      (globe.controls() as any).autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);
  
  const filteredCountryData = useMemo(() => {
    if (countryFilter === 'all') return MOCK_CUSTOMS_DATA;
    if (countryFilter === 'eu') return MOCK_CUSTOMS_DATA.filter(d => EU_COUNTRIES.has(d.region));
    if (countryFilter === 'supplyChain' && selectedProduct?.transit) {
        return MOCK_CUSTOMS_DATA.filter(d => 
            d.keywords.includes(selectedProduct.transit.origin.toLowerCase()) || 
            d.keywords.includes(selectedProduct.transit.destination.toLowerCase())
        );
    }
    return MOCK_CUSTOMS_DATA;
  }, [countryFilter, selectedProduct]);

  const riskFilteredData = useMemo(() => {
    if (riskFilter === 'all') return filteredCountryData;
    return filteredCountryData.filter(d => d.riskLevel === riskFilter);
  }, [riskFilter, filteredCountryData]);
  
  const polygonColor = useCallback((feat: any) => {
    const countryName = feat.properties.ADMIN;
    if (riskFilteredData.some(d => d.keywords.includes(countryName.toLowerCase()))) {
        return theme === 'dark' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(59, 130, 246, 0.3)';
    }
    return theme === 'dark' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';
  }, [theme, riskFilteredData]);
  
  const arcsData = useMemo(() => products.map(p => {
    if (!p.transit) return null;
    const origin = mockCountryCoordinates[p.transit.origin];
    const dest = mockCountryCoordinates[p.transit.destination];
    if (!origin || !dest) return null;
    
    let color = selectedProductId === p.id ? 'rgba(255, 255, 0, 0.9)' : 'rgba(139, 92, 246, 0.6)';
    
    return {
      startLat: origin.lat,
      startLng: origin.lng,
      endLat: dest.lat,
      endLng: dest.lng,
      color,
      stroke: selectedProductId === p.id ? 2 : 0.5,
      product: p,
    };
  }).filter(Boolean), [products, selectedProductId]);

  const factoryPoints = useMemo(() => {
    if(!showFactories) return [];
    return products.map(p => {
        if(!p.manufacturing?.country) return null;
        const coords = mockCountryCoordinates[p.manufacturing.country];
        if(!coords) return null;
        return {
            lat: coords.lat,
            lng: coords.lng,
            size: 0.2,
            color: 'rgba(234, 179, 8, 0.7)',
        }
    }).filter(Boolean);
  }, [products, showFactories]);

  const alertPoints = useMemo(() => {
    if (!showCustomsAlerts) return [];
    return alerts.map(alert => ({
        ...alert,
        lat: alert.lat,
        lng: alert.lng,
        size: 0.5,
        color: alert.severity === 'High' ? 'red' : 'orange',
    }));
  }, [alerts, showCustomsAlerts]);
  

  const globeComponent = useMemo(() => isClientMounted ? (
    <Globe
      ref={globeEl}
      backgroundColor="rgba(0,0,0,0)"
      globeMaterial={globeMaterial}
      polygonsData={landPolygons}
      polygonCapColor={polygonColor}
      polygonSideColor={() => 'rgba(0,0,0,0)'}
      polygonStrokeColor={() => (theme === 'dark' ? '#475569' : '#94a3b8')}
      onPolygonClick={handleCountryClick}
      arcsData={arcsData}
      arcColor={'color'}
      arcStroke={'stroke'}
      arcDashLength={0.4}
      arcDashGap={0.2}
      arcDashAnimateTime={2000}
      pointsData={[...alertPoints, ...factoryPoints]}
      pointLat="lat"
      pointLng="lng"
      pointColor="color"
      pointRadius="size"
      pointAltitude={0.01}
      onGlobeReady={() => setGlobeReady(true)}
    />
  ) : (
    <div className="flex items-center justify-center h-full w-full bg-globe-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ), [isClientMounted, globeMaterial, landPolygons, polygonColor, handleCountryClick, arcsData, alertPoints, factoryPoints, theme]);

  return (
    <div className="absolute inset-0">
      {globeComponent}
      <GlobeControls
        products={products}
        selectedProductId={selectedProductId}
        onProductSelect={onProductSelect}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        isAutoRotating={isAutoRotating}
        onToggleRotation={() => setIsAutoRotating(prev => !prev)}
        showFactories={showFactories}
        onToggleFactories={setShowFactories}
        showCustomsAlerts={showCustomsAlerts}
        onToggleCustomsAlerts={setShowCustomsAlerts}
      />
      {clickedCountry &&
        <ClickedCountryInfoCard 
            countryInfo={clickedCountry}
            productsTo={products.filter(p => p.transit?.destination === clickedCountry.ADMIN)}
            productsFrom={products.filter(p => p.transit?.origin === clickedCountry.ADMIN)}
            onDismiss={() => setClickedCountry(null)}
            onProductSelect={onProductSelect}
            roleSlug={roleSlug}
        />
      }
      {selectedProduct && 
        <SelectedProductCustomsInfoCard
          product={selectedProduct}
          user={user}
          alerts={alerts.filter(a => a.productId === selectedProduct.id)}
          onDismiss={() => onProductSelect(null)}
          destinationCountry={selectedProduct.transit?.destination}
          roleSlug={roleSlug}
        />
      }
    </div>
  );
}
