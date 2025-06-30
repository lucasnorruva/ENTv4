import ReactMarkdown from 'react-markdown';

const markdownContent = `
# Privacy Policy
*Last updated: July 22, 2024*

## 1. Information We Collect
We collect information you provide directly to us when you create an account, such as your name and email address. We also collect log data about your use of the services. This is a placeholder document and is not legally binding.

## 2. How We Use Information
We use the information we collect to provide, maintain, and improve our services. We do not share your personal information with third parties except as described in this policy or with your consent.

## 3. Data Storage
Your information is stored on secure servers. We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access.

## 4. Your Choices
You may update, correct, or delete information about you at any time by logging into your account. If you wish to delete your account, please contact us, but note that we may retain certain information as required by law or for legitimate business purposes.

## 5. Changes to This Policy
We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice.
`;

export default function PrivacyPage() {
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
