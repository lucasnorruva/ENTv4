import type { Product, CompliancePath } from "@/types";
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
  Tag,
  Thermometer,
  Lightbulb,
  Package,
  Percent,
  MapPin,
  FileQuestion,
  Archive,
  Sparkles,
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

export default function PublicPassportView({
  product,
  compliancePath,
}: {
  product: Product;
  compliancePath?: CompliancePath;
}) {
  const { sustainability } = product;
  const esg = sustainability;
  const lifecycle = sustainability?.lifecycleAnalysis;

  return (
    <Card className="max-w-4xl mx-auto overflow-hidden shadow-none border-0 md:border md:shadow-sm">
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
          <CardTitle as="h1" className="text-3xl font-bold">
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
            <CardTitle as="h2" className="text-lg mb-2">
              ESG Score
            </CardTitle>
            {esg?.score ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-primary">
                    {esg.score}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">/ 100</p>
                    <Progress value={esg.score} className="h-2 mt-1" />
                  </div>
                </div>
                {esg.summary && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {esg.summary}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Score not available.</p>
            )}
          </Card>
          <Card className="p-4 flex flex-col justify-center">
            <CardTitle as="h2" className="text-lg mb-2">
              Verification Status
            </CardTitle>
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
          defaultValue={["item-1", "item-2", "item-3", "item-4"]}
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xl font-semibold">
              Materials & Manufacturing
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <InfoRow icon={Factory} label="Manufacturing">
                <p className="text-sm text-muted-foreground">
                  {product.manufacturing?.facility} in{" "}
                  {product.manufacturing?.country}
                </p>
              </InfoRow>
              <InfoRow icon={Scale} label="Material Composition">
                {product.materials.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {product.materials.map((mat, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium text-foreground">
                          {mat.name}
                        </p>
                        <div className="flex gap-4 text-muted-foreground text-xs">
                          {mat.percentage !== undefined && (
                            <span className="flex items-center gap-1">
                              <Percent className="h-3 w-3" /> {mat.percentage}%
                              of total
                            </span>
                          )}
                          {mat.recycledContent !== undefined && (
                            <span className="flex items-center gap-1">
                              <Recycle className="h-3 w-3" />{" "}
                              {mat.recycledContent}% recycled
                            </span>
                          )}
                          {mat.origin && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Origin:{" "}
                              {mat.origin}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No material data provided.
                  </p>
                )}
              </InfoRow>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-xl font-semibold">
              Circularity & Lifecycle
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <InfoRow icon={Package} label="Packaging">
                <p className="text-sm text-muted-foreground">
                  {product.packaging?.type}
                  {product.packaging?.recycledContent !== undefined &&
                    ` (${product.packaging.recycledContent}% recycled)`}
                  . Recyclable: {product.packaging?.recyclable ? "Yes" : "No"}.
                </p>
              </InfoRow>
              <InfoRow icon={Wrench} label="Repairability">
                <p className="text-sm text-muted-foreground">
                  Repair manuals and end-of-life instructions are available to
                  authorized service providers and recyclers.
                </p>
              </InfoRow>
              {product.endOfLifeStatus &&
                product.endOfLifeStatus !== "Active" && (
                  <InfoRow icon={Archive} label="End-of-Life Status">
                    <Badge
                      variant={
                        product.endOfLifeStatus === "Recycled"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {product.endOfLifeStatus}
                    </Badge>
                  </InfoRow>
                )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-xl font-semibold">
              Lifecycle & Environmental Impact
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              {lifecycle ? (
                <>
                  <InfoRow
                    icon={Thermometer}
                    label="Estimated Carbon Footprint"
                    value={`${lifecycle.carbonFootprint.value} ${lifecycle.carbonFootprint.unit}`}
                  >
                    <p className="text-xs text-muted-foreground mt-1">
                      {lifecycle.carbonFootprint.summary}
                    </p>
                  </InfoRow>
                  <InfoRow icon={Lightbulb} label="Lifecycle Stages Impact">
                    <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                      <p>
                        <strong>Manufacturing:</strong>{" "}
                        {lifecycle.lifecycleStages.manufacturing}
                      </p>
                      <p>
                        <strong>Use Phase:</strong>{" "}
                        {lifecycle.lifecycleStages.usePhase}
                      </p>
                      <p>
                        <strong>End-of-Life:</strong>{" "}
                        {lifecycle.lifecycleStages.endOfLife}
                      </p>
                    </div>
                  </InfoRow>
                  <InfoRow icon={Sparkles} label="Improvement Opportunities">
                    <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1">
                      {lifecycle.improvementOpportunities.map((opp, i) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </InfoRow>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Lifecycle analysis data is not yet available for this product.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-xl font-semibold">
              Compliance & Certifications
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              {sustainability?.gaps && sustainability.gaps.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Compliance Gaps Identified</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                      {sustainability.gaps.map((gap, index) => (
                        <li key={index}>
                          <strong>{gap.regulation}:</strong> {gap.issue}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <InfoRow icon={FileQuestion} label="Compliance Path">
                <p className="font-semibold text-foreground">
                  {compliancePath?.name ?? 'No path selected.'}
                </p>
                {compliancePath?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {compliancePath.description}
                  </p>
                )}
              </InfoRow>
              <InfoRow icon={Globe} label="Compliance Summary">
                <p className="text-sm text-muted-foreground">
                  {sustainability?.complianceSummary || "Awaiting review."}
                </p>
              </InfoRow>
              <InfoRow icon={FileText} label="Certifications">
                {product.certifications && product.certifications.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {product.certifications.map(
                      (cert: any, index: number) => (
                        <li key={index}>{cert.name}</li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    No certifications listed.
                  </p>
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
