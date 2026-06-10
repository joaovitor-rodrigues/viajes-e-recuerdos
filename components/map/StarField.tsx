'use client'

import { useEffect, useRef } from 'react'

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!canvas || !ctx) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Distribute stars with slight center-avoidance (more on edges, less center)
      for (let i = 0; i < 480; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const r = Math.random() * 1.25 + 0.15
        const op = (Math.random() * 0.6 + 0.2).toFixed(2)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${op})`
        ctx.fill()
      }

      // A handful of brighter, slightly larger stars
      for (let i = 0; i < 18; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        ctx.beginPath()
        ctx.arc(x, y, Math.random() * 0.8 + 1.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,240,${(Math.random() * 0.3 + 0.7).toFixed(2)})`
        ctx.fill()
      }
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    />
  )
}
