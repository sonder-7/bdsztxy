import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BarChart3,
  ChevronLeft,
  ClipboardCheck,
  Clock,
  LogOut,
  Medal,
  ShieldCheck,
  Swords,
  UsersRound,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { apiLogin } from './lib/api'
import type { ApiUser } from './lib/api'

const demoAccounts = [
  { role: '管理员', username: 'admin', password: 'admin123456' },
  { role: '工作人员', username: 'staff', password: 'staff123456' },
  { role: '教练', username: 'coach', password: 'coach123456' },
  { role: '评委', username: 'judge', password: 'judge123456' },
]

const roleModules: Record<string, Array<{ title: string; description: string; icon: typeof ShieldCheck }>> = {
  admin: [
    { title: '营期管理', description: '创建营期，维护全局人员库和系统配置。', icon: ShieldCheck },
    { title: '赛事总览', description: '查看所有营期、队伍、比赛、评分和统计。', icon: BarChart3 },
    { title: '账号权限', description: '管理工作人员、教练、评委账号和角色。', icon: UsersRound },
    { title: '对阵录入', description: '录入三轮积分赛的会场、赛段和正反方队伍。', icon: Swords },
    { title: '积分核对', description: '核验评委票数、处理最佳辩手平票和修正记录。', icon: ClipboardCheck },
    { title: '数据报表', description: '查看队伍积分榜和学员个人赛事数据总览。', icon: BarChart3 },
  ],
  staff: [
    { title: '对阵录入', description: '录入三轮积分赛的会场、赛段和正反方队伍。', icon: Swords },
    { title: '积分核对', description: '核验评委票数、处理最佳辩手平票和修正记录。', icon: ClipboardCheck },
    { title: '数据报表', description: '查看队伍积分榜和学员个人赛事数据总览。', icon: BarChart3 },
  ],
  coach: [
    { title: '我的队伍', description: '查看队员信息和入营测评平均分。', icon: UsersRound },
    { title: '辩位录入', description: '录入每轮正反方辩位和评委可见备注。', icon: Swords },
    { title: '结营评定', description: '填写五维评价、寄语并导出结营评定图。', icon: Medal },
  ],
  judge: [
    { title: '评审任务', description: '按轮次查看负责会场及会场下所有比赛。', icon: ClipboardCheck },
    { title: '赛事记录', description: '填写发言记录、评委反馈和辩位分数。', icon: Swords },
    { title: '最终投票', description: '投出正反方总票和最佳辩手 3/2/1 票。', icon: Medal },
  ],
}

type JudgeMatch = {
  id: number
  round: string
  venue: string
  time: string
  topic: string
  affirmativeTeam: string
  negativeTeam: string
  status: 'pending' | 'draft' | 'submitted'
  positions: Array<{
    id: string
    side: 'affirmative' | 'negative'
    label: string
    speaker: string
    coachNote: string
  }>
}

