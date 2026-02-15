'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

interface ToastState {
  position: ToastPosition
  duration: number
  setPosition: (position: ToastPosition) => void
  setDuration: (duration: number) => void
}

export const useToastStore = create<ToastState>()(
  persist(
    set => ({
      position: 'bottom-right',
      duration: 3000,
      setPosition: position => set({ position }),
      setDuration: duration => set({ duration }),
    }),
    {
      name: 'toast-storage',
    }
  )
)
