import ReactMarkdown from 'react-markdown';

const markdownContent = `
# Terms of Service
*Last updated: July 22, 2024*

## 1. Introduction
Welcome to Norruva! These Terms of Service ("Terms") govern your use of our website and services. By accessing or using our service, you agree to be bound by these Terms. This is a placeholder document and is not legally binding.

## 2. Use of Our Service
You agree to use our services for lawful purposes only and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the service. The service is provided "as is" without any warranties.

## 3. Accounts
When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.

## 4. Intellectual Property
The service and its original content, features, and functionality are and will remain the exclusive property of Norruva and its licensors. The content generated here is for demonstration purposes only.

## 5. Termination
We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
`;

export default function TermsPage() {
  return (
    <main className="relative py-6 lg:py-8">
      <div className="mx-auto w-full min-w-0">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
