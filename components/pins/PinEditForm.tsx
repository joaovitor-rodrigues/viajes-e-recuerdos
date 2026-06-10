'use client'

import { useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import DatePicker from './DatePicker'
import dynamic from 'next/dynamic'
import type { AccountLabel } from '@/lib/googlePhotos'

const GooglePhotosPicker = dynamic(() => import('./GooglePhotosPicker'), { ssr: false })
import { usePins } from '@/hooks/usePins'
import { useMapStore } from '@/stores/mapStore'
import { PinSchema, type PinInput } from '@/lib/validations'
import { getFlagColor } from '@/lib/flagColors'
import MediaInput from './MediaInput'
import type { Pin } from '@/types/database'

const TODAY = new Date().toISOString().split('T')[0]

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 4,
  border: '1px solid rgba(160,120,72,0.2)',
  background: 'rgba(241,233,215,0.5)',
  color: '#2c1a0e',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
  transition: 'border-color 0.18s, box-shadow 0.18s',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  color: '#9a8068',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 600,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: 22,
  paddingBottom: 22,
  borderBottom: '1px solid rgba(160,120,72,0.13)',
}

const SECTION_TITLE: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 10,
  color: '#a07840',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontWeight: 700,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

const ERROR_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: '#8b3a30',
  marginTop: 3,
  fontFamily: 'var(--font-inter, "Inter", sans-serif)',
}

export interface PinEditFormHandle {
  isDirty: boolean
  getValues: () => Partial<PinInput>
  reset: (values: Partial<PinInput>) => void
}

interface Props {
  mode: 'create' | 'edit'
  initialValues?: Partial<PinInput & { id?: string }>
  pinId?: string
  onCancel: () => void
  onSuccess?: () => void
  updatePin?: (id: string, data: PinInput) => Promise<Pin | null>
}

