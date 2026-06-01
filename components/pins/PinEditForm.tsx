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
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid rgba(150,120,200,0.25)',
  background: 'rgba(255,255,255,0.7)',
  color: '#1a1730',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
  transition: 'border-color 0.18s',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  color: '#9b93b4',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  fontWeight: 600,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 22,
  paddingBottom: 22,
  borderBottom: '1px solid rgba(150,120,200,0.12)',
}

const SECTION_TITLE: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 11,
  color: '#C9485B',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: 700,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

const ERROR_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#E74C3C',
  marginTop: 3,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

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
  const selectedIcon  = watch('icon')
  const mediaValues   = watch('media')

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

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = '#C9485B'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,72,91,0.1)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'rgba(150,120,200,0.25)'
      e.currentTarget.style.boxShadow = 'none'
    },
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ color: '#1a1730' }}>

      {/* A — Localização */}
      <div style={SECTION_STYLE}>
        <h3 style={SECTION_TITLE}>Localização</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={LABEL_STYLE}>Cidade *</label>
            <input {...register('city')} style={INPUT_STYLE} {...focusStyle} />
            {errors.city && <p style={ERROR_STYLE}>{errors.city.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Estado</label>
            <input {...register('state')} style={INPUT_STYLE} {...focusStyle} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL_STYLE}>País *</label>
            <input {...register('country')} style={INPUT_STYLE} {...focusStyle} />
            {errors.country && <p style={ERROR_STYLE}>{errors.country.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Latitude</label>
            <input
              {...register('latitude', { valueAsNumber: true })}
              readOnly
              style={{ ...INPUT_STYLE, background: 'rgba(150,120,200,0.05)', color: '#b0a8c8' }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Longitude</label>
            <input
              {...register('longitude', { valueAsNumber: true })}
              readOnly
              style={{ ...INPUT_STYLE, background: 'rgba(150,120,200,0.05)', color: '#b0a8c8' }}
            />
          </div>
        </div>
      </div>

      {/* B — Sobre o momento */}
      <div style={SECTION_STYLE}>
        <h3 style={SECTION_TITLE}>Sobre o Momento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={LABEL_STYLE}>Título *</label>
            <input {...register('title')} maxLength={300} style={INPUT_STYLE} {...focusStyle} />
            {errors.title && <p style={ERROR_STYLE}>{errors.title.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Data *</label>
            <input type="date" {...register('pin_date')} max={TODAY} style={INPUT_STYLE} {...focusStyle} />
            {errors.pin_date && <p style={ERROR_STYLE}>{errors.pin_date.message}</p>}
          </div>
          <div>
            <label style={LABEL_STYLE}>Descrição</label>
            <textarea
              {...register('description')}
              maxLength={5000}
              rows={4}
              style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#C9485B'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,72,91,0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(150,120,200,0.25)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>

      {/* C — Fotos */}
      <div style={SECTION_STYLE}>
        <h3 style={SECTION_TITLE}>Fotos</h3>
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
            padding: '7px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.3)',
            color: '#2a9e98', fontFamily: 'var(--font-inter, "Inter", sans-serif)', fontWeight: 500,
          }}
        >
          + Adicionar foto
        </button>
      </div>

      {/* D — Vídeos */}
      <div style={SECTION_STYLE}>
        <h3 style={SECTION_TITLE}>Vídeos</h3>
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
            padding: '7px 16px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
            background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.3)',
            color: '#2a9e98', fontFamily: 'var(--font-inter, "Inter", sans-serif)', fontWeight: 500,
          }}
        >
          + Adicionar vídeo
        </button>
      </div>

      {/* E — Identidade visual */}
      <div style={SECTION_STYLE}>
        <h3 style={SECTION_TITLE}>Identidade Visual</h3>

        <label style={LABEL_STYLE}>Cor do pin</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c} type="button"
              onClick={() => setValue('color', c)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                cursor: 'pointer',
                outline: selectedColor === c ? `3px solid ${c}` : '2px solid transparent',
                outlineOffset: 2,
                transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 0.15s',
                boxShadow: selectedColor === c ? `0 0 8px ${c}80` : 'none',
              }}
            />
          ))}
          <input
            {...register('color')}
            placeholder="#RRGGBB"
            style={{ ...INPUT_STYLE, width: 90, padding: '5px 8px' }}
          />
        </div>

        <label style={{ ...LABEL_STYLE, marginTop: 14 }}>Ícone</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e} type="button"
              onClick={() => setValue('icon', e)}
              style={{
                width: 38, height: 38, borderRadius: 10, fontSize: 19,
                background: selectedIcon === e ? 'rgba(201,72,91,0.12)' : 'rgba(150,120,200,0.06)',
                border: selectedIcon === e ? '1.5px solid rgba(201,72,91,0.5)' : '1px solid rgba(150,120,200,0.2)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
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
            padding: '10px 22px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            background: 'transparent',
            border: '1px solid rgba(150,120,200,0.3)',
            color: '#7b6fa0',
            fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            fontWeight: 500,
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 22px', borderRadius: 20, fontSize: 13,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'rgba(201,72,91,0.4)' : '#C9485B',
            border: 'none', color: '#fff', fontWeight: 600,
            fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(201,72,91,0.3)',
          }}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar memória'}
        </button>
      </div>
    </form>
  )
}
