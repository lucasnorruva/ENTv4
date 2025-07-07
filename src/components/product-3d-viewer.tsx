// src/components/product-3d-viewer.tsx
'use client';

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { Vector3, Box3 } from 'three';
import type { ModelHotspot } from '@/types';
import { Info, X } from 'lucide-react';

function Hotspot({
  hotspot,
  onClick,
}: {
  hotspot: ModelHotspot;
  onClick: (data: any) => void;
}) {
  return (
    <Html position={hotspot.position as any} distanceFactor={10}>
      <div
        className="w-6 h-6 bg-primary/80 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary transition-colors text-primary-foreground animate-pulse"
        onClick={e => {
          e.stopPropagation();
          onClick(hotspot.data);
        }}
      >
        <Info size={16} />
      </div>
    </Html>
  );
}

function Model({
  url,
  hotspots,
  onHotspotClick,
}: {
  url: string;
  hotspots?: ModelHotspot[];
  onHotspotClick: (data: any) => void;
}) {
  const { scene } = useGLTF(url);
  // This will scale the model to fit a 1x1x1 box, which is helpful.
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 1.0 / maxDim;

  return (
    <primitive object={scene} scale={scale}>
      {hotspots?.map((hotspot, i) => (
        <Hotspot key={i} hotspot={hotspot} onClick={onHotspotClick} />
      ))}
    </primitive>
  );
}

export default function Product3DViewer({
  modelUrl,
  hotspots,
}: {
  modelUrl: string;
  hotspots?: ModelHotspot[];
}) {
  const [selectedHotspotData, setSelectedHotspotData] = useState<any | null>(
    null,
  );

  const handleHotspotClick = (data: any) => {
    setSelectedHotspotData(data);
  };

  const handleCloseInfo = () => {
    setSelectedHotspotData(null);
  };

  return (
    <div className="w-full h-96 rounded-lg bg-muted relative border">
      <Canvas camera={{ fov: 50, position: [2, 1, 2] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <pointLight position={[10, 10, 10]} decay={0} intensity={Math.PI} />
          <Model
            url={modelUrl}
            hotspots={hotspots}
            onHotspotClick={handleHotspotClick}
          />
        </Suspense>
        <OrbitControls />
      </Canvas>
      {selectedHotspotData && (
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg border shadow-lg max-w-xs animate-in fade-in-50">
          <button
            onClick={handleCloseInfo}
            className="absolute top-1 right-1 p-1 rounded-full hover:bg-muted"
          >
            <X size={14} />
            <span className="sr-only">Close</span>
          </button>
          <h4 className="font-bold text-sm">{selectedHotspotData.name}</h4>
          <p className="text-xs text-muted-foreground">
            Material: {selectedHotspotData.material}
          </p>
        </div>
      )}
    </div>
  );
}
