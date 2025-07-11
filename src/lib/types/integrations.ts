// src/types/integrations.ts
import type { BaseEntity } from ".";

export interface Integration extends BaseEntity {
    name: string;
    type: 'ERP' | 'PLM' | 'E-commerce' | 'CRM' | 'Cloud Storage' | 'Analytics';
    logo: string;
    dataAiHint?: string;
    description: string;
    enabled: boolean;
    status: 'Connected' | 'Disconnected' | 'Error';
    lastSync?: string;
    recordsSynced?: number;
}
