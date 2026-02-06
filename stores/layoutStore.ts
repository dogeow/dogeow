'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SiteLayout = 'grid' | 'magazine'

interface LayoutState {
  siteLayout: SiteLayout
  setSiteLayout: (layout: SiteLayout) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    set => ({
      siteLayout: 'grid',
      setSiteLayout: layout => set({ siteLayout: layout }),
    }),
    {
      name: 'layout-storage',
    }
  )
)
