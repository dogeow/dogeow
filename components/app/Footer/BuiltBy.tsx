import * as React from 'react'
import Link from 'next/link'

import Heart from './Heart'

const BuiltBy = () => {
  return (
    <div className="flex items-center justify-center gap-2 text-sm opacity-80">
      <span>🔨 Built By</span>
      <Link href="/about" className="underline decoration-green-500 decoration-wavy">
        小李世界
      </Link>
      <span> with </span>
      <Heart />
    </div>
  )
}

export default BuiltBy
