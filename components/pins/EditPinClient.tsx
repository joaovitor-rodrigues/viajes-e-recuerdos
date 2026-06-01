'use client'

import { useRouter } from 'next/navigation'
import PinEditForm from './PinEditForm'
import type { Pin } from '@/types/database'
import type { PinInput } from '@/lib/validations'

interface Props {
  pin: Pin
}

export default function EditPinClient({ pin }: Props) {
  const router = useRouter()

  const initialValues: Partial<PinInput> = {
    latitude: pin.latitude,
    longitude: pin.longitude,
    city: pin.city,
    state: pin.state ?? '',
    country: pin.country,
    title: pin.title,
    description: pin.description ?? '',
    pin_date: pin.pin_date,
    media: pin.media,
    color: pin.color,
    icon: pin.icon,
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f1a',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: 32,
      }}>
        <h1 style={{
          margin: '0 0 28px', fontSize: 24, color: '#f0ece4',
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 400,
        }}>
          Editar memória
        </h1>

        <PinEditForm
          mode="edit"
          pinId={pin.id}
          initialValues={initialValues}
          onCancel={() => router.push(`/pin/${pin.id}`)}
        />
      </div>
    </div>
  )
}