const judgeMatches: JudgeMatch[] = [
  {
    id: 1,
    round: '积分赛一',
    venue: 'A 会场',
    time: '08:00-09:00',
    topic: '人工智能是否会提升人类创造力',
    affirmativeTeam: '赤焰队',
    negativeTeam: '蓝锋队',
    status: 'pending',
    positions: [
      { id: 'a1', side: 'affirmative', label: '正方一辩', speaker: '小鹿', coachNote: '重点观察开篇定义和论点清晰度。' },
      { id: 'a2', side: 'affirmative', label: '正方二辩', speaker: '阿澈', coachNote: '攻防速度快，提醒记录反问质量。' },
      { id: 'a3', side: 'affirmative', label: '正方三辩', speaker: '星河', coachNote: '擅长情绪表达，注意结构完整度。' },
      { id: 'a4', side: 'affirmative', label: '正方四辩', speaker: '南乔', coachNote: '结辩经验少，关注总结层次。' },
      { id: 'n1', side: 'negative', label: '反方一辩', speaker: '青柠', coachNote: '定义可能较新，注意与对方定义冲突。' },
      { id: 'n2', side: 'negative', label: '反方二辩', speaker: '林深', coachNote: '擅长抓漏洞，关注交锋有效性。' },
      { id: 'n3', side: 'negative', label: '反方三辩', speaker: '北辰', coachNote: '素材丰富，注意是否服务主线。' },
      { id: 'n4', side: 'negative', label: '反方四辩', speaker: '云起', coachNote: '表达稳定，关注价值升华。' },
    ],
  },
  {
    id: 2,
    round: '积分赛一',
    venue: 'A 会场',
    time: '09:00-10:00',
    topic: '人工智能是否会提升人类创造力',
    affirmativeTeam: '晨光队',
    negativeTeam: '鲸落队',
    status: 'draft',
    positions: [
      { id: 'a1', side: 'affirmative', label: '正方一辩', speaker: '予安', coachNote: '开篇较稳，注意观点生产。' },
      { id: 'a2', side: 'affirmative', label: '正方二辩', speaker: '竹白', coachNote: '交锋主动，注意不要过快。' },
      { id: 'a3', side: 'affirmative', label: '正方三辩', speaker: '知夏', coachNote: '论据使用需具体。' },
      { id: 'a4', side: 'affirmative', label: '正方四辩', speaker: '温言', coachNote: '注意结辩时间分配。' },
      { id: 'n1', side: 'negative', label: '反方一辩', speaker: '一川', coachNote: '定义清楚，但铺垫略长。' },
      { id: 'n2', side: 'negative', label: '反方二辩', speaker: '清越', coachNote: '适合追问，关注问题质量。' },
      { id: 'n3', side: 'negative', label: '反方三辩', speaker: '明烛', coachNote: '表达有张力。' },
      { id: 'n4', side: 'negative', label: '反方四辩', speaker: '司南', coachNote: '价值总结能力强。' },
    ],
  },
]

