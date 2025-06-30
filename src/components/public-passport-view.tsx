import type { Product } from "@/types";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck,
  ShieldAlert,
  Leaf,
  Users,
  Landmark,
  Recycle,
  Wrench,
  Link as LinkIcon,
  Factory,
  Globe,
  FileText,
  Scale,
  AlertTriangle,
  Fingerprint,
  Quote,
} from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-3 border-b last:border-b-0">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{label}</p>
        {value && <p className="text-muted-foreground">{value}</p>}
        {children}
      </div>
    </div>
  );
}

export default function PublicPassportView({ product }: { product: Product }) {
  // In a real app, this would be filtered to show only public data.
  const passportData = JSON.parse(product.currentInformation);

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden shadow-none border-0">
      <CardHeader className="bg-muted/50 p-6 flex flex-col md:flex-row gap-6 items-center">
        <Image
          src={product.productImage}
          alt={product.productName}
          width={150}
          height={150}
          className="rounded-lg border object-cover aspect-square"
          data-ai-hint="product photo"
        />
        <div className="flex-1">
          <Badge variant="secondary" className="mb-2">
            {product.category}
          </Badge>
          <CardTitle className="text-3xl font-bold">
            {product.productName}
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            {product.productDescription}
          </CardDescription>
          {product.qrLabelText && (
            <blockquote className="mt-4 border-l-2 pl-4 italic text-muted-foreground flex gap-2">
              <Quote className="h-4 w-4 shrink-0" />
              <span>{product.qrLabelText}</span>
            </blockquote>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Supplied by: <strong>{product.supplier}</strong>
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-4 flex flex-col justify-center">
            <h3 className="text-lg font-semibold mb-2">ESG Score</h3>
            {product.esg ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-primary">
                    {product.esg.score}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">/ 100</p>
                    <Progress value={product.esg.score} className="h-2 mt-1" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {product.esg.summary}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Score not available.</p>
            )}
          </Card>
          <Card className="p-4 flex flex-col justify-center">
            <h3 className="text-lg font-semibold mb-2">Verification Status</h3>
            <div className="flex items-center gap-3">
              {product.verificationStatus === "Verified" ? (
                <ShieldCheck className="h-10 w-10 text-green-600" />
              ) : (
                <ShieldAlert className="h-10 w-10 text-amber-600" />
              )}
              <div>
                <Badge
                  variant={
                    product.verificationStatus === "Verified"
                      ? "default"
                      : product.verificationStatus === "Failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-sm"
                >
                  {product.verificationStatus || "Not Submitted"}
                </Badge>
                {product.lastVerificationDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Checked:{" "}
                    {format(new Date(product.lastVerificationDate), "PPP")}
                  </p>
                )}
              </div>
            </div>
            {product.verificationStatus === "Verified" &&
              product.blockchainProof && (
                <a
                  href={product.blockchainProof.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-3 flex items-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" /> View On-Chain Proof
                </a>
              )}
          </Card>
        </div>

        <Accordion
          type="multiple"
          className="w-full"
          defaultValue={["item-1", "item-2", "item-3"]}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xl font-semibold">
              Product Lifecycle
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <InfoRow icon={Factory} label="Manufacturing Process">
                <p className="text-sm text-muted-foreground">
                  {passportData.manufacturing_process || "Not specified"}
                </p>
              </InfoRow>
              <InfoRow icon={Recycle} label="Packaging">
                <p className="text-sm text-muted-foreground">
                  {passportData.packaging || "Not specified"}
                </p>
              </InfoRow>
              <InfoRow icon={Wrench} label="Repairability & End-of-life">
                <p className="text-sm text-muted-foreground">
                  Repair manuals and end-of-life instructions are available to
                  authorized service providers and recyclers.
                </p>
              </InfoRow>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-xl font-semibold">
              Sustainability & ESG Details
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {product.esg ? (
                <>
                  <InfoRow
                    icon={Leaf}
                    label="Environmental Score"
                    value={`${product.esg.environmental}/10`}
                  />
                  <InfoRow
                    icon={Users}
                    label="Social Score"
                    value={`${product.esg.social}/10`}
                  />
                  <InfoRow
                    icon={Landmark}
                    label="Governance Score"
                    value={`${product.esg.governance}/10`}
                  />
                </>
              ) : (
                <p className="text-muted-foreground text-sm p-4">
                  No ESG data available.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-xl font-semibold">
              Compliance & Certifications
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              {product.complianceGaps &&
                product.complianceGaps.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Compliance Gaps Identified</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                        {product.complianceGaps.map((gap, index) => (
                          <li key={index}>
                            <strong>{gap.regulation}:</strong> {gap.issue}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              <InfoRow icon={Globe} label="Compliance Summary">
                <p className="text-sm text-muted-foreground">
                  {product.complianceSummary || "Awaiting review."}
                </p>
              </InfoRow>
              <InfoRow icon={FileText} label="Certifications">
                {passportData.certifications &&
                passportData.certifications.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {passportData.certifications.map(
                      (cert: string, index: number) => (
                        <li key={index}>{cert}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  "No certifications listed."
                )}
              </InfoRow>
              <InfoRow icon={Scale} label="Material Composition">
                {passportData.materials &&
                passportData.materials.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {passportData.materials.map((mat: any, index: number) => (
                      <li key={index}>
                        {typeof mat === "object"
                          ? `${mat.name || mat.material}`
                          : mat}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No material data provided."
                )}
              </InfoRow>
              {product.ebsiVcId && (
                <InfoRow
                  icon={Fingerprint}
                  label="EBSI Credential ID"
                  value={
                    <span className="font-mono text-xs break-all">
                      {product.ebsiVcId}
                    </span>
                  }
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
