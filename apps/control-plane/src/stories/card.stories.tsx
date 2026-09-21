import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from '@rns/design-system';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card style={{ width: 360 }}>
      <CardHeader>
        <CardTitle>Organização</CardTitle>
        <CardDescription>Dados gerais visíveis para todos os membros.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Fábrica RNS — plano atual: Free.</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Salvar</Button>
      </CardFooter>
    </Card>
  ),
};
