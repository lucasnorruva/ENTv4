// src/components/customs-requirements-page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

const MOCK_CUSTOMS_DATA = [
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
    keywords: ['eu', 'european union', 'rohs', 'reach', 'cbam', 'ce', 'espr'],
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
      'united states',
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
];

const RiskLevelBadge = ({
  level,
}: {
  level: 'Low' | 'Medium' | 'High';
}) => {
  const Icon = {
    Low: ShieldCheck,
    Medium: ShieldAlert,
    High: ShieldAlert,
  }[level];

  const colorClass = {
    Low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    Medium:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    High: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  }[level];

  return (
    <Badge variant={'outline'} className={cn('capitalize', colorClass)}>
      <Icon className="mr-1 h-3.5 w-3.5" />
      {level} Risk
    </Badge>
  );
};

export default function CustomsRequirementsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const filteredData = MOCK_CUSTOMS_DATA.filter(item => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (!lowerSearchTerm) return true;

    const searchCorpus = [
      item.region,
      item.summary,
      ...item.keyDocs,
      ...item.relatedRegulations.map(r => r.name),
      ...(item.notes ? [item.notes] : []),
      ...item.keywords,
    ]
      .join(' ')
      .toLowerCase();

    return searchCorpus.includes(lowerSearchTerm);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Customs Requirements
        </h1>
        <p className="text-muted-foreground">
          A comprehensive overview of import requirements for major regions.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by region, regulation, or keyword (e.g., EU, UKCA, CBAM)..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredData.map(item => (
          <Card key={item.region}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{item.region}</CardTitle>
                <RiskLevelBadge level={item.riskLevel} />
              </div>
              <CardDescription>{item.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold text-sm mb-2">Key Documents:</h4>
                <div className="flex flex-wrap gap-2">
                  {item.keyDocs.map(doc => (
                    <Badge key={doc} variant="secondary">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="text-xs p-0 hover:no-underline">
                    Show All Details
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 space-y-4">
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Tariff Information</h4>
                      <p className="text-sm text-muted-foreground">{item.tariffs}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Related Regulations
                      </h4>
                      <ul className="space-y-1">
                        {item.relatedRegulations.map(reg => (
                          <li key={reg.name}>
                            <Link
                              href={reg.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {reg.name} <ExternalLink className="h-3 w-3" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {item.notes && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Notes</h4>
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
        {filteredData.length === 0 && (
          <Card className="text-center py-10">
            <CardContent>
              <p className="text-muted-foreground">
                No regions found for "{searchTerm}".
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
