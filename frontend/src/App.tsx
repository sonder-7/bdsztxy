import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BarChart3,
  ClipboardCheck,
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

function App() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123456')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const modules = useMemo(() => (user ? roleModules[user.role] ?? [] : []), [user])

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
                }}
              >
                <LogOut data-icon="inline-start" />
                退出
              </Button>
            </div>
          </header>

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

export default App
