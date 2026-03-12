import { act, renderHook } from '@testing-library/react'
import { useProjectCoverStore, type ProjectCoverMode } from '../projectCoverStore'

describe('projectCoverStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useProjectCoverStore.setState({ projectCoverMode: 'image' })
  })

  it('initializes with image mode by default', () => {
    const { result } = renderHook(() => useProjectCoverStore())

    expect(result.current.projectCoverMode).toBe('image')
  })

  it('switches between all supported cover modes', () => {
    const { result } = renderHook(() => useProjectCoverStore())
    const modes: ProjectCoverMode[] = ['color', 'none', 'image']

    modes.forEach(mode => {
      act(() => {
        result.current.setProjectCoverMode(mode)
      })

      expect(result.current.projectCoverMode).toBe(mode)
    })
  })

  it('rehydrates legacy boolean state as none when covers were disabled', async () => {
    localStorage.setItem(
      'project-cover-storage',
      JSON.stringify({
        state: { showProjectCovers: false },
        version: 0,
      })
    )

    await act(async () => {
      await useProjectCoverStore.persist.rehydrate()
    })

    expect(useProjectCoverStore.getState().projectCoverMode).toBe('none')
  })

  it('rehydrates legacy boolean state as image when covers were enabled', async () => {
    localStorage.setItem(
      'project-cover-storage',
      JSON.stringify({
        state: { showProjectCovers: true },
        version: 0,
      })
    )

    await act(async () => {
      await useProjectCoverStore.persist.rehydrate()
    })

    expect(useProjectCoverStore.getState().projectCoverMode).toBe('image')
  })
})
