import type { Metadata } from 'next'
import {
  Cormorant_Garamond,
  Playfair_Display,
  Lato,
  Roboto,
  Inter,
} from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300', '400', '600', '700'],
  variable: '--font-cormorant', display: 'swap',
})
const playfair = Playfair_Display({
  subsets: ['latin'], weight: ['400', '600'],
  variable: '--font-playfair', display: 'swap',
})
const lato = Lato({
  subsets: ['latin'], weight: ['300', '400', '700'],
  variable: '--font-lato', display: 'swap',
})
const roboto = Roboto({
  subsets: ['latin'], weight: ['300', '400', '500'],
  variable: '--font-roboto', display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', display: 'swap',
})

export const metadata: Metadata = {
  title: 'Viajes e Recuerdos',
  description: 'O nosso mapa de memórias.',
  robots: { index: false, follow: false },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💕</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={[
        cormorant.variable,
        playfair.variable,
        lato.variable,
        roboto.variable,
        inter.variable,
      ].join(' ')}
    >
      <body>{children}</body>
    </html>
  )
}
