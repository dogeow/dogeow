export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">用户协议</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">服务条款</h2>
          <p className="mb-4">
            欢迎使用本网站。注册本网站的账号时，需要阅读该《用户协议》，并同意遵守以下条款和条件才能完成注册（在注册页面勾选「我同意」的候选框）。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">用户责任</h2>
          <p className="mb-4">作为用户，您同意：</p>
          <ul className="mb-4 list-disc pl-6">
            <li>遵守所有适用的法律法规</li>
            <li>不上传恶意软件或有害内容</li>
            <li>不侵犯他人的知识产权</li>
            <li>不进行任何可能损害网站功能的行为</li>
            <li>对您的账户安全负责</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">服务提供</h2>
          <p className="mb-4">
            我们努力提供稳定可靠的服务，但不保证服务的连续性和完全无错误。我们保留随时修改或终止服务的权利，比如：网站改版、服务器维护等。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">知识产权</h2>
          <p className="mb-4">
            本网站的内容、设计、代码等知识产权归网站所有者所有。未经许可，不得复制、分发或以其他方式使用。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">免责声明</h2>
          <p className="mb-4">
            本网站按&ldquo;现状&rdquo;提供服务。我们不对因使用本网站而产生的任何直接或间接损失承担责任。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">争议解决</h2>
          <p className="mb-4">
            因使用本网站产生的争议，应通过友好协商解决。如协商不成，可通过法律途径解决。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">协议修改</h2>
          <p className="mb-4">
            我们会不定时修改本协议。重要修改会通过信息提醒您（建设中），不重要的修改比如：标点符号或更换为近义词等不影响条款的实质内容。因为信息都带有红点高亮提醒，建议看到及时阅读，继续使用网站即表示您接受修改后的协议。
          </p>
        </section>

        <p className="mt-8 text-sm text-gray-600">最后更新日期：2025年11月21日</p>
      </div>
    </div>
  )
}
