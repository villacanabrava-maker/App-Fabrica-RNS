import type { Metadata } from 'next';
import { sanitizeRedirectPath } from '@/lib/redirect';
import { RegistrarForm } from './registrar-form';

export const metadata: Metadata = { title: 'Criar conta — Fábrica Apps RNS' };

export default async function RegistrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <RegistrarForm next={sanitizeRedirectPath(params.next)} />;
}
