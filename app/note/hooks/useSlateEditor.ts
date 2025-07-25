import { useMemo } from 'react'
import { createEditor } from 'slate'
import { withReact } from 'slate-react'
import { withHistory } from 'slate-history'

// 创建并增强编辑器
export const useSlateEditor = () => {
  return useMemo(() => withHistory(withReact(createEditor())), [])
}

export default useSlateEditor
