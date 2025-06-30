import { getProductById } from "@/lib/actions";
import PublicPassportView from "@/components/public-passport-view";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ProductPassportPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="bg-muted min-h-screen">
      <header className="bg-background/80 backdrop-blur-sm border-b p-4 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-primary"
            >
              <path d="M17 17l-10-10"></path>
              <path d="M17 7v10"></path>
              <path d="M7 17V7"></path>
            </svg>
            <h1 className="text-xl font-bold">PassportFlow</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-8">
        <PublicPassportView product={product} />
      </main>
    </div>
  );
}
