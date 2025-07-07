// src/components/product-3d-viewer.tsx
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Vector3, Box3 } from 'three';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // This will scale the model to fit a 1x1x1 box, which is helpful.
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 1.0 / maxDim;

  return <primitive object={scene} scale={scale} />;
}

export default function Product3DViewer({
  modelUrl,
}: {
  modelUrl: string;
}) {

  return (
    <div className="w-full h-96 rounded-lg bg-muted relative border">
      <Canvas camera={{ fov: 50, position: [2, 1, 2] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <pointLight position={[10, 10, 10]} decay={0} intensity={Math.PI} />
          <Model url={modelUrl} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
