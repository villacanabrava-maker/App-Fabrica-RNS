import type { Meta, StoryObj } from '@storybook/nextjs';
import { StatusPill, type StatusPillState } from '@rns/design-system';

const meta: Meta<typeof StatusPill> = {
  title: 'Design System/StatusPill',
  component: StatusPill,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof StatusPill>;

const STATES: StatusPillState[] = [
  'running',
  'succeeded',
  'completed',
  'failed',
  'awaiting_human',
  'blocked',
  'cancelled',
  'queued',
  'pending',
  'in_review',
];

export const Running: Story = { args: { state: 'running' } };
export const Failed: Story = { args: { state: 'failed' } };
export const AwaitingHuman: Story = { args: { state: 'awaiting_human' } };

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 480 }}>
      {STATES.map((state) => (
        <StatusPill key={state} state={state} />
      ))}
    </div>
  ),
};
