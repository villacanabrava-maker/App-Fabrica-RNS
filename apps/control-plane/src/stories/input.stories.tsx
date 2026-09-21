import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from '@rns/design-system';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: {
    placeholder: 'nome@empresa.com',
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: 'ana@fabricarns.com' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'ana@fabricarns.com' },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'e-mail-invalido' },
};
