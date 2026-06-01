'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { usePins } from '@/hooks/usePins'
import { useMapStore } from '@/stores/mapStore'
import { PinSchema, type PinInput } from '@/lib/validations'
import type { Pin } from '@/types/database'
import MediaInput from './MediaInput'

const COLOR_SWATCHES = [
  '#C9485B','#E8956D','#F5C842','#6DB88A','#4ECDC4',
  '#5B8DD9','#8B6DC9','#C96D9E','#8B4513','#2C3E50','#E74C3C','#FFFFFF',
]

const EMOJI_OPTIONS = [
  '💕','✈️','🏠','🌟','🎂','🌅','🍽️','🏖️','🎵','📸','🌍','🏔️','🎭','☕','🌊',
]

const TODAY = new Date().toISOString().split('T')[0]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)', color: '#f0ece4',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
}

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)',
}

const ERROR_STYLE: React.CSSProperties = { fontSize: 11, color: '#E74C3C', marginTop: 3 }

interface Props {
  mode: 'create' | 'edit'
  initialValues?: Partial<PinInput & { id?: string }>
  pinId?: string
  onCancel: () => void
  onSuccess?: () => void
}

export default function PinEditForm({ mode, initialValues, pinId, onCancel, onSuccess }: Props) {
  const router = useRouter()
  const { createPin, updatePin } = usePins()
  const creationPosition = useMapStore((s) => s.creationPosition)

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { isSubmitting, errors },
  } = useForm<PinInput>({
    defaultValues: {
      latitude: 0, longitude: 0,
      city: '', state: '', country: '',
      title: '', description: '', pin_date: TODAY,
      media: [], color: '#C9485B', icon: '💕',
      ...initialValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'media' })

  useEffect(() => {
    if (mode === 'create' && creationPosition) {
      setValue('latitude', creationPosition.lat)
      setValue('longitude', creationPosition.lng)
    }
  }, [creationPosition, mode, setValue])

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const mediaValues = watch('media')

  async function onSubmit(data: PinInput) {
    const parsed = PinSchema.safeParse(data)
    if (!parsed.success) return

    if (mode === 'create') {
      const pin = await createPin(parsed.data)
      if (pin) { onSuccess?.(); router.push(`/pin/${pin.id}`) }
    } else if (mode === 'edit' && pinId) {
      const pin = await updatePin(pinId, parsed.data)
      if (pin) { onSuccess?.(); router.push(`/pin/${pinId}`) }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ color: '#f0ece4' }}>

      {/* A — Localização */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Localização
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={LABEL_STYLE}>Cidade *</label>
            <input {...register('city')} style={INPUT_STYLE} />
            {errors.city && <p style={ERROR_STYLE}>{errors.city.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Estado</label>
            <input {...register('state')} style={INPUT_STYLE} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL_STYLE}>País *</label>
            <input {...register('country')} style={INPUT_STYLE} />
            {errors.country && <p style={ERROR_STYLE}>{errors.country.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Latitude</label>
            <input
              {...register('latitude', { valueAsNumber: true })}
              readOnly
              style={{ ...INPUT_STYLE, background: 'rgba(255,255,255,0.02)', color: '#666' }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Longitude</label>
            <input
              {...register('longitude', { valueAsNumber: true })}
              readOnly
              style={{ ...INPUT_STYLE, background: 'rgba(255,255,255,0.02)', color: '#666' }}
            />
          </div>
        </div>
      </div>

      {/* B — Sobre o momento */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sobre o Momento
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={LABEL_STYLE}>Título *</label>
            <input {...register('title')} maxLength={300} style={INPUT_STYLE} />
            {errors.title && <p style={ERROR_STYLE}>{errors.title.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Data *</label>
            <input type="date" {...register('pin_date')} max={TODAY} style={INPUT_STYLE} />
            {errors.pin_date && <p style={ERROR_STYLE}>{errors.pin_date.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Descrição</label>
            <textarea
              {...register('description')}
              maxLength={5000}
              rows={4}
              style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </div>

      {/* C — Fotos */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Fotos
        </h3>
        {fields.map((field, i) =>
          mediaValues[i]?.type === 'image' ? (
            <MediaInput
              key={field.id}
              index={i}
              value={mediaValues[i]}
              onChange={(v) => setValue(`media.${i}`, v)}
              onRemove={() => remove(i)}
            />
          ) : null
        )}
        <button
          type="button"
          disabled={fields.length >= 20}
          onClick={() => append({ url: '', caption: '', type: 'image' })}
          style={{
            padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ECDC4',
          }}
        >
          + Adicionar foto
        </button>
      </div>

      {/* D — Vídeos */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Vídeos
        </h3>
        {fields.map((field, i) =>
          mediaValues[i]?.type === 'video' ? (
            <MediaInput
              key={field.id}
              index={i}
              value={mediaValues[i]}
              onChange={(v) => setValue(`media.${i}`, v)}
              onRemove={() => remove(i)}
            />
          ) : null
        )}
        <button
          type="button"
          disabled={fields.length >= 20}
          onClick={() => append({ url: '', caption: '', type: 'video' })}
          style={{
            padding: '7px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
            background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.3)', color: '#4ECDC4',
          }}
        >
          + Adicionar vídeo
        </button>
      </div>

      {/* E — Identidade visual */}
      <div style={SECTION_STYLE}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, color: '#4ECDC4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Identidade Visual
        </h3>

        <label style={LABEL_STYLE}>Cor do pin</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c} type="button"
              onClick={() => setValue('color', c)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                cursor: 'pointer', outline: selectedColor === c ? `3px solid ${c}` : 'none',
                outlineOffset: 2, transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}
            />
          ))}
          <input
            {...register('color')}
            placeholder="#RRGGBB"
            style={{ ...INPUT_STYLE, width: 90, padding: '4px 8px' }}
          />
        </div>

        <label style={{ ...LABEL_STYLE, marginTop: 12 }}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e} type="button"
              onClick={() => setValue('icon', e)}
              style={{
                width: 36, height: 36, borderRadius: 6, fontSize: 18,
                background: selectedIcon === e ? 'rgba(201,72,91,0.25)' : 'rgba(255,255,255,0.05)',
                border: selectedIcon === e ? '1px solid #C9485B' : '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* F — Botões */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '9px 20px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '9px 20px', borderRadius: 6, fontSize: 13, cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'rgba(201,72,91,0.4)' : '#C9485B', border: 'none', color: '#fff', fontWeight: 600,
          }}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar memória'}
        </button>
      </div>
    </form>
  )
}
