import { create } from 'zustand'

interface EditorState {
  isDirty: boolean
  setDirty: (dirty: boolean) => void
  saveDraft?: () => Promise<void>
  setSaveDraft: (fn: (() => Promise<void>) | undefined) => void
}

export const useEditorStore = create<EditorState>(set => ({
  isDirty: false,
  setDirty: dirty => set({ isDirty: dirty }),
  saveDraft: undefined,
  setSaveDraft: fn => set({ saveDraft: fn }),
}))
