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

  const [isMounted, setIsMounted] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false); // State for the selector popover

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
  
  // --- Effects ---

  // Effect 1: Fetch initial GeoJSON data for countries
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
    )
      .then(res => res.json())
      .then(geoJsonData => {
        setLandPolygons(geoJsonData.features);
        setFilteredLandPolygons(geoJsonData.features); // Initially show all
      })
      .catch(err => console.error('Error fetching geo data:', err));
  }, []);

  // Effect 2: Update arcs and highlights when the selected product changes
  useEffect(() => {
    if (!selectedProduct) {
      setArcsData([]);
      setHighlightedCountries([]);
      return;
    }

    const newArcs: any[] = [];
    const newHighlightedCountries = new Set<string>();

    const addCountryHighlight = (location?: string) => {
      const country = getCountryFromLocationString(location);
      if (country) newHighlightedCountries.add(country);
      return country;
    };

    // Add transit arc and countries
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
          color: theme === 'dark' ? '#60A5FA' : '#3B82F6', // Blue
          label: `${selectedProduct.productName} Transit`,
        });
      }
    }

    // Fetch and process supply chain graph
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
                  color: theme === 'dark' ? '#FBBF24' : '#F59E0B', // Amber
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


  // Effect 3: Update filtered polygons when filter changes
  useEffect(() => {
    if (!landPolygons.length) return;

    let filtered = landPolygons;
    if (countryFilter === 'eu') {
      filtered = landPolygons.filter(feat => isEU(feat.properties?.ADM0_A3 || feat.properties?.ISO_A3));
    } else if (countryFilter === 'supplyChain' && selectedProduct && highlightedCountries.length > 0) {
      filtered = landPolygons.filter(feat => {
        const adminName = feat.properties?.ADMIN || feat.properties?.NAME_LONG || '';
        return highlightedCountries.some(hc => adminName.toLowerCase().includes(hc.toLowerCase()));
      });
    }
    setFilteredLandPolygons(filtered);
  }, [countryFilter, landPolygons, highlightedCountries, selectedProduct]);


  // Effect 4: Control globe instance (camera, rotation)
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
    } else if (!clickedCountryInfo) {
      globe.pointOfView({ lat: 50, lng: 15, altitude: 2.5 }, 1000);
    }
  }, [globeReady, isAutoRotating, selectedProduct, clickedCountryInfo]);

  
  // --- Callbacks and Memos ---

  const isEU = useCallback((isoA3: string | undefined) => !!isoA3 && EU_COUNTRY_CODES.has(isoA3.toUpperCase()), []);

  const globeMaterial = useMemo(() => new MeshPhongMaterial({
    color: theme === 'dark' ? '#0f172a' : '#e0f2fe',
    transparent: true,
    opacity: 1,
  }), [theme]);

  const getPolygonCapColor = useCallback((feat: GeoJsonFeature) => {
    if (!feat.properties) return theme === 'dark' ? '#334155' : '#e2e8f0';
    const p = feat.properties as CountryProperties;
    const isDark = theme === 'dark';
    if (clickedCountryInfo && (clickedCountryInfo.ADM0_A3 === p.ADM0_A3 || clickedCountryInfo.ADMIN === p.ADMIN)) return 'tomato';
    if (highlightedCountries.some(hc => p.ADMIN.toLowerCase().includes(hc.toLowerCase()))) return isDark ? '#FBBF24' : '#F59E0B';
    if (isEU(p.ADM0_A3)) return isDark ? '#2563eb' : '#002D62';
    return isDark ? '#334155' : '#e2e8f0';
  }, [theme, isEU, highlightedCountries, clickedCountryInfo]);
  
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
    const params = new URLSearchParams(searchParams.toString());
    if (productId) {
      params.set('productId', productId);
    } else {
      params.delete('productId');
      setClickedCountryInfo(null);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const destinationCountry = selectedProduct?.transit ? getCountryFromLocationString(selectedProduct.transit.destination) : null;
  
  if (!isMounted) {
    return null; // Return null on the server and initial client render to match, letting Suspense handle the fallback.
  }

  return (
    <div className="absolute inset-0">
      <GlobeControls
        products={allProducts}
        selectedProductId={selectedProductId}
        onProductSelect={handleProductSelect}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter as any}
        isAutoRotating={isAutoRotating}
        onToggleRotation={() => setIsAutoRotating(prev => !prev)}
        isProductSelected={!!selectedProduct}
        isSelectorOpen={isSelectorOpen} // Pass state down
        onSelectorOpenChange={setIsSelectorOpen} // Pass handler down
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
        enablePointerInteraction={!isSelectorOpen} // Conditionally disable interaction
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
        <span className="font-bold">Legend:</span> EU Countries:{' '}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">
          Blue
        </span>{' '}
        | Product Focus:{' '}
        <span className="text-amber-600 dark:text-amber-400 font-semibold">
          Amber
        </span>
      </div>
    </div>
  );
}
