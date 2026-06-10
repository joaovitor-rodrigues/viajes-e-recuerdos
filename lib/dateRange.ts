import { format, parse } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function p(s: string): Date {
  return parse(s, 'yyyy-MM-dd', new Date())
}

/** "15 de junho de 2025" or "15 – 22 de junho de 2025" or "15 de junho – 3 de julho de 2025" */
export function formatDateRange(start: string, end: string): string {
  if (start === end)
    return format(p(start), "d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const s = p(start)
  const e = p(end)

  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth())
    return `${format(s, 'd')} – ${format(e, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`

  if (s.getFullYear() === e.getFullYear())
    return `${format(s, "d 'de' MMMM", { locale: ptBR })} – ${format(e, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`

  return `${format(s, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} – ${format(e, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`
}

/** "fev de 2023" or "fev – jun de 2023" or "dez 2024 – jan 2025" */
export function formatShortDateRange(start: string, end: string): string {
  if (start === end)
    return format(p(start), "MMM 'de' yyyy", { locale: ptBR })

  const s = p(start)
  const e = p(end)

  if (s.getFullYear() === e.getFullYear())
    return `${format(s, 'MMM', { locale: ptBR })} – ${format(e, "MMM 'de' yyyy", { locale: ptBR })}`

  return `${format(s, "MMM yyyy", { locale: ptBR })} – ${format(e, "MMM yyyy", { locale: ptBR })}`
}
