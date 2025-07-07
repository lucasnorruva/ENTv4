// src/components/product-3d-viewer.tsx
'use client';

import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { Vector3, Box3 } from 'three';
import type { ModelHotspot } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { X } from 'lucide-react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // This will scale the model to fit a 1x1x1 box, which is helpful.
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 1.0 / maxDim;

  return <primitive object={scene} scale={scale} />;
}

function Hotspot({
  position,
  onClick,
}: {
  position: [number, number, number];
  onClick: () => void;
}) {
  const ref = useRef<any>();

  useFrame(() => {
    if (ref.current) {
      ref.current.material.opacity = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
    }
  });

  return (
    <mesh position={position} onClick={onClick} ref={ref}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color="tomato" transparent />
    </mesh>
  );
}

function Annotation({
  hotspot,
  onClose,
}: {
  hotspot: ModelHotspot;
  onClose: () => void;
}) {
  return (
    <Html position={[hotspot.position.x, hotspot.position.y, hotspot.position.z]}>
      <Card className="w-64 -translate-x-1/2 -translate-y-[calc(100%+20px)] shadow-lg bg-card/90 backdrop-blur-sm">
        <CardHeader className="p-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">{hotspot.label}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="h-4 w-4"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground">{hotspot.description}</p>
        </CardContent>
      </Card>
    </Html>
  );
}

export default function Product3DViewer({
  modelUrl,
  hotspots,
}: {
  modelUrl: string;
  hotspots?: ModelHotspot[];
}) {
  const [selectedHotspot, setSelectedHotspot] = useState<ModelHotspot | null>(
    null,
  );

  return (
    <div className="w-full h-96 rounded-lg bg-muted relative border">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, position: [2, 2, 2] }}>
        <Suspense
          fallback={
            <Html center>
              <Loader2 className="h-8 w-8 animate-spin" />
            </Html>
          }
        >
          <ambientLight intensity={Math.PI / 2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
          <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
          <Model url={modelUrl} />
          {hotspots?.map((hotspot, index) => (
            <Hotspot
              key={index}
              position={[
                hotspot.position.x,
                hotspot.position.y,
                hotspot.position.z,
              ]}
              onClick={() => setSelectedHotspot(hotspot)}
            />
          ))}
          {selectedHotspot && (
              <Annotation hotspot={selectedHotspot} onClose={() => setSelectedHotspot(null)} />
          )}
        </Suspense>
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}
