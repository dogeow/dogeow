export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">用户协议</h1>
      
      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">服务条款</h2>
          <p className="mb-4">
            欢迎使用本网站。通过访问和使用本网站，您同意遵守以下条款和条件。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">用户责任</h2>
          <p className="mb-4">
            作为用户，您同意：
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>遵守所有适用的法律法规</li>
            <li>不上传恶意软件或有害内容</li>
            <li>不侵犯他人的知识产权</li>
            <li>不进行任何可能损害网站功能的行为</li>
            <li>对您的账户安全负责</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">服务提供</h2>
          <p className="mb-4">
            我们努力提供稳定可靠的服务，但不保证服务的连续性和完全无错误。我们保留随时修改或终止服务的权利。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">知识产权</h2>
          <p className="mb-4">
            本网站的内容、设计、代码等知识产权归网站所有者所有。未经许可，不得复制、分发或以其他方式使用。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">免责声明</h2>
          <p className="mb-4">
            本网站按&ldquo;现状&rdquo;提供服务。我们不对因使用本网站而产生的任何直接或间接损失承担责任。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">争议解决</h2>
          <p className="mb-4">
            因使用本网站产生的争议，应通过友好协商解决。如协商不成，可通过法律途径解决。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">协议修改</h2>
          <p className="mb-4">
            我们可能会不时修改本协议。重要修改将在网站上公布。继续使用网站即表示您接受修改后的协议。
          </p>
        </section>

        <p className="text-sm text-gray-600 mt-8">
          最后更新日期：{new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>
    </div>
  )
} 