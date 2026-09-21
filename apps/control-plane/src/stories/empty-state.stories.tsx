import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button, EmptyState } from '@rns/design-system';

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  args: {
    icon: 'search',
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar os filtros ou buscar por outro termo.',
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    icon: 'folder',
    title: 'Nenhum projeto ainda',
    description: 'Crie o primeiro projeto para começar a orquestrar agentes.',
    action: <Button size="sm">Criar projeto</Button>,
  },
};
