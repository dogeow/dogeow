export const normalizeNotes = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) {
    return data as T[]
  }

  if (data && typeof data === 'object' && 'notes' in data) {
    const notes = (data as { notes?: T[] }).notes
    return Array.isArray(notes) ? notes : []
  }

  return []
}

export const normalizeNote = <T>(data: unknown): T | null => {
  if (!data) {
    return null
  }

  if (typeof data === 'object' && 'note' in data) {
    const note = (data as { note?: T }).note
    return note ?? null
  }

  return data as T
}
