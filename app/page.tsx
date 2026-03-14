import { use } from 'react'
import { HomePage } from '@/components/app/HomePage'

interface HomeProps {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
}

function isPromiseSearchParams(
  value: HomeProps['searchParams']
): value is Promise<Record<string, string | string[] | undefined>> {
  return Boolean(value && typeof (value as Promise<unknown>).then === 'function')
}

export default function Home({ searchParams }: HomeProps) {
  let resolvedSearchParams: Record<string, string | string[] | undefined>

  if (isPromiseSearchParams(searchParams)) {
    resolvedSearchParams = use(
      searchParams as Promise<Record<string, string | string[] | undefined>>
    )
  } else {
    resolvedSearchParams = searchParams ?? {}
  }
  const sharedTrackValue = resolvedSearchParams.m
  const sharedTrackIndex = Number(
    Array.isArray(sharedTrackValue) ? sharedTrackValue[0] : (sharedTrackValue ?? '')
  )

  if (Number.isInteger(sharedTrackIndex) && sharedTrackIndex > 0) {
    return (
      <div className="sr-only">
        <h1>DogeOW 音乐分享</h1>
        <p>正在打开分享的音乐内容。</p>
      </div>
    )
  }

  return <HomePage />
}
