import { redirect } from 'next/navigation'
import createServerClient from '@/lib/supabase/server'
import type { Pin } from '@/types/database'
import EditPinClient from '@/components/pins/EditPinClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarPinPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data } = await supabase
    .from('pins')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) redirect('/mapa')

  return <EditPinClient pin={data as Pin} />
}
