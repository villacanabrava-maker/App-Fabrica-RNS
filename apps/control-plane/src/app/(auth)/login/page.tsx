import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Entrar — Fábrica Apps RNS' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registrado?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next ?? '/'} registered={params.registrado === '1'} />;
}
