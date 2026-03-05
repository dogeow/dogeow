import { PageContainer } from '@/components/layout'
import { Long_Cang } from 'next/font/google'

const longCang = Long_Cang({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-long-cang',
  display: 'swap',
})

const QUOTES = [
  '世界需要更多的英雄。有时候英雄可能为了一辆摩托车而死，但英雄不论成败，只要是对面邪恶，绝不袖手旁观，那就是英雄。',
  '花气袭人知昼暖',
  "I'm beyond the farthest stars 我越过无尽的银河 and I have been looking for you 寻找着你的身影 The light went down before my eyes 光在我眼前掠过 The light shone in the darkness 照亮了前方的黑夜。",
  '对受伤习以为常的我们逐渐明白，仅仅依靠心中的温柔天真的想法，怎能在复杂社会上立足。',
  '如果你不提出要求，就什么都得不到。当你这么想时，还怕被拒绝吗？',
  'You’re only limited by your imagination.',
  '编程的艺术就是处理复杂性的艺术',
  '优秀软件的作用是让复杂的东西看起来简单',
  '这些(监狱的)围墙很有趣。起初你痛恨它; 然后你逐渐习惯它; 足够长时间后, 你开始依赖它 -- 这就是体制化!',
  '路虽远，行则必达。事虽难，做则必成。',
  '视其之所往，方能知来者。',
  '一如往常的某一天，你突然站起来说，“今晚去看星星吧！”',
  '那是天鵝座α、牽牛星、織女星，你指向的夏季大三角。',
  'To become a hero in the future，So start from now on.',
  '内心要强大，自信和理念才能支撑起弱小的人类身躯。',
  'I Say Yes!',
  'Make something people want（制造用户需要的东西，如果没有，可以先制造自己需要的东西）',
  "If you aren't getting rejected on a daily basis, your goals aren't ambitious enough.",
  '生命给予生活中选择的权利，物质精神追求都需劳动去奠基，在浩瀚繁星而却昙花一现的宇宙中应正确对待事物、珍惜现在、创造未来。',
  '每个行为背后都有一个动机',
  '人生如棋，我身为卒，行动虽慢，不曾后退。',
  '天道酬勤',
  '一分为二',
  '幸福的家庭彼此相似，不幸的家庭各不相同。',
  '整装待发',
  '心之所向，身之所往。',
  'Le vent se leve, il faut tenter de vivre(起风了，唯有努力生存)',
  '人生不相见，动如参与商',
  '微尘中，各现无边刹海；刹海之中，复有微尘；彼诸微尘内，复有刹海；如是重重，不可穷尽，非是心识思量境界。',
  '每个人都是有思想的，所以要尊重每个人，当然狗也是，它也有情感。',
]

export default function AboutPage() {
  return (
    <PageContainer className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 flex-col gap-8 overflow-auto p-6">
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">自言自语</h2>
          <ul
            className={`${longCang.className} flex flex-col gap-3 text-2xl text-muted-foreground`}
          >
            {QUOTES.map(q => (
              <li key={q.slice(0, 20)} className="border-b border-border/50 pb-2 last:border-0">
                {q}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageContainer>
  )
}
