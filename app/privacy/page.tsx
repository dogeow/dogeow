export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">隐私政策</h1>
      
      <div className="prose prose-gray max-w-none">
      <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">网站说明</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>本网站是业余时间写点东西，作为学习。</li>
            <li>只做测试用，并非跟其他网站一样可以正常使用。</li>
            <li>欢迎您也来参与使用，但注意保护隐私。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">信息收集</h2>
          <p className="mb-4">
            本网站可能会收集以下类型的信息：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>您主动提供的个人信息（如注册信息：账号）。注意：密码是 Hash 存储，并非明文，只做登录对比，请放心。</li>
            <li>账号请不要使用个人的名字等敏感信息。</li>
            <li>IP 地址。作为保障网站安全，比如：根据 IP 来限制访问频率。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">信息使用</h2>
          <p className="mb-4">
            我们收集的账户和 IP 地址，这两个信息分别仅用于以下目的：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>让您正常登录网站。</li>
            <li>保障网站安全。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">信息安全</h2>
          <ul>
            <li>根据「信息收集」条目的说明，您账号和后续的网站功能使用中，请勿使用私密的字眼以及图片，那么信息不会造成不安全的隐患。</li>
            <li>因为，本网站是学习、测试用，所以，本网站更新和维护的频率很快。服务器环境（LNMP、Reids 等），还有 NPM、Composer 包等，都会及时更新。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">第三方服务</h2>
          <p className="mb-4">
            本网站未来可能包含第三方服务的链接。比如，腾讯、阿里云、字节等公司的技术文档链接等，这些我们不对这些第三方的隐私做法负责。请勿访问，如仍需访问，请参见第三方服务的隐私政策。
            当然除非有漏洞，否则本网站的链接都是经本人使用过的、大公司的网站，不会有太大的风险。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">该网站的漏洞和遗漏</h2>
          <p className="mb-4">
            如果该网站存在漏洞，Chrome 等浏览器提示红色危险警告，或者网站内容涉及非法字眼，请及时关闭该网站，如果您有时间，页可以帮忙举报下，避免其他用户访问到。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">政策更新</h2>
          <p className="mb-4">
            我们可能会不时更新本隐私政策。重大变更将通过网站通知您。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">联系我们</h2>
          <p className="mb-4">
            如果您对本隐私政策有任何疑问，请通过网站联系方式与我们联系（建设中）。
          </p>
        </section>

        <p className="text-sm text-gray-600 mt-8">
          最后更新日期：2025年7月25日
        </p>
      </div>
    </div>
  )
} 