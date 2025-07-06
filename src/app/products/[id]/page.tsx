// src/app/products/[id]/page.tsx
import { getProductById, getCompliancePathById } from "@/lib/actions";
import { getCompanyById } from "@/lib/auth";
import PublicPassportView from "@/components/public-passport-view";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";
import ProductAIChatbot from "@/components/product-ai-chatbot";

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

  const [compliancePath, company] = await Promise.all([
    product.compliancePathId
      ? getCompliancePathById(product.compliancePathId)
      : undefined,
    getCompanyById(product.companyId),
  ]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PublicPassportView
              product={product}
              compliancePath={compliancePath}
              company={company}
            />
          </div>
          <div className="lg:col-span-1">
            <ProductAIChatbot productId={product.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
