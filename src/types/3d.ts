// src/types/3d.ts

export interface ModelHotspot {
    position: [number, number, number];
    data: any;
    interactionType: 'showInfo' | 'playAnimation';
  }
