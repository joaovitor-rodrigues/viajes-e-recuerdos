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
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #f3eeff 0%, #fde8ef 45%, #eef4ff 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 16px 60px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 580,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(180,150,220,0.18)',
        borderRadius: 20,
        padding: '32px 32px 28px',
        boxShadow: '0 8px 40px rgba(120,80,180,0.1)',
      }}>
        <h1 style={{
          margin: '0 0 28px',
          fontSize: 22,
          color: '#1a1730',
          fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
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
