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
import { useRouter, useSearchParams } from 'next/navigation';
import type { GlobeMethods } from 'react-globe.gl';
import { MeshPhongMaterial } from 'three';
import { Loader2, Info } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { GeoJsonFeature } from 'geojson';

import type { Product, CustomsAlert } from '@/types';
import SelectedProductCustomsInfoCard from '@/components/dpp-tracker/SelectedProductCustomsInfoCard';
import ClickedCountryInfoCard from '@/components/dpp-tracker/ClickedCountryInfoCard';
import GlobeControls from './GlobeControls';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-background">
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
}

interface GlobalTrackerClientProps {
  products: Product[];
  alerts: CustomsAlert[];
}

export default function GlobalTrackerClient({
  products: allProducts,
  alerts: allAlerts,
}: GlobalTrackerClientProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>([]);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [arcsData, setArcsData] = useState<any[]>([]);
  
  const productIdFromQuery = searchParams.get('productId');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(productIdFromQuery);
  const [selectedProductAlerts, setSelectedProductAlerts] = useState<CustomsAlert[]>([]);
  const [countryFilter, setCountryFilter] = useState<'all' | 'eu' | 'supplyChain'>('all');
  const [clickedCountryInfo, setClickedCountryInfo] = useState<CountryProperties | null>(null);
  const [filteredLandPolygons, setFilteredLandPolygons] = useState<GeoJsonFeature[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 });

  const selectedProduct = useMemo(
    () => allProducts.find(p => p.id === selectedProductId),
    [selectedProductId, allProducts],
  );

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setGlobeSize({ width, height });
        }
      }
    });

    const currentRef = containerRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef) };
  }, []);

  const mockCountryCoordinates: { [key: string]: { lat: number; lng: number } } = useMemo(() => ({
    Germany: { lat: 51.1657, lng: 10.4515 }, France: { lat: 46.6034, lng: 1.8883 },
    Italy: { lat: 41.8719, lng: 12.5674 }, Spain: { lat: 40.4637, lng: -3.7492 },
    Poland: { lat: 51.9194, lng: 19.1451 }, USA: { lat: 37.0902, lng: -95.7129 },
    China: { lat: 35.8617, lng: 104.1954 }, Japan: { lat: 36.2048, lng: 138.2529 },
    'United Kingdom': { lat: 55.3781, lng: -3.436 }, Canada: { lat: 56.1304, lng: -106.3468 },
    India: { lat: 20.5937, lng: 78.9629 }, Netherlands: { lat: 52.1326, lng: 5.2913 },
    Czechia: { lat: 49.8175, lng: 15.473 }, Belgium: { lat: 50.5039, lng: 4.4699 },
    Switzerland: { lat: 46.8182, lng: 8.2275 }, Kenya: { lat: -0.0236, lng: 37.9062 },
    Vietnam: { lat: 14.0583, lng: 108.2772 }, 'Hong Kong': { lat: 22.3193, lng: 114.1694 },
    Australia: { lat: -25.2744, lng: 133.7751 }, 'South Korea': { lat: 35.9078, lng: 127.7669 },
    Brazil: { lat: -14.235, lng: -51.9253 }, Austria: { lat: 47.5162, lng: 14.5501 },
    Shanghai: { lat: 31.2304, lng: 121.4737 }, Mumbai: { lat: 19.076, lng: 72.8777 },
    Shenzhen: { lat: 22.5431, lng: 114.0579 }, 'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
    Newark: { lat: 40.7357, lng: -74.1724 }, Gdansk: { lat: 54.372158, lng: 18.638306 },
    Milan: { lat: 45.4642, lng: 9.19 }, Zurich: { lat: 47.3769, lng: 8.5417 },
    Prague: { lat: 50.0755, lng: 14.4378 }, Nairobi: { lat: -1.2921, lng: 36.8219 },
    'Port of Gdansk': { lat: 54.401, lng: 18.675 }, Rotterdam: { lat: 51.9225, lng: 4.47917 },
    Antwerp: { lat: 51.2213, lng: 4.4051 }, Bremerhaven: { lat: 53.5425, lng: 8.5819 },
    'Los Angeles': { lat: 34.0522, lng: -118.2437 }, Berlin: { lat: 52.5200, lng: 13.4050 },
    Paris: { lat: 48.8566, lng: 2.3522 }, Frankfurt: { lat: 50.1109, lng: 8.6821 },
    Lyon: { lat: 45.7640, lng: 4.8357 }, Stuttgart: { lat: 48.7758, lng: 9.1829 },
  }), []);

  const handlePolygonClick = useCallback((feat: GeoJsonFeature) => {
    if (feat.properties) {
      setClickedCountryInfo(feat.properties as CountryProperties);
      const countryName = (feat.properties as CountryProperties).ADMIN;
      const coords = mockCountryCoordinates[countryName];
      if (globeEl.current && coords) {
        globeEl.current.pointOfView({ lat: coords.lat, lng: coords.lng, altitude: 1.5 }, 1000);
      }
    }
  }, [mockCountryCoordinates]);

  const getCountryFromLocationString = useCallback((locationString?: string): string | null => {
    if (!locationString) return null;
    const parts = locationString.split(',').map(p => p.trim());
    const country = parts.pop();
    if (country && (mockCountryCoordinates[country] || EU_COUNTRY_CODES.has(country.toUpperCase()))) return country;
    const city = parts.pop();
    if (city && mockCountryCoordinates[city]) return city;
    return country || null;
  }, [mockCountryCoordinates]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(geoJsonData => setLandPolygons(geoJsonData.features))
      .catch(err => console.error('Error fetching geo data:', err));
  }, []);

  useEffect(() => {
    setHighlightedCountries([]);
    setArcsData([]);
    setSelectedProductAlerts([]);
    setClickedCountryInfo(null);

    if (!selectedProduct) {
      if (globeEl.current) globeEl.current.pointOfView({ lat: 50, lng: 15, altitude: 2.5 }, 1000);
      return;
    }

    const alerts = allAlerts.filter(a => a.productId === selectedProduct.id);
    setSelectedProductAlerts(alerts);
    
    const allArcs: any[] = [];
    const allHighlightedCountries = new Set<string>();

    if (selectedProduct.transit) {
      const { transit } = selectedProduct;
      const originCountry = getCountryFromLocationString(transit.origin);
      const destinationCountry = getCountryFromLocationString(transit.destination);
      const originCoords = originCountry ? mockCountryCoordinates[originCountry] : null;
      const destinationCoords = destinationCountry ? mockCountryCoordinates[destinationCountry] : null;

      if (originCountry) allHighlightedCountries.add(originCountry);
      if (destinationCountry) allHighlightedCountries.add(destinationCountry);

      if (originCoords && destinationCoords) {
        allArcs.push({
          startLat: originCoords.lat, startLng: originCoords.lng,
          endLat: destinationCoords.lat, endLng: destinationCoords.lng,
          color: theme === 'dark' ? '#60A5FA' : '#3B82F6', label: `${selectedProduct.productName} Transit`,
        });
      }
    }

    fetch(`/api/v1/dpp/graph/${selectedProduct.id}`)
      .then(res => (res.ok ? res.json() : null))
      .then(graph => {
        if (!graph || !graph.nodes) return;

        const manufacturerNode = graph.nodes.find((n: any) => n.type === 'manufacturer');
        const manufacturerCountry = getCountryFromLocationString(manufacturerNode?.data?.location);
        const manufacturerCoords = manufacturerCountry ? mockCountryCoordinates[manufacturerCountry] : null;

        if (manufacturerCountry) allHighlightedCountries.add(manufacturerCountry);

        if (manufacturerCoords) {
          graph.nodes.forEach((node: any) => {
            if (node.type === 'supplier') {
              const supplierCountry = getCountryFromLocationString(node.data.location);
              if (supplierCountry) {
                allHighlightedCountries.add(supplierCountry);
                const supplierCoords = mockCountryCoordinates[supplierCountry];
                if (supplierCoords && supplierCountry !== manufacturerCountry) {
                  allArcs.push({
                    startLat: supplierCoords.lat, startLng: supplierCoords.lng,
                    endLat: manufacturerCoords.lat, endLng: manufacturerCoords.lng,
                    color: theme === 'dark' ? '#FBBF24' : '#F59E0B', label: `Supply from ${supplierCountry}`,
                  });
                }
              }
            }
          });
        }
        setArcsData(allArcs);
        setHighlightedCountries(Array.from(allHighlightedCountries));
      })
      .catch(err => {
        console.error('Error fetching product graph:', err);
        setArcsData(allArcs);
        setHighlightedCountries(Array.from(allHighlightedCountries));
      });
  }, [selectedProduct, mockCountryCoordinates, getCountryFromLocationString, theme, allAlerts]);

  const isEU = useCallback((isoA3: string | undefined) => !!isoA3 && EU_COUNTRY_CODES.has(isoA3.toUpperCase()), []);

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
  }, [countryFilter, landPolygons, highlightedCountries, isEU, selectedProduct]);

  const globeMaterial = useMemo(() => {
    return new MeshPhongMaterial({ color: theme === 'dark' ? '#0f172a' : '#e0f2fe', transparent: true, opacity: 1 });
  }, [theme]);

  useEffect(() => {
    if (globeEl.current && globeReady) {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = isAutoRotating;
        controls.autoRotateSpeed = 0.3;
        controls.enableZoom = true;
        controls.minDistance = 150;
        controls.maxDistance = 1000;
      }
      if (!selectedProduct) globeEl.current.pointOfView({ lat: 50, lng: 15, altitude: 2.0 }, 1000);
    }
  }, [globeReady, isAutoRotating, selectedProduct]);

  const getPolygonCapColor = useCallback((feat: GeoJsonFeature) => {
    if (!feat.properties) return theme === 'dark' ? '#334155' : '#e2e8f0'; 
    const p = feat.properties as CountryProperties;
    const isDark = theme === 'dark';
    if (clickedCountryInfo && (clickedCountryInfo.ADM0_A3 === p.ADM0_A3 || clickedCountryInfo.ADMIN === p.ADMIN)) return 'tomato';
    if (highlightedCountries.some(hc => p.ADMIN.toLowerCase().includes(hc.toLowerCase()))) return isDark ? '#FBBF24' : '#F59E0B';
    if (isEU(p.ADM0_A3)) return isDark ? '#2563eb' : '#002D62';
    return isDark ? '#334155' : '#e2e8f0';
  }, [theme, isEU, highlightedCountries, clickedCountryInfo]);

  const getPolygonLabel = useCallback((feat: GeoJsonFeature) => {
    if (!feat.properties) return '';
    const p = feat.properties as CountryProperties;
    const name = p.ADMIN;
    let roles = [];
    if (isEU(p.ADM0_A3)) roles.push('EU Member');
    if (selectedProduct) {
        if(getCountryFromLocationString(selectedProduct.transit?.origin) === name) roles.push('Transit Origin');
        if(getCountryFromLocationString(selectedProduct.transit?.destination) === name) roles.push('Transit Destination');
    }
    return `<div style="background: rgba(40,40,40,0.8); color: white; padding: 5px 8px; border-radius: 4px; font-size: 12px;"><b>${name}</b><br/>${roles.join(', ')}</div>`;
  }, [isEU, selectedProduct, getCountryFromLocationString]);
  
  const handleProductSelect = (productId: string | null) => {
    setSelectedProductId(productId);
    const newPath = productId ? `/dashboard/admin/global-tracker?productId=${productId}` : '/dashboard/admin/global-tracker';
    router.push(newPath, { scroll: false });
  };

  const destinationCountry = selectedProduct?.transit ? getCountryFromLocationString(selectedProduct.transit.destination) : null;

  return (
    <div className="relative h-[calc(100vh-10rem)] w-full" ref={containerRef}>
      <GlobeControls
        products={allProducts}
        selectedProductId={selectedProductId}
        onProductSelect={handleProductSelect}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        isAutoRotating={isAutoRotating}
        onToggleRotation={() => setIsAutoRotating(!isAutoRotating)}
        isProductSelected={!!selectedProduct}
      />
      {globeSize.width > 0 && typeof window !== 'undefined' ? (
        <>
          <Globe
            ref={globeEl}
            width={globeSize.width} height={globeSize.height}
            backgroundColor="rgba(0,0,0,0)"
            globeMaterial={globeMaterial}
            polygonsData={filteredLandPolygons}
            polygonCapColor={getPolygonCapColor}
            polygonSideColor={() => 'rgba(0, 100, 0, 0.05)'}
            polygonStrokeColor={() => (theme === 'dark' ? '#475569' : '#000000')}
            polygonAltitude={0.01}
            onPolygonClick={handlePolygonClick}
            polygonLabel={getPolygonLabel}
            polygonsTransitionDuration={300}
            arcsData={arcsData}
            arcColor={'color'}
            arcDashLength={0.4} arcDashGap={0.1} arcDashAnimateTime={2000}
            arcStroke={0.5} arcLabel="label"
            onGlobeReady={() => setGlobeReady(true)}
            enablePointerInteraction={true}
          />
          {selectedProduct && (
            <SelectedProductCustomsInfoCard
              product={selectedProduct}
              alerts={selectedProductAlerts}
              onDismiss={() => handleProductSelect(null)}
              destinationCountry={destinationCountry}
            />
          )}
          {clickedCountryInfo && (
            <ClickedCountryInfoCard countryInfo={clickedCountryInfo} onDismiss={() => setClickedCountryInfo(null)} />
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-globe-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs p-2 rounded-md shadow-lg pointer-events-none backdrop-blur-sm border">
        <Info className="inline h-3 w-3 mr-1" />
        <span className="font-bold">Legend:</span> EU Countries: <span className="text-blue-600 dark:text-blue-400 font-semibold">Blue</span> | Product Focus: <span className="text-amber-600 dark:text-amber-400 font-semibold">Amber</span>
      </div>
    </div>
  );
}
