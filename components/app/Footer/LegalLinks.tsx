import Link from 'next/link'

export default function LegalLinks() {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <Link 
        href="/privacy" 
        className="hover:text-gray-900 transition-colors"
      >
        隐私政策
      </Link>
      <span className="text-gray-400">|</span>
      <Link 
        href="/terms" 
        className="hover:text-gray-900 transition-colors"
      >
        用户协议
      </Link>
    </div>
  )
} 