import { getProductById, getCompliancePathById } from "@/lib/actions";
import PublicPassportView from "@/components/public-passport-view";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";

export default async function ProductPassportPage({
  params,
}: {
  params: { id: string };
}) {
  // For public pages, we don't pass a userId, so it will only fetch published products.
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  const compliancePath = product.compliancePathId
    ? await getCompliancePathById(product.compliancePathId)
    : undefined;

  return (
    <div className="bg-muted min-h-screen">
      <header className="bg-background/80 backdrop-blur-sm border-b p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <PublicPassportView product={product} compliancePath={compliancePath} />
      </main>
    </div>
  );
}
