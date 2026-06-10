import { z } from 'zod'

export const PinSchema = z.object({
  latitude:    z.number().min(-90).max(90),
  longitude:   z.number().min(-180).max(180),
  city:        z.string().min(1).max(200),
  state:       z.string().max(200).optional().nullable(),
  country:     z.string().min(1).max(200),
  title:       z.string().min(1).max(300),
  description: z.string().max(5000).optional().nullable(),
  start_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida — use YYYY-MM-DD'),
  end_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida — use YYYY-MM-DD'),
  media:       z.array(
    z.object({
      url:     z.string().url(),
      caption: z.string().max(500),
      type:    z.enum(['image', 'video']),
    })
  ).max(20),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida — use #RRGGBB'),
})

export const PinUpdateSchema = PinSchema.partial()

export type PinInput       = z.infer<typeof PinSchema>
export type PinUpdateInput = z.infer<typeof PinUpdateSchema>