function App() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123456')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const modules = useMemo(() => (user ? roleModules[user.role] ?? [] : []), [user])
  const selectedMatch = useMemo(
    () => judgeMatches.find((match) => match.id === selectedMatchId) ?? null,
    [selectedMatchId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const result = await apiLogin(username, password)
      setUser(result.user)
      setToken(result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6">
          <header className="flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-medium text-slate-500">表达实战特训营管理系统</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">{user.roleLabel}工作台</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-slate-500">{user.username}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUser(null)
                  setToken(null)
                  setSelectedMatchId(null)
                }}
              >
                <LogOut data-icon="inline-start" />
                退出
              </Button>
            </div>
          </header>

          {user.role === 'judge' ? (
            <JudgeWorkspace
              matches={judgeMatches}
              selectedMatch={selectedMatch}
              onSelectMatch={setSelectedMatchId}
              onBack={() => setSelectedMatchId(null)}
            />
          ) : (
          <section className="grid flex-1 gap-5 py-8 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-lg border border-slate-200 bg-white p-4">
              <nav className="flex flex-col gap-2">
                {modules.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.title}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <Icon className="size-4" />
                      {item.title}
                    </button>
                  )
                })}
              </nav>
            </aside>

            <section className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-3">
                {modules.map((item) => {
                  const Icon = item.icon
                  return (
                    <Card key={item.title}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{item.title}</CardTitle>
                          <Icon className="size-5 text-slate-400" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>当前开发阶段</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-red-100 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-700">正方红色系统</p>
                      <p className="mt-2 text-sm leading-6 text-red-900">
                        后续辩位、票数和评分界面会使用红色区分正方信息。
                      </p>
                    </div>
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-700">反方蓝色系统</p>
                      <p className="mt-2 text-sm leading-6 text-blue-900">
                        后续辩位、票数和评分界面会使用蓝色区分反方信息。
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-xs text-slate-400">Token 已建立：{token?.slice(0, 8)}...</p>
                </CardContent>
              </Card>
            </section>
          </section>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <div className="mb-8 inline-flex rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            成人辩论表达培训营队
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-normal">
            表达实战特训营管理系统
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            支持营期、分队、入营测评、积分赛录入、评委记录、积分核对和结营评定。
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-200">正方</p>
              <p className="mt-2 text-sm text-red-100/80">辩位与投票使用红色视觉识别。</p>
            </div>
            <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="text-sm font-semibold text-blue-200">反方</p>
              <p className="mt-2 text-sm text-blue-100/80">辩位与投票使用蓝色视觉识别。</p>
            </div>
          </div>
        </section>

        <Card className="border-white/10 bg-white text-slate-950 shadow-2xl">
          <CardHeader>
            <CardTitle>账号登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium">
                账号
                <input
                  className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                密码
                <input
                  className="h-11 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 grid gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                  type="button"
                  onClick={() => {
                    setUsername(account.username)
                    setPassword(account.password)
                  }}
                >
                  <span>{account.role}</span>
                  <span className="font-mono text-xs text-slate-500">{account.username}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function JudgeWorkspace({
  matches,
  selectedMatch,
  onSelectMatch,
  onBack,
}: {
  matches: JudgeMatch[]
  selectedMatch: JudgeMatch | null
  onSelectMatch: (id: number) => void
  onBack: () => void
}) {
  if (selectedMatch) {
    return <JudgeMatchDetail match={selectedMatch} onBack={onBack} />
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-8">
      <div>
        <h2 className="text-xl font-semibold tracking-normal">我的评审比赛</h2>
        <p className="mt-2 text-sm text-slate-500">进入比赛后完成发言记录、评委反馈、辩位打分、最终投票和最佳辩手票。</p>
      </div>

      <div className="grid gap-4">
        {matches.map((match) => (
          <button
            key={match.id}
            type="button"
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            onClick={() => onSelectMatch(match.id)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{match.round}</span>
                  <span>{match.venue}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" />
                    {match.time}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold">{match.topic}</p>
              </div>
              <span className="rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                {match.status === 'pending' ? '待评审' : '草稿中'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-xs font-medium text-red-500">正方</p>
                <p className="mt-1 font-semibold text-red-900">{match.affirmativeTeam}</p>
              </div>
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium text-blue-500">反方</p>
                <p className="mt-1 font-semibold text-blue-900">{match.negativeTeam}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function JudgeMatchDetail({ match, onBack }: { match: JudgeMatch; onBack: () => void }) {
  return (
    <section className="flex flex-1 flex-col gap-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft data-icon="inline-start" />
            返回比赛列表
          </Button>
          <h2 className="mt-4 text-xl font-semibold tracking-normal">{match.topic}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {match.round} · {match.venue} · {match.time}
          </p>
        </div>
        <div className="grid min-w-80 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-medium text-red-500">正方</p>
            <p className="mt-1 font-semibold text-red-900">{match.affirmativeTeam}</p>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-500">反方</p>
            <p className="mt-1 font-semibold text-blue-900">{match.negativeTeam}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>辩位记录与打分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {match.positions.map((position) => (
              <div
                key={position.id}
                className={
                  position.side === 'affirmative'
                    ? 'rounded-lg border border-red-100 bg-red-50/50 p-4'
                    : 'rounded-lg border border-blue-100 bg-blue-50/50 p-4'
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={position.side === 'affirmative' ? 'text-sm font-semibold text-red-700' : 'text-sm font-semibold text-blue-700'}>
                      {position.label} · {position.speaker}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">教练备注：{position.coachNote}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    分数
                    <input
                      className="h-9 w-20 rounded-md border border-slate-200 bg-white px-2 text-sm outline-none focus:border-slate-400"
                      max="9"
                      min="0"
                      step="0.5"
                      type="number"
                      placeholder="0-9"
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    发言记录
                    <textarea className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    评委反馈
                    <textarea className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最终投票</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-red-700">
                正方票数
                <input className="h-10 rounded-md border border-red-100 px-3 text-slate-950 outline-none focus:border-red-300" max="3" min="0" type="number" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-blue-700">
                反方票数
                <input className="h-10 rounded-md border border-blue-100 px-3 text-slate-950 outline-none focus:border-blue-300" max="3" min="0" type="number" />
              </label>
            </div>
            <p className="mt-3 text-xs text-slate-500">每位评委每场共 3 票，分配给正反方。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最佳辩手票</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[3, 2, 1].map((weight) => (
                <label key={weight} className="flex flex-col gap-2 text-sm font-medium">
                  {weight} 票
                  <select className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400">
                    <option value="">选择辩位</option>
                    {match.positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.label} · {position.speaker}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">保存草稿</Button>
        <Button type="button">提交评审记录</Button>
      </div>
    </section>
  )
}

export default App
