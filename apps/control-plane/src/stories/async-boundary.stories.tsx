import type { Meta, StoryObj } from '@storybook/nextjs';
import { AsyncBoundary, Card, CardContent, EmptyState, ErrorState, PartialWarning } from '@rns/design-system';

const meta: Meta<typeof AsyncBoundary> = {
  title: 'Design System/AsyncBoundary',
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof AsyncBoundary>;

export const Loading: Story = {
  render: () => (
    <AsyncBoundary state="loading" loading={<p>Carregando…</p>}>
      <p>Conteúdo carregado.</p>
    </AsyncBoundary>
  ),
};

export const Empty: Story = {
  render: () => (
    <AsyncBoundary
      state="empty"
      loading={<p>Carregando…</p>}
      empty={<EmptyState icon="inbox" title="Nada por aqui ainda" />}
    >
      <p>Conteúdo carregado.</p>
    </AsyncBoundary>
  ),
};

export const Error: Story = {
  render: () => (
    <AsyncBoundary state="error" loading={<p>Carregando…</p>} error={<ErrorState />}>
      <p>Conteúdo carregado.</p>
    </AsyncBoundary>
  ),
};

export const Partial: Story = {
  render: () => (
    <AsyncBoundary
      state="partial"
      loading={<p>Carregando…</p>}
      partial={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PartialWarning message="Alguns dados não puderam ser atualizados agora." />
          <Card>
            <CardContent>Parte do conteúdo carregou normalmente.</CardContent>
          </Card>
        </div>
      }
    >
      <p>Conteúdo carregado.</p>
    </AsyncBoundary>
  ),
};

export const Success: Story = {
  render: () => (
    <AsyncBoundary state="success" loading={<p>Carregando…</p>}>
      <Card>
        <CardContent>Conteúdo carregado com sucesso.</CardContent>
      </Card>
    </AsyncBoundary>
  ),
};
