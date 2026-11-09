import { redirect } from 'next/navigation';

type Props = { params: Promise<{ guildId: string }> };

export default async function CommandsPage({ params }: Props) {
  const { guildId } = await params;
  redirect(`/dashboard/${guildId}/configuration?tab=policies`);
}
