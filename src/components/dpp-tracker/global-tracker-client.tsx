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
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { GlobeMethods } from 'react-globe.gl';
import { MeshPhongMaterial } from 'three';
import { Loader2, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { GeoJsonFeature } from 'geojson';

import type { Product, CustomsAlert, User } from '@/types';
import SelectedProductCustomsInfoCard from '@/components/dpp-tracker/SelectedProductCustomsInfoCard';
import ClickedCountryInfoCard from '@/components/dpp-tracker/ClickedCountryInfoCard';
import GlobeControls from './GlobeControls';
import {
  mockCountryCoordinates,
  getCountryFromLocationString,
} from '@/lib/country-coordinates';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-globe-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-4 text-lg text-muted-foreground">Loading Globe...</p>
    </div>
  ),
});

const EU_COUNTRY_CODES = new Set([
  'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
  'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
  'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE',
]);

interface CountryProperties {
  ADMIN: string;
  ADM0_A3: string;
  NAME_LONG?: string;
  ISO_A3?: string;
  REGION_WB?: string;
}

interface GlobalTrackerClientProps {
  products: Product[];
  alerts: CustomsAlert[];
  user: User;
  roleSlug: string;
}

export default function GlobalTrackerClient({
  products: allProducts,
  alerts: allAlerts,
  user,
  roleSlug,
}: GlobalTrackerClientProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();

  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [filteredLandPolygons, setFilteredLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const productIdFromQuery = searchParams.get('productId');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productIdFromQuery,
  );
  
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>([]);
  const [clickedCountryInfo, setClickedCountryInfo] = useState<CountryProperties | null>(null);
  
  const [countryFilter, setCountryFilter] = useState<'all' | 'eu' | 'supplyChain'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedProduct = useMemo(
    () => allProducts.find(p => p.id === selectedProductId),
    [selectedProductId, allProducts],
  );

  const selectedProductAlerts = useMemo(
    () => allAlerts.filter(a => a.productId === selectedProductId),
    [selectedProductId, allAlerts]
  );
  
  const isEU = useCallback((isoA3: string | undefined) => !!isoA3 && EU_COUNTRY_CODES.has(isoA3.toUpperCase()), []);

  const countryRiskMap = useMemo(() => {
    const map = new Map<string, 'High' | 'Medium' | 'Low'>();
    MOCK_CUSTOMS_DATA.forEach(data => {
      data.keywords.forEach(keyword => {
        // Simple mapping; a more robust solution would use ISO codes.
        if (!map.has(keyword)) {
          map.set(keyword, data.riskLevel);
        }
      });
    });
    return map;
  }, []);

  const globeMaterial = useMemo(() => new MeshPhongMaterial({
    color: theme === 'dark' ? '#0f172a' : '#e0f2fe',
    transparent: true,
    opacity: 1,
  }), [theme]);

  const getPolygonCapColor = useCallback((feat: GeoJsonFeature) => {
    if (!feat.properties) return theme === 'dark' ? '#334155' : '#e2e8f0';
    const p = feat.properties as CountryProperties;
    const isDark = theme === 'dark';
    const countryNameLower = p.ADMIN.toLowerCase();
    
    // Clicked country always has priority color
    if (clickedCountryInfo && (clickedCountryInfo.ADM0_A3 === p.ADM0_A3 || clickedCountryInfo.ADMIN === p.ADMIN)) return 'tomato';
    
    // Product supply chain highlight has next priority
    if (highlightedCountries.some(hc => countryNameLower.includes(hc.toLowerCase()))) return isDark ? '#FBBF24' : '#F59E0B';
    
    // Risk filter highlight
    if (riskFilter !== 'all' && countryRiskMap.get(countryNameLower) === riskFilter) {
      if (riskFilter === 'High') return isDark ? '#ef4444' : '#b91c1c';
      if (riskFilter === 'Medium') return isDark ? '#f59e0b' : '#d97706';
      if (riskFilter === 'Low') return isDark ? '#22c55e' : '#16a34a';
    }

    // EU highlight
    if (isEU(p.ADM0_A3 || p.ISO_A3)) return isDark ? '#2563eb' : '#002D62';
    
    // Default color
    return isDark ? '#334155' : '#e2e8f0';
  }, [theme, isEU, highlightedCountries, clickedCountryInfo, riskFilter, countryRiskMap]);
  
  const handlePolygonClick = useCallback((feat: GeoJsonFeature) => {
    if (feat.properties) {
      setClickedCountryInfo(feat.properties as CountryProperties);
      const countryName = (feat.properties as CountryProperties).ADMIN;
      const coords = mockCountryCoordinates[countryName];
      if (globeEl.current && coords) {
        globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.5 }, 1000);
      }
    }
  }, []);

  const handleProductSelect = useCallback((productId: string | null) => {
    setSelectedProductId(productId);
    setClickedCountryInfo(null);
    const params = new URLSearchParams(searchParams.toString());
    if (productId) {
      params.set('productId', productId);
      setCountryFilter('supplyChain'); 
    } else {
      params.delete('productId');
      setCountryFilter('all');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
    )
      .then(res => res.json())
      .then(geoJsonData => {
        setLandPolygons(geoJsonData.features);
        setFilteredLandPolygons(geoJsonData.features);
      })
      .catch(err => console.error('Error fetching geo data:', err));
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setArcsData([]);
      setHighlightedCountries([]);
      return;
    }

    let newArcs: any[] = [];
    const newHighlightedCountries = new Set<string>();

    const addCountryHighlight = (location?: string) => {
      const country = getCountryFromLocationString(location);
      if (country) newHighlightedCountries.add(country);
      return country;
    };

    if (selectedProduct.transit) {
      const { transit } = selectedProduct;
      const originCountry = addCountryHighlight(transit.origin);
      const destinationCountry = addCountryHighlight(transit.destination);
      const originCoords = originCountry ? mockCountryCoordinates[originCountry] : null;
      const destinationCoords = destinationCountry ? mockCountryCoordinates[destinationCountry] : null;

      if (originCoords && destinationCoords) {
        newArcs.push({
          startLat: originCoords.lat, startLng: originCoords.lng,
          endLat: destinationCoords.lat, endLng: destinationCoords.lng,
          color: theme === 'dark' ? '#60A5FA' : '#3B82F6',
          label: `${selectedProduct.productName} Transit`,
        });
      }
    }

    fetch(`/api/v1/dpp/graph/${selectedProduct.id}`)
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(graph => {
        if (!graph || !graph.nodes) return;

        const manufacturerNode = graph.nodes.find((n: any) => n.type === 'manufacturer');
        const manufacturerCountry = addCountryHighlight(manufacturerNode?.data?.location);
        const manufacturerCoords = manufacturerCountry ? mockCountryCoordinates[manufacturerCountry] : null;

        if (manufacturerCoords) {
          graph.nodes.forEach((node: any) => {
            if (node.type === 'supplier') {
              const supplierCountry = addCountryHighlight(node.data.location);
              const supplierCoords = supplierCountry ? mockCountryCoordinates[supplierCountry] : null;
              if (supplierCoords && supplierCountry !== manufacturerCountry) {
                newArcs.push({
                  startLat: supplierCoords.lat, startLng: supplierCoords.lng,
                  endLat: manufacturerCoords.lat, endLng: manufacturerCoords.lng,
                  color: theme === 'dark' ? '#FBBF24' : '#F59E0B',
                  label: `Supply from ${supplierCountry}`,
                });
              }
            }
          });
        }
        setArcsData(newArcs);
        setHighlightedCountries(Array.from(newHighlightedCountries));
      })
      .catch(err => {
        console.error('Error fetching product graph:', err);
        setArcsData(newArcs);
        setHighlightedCountries(Array.from(newHighlightedCountries));
      });
  }, [selectedProduct, theme]);

  useEffect(() => {
    if (!landPolygons.length) return;

    let filtered = landPolygons;
    if (countryFilter === 'eu') {
      filtered = landPolygons.filter(feat => isEU(feat.properties?.ADM0_A3 || feat.properties?.ISO_A3));
    } else if (countryFilter === 'supplyChain' && selectedProduct && highlightedCountries.length > 0) {
      filtered = landPolygons.filter(feat => {
        const p = feat.properties as CountryProperties;
        const adminName = p.ADMIN || p.NAME_LONG || '';
        const isoA3 = p.ADM0_A3 || p.ISO_A3 || '';
        const lowerCaseAdminName = adminName.toLowerCase();

        return highlightedCountries.some(hc => {
          const lowerHc = hc.toLowerCase();
          return lowerCaseAdminName.includes(lowerHc) || 
                 (mockCountryCoordinates[hc] && isoA3 === Object.keys(mockCountryCoordinates).find(key => key === hc));
        });
      });
    } else if (riskFilter !== 'all') {
      filtered = landPolygons.filter(feat => {
        const p = feat.properties as CountryProperties;
        const adminNameLower = p.ADMIN.toLowerCase();
        return countryRiskMap.get(adminNameLower) === riskFilter;
      });
    }
    setFilteredLandPolygons(filtered);
  }, [countryFilter, landPolygons, highlightedCountries, selectedProduct, isEU, riskFilter, countryRiskMap]);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || !globeReady) return;

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 1000;
    }

    if (selectedProduct && selectedProduct.transit) {
      const destinationCountry = getCountryFromLocationString(selectedProduct.transit.destination);
      const destinationCoords = destinationCountry ? mockCountryCoordinates[destinationCountry] : null;
      if (destinationCoords) {
        globe.pointOfView({ lat: destinationCoords.lat, lng: destinationCoords.lng, altitude: 1.5 }, 1000);
      }
    }
  }, [globeReady, isAutoRotating, selectedProduct]);
  
  const destinationCountry = selectedProduct?.transit ? getCountryFromLocationString(selectedProduct.transit.destination) : null;
  
  if (!isMounted) {
    return null;
  }

  return (
    <div className="absolute inset-0">
      <GlobeControls
        products={allProducts}
        selectedProductId={selectedProductId}
        onProductSelect={handleProductSelect}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter as any}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter as any}
        isAutoRotating={isAutoRotating}
        onToggleRotation={() => setIsAutoRotating(prev => !prev)}
        isProductSelected={!!selectedProduct}
      />
      <Globe
        ref={globeEl}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={globeMaterial}
        polygonsData={filteredLandPolygons}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={() => 'rgba(0, 100, 0, 0.05)'}
        polygonStrokeColor={() => (theme === 'dark' ? '#475569' : '#000000')}
        polygonAltitude={0.01}
        onPolygonClick={handlePolygonClick}
        polygonsTransitionDuration={300}
        arcsData={arcsData}
        arcColor={'color'}
        arcDashLength={0.4}
        arcDashGap={0.1}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        onGlobeReady={() => setGlobeReady(true)}
      />
      {selectedProduct && (
        <SelectedProductCustomsInfoCard
          product={selectedProduct}
          alerts={selectedProductAlerts}
          onDismiss={() => handleProductSelect(null)}
          destinationCountry={destinationCountry}
          roleSlug={roleSlug}
        />
      )}
      {clickedCountryInfo && (
        <ClickedCountryInfoCard
          countryInfo={clickedCountryInfo}
          onDismiss={() => setClickedCountryInfo(null)}
          roleSlug={roleSlug}
        />
      )}
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs p-2 rounded-md shadow-lg pointer-events-none backdrop-blur-sm border">
        <Info className="inline h-3 w-3 mr-1" />
        <span className="font-bold">Legend:</span> Supply Chain Route:{' '}
        <span className="text-amber-600 dark:text-amber-400 font-semibold">
          Amber
        </span>{' '}
        | Final Transit:{' '}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">
          Blue
        </span>
      </div>
    </div>
  );
}
