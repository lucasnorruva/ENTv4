import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

async function getDocContent(slug: string[] | undefined) {
  const isRoot = !slug || slug.length === 0;
  const fileName = isRoot ? 'README.md' : `${slug.join('/')}.md`;
  const filePath = path.join(process.cwd(), isRoot ? '' : 'docs', fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
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
