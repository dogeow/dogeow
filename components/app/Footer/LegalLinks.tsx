import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'

export default function LegalLinks() {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <Link href="/about/privacy" className="transition-colors hover:text-gray-900">
        {t('footer.privacy_policy', '隐私政策')}
      </Link>
      <span className="text-gray-400">|</span>
      <Link href="/about/terms" className="transition-colors hover:text-gray-900">
        {t('footer.terms_of_service', '用户协议')}
      </Link>
      <span className="text-gray-400">|</span>
      <Link href="/about/site" className="transition-colors hover:text-gray-900">
        {t('footer.site_info', '网站信息')}
      </Link>
    </div>
  )
}
