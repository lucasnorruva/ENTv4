// src/components/dpp-tracker/global-tracker-client.tsx
'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { GlobeMethods } from 'react-globe.gl';
import { MeshPhongMaterial } from 'three';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { GeoJsonFeature } from 'geojson';

import type {
  Product,
  CustomsAlert,
  User,
  ProductionLine,
  SimulatedRoute,
} from '@/types';
import SelectedProductCustomsInfoCard from '@/components/dpp-tracker/SelectedProductCustomsInfoCard';
import ClickedCountryInfoCard from '@/components/dpp-tracker/ClickedCountryInfoCard';
import OperationalPointInfoCard from '@/components/dpp-tracker/OperationalPointInfoCard';
import GlobeControls from './GlobeControls';
import {
  mockCountryCoordinates,
  getCountryFromLocationString,
} from '@/lib/country-coordinates';
import { MOCK_CUSTOMS_DATA } from '@/lib/customs-data';
import {
  getPointColorForStatus,
  getFactoryColor,
} from '@/lib/dppDisplayUtils';
import { useToast } from '@/hooks/use-toast';
import { getProductionLines } from '@/lib/actions';
import { MOCK_SUPPLIERS } from '@/lib/supplier-data';
import RouteAnalysisPanel from './RouteAnalysisPanel';
import { analyzeSimulatedRoute as analyzeRouteAction } from '@/lib/actions/product-ai-actions';
import SimulatedRouteInfoCard from './SimulatedRouteInfoCard';

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
  'AUT',
  'BEL',
  'BGR',
  'HRV',
  'CYP',
  'CZE',
  'DNK',
  'EST',
  'FIN',
  'FRA',
  'DEU',
  'GRC',
  'HUN',
  'IRL',
  'ITA',
  'LVA',
  'LTU',
  'LUX',
  'MLT',
  'NLD',
  'POL',
  'PRT',
  'ROU',
  'SVK',
  'SVN',
  'ESP',
  'SWE',
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
  const { toast } = useToast();

  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [filteredLandPolygons, setFilteredLandPolygons] = useState<
    GeoJsonFeature[]
  >([]);
  const [globeReady, setGlobeReady] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const productIdFromQuery = searchParams.get('productId');
  const [selectedProductId, setSelectedProductId] =
    useState<string | null>(productIdFromQuery);
  const [clickedCountryInfo, setClickedCountryInfo] =
    useState<CountryProperties | null>(null);
  const [clickedFactory, setClickedFactory] = useState<ProductionLine | null>(
    null,
  );

  const [countryFilter, setCountryFilter] = useState<
    'all' | 'eu' | 'supplyChain'
  >('all');
  const [riskFilter, setRiskFilter] = useState<
    'all' | 'High' | 'Medium' | 'Low'
  >('all');
  const [showFactories, setShowFactories] = useState(true);
  const [showCustomsAlerts, setShowCustomsAlerts] = useState(true);

  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [simulatedRoute, setSimulatedRoute] = useState<SimulatedRoute | null>(null);
  const [isAnalyzingRoute, startRouteAnalysisTransition] = useTransition();

  const [isMounted, setIsMounted] = useState(false);
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [highlightedCountries, setHighlightedCountries] = useState<string[]>(
    [],
  );
  const [ringsData, setRingsData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const countryRiskMap = useMemo(() => {
    const map = new Map<string, 'Low' | 'Medium' | 'High'>();
    MOCK_CUSTOMS_DATA.forEach(data => {
      data.keywords.forEach(keyword => {
        if (!map.has(keyword)) map.set(keyword, data.riskLevel);
      });
    });
    return map;
  }, []);

  const globeMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: theme === 'dark' ? '#0f172a' : '#e0f2fe',
        transparent: true,
        opacity: 1,
      }),
    [theme],
  );

  const isEU = useCallback(
    (isoA3: string | undefined) =>
      !!isoA3 && EU_COUNTRY_CODES.has(isoA3.toUpperCase()),
    [],
  );

  const getPolygonCapColor = useCallback(
    (feat: GeoJsonFeature) => {
      if (!feat.properties) return theme === 'dark' ? '#334155' : '#e2e8f0';
      const p = feat.properties as CountryProperties;
      const isDark = theme === 'dark';
      const countryNameLower = p.ADMIN.toLowerCase();

      if (
        clickedCountryInfo &&
        (clickedCountryInfo.ADM0_A3 === p.ADM0_A3 ||
          clickedCountryInfo.ADMIN === p.ADMIN)
      )
        return 'tomato';
      if (
        highlightedCountries.some(hc =>
          countryNameLower.includes(hc.toLowerCase()),
        )
      )
        return isDark ? '#FBBF24' : '#F59E0B';

      if (
        riskFilter !== 'all' &&
        countryRiskMap.get(countryNameLower) === riskFilter
      ) {
        if (riskFilter === 'High') return isDark ? '#ef4444' : '#b91c1c';
        if (riskFilter === 'Medium') return isDark ? '#f59e0b' : '#d97706';
        if (riskFilter === 'Low') return isDark ? '#22c55e' : '#16a34a';
      }

      if (isEU(p.ADM0_A3 || p.ISO_A3)) return isDark ? '#2563eb' : '#002D62';

      return isDark ? '#334155' : '#e2e8f0';
    },
    [
      theme,
      isEU,
      highlightedCountries,
      clickedCountryInfo,
      riskFilter,
      countryRiskMap,
    ],
  );

  useEffect(() => {
    Promise.all([
      fetch(
        'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
      ).then(res => res.json()),
      getProductionLines(),
    ])
      .then(([geoJsonData, lines]) => {
        setLandPolygons(geoJsonData.features);
        setFilteredLandPolygons(geoJsonData.features);
        setProductionLines(lines);
      })
      .catch(err => console.error('Error fetching initial globe data:', err));
  }, []);

  const handleProductSelect = useCallback(
    (productId: string | null) => {
      setClickedFactory(null);
      setSelectedProductId(productId);
      setClickedCountryInfo(null);
      setSimulatedRoute(null);
      const params = new URLSearchParams(searchParams.toString());
      if (productId) {
        params.set('productId', productId);
        setCountryFilter('supplyChain');
      } else {
        params.delete('productId');
        setCountryFilter('all');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handlePolygonClick = useCallback((feat: GeoJsonFeature) => {
    const countryProps = feat.properties as CountryProperties;
    if (!countryProps) return;

    setClickedCountryInfo(countryProps);
    setClickedFactory(null);
    setSimulatedRoute(null);
    const countryName = countryProps.ADMIN;
    const coords = mockCountryCoordinates[countryName];
    if (globeEl.current && coords) {
      globeEl.current.pointOfView(
        { lat: coords.lat, lng: coords.lng, altitude: 1.5 },
        1000,
      );
    }
  }, []);

  const handleLabelClick = useCallback((label: any) => {
    setClickedFactory(label.data as ProductionLine);
    setClickedCountryInfo(null);
    setSimulatedRoute(null);
    if (globeEl.current) {
      globeEl.current.pointOfView(
        { lat: label.lat, lng: label.lng, altitude: 1.5 },
        1000,
      );
    }
  }, []);

  const selectedProduct = useMemo(
    () => allProducts.find(p => p.id === selectedProductId),
    [selectedProductId, allProducts],
  );
  const selectedProductAlerts = useMemo(
    () => allAlerts.filter(a => a.productId === selectedProductId),
    [selectedProductId, allAlerts],
  );

  const factoryPoints = useMemo(() => {
    if (!showFactories) return [];
    return productionLines
      .map(line => {
        const coords =
          mockCountryCoordinates[
            getCountryFromLocationString(line.location) || ''
          ];
        if (!coords) return null;
        return {
          ...coords,
          name: line.name,
          color: getFactoryColor(line.status),
          size: 0.6,
          data: line,
        };
      })
      .filter(p => p !== null);
  }, [showFactories, productionLines]);

  useEffect(() => {
    const newArcs: any[] = [];
    const newPoints: any[] = [];
    const newHighlightedCountries = new Set<string>();

    const processProduct = (product: Product, isSelected: boolean) => {
      const pointColor = getPointColorForStatus(product.verificationStatus);
      const factoryCountry = product.manufacturing?.country
        ? getCountryFromLocationString(product.manufacturing.country)
        : null;
      const factoryCoords = factoryCountry ? mockCountryCoordinates[factoryCountry] : null;

      // Material Sourcing Arcs
      if (isSelected && factoryCoords) {
        product.materials.forEach(material => {
          if (material.origin) {
            const supplier = MOCK_SUPPLIERS.find(s => s.location.includes(material.origin!));
            const originCountry = supplier ? getCountryFromLocationString(supplier.location) : null;
            const originCoords = originCountry ? mockCountryCoordinates[originCountry] : null;
            
            if (originCoords) {
              const materialColor = '#fbbf24';
              newPoints.push({ lat: originCoords.lat, lng: originCoords.lng, size: 0.2, color: materialColor, name: `Supplier: ${supplier?.name}` });
              newArcs.push({
                startLat: originCoords.lat,
                startLng: originCoords.lng,
                endLat: factoryCoords.lat,
                endLng: factoryCoords.lng,
                color: [materialColor, materialColor],
                stroke: 0.2,
                label: `Material: ${material.name}`
              });
              if(originCountry) newHighlightedCountries.add(originCountry);
            }
          }
        });
      }

      // Final Product Transit Arc
      if (product.transit) {
        const { transit } = product;
        const originCoords = factoryCoords || mockCountryCoordinates[getCountryFromLocationString(transit.origin) || ''];
        const destinationCoords =
          mockCountryCoordinates[
            getCountryFromLocationString(transit.destination) || ''
          ];
        
        if (originCoords)
          newPoints.push({
            lat: originCoords.lat,
            lng: originCoords.lng,
            size: 0.3,
            color: pointColor,
            name: `Origin: ${transit.origin}`,
          });
        if (destinationCoords)
          newPoints.push({
            lat: destinationCoords.lat,
            lng: destinationCoords.lng,
            size: 0.5,
            color: pointColor,
            name: `Destination: ${transit.destination}`,
          });
        if (originCoords && destinationCoords) {
          newArcs.push({
            startLat: originCoords.lat,
            startLng: originCoords.lng,
            endLat: destinationCoords.lat,
            endLng: destinationCoords.lng,
            color: [pointColor, pointColor],
            label: `${product.productName} Transit`,
          });
        }
      }
      if (isSelected) {
        if(factoryCountry) newHighlightedCountries.add(factoryCountry);
        const destCountry = getCountryFromLocationString(
          product.transit?.destination,
        );
        if (destCountry) newHighlightedCountries.add(destCountry);
      }
    };

    if (selectedProduct) {
      processProduct(selectedProduct, true);
    } else {
      allProducts.forEach(p => processProduct(p, false));
    }

    if (simulatedRoute) {
        const originCoords = mockCountryCoordinates[simulatedRoute.origin];
        const destCoords = mockCountryCoordinates[simulatedRoute.destination];
        if (originCoords && destCoords) {
          newArcs.push({
            startLat: originCoords.lat,
            startLng: originCoords.lng,
            endLat: destCoords.lat,
            endLng: destCoords.lng,
            color: ['#8B5CF6', '#EC4899'], // A vibrant gradient for simulation
            label: `Simulated: ${simulatedRoute.origin} to ${simulatedRoute.destination}`,
            dashLength: 0.2,
            dashGap: 0.1,
            dashAnimateTime: 1000,
          });
          newHighlightedCountries.add(simulatedRoute.origin);
          newHighlightedCountries.add(simulatedRoute.destination);
        }
      }

    setArcsData(newArcs);
    setPointsData(newPoints);
    setHighlightedCountries(Array.from(newHighlightedCountries));
    
    // Process alerts for rings
    const alertColorMapping = {
        High: 'rgba(239, 68, 68, 0.7)',
        Medium: 'rgba(245, 158, 11, 0.7)',
        Low: 'rgba(34, 197, 94, 0.7)',
    };

    const newRings = showCustomsAlerts ? allAlerts.map(alert => ({
        lat: alert.lat,
        lng: alert.lng,
        maxR: alert.severity === 'High' ? 10 : 5,
        propagationSpeed: alert.severity === 'High' ? 2 : 1,
        color: alertColorMapping[alert.severity],
    })) : [];
    
    setRingsData(newRings);

  }, [selectedProduct, allProducts, theme, simulatedRoute, showCustomsAlerts, allAlerts]);

  useEffect(() => {
    if (!landPolygons.length) return;
    let filtered = landPolygons;
    if (countryFilter === 'eu') {
      filtered = landPolygons.filter(feat =>
        isEU(feat.properties?.ADM0_A3 || feat.properties?.ISO_A3),
      );
    } else if (
      countryFilter === 'supplyChain' &&
      highlightedCountries.length > 0
    ) {
      filtered = landPolygons.filter(feat => {
        const p = feat.properties as CountryProperties;
        const adminName = p.ADMIN || p.NAME_LONG || '';
        return highlightedCountries.some(hc =>
          adminName.toLowerCase().includes(hc.toLowerCase()),
        );
      });
    } else if (riskFilter !== 'all') {
      filtered = landPolygons.filter(feat => {
        const p = feat.properties as CountryProperties;
        const adminNameLower = p.ADMIN.toLowerCase();
        return countryRiskMap.get(adminNameLower) === riskFilter;
      });
    }
    setFilteredLandPolygons(filtered);
  }, [
    countryFilter,
    landPolygons,
    highlightedCountries,
    selectedProduct,
    isEU,
    riskFilter,
    countryRiskMap,
  ]);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || !globeReady) return;
    const controls = globe.controls() as any;
    if (controls) {
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.minDistance = 150;
      controls.maxDistance = 1000;
    }
    if (selectedProduct && selectedProduct.transit) {
      const destinationCountry = getCountryFromLocationString(
        selectedProduct.transit.destination,
      );
      const destinationCoords = destinationCountry
        ? mockCountryCoordinates[destinationCountry]
        : null;
      if (destinationCoords)
        globe.pointOfView(
          {
            lat: destinationCoords.lat,
            lng: destinationCoords.lng,
            altitude: 1.5,
          },
          1000,
        );
    } else {
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  }, [globeReady, isAutoRotating, selectedProduct]);

  const destinationCountry = selectedProduct?.transit
    ? getCountryFromLocationString(selectedProduct.transit.destination)
    : null;

  const productsToCountry = useMemo(() => {
    if (!clickedCountryInfo) return [];
    return allProducts.filter(p =>
      p.transit?.destination.includes(clickedCountryInfo.ADMIN),
    );
  }, [clickedCountryInfo, allProducts]);

  const productsFromCountry = useMemo(() => {
    if (!clickedCountryInfo) return [];
    return allProducts.filter(p =>
      p.transit?.origin.includes(clickedCountryInfo.ADMIN),
    );
  }, [clickedCountryInfo, allProducts]);

  const handleAnalyzeNewRoute = (
    productId: string,
    origin: string,
    destination: string,
  ) => {
    startRouteAnalysisTransition(async () => {
      setSimulatedRoute(null);
      setClickedCountryInfo(null);
      setClickedFactory(null);
      setSelectedProductId(null);
      try {
        const result = await analyzeRouteAction(
          productId,
          origin,
          destination,
          user.id,
        );
        setSimulatedRoute(result);
        const destCoords = mockCountryCoordinates[destination];
        if (destCoords && globeEl.current) {
          globeEl.current.pointOfView(
            { lat: destCoords.lat, lng: destCoords.lng, altitude: 1.5 },
            1000,
          );
        }
      } catch (error: any) {
        toast({
          title: 'Analysis Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    });
  };

  if (!isMounted) return null;

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
        showFactories={showFactories}
        onToggleFactories={setShowFactories}
        showCustomsAlerts={showCustomsAlerts}
        onToggleCustomsAlerts={setShowCustomsAlerts}
        onToggleAnalysisPanel={() => setIsAnalysisPanelOpen(prev => !prev)}
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
        arcDashLength={(d: any) => d.dashLength || 0.4}
        arcDashGap={(d: any) => d.dashGap || 0.1}
        arcDashAnimateTime={(d: any) => d.dashAnimateTime || 2000}
        arcStroke={'stroke'}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius="size"
        pointLabel="name"
        labelsData={factoryPoints}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelText={(d: any) => d.name}
        labelSize={() => 0.5}
        labelColor={(d: any) => d.color}
        labelDotRadius={() => 0.6}
        onLabelClick={handleLabelClick}
        ringsData={ringsData}
        ringMaxRadius="maxR"
        ringColor={() => (d: any) => d.color}
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod={1000}
        onGlobeReady={() => setGlobeReady(true)}
      />
      {selectedProduct && (
        <SelectedProductCustomsInfoCard
          product={selectedProduct}
          user={user}
          alerts={selectedProductAlerts}
          onDismiss={() => handleProductSelect(null)}
          destinationCountry={destinationCountry}
          roleSlug={roleSlug}
        />
      )}
      {clickedCountryInfo && (
        <ClickedCountryInfoCard
          countryInfo={clickedCountryInfo}
          productsTo={productsToCountry}
          productsFrom={productsFromCountry}
          onDismiss={() => setClickedCountryInfo(null)}
          onProductSelect={handleProductSelect}
          roleSlug={roleSlug}
        />
      )}
      {clickedFactory && (
        <OperationalPointInfoCard
          line={clickedFactory}
          onDismiss={() => setClickedFactory(null)}
          roleSlug={roleSlug}
        />
      )}
       {simulatedRoute && (
        <SimulatedRouteInfoCard route={simulatedRoute} onDismiss={() => setSimulatedRoute(null)} />
      )}
      <RouteAnalysisPanel
        isOpen={isAnalysisPanelOpen}
        products={allProducts}
        isAnalyzing={isAnalyzingRoute}
        onAnalyze={handleAnalyzeNewRoute}
      />
    </div>
  );
}
