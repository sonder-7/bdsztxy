import { useEffect, useMemo, useState } from 'react'
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
import {
  apiCreateCamp,
  apiCreateCoach,
  apiCreateEnrollment,
  apiCreateJudge,
  apiCreateMatch,
  apiCreateStudent,
  apiCreateTeam,
  apiCreateTeamFromNicknames,
  apiCreateUserAccount,
  apiCreateVenue,
  apiGetCoachDashboard,
  apiGetJudgeMatches,
  apiGetOperationsDashboard,
  apiImportEnrollments,
  apiLogin,
  apiSubmitCoachPositions,
  apiSubmitJudgeBallot,
  apiUpdateEnrollment,
  apiUpdateRoundTopic,
  apiUpdateTeam,
  apiUpdateUserAccount,
} from './lib/api'
import type { ApiUser, CoachDashboard, EnrollmentImportPreview, JudgeBallotPayload, JudgeMatch, OperationsDashboard } from './lib/api'

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

function App() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [operations, setOperations] = useState<OperationsDashboard | null>(null)
  const [operationsReloadKey, setOperationsReloadKey] = useState(0)
  const [operationsError, setOperationsError] = useState('')
  const [judgeMatches, setJudgeMatches] = useState<JudgeMatch[]>([])
  const [judgeReloadKey, setJudgeReloadKey] = useState(0)
  const [judgeError, setJudgeError] = useState('')
  const [coachDashboard, setCoachDashboard] = useState<CoachDashboard | null>(null)
  const [coachReloadKey, setCoachReloadKey] = useState(0)
  const [coachError, setCoachError] = useState('')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123456')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const modules = useMemo(() => (user ? roleModules[user.role] ?? [] : []), [user])
  const selectedMatch = useMemo(
    () => judgeMatches.find((match) => match.id === selectedMatchId) ?? null,
    [judgeMatches, selectedMatchId],
  )

  useEffect(() => {
    if (!token || !user || !['admin', 'staff'].includes(user.role)) {
      setOperations(null)
      setOperationsError('')
      return
    }

    let isMounted = true
    apiGetOperationsDashboard(token)
      .then((data) => {
        if (isMounted) {
          setOperations(data)
          setOperationsError('')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setOperationsError(err instanceof Error ? err.message : '无法读取运营工作台数据。')
        }
      })

    return () => {
      isMounted = false
    }
  }, [operationsReloadKey, token, user])

  useEffect(() => {
    if (!token || !user || user.role !== 'judge') {
      setJudgeMatches([])
      setJudgeError('')
      return
    }

    let isMounted = true
    apiGetJudgeMatches(token)
      .then((data) => {
        if (isMounted) {
          setJudgeMatches(data)
          setJudgeError('')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setJudgeError(err instanceof Error ? err.message : '无法读取评审任务。')
        }
      })

    return () => {
      isMounted = false
    }
  }, [judgeReloadKey, token, user])

  useEffect(() => {
    if (!token || !user || user.role !== 'coach') {
      setCoachDashboard(null)
      setCoachError('')
      return
    }

    let isMounted = true
    apiGetCoachDashboard(token)
      .then((data) => {
        if (isMounted) {
          setCoachDashboard(data)
          setCoachError('')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCoachError(err instanceof Error ? err.message : '无法读取教练工作台数据。')
        }
      })

    return () => {
      isMounted = false
    }
  }, [coachReloadKey, token, user])

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
                  setOperations(null)
                  setJudgeMatches([])
                  setCoachDashboard(null)
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
              error={judgeError}
              token={token}
              onRefresh={() => setJudgeReloadKey((value) => value + 1)}
            />
          ) : ['admin', 'staff'].includes(user.role) ? (
            <StaffWorkspace
              modules={modules}
              operations={operations}
              error={operationsError}
              token={token}
              isAdmin={user.role === 'admin'}
              onRefresh={() => setOperationsReloadKey((value) => value + 1)}
            />
          ) : user.role === 'coach' ? (
            <CoachWorkspace
              dashboard={coachDashboard}
              error={coachError}
              token={token}
              onRefresh={() => setCoachReloadKey((value) => value + 1)}
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

function StaffWorkspace({
  modules,
  operations,
  error,
  token,
  isAdmin,
  onRefresh,
}: {
  modules: Array<{ title: string; description: string; icon: typeof ShieldCheck }>
  operations: OperationsDashboard | null
  error: string
  token: string | null
  isAdmin: boolean
  onRefresh: () => void
}) {
  const [topicRoundId, setTopicRoundId] = useState('')
  const [topic, setTopic] = useState('')
  const [venueRoundId, setVenueRoundId] = useState('')
  const [venueName, setVenueName] = useState('')
  const [venueJudgeIds, setVenueJudgeIds] = useState<string[]>([])
  const [matchRoundId, setMatchRoundId] = useState('')
  const [matchVenueId, setMatchVenueId] = useState('')
  const [matchSequence, setMatchSequence] = useState('')
  const [matchTime, setMatchTime] = useState('10:00')
  const [affirmativeTeamId, setAffirmativeTeamId] = useState('')
  const [negativeTeamId, setNegativeTeamId] = useState('')
  const [campName, setCampName] = useState('')
  const [campSeason, setCampSeason] = useState('')
  const [campStartsOn, setCampStartsOn] = useState('')
  const [campEndsOn, setCampEndsOn] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamCoachId, setTeamCoachId] = useState('')
  const [bulkTeamName, setBulkTeamName] = useState('')
  const [bulkTeamCoachId, setBulkTeamCoachId] = useState('')
  const [bulkTeamNicknames, setBulkTeamNicknames] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<EnrollmentImportPreview | null>(null)
  const [studentName, setStudentName] = useState('')
  const [studentPhone, setStudentPhone] = useState('')
  const [studentNickname, setStudentNickname] = useState('')
  const [studentTeamId, setStudentTeamId] = useState('')
  const [accountUsername, setAccountUsername] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountRole, setAccountRole] = useState<'admin' | 'staff' | 'coach' | 'judge'>('staff')
  const [accountDisplayName, setAccountDisplayName] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedTopicRound = operations?.rounds.find((round) => String(round.id) === topicRoundId)
  const venuesForSelectedRound = operations?.venues.filter(
    (venue) => !matchRoundId || String(venue.integral_round) === matchRoundId,
  ) ?? []

  useEffect(() => {
    if (!operations) return
    const firstRound = operations.rounds[0]
    const firstVenue = operations.venues[0]
    const firstTeam = operations.teams[0]
    const secondTeam = operations.teams[1]

    if (firstRound && !topicRoundId) {
      setTopicRoundId(String(firstRound.id))
      setTopic(firstRound.topic)
    }
    if (firstRound && !venueRoundId) setVenueRoundId(String(firstRound.id))
    if (firstRound && !matchRoundId) setMatchRoundId(String(firstRound.id))
    if (firstVenue && !matchVenueId) setMatchVenueId(String(firstVenue.id))
    if (!matchSequence) setMatchSequence(String((operations.matches.length || 0) + 1))
    if (firstTeam && !affirmativeTeamId) setAffirmativeTeamId(String(firstTeam.id))
    if (secondTeam && !negativeTeamId) setNegativeTeamId(String(secondTeam.id))
    if (operations.coaches[0] && !teamCoachId) setTeamCoachId(String(operations.coaches[0].id))
    if (operations.coaches[0] && !bulkTeamCoachId) setBulkTeamCoachId(String(operations.coaches[0].id))
    if (operations.teams[0] && !studentTeamId) setStudentTeamId(String(operations.teams[0].id))
  }, [affirmativeTeamId, bulkTeamCoachId, matchRoundId, matchSequence, matchVenueId, negativeTeamId, operations, studentTeamId, teamCoachId, topicRoundId, venueRoundId])

  useEffect(() => {
    if (selectedTopicRound) setTopic(selectedTopicRound.topic)
  }, [selectedTopicRound])

  async function submitTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !topicRoundId) return
    await save(async () => {
      await apiUpdateRoundTopic(token, Number(topicRoundId), topic)
      return '辩题已更新。'
    })
  }

  async function submitVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !venueRoundId) return
    await save(async () => {
      await apiCreateVenue(token, Number(venueRoundId), venueName, venueJudgeIds.map(Number))
      setVenueName('')
      setVenueJudgeIds([])
      return '会场已创建并完成评委分配。'
    })
  }

  async function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !matchRoundId || !matchVenueId || !affirmativeTeamId || !negativeTeamId) return
    if (affirmativeTeamId === negativeTeamId) {
      setFormError('正反方不能选择同一支队伍。')
      return
    }
    await save(async () => {
      await apiCreateMatch(token, {
        integral_round: Number(matchRoundId),
        venue: Number(matchVenueId),
        sequence: Number(matchSequence),
        starts_at: matchTime,
        affirmative_team: Number(affirmativeTeamId),
        negative_team: Number(negativeTeamId),
      })
      setMatchSequence(String((operations?.matches.length || 0) + 2))
      return '对阵已创建。'
    })
  }

  async function submitCamp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !campName) return
    await save(async () => {
      await apiCreateCamp(token, {
        name: campName,
        season: campSeason,
        starts_on: campStartsOn || null,
        ends_on: campEndsOn || null,
        is_active: true,
      })
      setCampName('')
      setCampSeason('')
      setCampStartsOn('')
      setCampEndsOn('')
      return '营期已创建，并自动生成积分赛 1/2/3。'
    })
  }

  async function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !teamName || !teamCoachId) return
    await save(async () => {
      await apiCreateTeam(token, {
        camp: activeCamp.id,
        name: teamName,
        coach: Number(teamCoachId),
      })
      setTeamName('')
      return '队伍已创建并分配教练。'
    })
  }

  async function previewEnrollmentImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !importFile) return
    await save(async () => {
      const preview = await apiImportEnrollments(token, activeCamp.id, importFile, false)
      setImportPreview(preview)
      return `已预览 ${preview.total} 位学员：新增 ${preview.new_student_count}，匹配已有 ${preview.matched_student_count}。`
    })
  }

  async function commitEnrollmentImport() {
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !importFile || !importPreview || importPreview.errors.length) return
    await save(async () => {
      const result = await apiImportEnrollments(token, activeCamp.id, importFile, true)
      setImportPreview(result)
      setImportFile(null)
      return `已导入 ${result.total} 位本期学员。`
    })
  }

  async function submitBulkTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !bulkTeamName || !bulkTeamCoachId || !bulkTeamNicknames) return
    await save(async () => {
      await apiCreateTeamFromNicknames(token, {
        camp: activeCamp.id,
        coach: Number(bulkTeamCoachId),
        name: bulkTeamName,
        nicknames: bulkTeamNicknames,
      })
      setBulkTeamName('')
      setBulkTeamNicknames('')
      return '队伍已创建，7-8 位学员已归队。'
    })
  }

  async function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !studentName || !studentNickname) return
    await save(async () => {
      const student = await apiCreateStudent(token, { real_name: studentName, phone: studentPhone, note: '' })
      await apiCreateEnrollment(token, {
        camp: activeCamp.id,
        student: student.id,
        nickname: studentNickname,
        team: studentTeamId ? Number(studentTeamId) : null,
      })
      setStudentName('')
      setStudentPhone('')
      setStudentNickname('')
      return '学员已录入并加入当前营期。'
    })
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !accountUsername || !accountPassword || !accountDisplayName) return
    await save(async () => {
      let coachId: number | null = null
      let judgeId: number | null = null
      if (accountRole === 'coach') {
        const coach = await apiCreateCoach(token, { name: accountDisplayName, phone: '', note: '' })
        coachId = coach.id
      }
      if (accountRole === 'judge') {
        const judge = await apiCreateJudge(token, { name: accountDisplayName, phone: '', note: '' })
        judgeId = judge.id
      }
      await apiCreateUserAccount(token, {
        username: accountUsername,
        password: accountPassword,
        role: accountRole,
        display_name: accountDisplayName,
        phone: '',
        coach: coachId,
        judge: judgeId,
        is_active: true,
        profile_is_active: true,
      })
      setAccountUsername('')
      setAccountPassword('')
      setAccountDisplayName('')
      return accountRole === 'coach' || accountRole === 'judge'
        ? '人员档案和账号已创建。'
        : '账号已创建。'
    })
  }

  async function toggleAccount(userId: number, currentActive: boolean) {
    if (!token) return
    await save(async () => {
      await apiUpdateUserAccount(token, userId, { is_active: !currentActive, profile_is_active: !currentActive })
      return currentActive ? '账号已停用。' : '账号已启用。'
    })
  }

  async function quickUpdateTeam(teamId: number, name: string, coach: number) {
    if (!token) return
    await save(async () => {
      await apiUpdateTeam(token, teamId, { name, coach })
      return '队伍信息已更新。'
    })
  }

  async function quickUpdateEnrollment(enrollmentId: number, nickname: string, team: number | null) {
    if (!token) return
    await save(async () => {
      await apiUpdateEnrollment(token, enrollmentId, { nickname, team })
      return '学员归队信息已更新。'
    })
  }

  async function save(action: () => Promise<string>) {
    setIsSaving(true)
    setFormError('')
    setFormMessage('')
    try {
      const message = await action()
      setFormMessage(message)
      onRefresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存失败，请稍后重试。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
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
        <div>
          <h2 className="text-xl font-semibold tracking-normal">赛事运营工作台</h2>
          <p className="mt-2 text-sm text-slate-500">
            当前先接入营期、队伍、积分赛轮次、会场、评委分配和对阵数据。
          </p>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {formError ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
        {formMessage ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{formMessage}</p> : null}

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="当前营期" value={operations?.activeCamp?.name ?? '读取中'} />
          <MetricCard label="队伍数" value={String(operations?.teams.length ?? 0)} />
          <MetricCard label="评委数" value={String(operations?.judges.length ?? 0)} />
          <MetricCard label="已录对阵" value={String(operations?.matches.length ?? 0)} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>创建营期</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={submitCamp}>
                <input
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  placeholder="营期名称，如 2026 夏季表达实战特训营"
                  value={campName}
                  onChange={(event) => setCampName(event.target.value)}
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    placeholder="季节，如 2026 夏季"
                    value={campSeason}
                    onChange={(event) => setCampSeason(event.target.value)}
                  />
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    type="date"
                    value={campStartsOn}
                    onChange={(event) => setCampStartsOn(event.target.value)}
                  />
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    type="date"
                    value={campEndsOn}
                    onChange={(event) => setCampEndsOn(event.target.value)}
                  />
                </div>
                <Button type="submit" disabled={isSaving || !campName}>创建营期</Button>
              </form>
              <div className="mt-5 grid gap-2">
                {operations?.camps.slice(0, 4).map((camp) => (
                  <div key={camp.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                    <span className="font-semibold">{camp.name}</span>
                    <span className="ml-2 text-slate-500">{camp.season || '未填写季节'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>创建人员账号</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3" onSubmit={submitAccount}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                      placeholder="姓名"
                      value={accountDisplayName}
                      onChange={(event) => setAccountDisplayName(event.target.value)}
                    />
                    <select
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={accountRole}
                      onChange={(event) => setAccountRole(event.target.value as 'admin' | 'staff' | 'coach' | 'judge')}
                    >
                      <option value="staff">工作人员</option>
                      <option value="coach">教练</option>
                      <option value="judge">评委</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                      placeholder="账号"
                      value={accountUsername}
                      onChange={(event) => setAccountUsername(event.target.value)}
                    />
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                      placeholder="密码"
                      type="password"
                      value={accountPassword}
                      onChange={(event) => setAccountPassword(event.target.value)}
                    />
                    <Button type="submit" disabled={isSaving || !accountUsername || !accountPassword || !accountDisplayName}>
                      创建
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Excel 导入本期学员</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={previewEnrollmentImport}>
                <input
                  className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(event) => {
                    setImportFile(event.target.files?.[0] ?? null)
                    setImportPreview(null)
                  }}
                />
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isSaving || !importFile}>预览导入</Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving || !importFile || !importPreview || Boolean(importPreview.errors.length)}
                    onClick={commitEnrollmentImport}
                  >
                    确认导入
                  </Button>
                </div>
              </form>
              {importPreview ? (
                <div className="mt-5 rounded-md border border-slate-200 px-4 py-3">
                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <p>总行数：<span className="font-semibold">{importPreview.total}</span></p>
                    <p>新增学员：<span className="font-semibold">{importPreview.new_student_count}</span></p>
                    <p>匹配已有：<span className="font-semibold">{importPreview.matched_student_count}</span></p>
                  </div>
                  {importPreview.errors.length ? (
                    <div className="mt-4 grid gap-2">
                      {importPreview.errors.slice(0, 6).map((error) => (
                        <p key={error.row} className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                          第 {error.row} 行：{error.messages.join('；')}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      校验通过，可以确认导入。
                    </p>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>按昵称批量创建队伍</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={submitBulkTeam}>
                <input
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  placeholder="队伍名称"
                  value={bulkTeamName}
                  onChange={(event) => setBulkTeamName(event.target.value)}
                />
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  value={bulkTeamCoachId}
                  onChange={(event) => setBulkTeamCoachId(event.target.value)}
                >
                  <option value="">选择教练</option>
                  {operations?.coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
                <textarea
                  className="min-h-32 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  placeholder={'每行一个本期昵称，必须 7-8 人\njimmy\n洋子\n大林\nTing'}
                  value={bulkTeamNicknames}
                  onChange={(event) => setBulkTeamNicknames(event.target.value)}
                />
                <Button type="submit" disabled={isSaving || !bulkTeamName || !bulkTeamCoachId || !bulkTeamNicknames}>
                  创建队伍并归队
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>空队伍创建</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={submitTeam}>
                <input
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  placeholder="队伍名称"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                />
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  value={teamCoachId}
                  onChange={(event) => setTeamCoachId(event.target.value)}
                >
                  <option value="">选择教练</option>
                  {operations?.coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>{coach.name}</option>
                  ))}
                </select>
                <Button type="submit" disabled={isSaving || !teamName || !teamCoachId}>创建空队伍</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>录入学员并归队</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={submitStudent}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="真实姓名" value={studentName} onChange={(event) => setStudentName(event.target.value)} />
                  <input className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="本期昵称" value={studentNickname} onChange={(event) => setStudentNickname(event.target.value)} />
                </div>
                <input className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400" placeholder="联系方式" value={studentPhone} onChange={(event) => setStudentPhone(event.target.value)} />
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  value={studentTeamId}
                  onChange={(event) => setStudentTeamId(event.target.value)}
                >
                  <option value="">暂不分队</option>
                  {operations?.teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <Button type="submit" disabled={isSaving || !studentName || !studentNickname}>录入学员</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>账号列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {operations?.users.map((account) => (
                  <div key={account.id} className="rounded-md border border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{account.display_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{account.username} · {account.role}</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => toggleAccount(account.id, account.is_active)}>
                      {account.is_active ? '停用' : '启用'}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    绑定：{account.coach_name || account.judge_name || '无需绑定'}
                  </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>设置辩题</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="mb-5 grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={submitTopic}>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                value={topicRoundId}
                onChange={(event) => setTopicRoundId(event.target.value)}
              >
                {operations?.rounds.map((round) => (
                  <option key={round.id} value={round.id}>积分赛 {round.number}</option>
                ))}
              </select>
              <input
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                placeholder="输入本轮辩题"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
              <Button type="submit" disabled={isSaving || !topicRoundId}>保存辩题</Button>
            </form>
            <div className="grid gap-3">
              {operations?.rounds.length ? (
                operations.rounds.map((round) => (
                  <div key={round.id} className="rounded-md border border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">积分赛 {round.number}</p>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {round.match_count} 场比赛
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{round.topic || '暂未设置辩题'}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无积分赛轮次。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>创建会场与评委分配</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="mb-5 grid gap-3" onSubmit={submitVenue}>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={venueRoundId}
                    onChange={(event) => setVenueRoundId(event.target.value)}
                  >
                    {operations?.rounds.map((round) => (
                      <option key={round.id} value={round.id}>积分赛 {round.number}</option>
                    ))}
                  </select>
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    placeholder="会场名称，如 B 会场"
                    value={venueName}
                    onChange={(event) => setVenueName(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <p className="text-sm font-medium">分配评委</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {operations?.judges.map((judge) => (
                      <label key={judge.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                        <input
                          checked={venueJudgeIds.includes(String(judge.id))}
                          type="checkbox"
                          onChange={(event) => {
                            setVenueJudgeIds((current) =>
                              event.target.checked
                                ? [...current, String(judge.id)]
                                : current.filter((id) => id !== String(judge.id)),
                            )
                          }}
                        />
                        {judge.name}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={isSaving || !venueName || !venueRoundId}>创建会场</Button>
              </form>
              <div className="grid gap-3">
                {operations?.venues.length ? (
                  operations.venues.map((venue) => (
                    <div key={venue.id} className="rounded-md border border-slate-200 px-4 py-3">
                      <p className="font-semibold">{venue.name}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        评委：{venue.judge_names.join('、') || '暂未分配'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">暂无会场。</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>录入对阵</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="mb-5 grid gap-3" onSubmit={submitMatch}>
                <div className="grid gap-3 md:grid-cols-4">
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={matchRoundId}
                    onChange={(event) => {
                      setMatchRoundId(event.target.value)
                      setMatchVenueId('')
                    }}
                  >
                    {operations?.rounds.map((round) => (
                      <option key={round.id} value={round.id}>积分赛 {round.number}</option>
                    ))}
                  </select>
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={matchVenueId}
                    onChange={(event) => setMatchVenueId(event.target.value)}
                  >
                    <option value="">选择会场</option>
                    {venuesForSelectedRound.map((venue) => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    min="1"
                    max="5"
                    placeholder="场次"
                    type="number"
                    value={matchSequence}
                    onChange={(event) => setMatchSequence(event.target.value)}
                  />
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    type="time"
                    value={matchTime}
                    onChange={(event) => setMatchTime(event.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-red-700">
                    正方队伍
                    <select
                      className="h-10 rounded-md border border-red-100 bg-white px-3 text-sm text-slate-950 outline-none focus:border-red-300"
                      value={affirmativeTeamId}
                      onChange={(event) => setAffirmativeTeamId(event.target.value)}
                    >
                      {operations?.teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-blue-700">
                    反方队伍
                    <select
                      className="h-10 rounded-md border border-blue-100 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-300"
                      value={negativeTeamId}
                      onChange={(event) => setNegativeTeamId(event.target.value)}
                    >
                      {operations?.teams.map((team) => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button type="submit" disabled={isSaving || !matchVenueId || !matchSequence}>创建对阵</Button>
              </form>
              <div className="grid gap-3">
                {operations?.matches.length ? (
                  operations.matches.map((match) => (
                    <div key={match.id} className="rounded-md border border-slate-200 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                        <span>积分赛 {match.round_number} · {match.venue_name} · 第 {match.sequence} 场</span>
                        <span>{match.starts_at.slice(0, 5)}</span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2">
                          <p className="text-xs font-medium text-red-500">正方</p>
                          <p className="mt-1 font-semibold text-red-900">{match.affirmative_team_name}</p>
                        </div>
                        <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                          <p className="text-xs font-medium text-blue-500">反方</p>
                          <p className="mt-1 font-semibold text-blue-900">{match.negative_team_name}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">暂无对阵。</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>积分核对与赛事记录完成情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {operations?.matchReviews.length ? (
                operations.matchReviews.map((review) => (
                  <div key={review.match} className="rounded-lg border border-slate-200 px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          积分赛 {review.round_number} · {review.venue_name} · 第 {review.sequence} 场 · {review.starts_at}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{review.topic || '暂未设置辩题'}</p>
                      </div>
                      <span
                        className={
                          review.is_complete
                            ? 'rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700'
                            : 'rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700'
                        }
                      >
                        {review.is_complete ? '已完成' : '待核对'}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">辩位录入</p>
                        <p className="mt-1 font-semibold">
                          正 {review.affirmative_position_count}/4 · 反 {review.negative_position_count}/4
                        </p>
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">评委提交</p>
                        <p className="mt-1 font-semibold">
                          {review.submitted_ballot_count}/{review.assigned_judge_count}
                        </p>
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">草稿 / 未提交</p>
                        <p className="mt-1 font-semibold">
                          {review.draft_ballot_count} / {review.pending_ballot_count}
                        </p>
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-500">辩位分录入</p>
                        <p className="mt-1 font-semibold">
                          {review.submitted_score_count}/{review.expected_score_count}
                        </p>
                      </div>
                      <div className="rounded-md bg-slate-50 px-3 py-2 md:col-span-2">
                        <p className="text-xs text-slate-500">评委</p>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {review.assigned_judge_names.join('、') || '暂未分配'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3">
                        <p className="text-xs font-medium text-red-500">正方</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-red-900">{review.affirmative_team_name}</p>
                          <p className="text-lg font-semibold text-red-900">{review.affirmative_points.toFixed(2)} 分</p>
                        </div>
                        <p className="mt-2 text-xs text-red-800">
                          辩位分 {review.affirmative_position_score.toFixed(1)} × 0.15 + 投票 {review.affirmative_votes}
                        </p>
                      </div>
                      <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
                        <p className="text-xs font-medium text-blue-500">反方</p>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-blue-900">{review.negative_team_name}</p>
                          <p className="text-lg font-semibold text-blue-900">{review.negative_points.toFixed(2)} 分</p>
                        </div>
                        <p className="mt-2 text-xs text-blue-800">
                          辩位分 {review.negative_position_score.toFixed(1)} × 0.15 + 投票 {review.negative_votes}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">最佳辩手票汇总</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {review.best_speaker_totals.length ? (
                          review.best_speaker_totals.map((speaker) => (
                            <span
                              key={speaker.position}
                              className={
                                speaker.side === 'affirmative'
                                  ? 'rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800'
                                  : 'rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'
                              }
                            >
                              {speaker.label} · {speaker.speaker} · {speaker.votes} 票
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-500">暂无已提交最佳辩手票。</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无可核对的比赛。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>队伍积分榜</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">排名</th>
                    <th className="py-2 pr-4 font-medium">队伍</th>
                    <th className="py-2 pr-4 font-medium">积分赛 1</th>
                    <th className="py-2 pr-4 font-medium">积分赛 2</th>
                    <th className="py-2 pr-4 font-medium">积分赛 3</th>
                    <th className="py-2 pr-4 font-medium">总分</th>
                  </tr>
                </thead>
                <tbody>
                  {operations?.teamRankings.map((team, index) => (
                    <tr key={team.team} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold">{index + 1}</td>
                      <td className="py-3 pr-4 font-semibold">{team.team_name}</td>
                      {team.round_scores.map((round) => (
                        <td key={round.round_number} className="py-3 pr-4">{round.score.toFixed(2)}</td>
                      ))}
                      <td className="py-3 pr-4 font-semibold">{team.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>队伍列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {operations?.teams.map((team) => (
                <div key={team.id} className="rounded-md border border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{team.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const name = window.prompt('队伍名称', team.name)
                        if (!name) return
                        quickUpdateTeam(team.id, name, team.coach)
                      }}
                    >
                      编辑
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    教练：{team.coach_name} · 队员：{team.member_count} 人
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-slate-400">Token 已建立：{token?.slice(0, 8)}...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学员归队表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {operations?.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="rounded-md border border-slate-200 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{enrollment.nickname}</p>
                      <p className="mt-1 text-xs text-slate-500">{enrollment.student_name} · {enrollment.team_name || '暂未分队'}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const nickname = window.prompt('本期昵称', enrollment.nickname)
                        if (!nickname) return
                        quickUpdateEnrollment(enrollment.id, nickname, enrollment.team)
                      }}
                    >
                      编辑
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </section>
  )
}

function CoachWorkspace({
  dashboard,
  error,
  token,
  onRefresh,
}: {
  dashboard: CoachDashboard | null
  error: string
  token: string | null
  onRefresh: () => void
}) {
  return (
    <section className="flex flex-1 flex-col gap-5 py-8">
      <div>
        <h2 className="text-xl font-semibold tracking-normal">教练工作台</h2>
        <p className="mt-2 text-sm text-slate-500">查看本队队员，并为每场积分赛录入本队四个辩位和评委可见备注。</p>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="当前队伍" value={dashboard?.team.name ?? '读取中'} />
        <MetricCard label="所属营期" value={dashboard?.team.camp_name ?? '读取中'} />
        <MetricCard label="待处理比赛" value={String(dashboard?.matches.filter((match) => !match.position_completion.is_complete).length ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>我的队员</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {dashboard?.members.length ? (
              dashboard.members.map((member) => (
                <div key={member.id} className="rounded-md border border-slate-200 px-4 py-3">
                  <p className="font-semibold">{member.nickname}</p>
                  <p className="mt-1 text-xs text-slate-500">{member.student_name}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无队员数据。</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5">
        {dashboard?.matches.length ? (
          dashboard.matches.map((match) => (
            <CoachMatchCard
              key={match.id}
              match={match}
              members={dashboard.members}
              token={token}
              onRefresh={onRefresh}
            />
          ))
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">当前队伍暂无积分赛比赛。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

function CoachMatchCard({
  match,
  members,
  token,
  onRefresh,
}: {
  match: CoachDashboard['matches'][number]
  members: CoachDashboard['members']
  token: string | null
  onRefresh: () => void
}) {
  const [positionForms, setPositionForms] = useState<Record<number, { enrollment: string; coachNote: string }>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const positionsByNumber = new Map(match.positions.map((position) => [position.position_number, position]))
    setPositionForms(
      Object.fromEntries(
        [1, 2, 3, 4].map((positionNumber) => {
          const position = positionsByNumber.get(positionNumber)
          return [
            positionNumber,
            {
              enrollment: position?.enrollment ? String(position.enrollment) : '',
              coachNote: position?.coach_note ?? '',
            },
          ]
        }),
      ),
    )
    setMessage('')
    setError('')
  }, [match])

  function updatePosition(positionNumber: number, field: 'enrollment' | 'coachNote', value: string) {
    setPositionForms((current) => ({
      ...current,
      [positionNumber]: {
        ...current[positionNumber],
        [field]: value,
      },
    }))
  }

  async function savePositions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    if ([1, 2, 3, 4].some((positionNumber) => !positionForms[positionNumber]?.enrollment)) {
      setError('请完整选择一辩、二辩、三辩、四辩。')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      await apiSubmitCoachPositions(
        token,
        match.id,
        [1, 2, 3, 4].map((positionNumber) => ({
          position_number: positionNumber,
          enrollment: Number(positionForms[positionNumber].enrollment),
          coach_note: positionForms[positionNumber].coachNote,
        })),
      )
      setMessage('辩位已保存。')
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请检查输入。')
    } finally {
      setIsSaving(false)
    }
  }

  const sideLabel = match.coach_side === 'affirmative' ? '正方' : '反方'
  const sideClass =
    match.coach_side === 'affirmative'
      ? 'border-red-100 bg-red-50 text-red-900'
      : 'border-blue-100 bg-blue-50 text-blue-900'

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>积分赛 {match.round_number} · {match.venue_name} · 第 {match.sequence} 场</CardTitle>
            <p className="mt-2 text-sm text-slate-500">{match.starts_at.slice(0, 5)} · {match.topic || '暂未设置辩题'}</p>
          </div>
          <span
            className={
              match.position_completion.is_complete
                ? 'rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700'
                : 'rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700'
            }
          >
            {match.position_completion.completed}/{match.position_completion.required} 已录入
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <div className={match.coach_side === 'affirmative' ? 'rounded-md border border-red-100 bg-red-50 px-4 py-3' : 'rounded-md border border-slate-200 px-4 py-3'}>
            <p className="text-xs font-medium text-red-500">正方</p>
            <p className="mt-1 font-semibold text-red-900">{match.affirmative_team_name}</p>
          </div>
          <div className={match.coach_side === 'negative' ? 'rounded-md border border-blue-100 bg-blue-50 px-4 py-3' : 'rounded-md border border-slate-200 px-4 py-3'}>
            <p className="text-xs font-medium text-blue-500">反方</p>
            <p className="mt-1 font-semibold text-blue-900">{match.negative_team_name}</p>
          </div>
        </div>

        <div className={`mt-4 rounded-md border px-4 py-3 ${sideClass}`}>
          <p className="text-sm font-semibold">本队本场为{sideLabel}：{match.coach_team_name}</p>
        </div>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

        <form className="mt-5 grid gap-4" onSubmit={savePositions}>
          {[1, 2, 3, 4].map((positionNumber) => (
            <div key={positionNumber} className="rounded-md border border-slate-200 px-4 py-3">
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  {sideLabel}{positionNumber}辩
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={positionForms[positionNumber]?.enrollment ?? ''}
                    onChange={(event) => updatePosition(positionNumber, 'enrollment', event.target.value)}
                  >
                    <option value="">选择队员</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.nickname}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium">
                  评委可见备注
                  <input
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                    placeholder="例如：重点观察开篇结构、攻防节奏等"
                    value={positionForms[positionNumber]?.coachNote ?? ''}
                    onChange={(event) => updatePosition(positionNumber, 'coachNote', event.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>保存本场辩位</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
      </CardContent>
    </Card>
  )
}

function JudgeWorkspace({
  matches,
  selectedMatch,
  onSelectMatch,
  onBack,
  error,
  token,
  onRefresh,
}: {
  matches: JudgeMatch[]
  selectedMatch: JudgeMatch | null
  onSelectMatch: (id: number) => void
  onBack: () => void
  error: string
  token: string | null
  onRefresh: () => void
}) {
  if (selectedMatch) {
    return <JudgeMatchDetail match={selectedMatch} onBack={onBack} token={token} onRefresh={onRefresh} />
  }

  return (
    <section className="flex flex-1 flex-col gap-5 py-8">
      <div>
        <h2 className="text-xl font-semibold tracking-normal">我的评审比赛</h2>
        <p className="mt-2 text-sm text-slate-500">进入比赛后完成发言记录、评委反馈、辩位打分、最终投票和最佳辩手票。</p>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4">
        {matches.length ? matches.map((match) => (
          <button
            key={match.id}
            type="button"
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
            onClick={() => onSelectMatch(match.id)}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{match.round_label}</span>
                  <span>{match.venue_name}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-4" />
                    {match.starts_at.slice(0, 5)}
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
                <p className="mt-1 font-semibold text-red-900">{match.affirmative_team_name}</p>
              </div>
              <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-medium text-blue-500">反方</p>
                <p className="mt-1 font-semibold text-blue-900">{match.negative_team_name}</p>
              </div>
            </div>
          </button>
        )) : (
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">当前没有分配给你的评审比赛。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

function JudgeMatchDetail({
  match,
  onBack,
  token,
  onRefresh,
}: {
  match: JudgeMatch
  onBack: () => void
  token: string | null
  onRefresh: () => void
}) {
  const [positionForms, setPositionForms] = useState<Record<number, { score: string; speechRecord: string; judgeFeedback: string }>>({})
  const [affirmativeVotes, setAffirmativeVotes] = useState('0')
  const [negativeVotes, setNegativeVotes] = useState('3')
  const [bestVotes, setBestVotes] = useState<Record<number, string>>({ 3: '', 2: '', 1: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const scoresByPosition = new Map(match.ballot?.position_scores.map((score) => [score.position, score]) ?? [])
    const votesByWeight = new Map(match.ballot?.best_speaker_votes.map((vote) => [vote.weight, String(vote.position)]) ?? [])
    const nextPositionForms = Object.fromEntries(
      match.positions.map((position) => {
        const existingScore = scoresByPosition.get(position.id)
        return [
          position.id,
          {
            score: existingScore?.score ?? '',
            speechRecord: existingScore?.speech_record ?? '',
            judgeFeedback: existingScore?.judge_feedback ?? '',
          },
        ]
      }),
    )

    setPositionForms(nextPositionForms)
    setAffirmativeVotes(String(match.ballot?.affirmative_votes ?? 0))
    setNegativeVotes(String(match.ballot?.negative_votes ?? 3))
    setBestVotes({
      3: votesByWeight.get(3) ?? '',
      2: votesByWeight.get(2) ?? '',
      1: votesByWeight.get(1) ?? '',
    })
    setMessage('')
    setError('')
  }, [match])

  function updatePosition(positionId: number, field: 'score' | 'speechRecord' | 'judgeFeedback', value: string) {
    setPositionForms((current) => ({
      ...current,
      [positionId]: {
        ...current[positionId],
        [field]: value,
      },
    }))
  }

  async function saveBallot(submit: boolean) {
    if (!token) return
    const selectedBestPositions = [bestVotes[3], bestVotes[2], bestVotes[1]].filter(Boolean)

    if (Number(affirmativeVotes) + Number(negativeVotes) !== 3) {
      setError('最终投票正反方合计必须是 3 票。')
      return
    }
    if (selectedBestPositions.length !== 3 || new Set(selectedBestPositions).size !== 3) {
      setError('最佳辩手 3/2/1 票必须各选一名，且不能重复。')
      return
    }
    if (match.positions.some((position) => positionForms[position.id]?.score === '')) {
      setError('请为本场所有辩位填写 0-9 分。')
      return
    }

    const payload: JudgeBallotPayload = {
      affirmative_votes: Number(affirmativeVotes),
      negative_votes: Number(negativeVotes),
      submit,
      position_scores: match.positions.map((position) => ({
        position: position.id,
        score: Number(positionForms[position.id].score),
        speech_record: positionForms[position.id].speechRecord,
        judge_feedback: positionForms[position.id].judgeFeedback,
      })),
      best_speaker_votes: [3, 2, 1].map((weight) => ({
        position: Number(bestVotes[weight]),
        weight,
      })),
    }

    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      await apiSubmitJudgeBallot(token, match.id, payload)
      setMessage(submit ? '评审记录已提交。' : '草稿已保存。')
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请检查输入。')
    } finally {
      setIsSaving(false)
    }
  }

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
            {match.round_label} · {match.venue_name} · {match.starts_at.slice(0, 5)}
          </p>
        </div>
        <div className="grid min-w-80 gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-medium text-red-500">正方</p>
            <p className="mt-1 font-semibold text-red-900">{match.affirmative_team_name}</p>
          </div>
          <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-500">反方</p>
            <p className="mt-1 font-semibold text-blue-900">{match.negative_team_name}</p>
          </div>
        </div>
      </div>

      {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

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
                    <p className="mt-1 text-xs text-slate-500">教练备注：{position.coach_note || '暂无备注'}</p>
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
                      value={positionForms[position.id]?.score ?? ''}
                      onChange={(event) => updatePosition(position.id, 'score', event.target.value)}
                    />
                  </label>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    发言记录
                    <textarea
                      className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={positionForms[position.id]?.speechRecord ?? ''}
                      onChange={(event) => updatePosition(position.id, 'speechRecord', event.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    评委反馈
                    <textarea
                      className="min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={positionForms[position.id]?.judgeFeedback ?? ''}
                      onChange={(event) => updatePosition(position.id, 'judgeFeedback', event.target.value)}
                    />
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
                <input
                  className="h-10 rounded-md border border-red-100 px-3 text-slate-950 outline-none focus:border-red-300"
                  max="3"
                  min="0"
                  type="number"
                  value={affirmativeVotes}
                  onChange={(event) => setAffirmativeVotes(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-blue-700">
                反方票数
                <input
                  className="h-10 rounded-md border border-blue-100 px-3 text-slate-950 outline-none focus:border-blue-300"
                  max="3"
                  min="0"
                  type="number"
                  value={negativeVotes}
                  onChange={(event) => setNegativeVotes(event.target.value)}
                />
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
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={bestVotes[weight] ?? ''}
                    onChange={(event) => setBestVotes((current) => ({ ...current, [weight]: event.target.value }))}
                  >
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
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => saveBallot(false)}>保存草稿</Button>
        <Button type="button" disabled={isSaving} onClick={() => saveBallot(true)}>提交评审记录</Button>
      </div>
    </section>
  )
}

export default App
