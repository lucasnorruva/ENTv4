// src/components/product-3d-viewer.tsx
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Html, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  // This will scale the model to fit a 1x1x1 box, which is helpful.
  return <primitive object={scene} scale={1} />;
}

export default function Product3DViewer({ modelUrl }: { modelUrl: string }) {
  return (
    <div className="w-full h-96 rounded-lg bg-muted relative border">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 50, position: [2, 2, 2] }}
      >
        <Suspense
          fallback={
            <Html center>
              <Loader2 className="h-8 w-8 animate-spin" />
            </Html>
          }
        >
          <Stage environment="city" intensity={0.6}>
            <Model url={modelUrl} />
          </Stage>
        </Suspense>
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}
