import * as React from 'react'
import Image from 'next/image'
import { ExternalLink } from '@/components/ExternalLink'

const BEIAN_URL = 'http://www.beian.gov.cn/'
const MIIT_URL = 'https://beian.miit.gov.cn/'

const ICP_ICON_PATH = '/images/tech/ICP.png'

const ICP = () => {
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs opacity-60">
      <ExternalLink href={BEIAN_URL}>
        <Image
          src={ICP_ICON_PATH}
          alt="ICP 图标"
          width={16}
          height={16}
          className="mr-1 inline-block align-middle"
        />
        <span>闽公网安备35020302033650号</span>
      </ExternalLink>

      <ExternalLink href={MIIT_URL}>闽ICP备19021694号</ExternalLink>
    </div>
  )
}

export default ICP
