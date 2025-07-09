import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

async function getDocContent(slug: string[] | undefined) {
  const isRoot = !slug || slug.length === 0;
  // If root, try `docs/index.md`, otherwise construct path from slug
  const docPath = isRoot ? 'index.md' : `${slug.join('/')}.md`;
  const filePath = path.join(process.cwd(), 'docs', docPath);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

export default async function DocsPage({
  params,
}: {
  params: { slug: string[] | undefined };
}) {
  const content = await getDocContent(params.slug);

  if (!content) {
    notFound();
  }

  return (
    <main className="relative py-6 lg:py-8">
      <div className="mx-auto w-full min-w-0">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}