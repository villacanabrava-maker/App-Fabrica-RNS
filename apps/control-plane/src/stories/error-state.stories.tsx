import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';
import { ErrorState } from '@rns/design-system';

const meta: Meta<typeof ErrorState> = {
  title: 'Design System/ErrorState',
  component: ErrorState,
  parameters: { layout: 'centered' },
  args: {
    onRetry: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {};

export const WithCorrelationId: Story = {
  args: {
    title: 'Não foi possível carregar os projetos',
    correlationId: 'req_8f2c1a3e',
  },
};

export const WithoutRetry: Story = {
  args: { onRetry: undefined },
};
