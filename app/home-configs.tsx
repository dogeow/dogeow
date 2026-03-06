import {
  Package,
  FlaskConical,
  FileText,
  Wrench,
  Compass,
  NotebookPen,
  Gamepad2,
  MessageSquare,
  Languages,
} from 'lucide-react'
import type { GridLayout, Tile } from './types'

export const homeTiles: Tile[] = [
  {
    name: 'thing',
    nameKey: 'nav.thing',
    icon: <Package />,
    href: '/thing',
    color: '#2196F3',
    needLogin: true,
  },
  {
    name: 'lab',
    nameKey: 'nav.lab',
    icon: <FlaskConical />,
    href: '/lab',
    color: '#388e3c',
    needLogin: true,
  },
  {
    name: 'file',
    nameKey: 'nav.file',
    icon: <FileText />,
    href: '/file',
    color: '#FF5722',
    needLogin: true,
  },
  {
    name: 'tool',
    nameKey: 'nav.tool',
    icon: <Wrench />,
    href: '/tool',
    color: '#8B5A2B',
    needLogin: true,
  },
  {
    name: 'nav',
    nameKey: 'nav.nav',
    icon: <Compass />,
    href: '/nav',
    color: '#FFA000',
    needLogin: true,
  },
  {
    name: 'note',
    nameKey: 'nav.note',
    icon: <NotebookPen />,
    href: '/note',
    color: '#1976D2',
    needLogin: true,
  },
  {
    name: 'game',
    nameKey: 'nav.game',
    icon: <Gamepad2 />,
    href: '/game',
    color: '#424242',
    needLogin: true,
  },
  {
    name: 'chat',
    nameKey: 'nav.chat',
    icon: <MessageSquare />,
    href: '/chat',
    color: '#E91E63',
    needLogin: true,
  },
  {
    name: 'word',
    nameKey: 'nav.word',
    icon: <Languages />,
    href: '/word',
    color: '#E91E63',
    needLogin: true,
  },
]

export const homeGridLayout: GridLayout = {
  columns: 3,
  templateAreas: `
      "thing thing word"
      "chat file file"
      "chat tool lab"
      "nav note game"
    `,
}
