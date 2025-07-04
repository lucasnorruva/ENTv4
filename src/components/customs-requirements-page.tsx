// src/components/customs-requirements-page.tsx

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const MOCK_CUSTOMS_DATA = [
  {
    region: 'European Union (EU)',
    summary:
      'Requires Digital Product Passports for specific categories (e.g., batteries, textiles). Adherence to CE marking, RoHS, and REACH is mandatory. Imports are subject to CBAM reporting for carbon-intensive goods.',
    keyDocs: [
      'Declaration of Conformity',
      'RoHS Test Reports',
      'CBAM Declaration',
    ],
    tariffs: 'Based on TARIC classification. Average ~4.2% for non-EU goods.',
    keywords: ['eu', 'european union', 'rohs', 'reach', 'cbam', 'ce'],
  },
  {
    region: 'United States (USA)',
    summary:
      'Goods are subject to inspection by Customs and Border Protection (CBP). Requires compliance with Consumer Product Safety Commission (CPSC) standards. Conflict Minerals reporting required for certain industries.',
    keyDocs: ['Commercial Invoice', 'Packing List', 'Bill of Lading', 'CPSC Certificate'],
    tariffs: 'Based on HTSUS code. Varies widely by product and origin.',
    keywords: ['usa', 'united states', 'cpsc', 'conflict minerals', 'htsus'],
  },
  {
    region: 'China',
    summary:
      'All products must meet GB standards. China Compulsory Certification (CCC) mark is required for many product categories. Strict customs clearance process with detailed documentation.',
    keyDocs: ['CCC Mark Certificate', 'Bill of Lading', 'Invoice', 'Customs Declaration Form'],
    tariffs: 'Varies based on product classification and trade agreements.',
    keywords: ['china', 'gb standards', 'ccc'],
  },
  {
    region: 'United Kingdom (UK)',
    summary:
      'Post-Brexit, requires UKCA marking instead of CE marking for goods placed on the market in Great Britain. Adheres to UK RoHS and UK REACH regulations.',
    keyDocs: ['UKCA Declaration of Conformity', 'Customs Declaration (SAD)'],
    tariffs: 'Based on the UK Global Tariff (UKGT).',
    keywords: ['uk', 'united kingdom', 'ukca', 'ukgt'],
  },
];

export default function CustomsRequirementsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = MOCK_CUSTOMS_DATA.filter(item =>
    item.keywords.some(keyword =>
      keyword.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Customs Requirements
        </h1>
        <p className="text-muted-foreground">
          A high-level overview of import requirements for major regions.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by region or regulation (e.g., EU, UKCA, RoHS)..."
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <Accordion type="multiple" className="space-y-4">
        {filteredData.map(item => (
          <AccordionItem value={item.region} key={item.region} className="border rounded-lg">
            <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
              {item.region}
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">{item.summary}</p>
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
                <div>
                  <h4 className="font-semibold text-sm mb-2">Tariff Info:</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.tariffs}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
       {filteredData.length === 0 && (
        <Card className="text-center py-10">
            <CardContent>
                <p className="text-muted-foreground">No regions found for "{searchTerm}".</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
