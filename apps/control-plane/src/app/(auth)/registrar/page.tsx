import type { Metadata } from 'next';
import { RegistrarForm } from './registrar-form';

export const metadata: Metadata = { title: 'Criar conta — Fábrica Apps RNS' };

export default function RegistrarPage() {
  return <RegistrarForm />;
}
