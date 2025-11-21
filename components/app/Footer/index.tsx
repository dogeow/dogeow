import * as React from 'react'

import BuiltBy from './BuiltBy'
import PowerBy from './PoweredBy'
import ICP from './ICP'
import LegalLinks from './LegalLinks'

export default function Footer() {
  return (
    <footer className="mt-auto flex flex-col items-center gap-2">
      <LegalLinks />
      <BuiltBy />
      <PowerBy />
      <ICP />
    </footer>
  )
}
