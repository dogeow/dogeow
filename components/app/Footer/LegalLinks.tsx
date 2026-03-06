import Link from 'next/link'
import { useHomepageTranslation } from '@/hooks/useHomepageTranslation'

export default function LegalLinks() {
  const { t } = useHomepageTranslation()

  return (
    <div className="text-muted-foreground flex items-center gap-4 text-sm">
      <Link href="/about/privacy" className="hover:text-foreground transition-colors">
        {t('footer.privacy_policy', '隐私政策')}
      </Link>
      <span className="text-muted-foreground/50">|</span>
      <Link href="/about/terms" className="hover:text-foreground transition-colors">
        {t('footer.terms_of_service', '用户协议')}
      </Link>
      <span className="text-muted-foreground/50">|</span>
      <Link href="/about/site" className="hover:text-foreground transition-colors">
        {t('footer.site_info', '网站信息')}
      </Link>
    </div>
  )
}
