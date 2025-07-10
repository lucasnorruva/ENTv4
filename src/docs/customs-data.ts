// src/lib/customs-data.ts

export interface CustomsRequirement {
  region: string;
  summary: string;
  keyDocs: string[];
  tariffs: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  notes: string;
  relatedRegulations: {
    name: string;
    link: string;
  }[];
  keywords: string[];
}

export const MOCK_CUSTOMS_DATA: CustomsRequirement[] = [
  {
    region: 'European Union (EU)',
    summary:
      'Requires Digital Product Passports for specific categories (e.g., batteries, textiles). Adherence to CE marking, RoHS, and REACH is mandatory. Imports are subject to CBAM reporting for carbon-intensive goods.',
    keyDocs: [
      'Declaration of Conformity',
      'RoHS Test Reports',
      'CBAM Declaration',
      'Commercial Invoice',
    ],
    tariffs: 'Based on TARIC classification. Average ~4.2% for non-EU goods.',
    riskLevel: 'High' as const,
    notes:
      'DPP requirements are being phased in. Check specific product regulations (delegated acts) for timelines.',
    relatedRegulations: [
      {
        name: 'ESPR',
        link: 'https://commission.europa.eu/energy-climate-change-environment/standards-tools-and-labels/products-ecodesign-and-energy-labelling/ecodesign-sustainable-products-regulation_en',
      },
      {
        name: 'CBAM',
        link: 'https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en',
      },
      {
        name: 'REACH',
        link: 'https://echa.europa.eu/regulations/reach/understanding-reach',
      },
    ],
    keywords: ['eu', 'european union', 'rohs', 'reach', 'cbam', 'ce', 'espr', 'germany', 'france', 'italy', 'spain', 'poland', 'netherlands', 'belgium', 'austria'],
  },
  {
    region: 'United States (USA)',
    summary:
      'Goods are subject to inspection by Customs and Border Protection (CBP). Requires compliance with Consumer Product Safety Commission (CPSC) standards. Conflict Minerals reporting required for certain industries under Dodd-Frank Act.',
    keyDocs: [
      'Commercial Invoice',
      'Packing List',
      'Bill of Lading',
      'CPSC Certificate',
      'Importer Security Filing (ISF)',
    ],
    tariffs:
      'Based on HTSUS code. Varies widely by product and origin. Section 301 tariffs may apply to goods from China.',
    riskLevel: 'Medium' as const,
    notes:
      'Customs entries are complex. Use of a licensed customs broker is highly recommended.',
    relatedRegulations: [
      { name: 'CPSC', link: 'https://www.cpsc.gov/' },
      {
        name: 'Dodd-Frank Act (Sec. 1502)',
        link: 'https://www.sec.gov/news/press-release/2012-2012-163htm',
      },
    ],
    keywords: [
      'usa',
      'united states of america',
      'cpsc',
      'conflict minerals',
      'htsus',
      'isf',
      'cbp',
      'america',
    ],
  },
  {
    region: 'China',
    summary:
      'All products must meet GB standards. China Compulsory Certification (CCC) mark is required for many product categories. Strict customs clearance process with detailed documentation and potential for physical inspection.',
    keyDocs: [
      'CCC Mark Certificate',
      'Bill of Lading',
      'Invoice',
      'Customs Declaration Form',
      'Packing List',
    ],
    tariffs:
      'Varies based on product classification and trade agreements. Subject to VAT and consumption tax.',
    riskLevel: 'High' as const,
    notes:
      'Ensure all documentation is translated accurately into Mandarin. Discrepancies can lead to significant delays.',
    relatedRegulations: [
      {
        name: 'CCC Certification',
        link: 'https://www.isccc.gov.cn/en/index.shtml',
      },
      { name: 'GB Standards', link: 'https://www.sac.gov.cn/' },
    ],
    keywords: ['china', 'gb standards', 'ccc', 'mandarin'],
  },
  {
    region: 'United Kingdom (UK)',
    summary:
      'Post-Brexit, requires UKCA marking instead of CE marking for goods placed on the market in Great Britain. Adheres to UK RoHS and UK REACH regulations, which are currently aligned with but separate from EU versions.',
    keyDocs: [
      'UKCA Declaration of Conformity',
      'Customs Declaration (SAD/C88)',
      'Commercial Invoice',
    ],
    tariffs:
      'Based on the UK Global Tariff (UKGT). Imports from EU may require proof of origin for tariff-free access.',
    riskLevel: 'Medium' as const,
    notes:
      'Rules for Northern Ireland differ due to the Windsor Framework. Goods may need to meet EU standards.',
    relatedRegulations: [
      {
        name: 'UKCA Marking',
        link: 'https://www.gov.uk/guidance/using-the-ukca-marking',
      },
      {
        name: 'UK REACH',
        link: 'https://www.gov.uk/guidance/how-to-comply-with-reach-chemical-regulations',
      },
    ],
    keywords: ['uk', 'united kingdom', 'ukca', 'ukgt', 'brexit', 'windsor'],
  },
    {
    region: 'Japan',
    summary:
      'Requires compliance with PSE mark for electrical appliances and electronics. Strict rules on food contact materials and chemicals (CSCL). E-waste recycling laws in place for many product types.',
    keyDocs: [
      'PSE Certificate',
      'Invoice',
      'Bill of Lading',
    ],
    tariffs:
      'Generally low, but depends on product category and country of origin. Japan has many free trade agreements.',
    riskLevel: 'Medium' as const,
    notes:
      'Japanese customs are known for meticulous inspection of documentation. Ensure all details are precise.',
    relatedRegulations: [
      {
        name: 'PSE Law (DENAN)',
        link: 'https://www.meti.go.jp/english/policy/economy/consumer/conformity/index.html',
      },
    ],
    keywords: ['japan', 'pse', 'denan', 'cscl'],
  },
  {
    region: 'India',
    summary:
      'Bureau of Indian Standards (BIS) certification is mandatory for many electronics and IT goods. E-waste management rules are strictly enforced.',
    keyDocs: [
      'BIS Certificate',
      'Bill of Entry',
      'Commercial Invoice',
    ],
    tariffs:
      'High tariffs on many imported goods, particularly consumer electronics.',
    riskLevel: 'High' as const,
    notes:
      'The customs clearance process can be slow and bureaucratic. Accurate paperwork is critical.',
    relatedRegulations: [
      {
        name: 'BIS Certification',
        link: 'https://www.bis.gov.in/',
      },
    ],
    keywords: ['india', 'bis', 'e-waste'],
  },
   {
    region: 'Vietnam',
    summary:
      'Growing manufacturing hub. Requires energy efficiency labeling (VNEEP) for certain products. Member of several free trade agreements (e.g., EVFTA, CPTPP) which can reduce tariffs.',
    keyDocs: [
      'Certificate of Origin (for FTA benefits)',
      'Invoice',
      'Packing List',
      'Quality Inspection Certificate',
    ],
    tariffs:
      'Tariffs vary. Leveraging FTAs is key to cost-effective importation.',
    riskLevel: 'Medium' as const,
    notes:
      'Customs procedures are modernizing but can still be inconsistent across different ports.',
    relatedRegulations: [
      {
        name: 'VNEEP',
        link: 'http://vneec.gov.vn/',
      },
    ],
    keywords: ['vietnam', 'vneep', 'evfta'],
  },
   {
    region: 'Brazil',
    summary:
      'Complex tax and import system (INMETRO certification required for many goods). High import duties and taxes. Known for bureaucratic customs clearance.',
    keyDocs: [
      'INMETRO Certificate',
      'Import Declaration (DI)',
      'Radar License (for importer)',
      'Commercial Invoice',
    ],
    tariffs:
      'Part of Mercosur customs union. High tariffs and taxes are common.',
    riskLevel: 'High' as const,
    notes:
      'Requires a registered Brazilian entity (CNPJ) to act as the importer of record.',
    relatedRegulations: [
      {
        name: 'INMETRO',
        link: 'http://www.inmetro.gov.br/english/',
      },
    ],
    keywords: ['brazil', 'inmetro', 'cnpj', 'mercosur'],
  },
];
