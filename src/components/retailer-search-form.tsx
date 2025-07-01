// src/components/retailer-search-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function RetailerSearchForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `/dashboard/retailer/catalog?q=${encodeURIComponent(
          searchTerm.trim(),
        )}`,
      );
    } else {
      router.push('/dashboard/retailer/catalog');
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full max-w-sm items-center space-x-2"
    >
      <Input
        type="text"
        placeholder="Search by Product Name..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      <Button type="submit">
        <Search className="h-4 w-4 mr-2" /> Search
      </Button>
    </form>
  );
}
