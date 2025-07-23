import * as React from 'react'

import BuiltBy from './BuiltBy'
import PowerBy from './PoweredBy'
import ICP from './ICP'

export default function Footer() {
  return (
    <footer className="mt-auto flex flex-wrap justify-center gap-2">
      <PowerBy />
      <BuiltBy />
      <ICP />
    </footer>
  )
}