const PinEditForm = forwardRef<PinEditFormHandle, Props>(function PinEditForm(
  { mode, initialValues, pinId, onCancel, onSuccess, updatePin: updatePinProp },
  ref,
) {
  const { createPin, updatePin: updatePinHook } = usePins()
  const updatePin = updatePinProp ?? updatePinHook
  const creationPosition = useMapStore((s) => s.creationPosition)

  const {
    register, handleSubmit, watch, setValue, control, reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<PinInput>({
    defaultValues: {
      latitude: 0, longitude: 0,
      city: '', state: '', country: '',
      title: '', description: '', start_date: TODAY, end_date: TODAY,
      media: [], color: '#C9485B',
      ...initialValues,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'media' })

  useImperativeHandle(ref, () => ({
    isDirty,
    getValues,
    reset: (values) => reset({ ...getValues(), ...values } as PinInput),
  }), [isDirty, getValues, reset])

  useEffect(() => {
    if (mode === 'create' && creationPosition) {
      setValue('latitude', creationPosition.lat)
      setValue('longitude', creationPosition.lng)
    }
  }, [creationPosition, mode, setValue])

  type PickerState = { filter: 'image' | 'video'; label: AccountLabel } | null
  const [photosPicker,  setPhotosPicker]  = useState<PickerState>(null)
  const [photosChooser, setPhotosChooser] = useState<'image' | 'video' | null>(null)
  const [pickerError] = useState<string | null>(null)

  const country    = watch('country')
  const startDate  = watch('start_date')
  const mediaValues = watch('media')

  useEffect(() => {
    if (country) setValue('color', getFlagColor(country))
  }, [country, setValue])

  useEffect(() => {
    if (!startDate) return
    const end = getValues('end_date')
    if (end && end < startDate) setValue('end_date', startDate, { shouldDirty: true })
  }, [startDate, getValues, setValue])

  async function onSubmit(data: PinInput) {
    const parsed = PinSchema.safeParse(data)
    if (!parsed.success) return

    if (mode === 'create') {
      const pin = await createPin(parsed.data)
      if (pin) onSuccess?.()
    } else if (mode === 'edit' && pinId) {
      const pin = await updatePin(pinId, parsed.data)
      if (pin) onSuccess?.()
    }
  }

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'rgba(160,120,72,0.5)'
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(160,120,72,0.1)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = 'rgba(160,120,72,0.2)'
      e.currentTarget.style.boxShadow = 'none'
    },
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '6px 16px', borderRadius: 3, fontSize: 11, cursor: 'pointer',
    background: 'rgba(160,120,72,0.07)', border: '1px solid rgba(160,120,72,0.25)',
    color: '#6a4e2a', fontFamily: 'var(--font-inter, "Inter", sans-serif)', fontWeight: 500,
    transition: 'background 0.15s',
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ color: '#2c1a0e' }}>

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
              style={{ ...INPUT_STYLE, background: 'rgba(160,120,72,0.05)', color: '#b0a090' }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Longitude</label>
            <input
              {...register('longitude', { valueAsNumber: true })}
              readOnly
              style={{ ...INPUT_STYLE, background: 'rgba(160,120,72,0.05)', color: '#b0a090' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={LABEL_STYLE}>Início *</label>
                <Controller
                  control={control}
                  name="start_date"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} max={TODAY} />
                  )}
                />
                {errors.start_date && <p style={ERROR_STYLE}>{errors.start_date.message}</p>}
              </div>
              <div>
                <label style={LABEL_STYLE}>Fim *</label>
                <Controller
                  control={control}
                  name="end_date"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} min={startDate} max={TODAY} />
                  )}
                />
                {errors.end_date && <p style={ERROR_STYLE}>{errors.end_date.message}</p>}
              </div>
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Descrição</label>
            <textarea
              {...register('description')}
              maxLength={5000}
              rows={4}
              style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'var(--font-inter, "Inter", sans-serif)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(160,120,72,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(160,120,72,0.1)' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(160,120,72,0.2)';  e.currentTarget.style.boxShadow = 'none' }}
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
        <DrivePickerButtons
          filter="image"
          photosChooser={photosChooser}
          setPhotosChooser={setPhotosChooser}
          disabled={fields.length >= 20}
          onGPhotos={(label) => { setPhotosChooser(null); setPhotosPicker({ filter: 'image', label }) }}
          addBtnStyle={addBtnStyle}
        />
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
        <DrivePickerButtons
          filter="video"
          photosChooser={photosChooser}
          setPhotosChooser={setPhotosChooser}
          disabled={fields.length >= 20}
          onGPhotos={(label) => { setPhotosChooser(null); setPhotosPicker({ filter: 'video', label }) }}
          addBtnStyle={addBtnStyle}
        />
      </div>

      <input type="hidden" {...register('color')} />

      {pickerError && (
        <p style={{ margin: '0 0 8px', fontSize: 11, color: '#8b3a30', fontFamily: '"Inter",sans-serif' }}>
          {pickerError}
        </p>
      )}

      {photosPicker && (
        <GooglePhotosPicker
          label={photosPicker.label}
          filter={photosPicker.filter}
          onConfirm={(items) => {
            items.forEach(item => {
              const type = item.mimeType.startsWith('video/') ? 'video' : 'image'
              append({ url: item.url, caption: item.filename, type })
            })
            setPhotosPicker(null)
          }}
          onClose={() => setPhotosPicker(null)}
        />
      )}

      {/* F — Botões */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 20px', borderRadius: 3, fontSize: 12, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(160,120,72,0.3)',
            color: '#7a6050', fontFamily: 'var(--font-inter, "Inter", sans-serif)', fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '8px 20px', borderRadius: 3, fontSize: 12,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            background: isSubmitting ? 'rgba(201,72,91,0.4)' : '#C9485B',
            border: 'none', color: '#fff', fontWeight: 600,
            fontFamily: 'var(--font-inter, "Inter", sans-serif)',
            letterSpacing: '0.04em',
            boxShadow: isSubmitting ? 'none' : '0 3px 12px rgba(201,72,91,0.28)',
            transition: 'box-shadow 0.15s',
          }}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar memória'}
        </button>
      </div>
    </form>
  )
})

export default PinEditForm

// ── Botões de seleção de mídia ────────────────────────────────────────────
function DrivePickerButtons({
  filter, photosChooser, setPhotosChooser,
  disabled, onGPhotos, addBtnStyle,
}: {
  filter:           'image' | 'video'
  photosChooser:    'image' | 'video' | null
  setPhotosChooser: (v: 'image' | 'video' | null) => void
  disabled:         boolean
  onGPhotos:        (label: AccountLabel) => void
  addBtnStyle:      React.CSSProperties
}) {
  const icon         = filter === 'image' ? '📷' : '🎬'
  const isPhotosOpen = photosChooser === filter

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {isPhotosOpen ? (
        <>
          <span style={{ fontSize: 10, color: '#a07840', fontFamily: '"Inter",sans-serif' }}>Conta:</span>
          {(['joão', 'jéssica'] as AccountLabel[]).map(lbl => (
            <button
              key={lbl} type="button"
              onClick={() => onGPhotos(lbl)}
              style={{ ...addBtnStyle, color: '#34a853', borderColor: 'rgba(52,168,83,0.4)', textTransform: 'capitalize' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,168,83,0.1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
            >
              {lbl}
            </button>
          ))}
          <button
            type="button" onClick={() => setPhotosChooser(null)}
            style={{ ...addBtnStyle, padding: '5px 8px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.14)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
          >
            ✕
          </button>
        </>
      ) : (
        <button
          type="button" disabled={disabled}
          onClick={() => setPhotosChooser(filter)}
          style={{ ...addBtnStyle, color: '#34a853', borderColor: 'rgba(52,168,83,0.35)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(52,168,83,0.09)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(160,120,72,0.07)' }}
        >
          {icon} Google Fotos
        </button>
      )}
    </div>
  )
}
