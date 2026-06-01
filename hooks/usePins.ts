import { useEffect } from 'react'
import { usePinsStore } from '@/stores/pinsStore'
import type { Pin } from '@/types/database'
import type { PinInput, PinUpdateInput } from '@/lib/validations'
import createClient from '@/lib/supabase/client'

function toast(message: string, type: 'success' | 'error') {
  // Replace with your toast library (e.g. sonner, react-hot-toast)
  console[type === 'error' ? 'error' : 'log'](`[${type.toUpperCase()}] ${message}`)
}

export function usePins() {
  const { pins, isLoading, setPins, addPin, updatePin, removePin, setLoading } = usePinsStore()

  async function fetchPins() {
    setLoading(true)
    try {
      const res = await fetch('/api/pins')
      if (!res.ok) throw new Error(await res.text())
      const data: Pin[] = await res.json()
      setPins(data)
    } catch {
      toast('Erro ao carregar pins', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function createPin(data: PinInput): Promise<Pin | null> {
    const tempId = `temp-${Date.now()}`
    const optimistic: Pin = {
      ...data,
      id: tempId,
      state: data.state ?? null,
      description: data.description ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    addPin(optimistic)

    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: Pin = await res.json()
      removePin(tempId)
      addPin(created)
      toast('Pin criado com sucesso!', 'success')
      return created
    } catch {
      removePin(tempId)
      toast('Erro ao criar pin', 'error')
      return null
    }
  }

  async function updatePin(id: string, data: PinUpdateInput): Promise<Pin | null> {
    try {
      const res = await fetch(`/api/pins/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: Pin = await res.json()
      usePinsStore.getState().updatePin(id, updated)
      toast('Pin atualizado!', 'success')
      return updated
    } catch {
      toast('Erro ao atualizar pin', 'error')
      return null
    }
  }

  async function deletePin(id: string): Promise<boolean> {
    const previous = pins.find((p) => p.id === id)
    removePin(id)
    try {
      const res = await fetch(`/api/pins/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast('Pin removido', 'success')
      return true
    } catch {
      if (previous) addPin(previous)
      toast('Erro ao remover pin', 'error')
      return false
    }
  }

  function getPinById(id: string): Pin | undefined {
    return pins.find((p) => p.id === id)
  }

  return { pins, isLoading, fetchPins, createPin, updatePin, deletePin, getPinById }
}

export function useRealtimeSync() {
  const { addPin, updatePin, removePin } = usePinsStore()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('pins')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pins' },
        (payload) => {
          addPin(payload.new as Pin)
          toast('Nova memória adicionada 💕', 'success')
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pins' },
        (payload) => {
          updatePin((payload.new as Pin).id, payload.new as Partial<Pin>)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pins' },
        (payload) => {
          removePin((payload.old as Pin).id)
          toast('Memória removida', 'success')
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
