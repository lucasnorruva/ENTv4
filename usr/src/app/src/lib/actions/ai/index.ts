
// src/lib/actions/ai/index.ts
/**
 * @fileoverview This is the central barrel file for all AI-related server actions
 * that are intended to be called from client components. Consolidating exports
 * here simplifies imports and prevents circular dependency issues.
 */
'use server';

// This barrel file re-exports all AI-related actions.
export * from './news-analyzer-actions';
export * from '@/lib/actions/product-ai-actions';
export * from '@/lib/actions/dev-tool-actions';
