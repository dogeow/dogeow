export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">隐私政策</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">网站说明</h2>
          <ul className="mb-4 list-disc pl-6">
            <li>
              本网站是业余时间写的一些小功能、小应用，仅作为学习使用，并非跟其他网站一样可以正常日常使用。
            </li>
            <li>本网站也欢迎您来参与体验、测试，但您注意保护自己的隐私，具体参见以下说明。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">信息收集</h2>
          <p className="mb-4">本网站可能会收集以下类型的信息：</p>
          <ul className="mb-4 list-disc pl-6">
            <li>
              您主动提供的个人信息（如注册信息：账号名称）。注意：密码是 Hash
              形式存储并非明文存储，没人能知道密码是多少，请放心。
            </li>
            <li>账号名称请不要使用个人的名字、生日等敏感信息。</li>
            <li>IP 地址。作为保障网站安全，比如：根据 IP 来限制访问频率。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">信息使用</h2>
          <p className="mb-4">我们收集的账户名称和 IP 地址，这两个信息分别仅用于以下目的：</p>
          <ul className="mb-4 list-disc pl-6">
            <li>让您根据自己的账号名称和只有您知道的密码来登录网站。</li>
            <li>保障网站安全。</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">信息安全</h2>
          <ul>
            <li>
              根据「信息收集」条目的说明，您账号名称和后续的网站功能使用中，请勿使用私密的字眼以及图片，那么信息则不会造成太大的安全隐患。
            </li>
            <li>
              因为，本网站是学习、测试用，所以，本网站更新和维护的频率很快。服务器环境（LNMP、Reids
              等），还有 NPM、Composer 包等，都会及时更新，保证最大限度地保护用户的隐私。
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">第三方服务</h2>
          <p className="mb-4">
            本网站未来可能包含第三方服务的链接。比如，腾讯、阿里云、字节等公司的技术文档链接等，这些我们不对这些第三方的隐私做法负责。如需访问，请参见第三方服务的隐私政策。
            当然除非有漏洞，否则本网站的链接都是经本人使用过的、大公司的网站，不会有太大的风险。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">该网站的漏洞和遗漏</h2>
          <p className="mb-4">
            如果该网站存在漏洞，Chrome
            等浏览器提示红色危险警告，或者网站内容涉及非法字眼，请及时关闭该网站，如果您有时间，也可以帮忙举报下，避免其他用户访问到。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">政策更新</h2>
          <p className="mb-4">我们可能会不时更新本隐私政策。重大变更将通过网站通知您。</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">联系我们</h2>
          <p className="mb-4">
            如果您对本隐私政策有任何疑问，请通过网站联系方式与我们联系（建设中）。
          </p>
        </section>

        <p className="mt-8 text-sm text-gray-600">最后更新日期：2025年7月25日</p>
      </div>
    </div>
  )
}
