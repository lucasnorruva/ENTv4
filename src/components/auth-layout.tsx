import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthLayout({
  children,
  title,
  description,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-balance text-muted-foreground">{description}</p>
          </div>
          {children}
          <div className="mt-4 text-center text-sm">
            {footerText}{' '}
            <Link href={footerLinkHref} className="underline">
              {footerLinkText}
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://placehold.co/1080x1920.png"
          alt="Image"
          fill
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="abstract technology"
        />
      </div>
    </div>
  );
}
