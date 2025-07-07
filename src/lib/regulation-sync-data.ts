// src/lib/regulation-sync-data.ts
import type { RegulationSource } from '@/types';

export const regulationSyncData: RegulationSource[] = [
  {
    id: 'echa_reach_scip',
    name: 'ECHA REACH & SCIP',
    type: 'API',
    status: 'Operational',
    version: 'v3.1',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'token_access',
        description: 'Confirm API token access & rate limits',
        status: true,
      },
      {
        id: 'parse_lists',
        description: 'Parse Candidate List, Authorisation List, SCIP notifications',
        status: true,
      },
      {
        id: 'normalize_uuids',
        description: 'Normalize substance UUIDs to internal format',
        status: true,
      },
      {
        id: 'map_risks',
        description: 'Map chemical risks to product types',
        status: false,
      },
      {
        id: 'enable_ai_prompts',
        description: 'Enable keyword-based AI risk prompts (PFAS, SVHCs)',
        status: true,
      },
    ],
  },
  {
    id: 'espr',
    name: 'ESPR Data Layer',
    type: 'API',
    status: 'Operational',
    version: 'v1.1',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'confirm_schema',
        description: 'Confirm schema (v1.1) and endpoint structure',
        status: true,
      },
      {
        id: 'sync_datasets',
        description: 'Sync Product Environmental Performance datasets',
        status: true,
      },
      {
        id: 'index_criteria',
        description: 'Index ESPR criteria by category',
        status: true,
      },
      {
        id: 'alert_logic',
        description: 'Create alert logic for upcoming regulation cutoffs',
        status: true,
      },
      {
        id: 'map_readiness_score',
        description: 'Map readiness score logic to Gemini AI module',
        status: true,
      },
    ],
  },
  {
    id: 'eu_battery',
    name: 'EU Battery Regulation Feed',
    type: 'Feed',
    status: 'Operational',
    version: 'v2.0',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'fetch_structure',
        description: 'Fetch battery passport structure (v2.0)',
        status: true,
      },
      {
        id: 'track_diligence',
        description: 'Track due diligence fields (cobalt sourcing, etc.)',
        status: true,
      },
      {
        id: 'validate_carbon',
        description: 'Validate carbon footprint methodology',
        status: true,
      },
      {
        id: 'alert_non_compliance',
        description: 'Enable "Non-compliance Alert" logic on real-time updates',
        status: true,
      },
    ],
  },
  {
    id: 'eu_ecolabel',
    name: 'EU Ecolabel Registry',
    type: 'API',
    status: 'Operational',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'pull_classes',
        description: 'Pull certified product classes + awarded criteria',
        status: true,
      },
      {
        id: 'crosscheck_claims',
        description: 'Crosscheck brand claims against Ecolabel requirements',
        status: true,
      },
      {
        id: 'enable_eligibility_check',
        description: 'Enable Ecolabel badge eligibility check per SKU',
        status: true,
      },
    ],
  },
  {
    id: 'eprel',
    name: 'EPREL Database',
    type: 'API',
    status: 'Degraded Performance',
    version: 'v4.5',
    lastSync: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
    checklist: [
      {
        id: 'connect_schema',
        description: 'Connect to v4.5 schema (degraded - retry logic)',
        status: true,
      },
      {
        id: 'import_categories',
        description: 'Import product energy label categories and statuses',
        status: true,
      },
      {
        id: 'link_verification',
        description: 'Link to verification page in public view',
        status: false,
      },
    ],
  },
   {
    id: 'taric',
    name: 'EU Customs (TARIC)',
    type: 'API',
    status: 'Operational',
    version: 'v1.8',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'sync_schema',
        description: 'Sync customs code schema (v1.8)',
        status: true,
      },
      {
        id: 'auto_classify',
        description: 'Auto-classify product TARIC codes via AI',
        status: true,
      },
      {
        id: 'alert_dual_use',
        description: 'Alert for dual-use goods, carbon border tax implications',
        status: true,
      },
    ],
  },
  {
    id: 'eurlex',
    name: 'EU Legislation (EUR-Lex)',
    type: 'API',
    status: 'Operational',
    lastSync: new Date().toISOString(),
    checklist: [
      {
        id: 'fetch_texts',
        description: 'Fetch legal texts by CELEX number or regulation ID',
        status: true,
      },
      {
        id: 'tag_rules',
        description: 'Tag incoming rules with product category relevance',
        status: true,
      },
      {
        id: 'store_excerpts',
        description: 'Store legal text excerpts for Gemini to summarize',
        status: true,
      },
    ],
  },
  {
    id: 'cirpass',
    name: 'CIRPASS Initiative',
    type: 'Manual',
    status: 'Operational',
    lastSync: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    checklist: [
      {
        id: 'align_fields',
        description: 'Align DPP fields with CIRPASS standard data model',
        status: true,
      },
      {
        id: 'verify_uuid',
        description: 'Verify DPP UUID assignment + NFT anchoring logic',
        status: true,
      },
      {
        id: 'enable_export',
        description: 'Enable CIRPASS-compliant export for brands and auditors',
        status: true,
      },
    ],
  },
  {
    id: 'echa_cl',
    name: 'ECHA C&L Inventory',
    type: 'API',
    status: 'Not Implemented',
    version: 'v2.8',
    lastSync: '',
    checklist: [
      {
        id: 'sync_entries',
        description: 'Sync v2.8 hazardous chemical labeling entries',
        status: false,
      },
      {
        id: 'include_fields',
        description: 'Include Hazard Classification, Signal Words, Pictograms',
        status: false,
      },
      {
        id: 'overlay_map',
        description: 'Overlay into visual risk map on product DPP',
        status: false,
      },
    ],
  },
];
