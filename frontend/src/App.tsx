import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
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
  apiCreateAssessmentAssignment,
  apiCreateAssessmentVenue,
  apiCreateCamp,
  apiCreateCoach,
  apiCreateJudge,
  apiCreateMatch,
  apiCreateTeamFromNicknames,
  apiCreateUserAccount,
  apiCreateVenue,
  apiDownloadGraduationExport,
  apiDownloadOperationsExport,
  apiGetCoachAssessments,
  apiGetCoachDashboard,
  apiGetJudgeMatches,
  apiGetOperationsDashboard,
  apiImportEnrollments,
  apiLogin,
  apiSubmitCoachPositions,
  apiSubmitEntranceScore,
  apiSubmitGraduationEvaluation,
  apiSubmitJudgeBallot,
  apiUpdateEnrollment,
  apiUpdateMatch,
  apiUpdateRoundTopic,
  apiUpdateTeam,
  apiUpdateUserAccount,
  apiUpdateVenue,
  apiVerifyMatch,
} from './lib/api'
import type { ApiUser, CoachAssessmentDashboard, CoachDashboard, EnrollmentImportPreview, JudgeBallotPayload, JudgeMatch, OperationsDashboard } from './lib/api'

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

type StaffSectionKey =
  | 'overview'
  | 'camp-management'
  | 'camp-students'
  | 'student-library'
  | 'teams-coaches'
  | 'assessment'
  | 'schedule'
  | 'position-progress'
  | 'review'
  | 'rankings'
  | 'graduation'
  | 'system'

const staffSections: Array<{
  key: StaffSectionKey
  title: string
  description: string
  icon: typeof ShieldCheck
  group: 'global' | 'camp'
  adminOnly?: boolean
}> = [
  { key: 'camp-management', title: '营期管理', description: '创建营期、查看全部营期，并维护营期基础信息。', icon: ShieldCheck, group: 'global', adminOnly: true },
  { key: 'system', title: '人员与账号', description: '创建和停用工作人员、教练、评委、管理员账号。', icon: UsersRound, group: 'global', adminOnly: true },
  { key: 'student-library', title: '总学员库', description: '查看跨营期学员、真实姓名、电话和历期昵称。', icon: UsersRound, group: 'global' },
  { key: 'overview', title: '营期总览', description: '查看当前营期准备状态和待处理事项。', icon: BarChart3, group: 'camp' },
  { key: 'camp-students', title: '本期学员', description: '导入本期学员、查看名单和归队状态。', icon: UsersRound, group: 'camp' },
  { key: 'teams-coaches', title: '本期队伍', description: '按昵称建队、绑定教练、维护队伍信息。', icon: Swords, group: 'camp' },
  { key: 'assessment', title: '入营测评', description: '设置测评会场、分配教练和学员。', icon: Medal, group: 'camp' },
  { key: 'schedule', title: '积分赛编排', description: '设置辩题、会场、评委和三轮积分赛对阵。', icon: ClipboardCheck, group: 'camp' },
  { key: 'position-progress', title: '辩位录入进度', description: '查看教练是否完成每场比赛的辩位录入。', icon: ShieldCheck, group: 'camp' },
  { key: 'review', title: '积分核对', description: '汇总评委提交情况、分数、投票和最佳辩手票。', icon: ClipboardCheck, group: 'camp' },
  { key: 'rankings', title: '排名与报表', description: '查看积分榜、学员赛事数据，并导出报表。', icon: BarChart3, group: 'camp' },
  { key: 'graduation', title: '结营评定', description: '查看结营评定完成情况，后续支持批量导出。', icon: Medal, group: 'camp' },
]

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
  const [coachAssessments, setCoachAssessments] = useState<CoachAssessmentDashboard | null>(null)
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
      setCoachAssessments(null)
      setCoachError('')
      return
    }

    let isMounted = true
    Promise.all([apiGetCoachDashboard(token), apiGetCoachAssessments(token)])
      .then(([dashboard, assessments]) => {
        if (isMounted) {
          setCoachDashboard(dashboard)
          setCoachAssessments(assessments)
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
                  setCoachAssessments(null)
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
              operations={operations}
              error={operationsError}
              token={token}
              isAdmin={user.role === 'admin'}
              onRefresh={() => setOperationsReloadKey((value) => value + 1)}
            />
          ) : user.role === 'coach' ? (
            <CoachWorkspace
              dashboard={coachDashboard}
              assessments={coachAssessments}
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
  operations,
  error,
  token,
  isAdmin,
  onRefresh,
}: {
  operations: OperationsDashboard | null
  error: string
  token: string | null
  isAdmin: boolean
  onRefresh: () => void
}) {
  const [topicRoundId, setTopicRoundId] = useState('')
  const [topic, setTopic] = useState('')
  const [scheduleRoundNumber, setScheduleRoundNumber] = useState('1')
  const [venueNameDrafts, setVenueNameDrafts] = useState<Record<number, string>>({})
  const [editingVenue, setEditingVenue] = useState<{ id: number; name: string; judgeIds: string[] } | null>(null)
  const [editingMatch, setEditingMatch] = useState<null | {
    id: number | null
    venueId: number
    sequence: number
    affirmativeTeamId: string
    negativeTeamId: string
  }>(null)
  const [campName, setCampName] = useState('')
  const [campSeason, setCampSeason] = useState('')
  const [campStartsOn, setCampStartsOn] = useState('')
  const [campEndsOn, setCampEndsOn] = useState('')
  const [bulkTeamName, setBulkTeamName] = useState('')
  const [bulkTeamCoachId, setBulkTeamCoachId] = useState('')
  const [bulkTeamNicknames, setBulkTeamNicknames] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<EnrollmentImportPreview | null>(null)
  const [accountUsername, setAccountUsername] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountRole, setAccountRole] = useState<'admin' | 'staff' | 'coach' | 'judge'>('staff')
  const [accountDisplayName, setAccountDisplayName] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<StaffSectionKey>('overview')
  const [studentSearch, setStudentSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const [reviewRoundFilter, setReviewRoundFilter] = useState('all')
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null)
  const [verificationNote, setVerificationNote] = useState('')
  const [bestSpeakerOverride, setBestSpeakerOverride] = useState('')
  const [assessmentVenueName, setAssessmentVenueName] = useState('')
  const [assessmentCoachIds, setAssessmentCoachIds] = useState<string[]>([])
  const [assessmentVenueId, setAssessmentVenueId] = useState('')
  const [assessmentEnrollmentId, setAssessmentEnrollmentId] = useState('')
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)

  const selectedTopicRound = operations?.rounds.find((round) => String(round.id) === topicRoundId)
  const selectedScheduleRound = operations?.rounds.find((round) => String(round.number) === scheduleRoundNumber)
  const visibleSections = staffSections.filter((section) => isAdmin || !section.adminOnly)
  const currentSection = visibleSections.find((section) => section.key === activeSection) ?? visibleSections[0]
  const globalSections = visibleSections.filter((section) => section.group === 'global')
  const campSections = visibleSections.filter((section) => section.group === 'camp')
  const pendingReviewCount = operations?.matchReviews.filter((review) => !review.is_verified).length ?? 0
  const pendingPositionCount =
    operations?.matchReviews.filter(
      (review) => review.affirmative_position_count < 4 || review.negative_position_count < 4,
    ).length ?? 0
  const unassignedEnrollmentCount = operations?.enrollments.filter((enrollment) => !enrollment.team).length ?? 0
  const filteredEnrollments =
    operations?.enrollments.filter((enrollment) => {
      const keyword = studentSearch.trim().toLowerCase()
      if (!keyword) return true
      return [enrollment.nickname, enrollment.student_name, enrollment.team_name ?? '']
        .some((value) => value.toLowerCase().includes(keyword))
    }) ?? []
  const filteredStudentHistories =
    operations?.studentHistories.filter((student) => {
      const keyword = studentSearch.trim().toLowerCase()
      if (!keyword) return true
      return [student.real_name, student.phone, ...student.participations.map((item) => item.nickname)]
        .some((value) => value.toLowerCase().includes(keyword))
    }) ?? []
  const filteredTeams =
    operations?.teams.filter((team) => {
      const keyword = teamSearch.trim().toLowerCase()
      if (!keyword) return true
      return [team.name, team.coach_name].some((value) => value.toLowerCase().includes(keyword))
    }) ?? []
  const requiredVenueCount = operations ? Math.max(1, Math.min(4, Math.ceil(operations.teams.length / 5))) : 1
  const selectedRoundVenues = selectedScheduleRound
    ? operations?.venues.filter((venue) => venue.integral_round === selectedScheduleRound.id) ?? []
    : []
  const selectedRoundMatches = operations?.matches.filter((match) => String(match.round_number) === scheduleRoundNumber) ?? []
  const venueSlots = Array.from({ length: requiredVenueCount }, (_, index) => {
    const existingVenue = selectedRoundVenues[index]
    return {
      index,
      venue: existingVenue,
      draftName: venueNameDrafts[index] ?? existingVenue?.name ?? `${String.fromCharCode(65 + index)} 会场`,
    }
  })
  const firstIntegralRound = operations?.rounds.find((round) => round.number === 1) ?? operations?.rounds[0]
  const firstRoundVenues = firstIntegralRound
    ? operations?.venues.filter((venue) => venue.integral_round === firstIntegralRound.id) ?? []
    : []
  const overviewVenueSlots = Array.from({ length: requiredVenueCount }, (_, index) => {
    const existingVenue = firstRoundVenues[index]
    return {
      index,
      venue: existingVenue,
      draftName: venueNameDrafts[index] ?? existingVenue?.name ?? `${String.fromCharCode(65 + index)} 会场`,
    }
  })
  const visibleReviews =
    operations?.matchReviews.filter((review) => reviewRoundFilter === 'all' || String(review.round_number) === reviewRoundFilter) ?? []
  const selectedReview = operations?.matchReviews.find((review) => review.match === selectedReviewId) ?? null

  useEffect(() => {
    if (!operations) return
    const firstRound = operations.rounds[0]

    if (firstRound && !topicRoundId) {
      setTopicRoundId(String(firstRound.id))
      setTopic(firstRound.topic)
    }
    if (operations.coaches[0] && !bulkTeamCoachId) setBulkTeamCoachId(String(operations.coaches[0].id))
    if (operations.assessmentVenues[0] && !assessmentVenueId) setAssessmentVenueId(String(operations.assessmentVenues[0].id))
    if (operations.enrollments[0] && !assessmentEnrollmentId) setAssessmentEnrollmentId(String(operations.enrollments[0].id))
  }, [assessmentEnrollmentId, assessmentVenueId, bulkTeamCoachId, operations, topicRoundId])

  useEffect(() => {
    if (selectedTopicRound) setTopic(selectedTopicRound.topic)
  }, [selectedTopicRound])

  useEffect(() => {
    if (!selectedReview) return
    setVerificationNote(selectedReview.verification_note)
    setBestSpeakerOverride(selectedReview.best_speaker_override ? String(selectedReview.best_speaker_override) : '')
  }, [selectedReview])

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
    if (!token || !selectedScheduleRound || !editingVenue) return
    if (editingVenue.judgeIds.length < 2 || editingVenue.judgeIds.length > 3) {
      setFormError('每个会场必须分配 2-3 位评委。')
      return
    }
    await save(async () => {
      if (editingVenue.id) {
        await apiUpdateVenue(token, editingVenue.id, {
          name: editingVenue.name,
          judges: editingVenue.judgeIds.map(Number),
        })
      }
      setEditingVenue(null)
      return '会场评委已更新。'
    })
  }

  async function saveVenueSlot(name: string) {
    if (!token || !selectedScheduleRound || !name.trim()) return
    if (selectedRoundVenues.some((venue) => venue.name === name.trim())) {
      setFormError('当前轮次已存在同名会场，请更换名称。')
      return
    }
    await save(async () => {
      await apiCreateVenue(token, selectedScheduleRound.id, name.trim(), [])
      return '会场名称已保存。'
    })
  }

  async function syncVenueNamesToRounds() {
    if (!token || !operations) return
    await save(async () => {
      const names = overviewVenueSlots.map((slot) => slot.draftName.trim()).filter(Boolean)
      if (new Set(names).size !== names.length) {
        throw new Error('会场名称不能重复，请先调整名称。')
      }
      for (const round of operations.rounds) {
        const venues = operations.venues
          .filter((venue) => venue.integral_round === round.id)
          .map((venue) => ({ id: venue.id, name: venue.name }))
        for (const [index, name] of names.entries()) {
          const sameNameVenue = venues.find((venue) => venue.name === name)
          if (sameNameVenue) continue

          const existing = venues[index]
          if (existing) {
            await apiUpdateVenue(token, existing.id, { name })
            existing.name = name
          } else {
            await apiCreateVenue(token, round.id, name, [])
            venues.push({ id: -Date.now() - index, name })
          }
        }
      }
      return '本期会场名称已同步到三轮积分赛。'
    })
  }

  async function submitAssessmentVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const activeCamp = operations?.activeCamp
    if (!token || !activeCamp || !assessmentVenueName) return
    await save(async () => {
      await apiCreateAssessmentVenue(token, activeCamp.id, assessmentVenueName, assessmentCoachIds.map(Number))
      setAssessmentVenueName('')
      setAssessmentCoachIds([])
      return '测评会场已创建。'
    })
  }

  async function submitAssessmentAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !assessmentVenueId || !assessmentEnrollmentId) return
    await save(async () => {
      await apiCreateAssessmentAssignment(token, Number(assessmentVenueId), Number(assessmentEnrollmentId))
      return '学员已分配到测评会场。'
    })
  }

  async function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !editingMatch) return
    if (editingMatch.affirmativeTeamId === editingMatch.negativeTeamId) {
      setFormError('正反方不能选择同一支队伍。')
      return
    }
    await save(async () => {
      const payload = {
        venue: editingMatch.venueId,
        sequence: editingMatch.sequence,
        starts_at: `${String(7 + editingMatch.sequence).padStart(2, '0')}:00`,
        affirmative_team: Number(editingMatch.affirmativeTeamId),
        negative_team: Number(editingMatch.negativeTeamId),
      }
      if (editingMatch.id) {
        await apiUpdateMatch(token, editingMatch.id, payload)
      } else if (selectedScheduleRound) {
        await apiCreateMatch(token, {
          integral_round: selectedScheduleRound.id,
          ...payload,
        })
      }
      setEditingMatch(null)
      return editingMatch.id ? '对阵已更新。' : '对阵已创建。'
    })
  }

  async function submitMatchVerification(matchId: number, isVerified: boolean) {
    if (!token) return
    await save(async () => {
      await apiVerifyMatch(token, matchId, {
        is_verified: isVerified,
        verification_note: verificationNote,
        best_speaker_override: bestSpeakerOverride ? Number(bestSpeakerOverride) : null,
      })
      return isVerified ? '比赛已标记为核验完成。' : '比赛已取消核验。'
    })
  }

  async function downloadExport(kind: 'team-rankings' | 'student-stats' | 'judge-records', filename: string) {
    if (!token) return
    await save(async () => {
      const blob = await apiDownloadOperationsExport(token, kind)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      return '导出文件已生成。'
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
      setIsImportModalOpen(false)
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
      setIsTeamModalOpen(false)
      return '队伍已创建，7-8 位学员已归队。'
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
      setIsAccountModalOpen(false)
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
        <nav className="flex flex-col gap-5">
          {[
            ['全局管理', globalSections],
            ['当前营期运营', campSections],
          ].map(([groupTitle, sections]) => (
            <div key={groupTitle as string} className="grid gap-2">
              <p className="px-3 text-xs font-semibold text-slate-400">{groupTitle as string}</p>
              {(sections as typeof visibleSections).map((item) => {
                const Icon = item.icon
                const isActive = item.key === currentSection.key
                return (
                  <button
                    key={item.title}
                    className={
                      isActive
                        ? 'flex items-center gap-3 rounded-md bg-slate-950 px-3 py-2 text-left text-sm font-medium text-white'
                        : 'flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100'
                    }
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                  >
                    <Icon className="size-4" />
                    {item.title}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">{currentSection.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{currentSection.description}</p>
        </div>

        {currentSection.group === 'camp' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-medium text-slate-500">当前营期</p>
              <p className="mt-1 text-sm font-semibold">{operations?.activeCamp?.name ?? '暂无营期'}</p>
            </div>
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-600">
              跨营期数据请到左侧“全局管理”
            </span>
          </div>
        ) : null}

        {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {formError ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p> : null}
        {formMessage ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{formMessage}</p> : null}

        {activeSection === 'overview' ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="当前营期" value={operations?.activeCamp?.name ?? '读取中'} />
              <MetricCard label="队伍数" value={String(operations?.teams.length ?? 0)} />
              <MetricCard label="评委数" value={String(operations?.judges.length ?? 0)} />
              <MetricCard label="已录对阵" value={String(operations?.matches.length ?? 0)} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>待处理事项</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-700">待核对比赛</p>
                    <p className="mt-2 text-2xl font-semibold text-amber-900">{pendingReviewCount}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">辩位未完整录入</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{pendingPositionCount}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-600">未分队学员</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{unassignedEnrollmentCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>本期会场名称预设</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    本期 {operations?.teams.length ?? 0} 支队伍，应设置 {requiredVenueCount} 个会场；名称会同步到三轮积分赛。
                  </p>
                  <Button type="button" disabled={isSaving || !operations?.rounds.length} onClick={syncVenueNamesToRounds}>
                    同步到三轮积分赛
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {overviewVenueSlots.map((slot) => (
                    <label key={slot.index} className="grid gap-2 text-sm font-medium text-slate-700">
                      {String.fromCharCode(65 + slot.index)} 会场名称
                      <input
                        className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal outline-none focus:border-slate-400"
                        value={slot.draftName}
                        onChange={(event) =>
                          setVenueNameDrafts((current) => ({ ...current, [slot.index]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {activeSection === 'camp-management' || activeSection === 'system' ? (
          <div className="grid gap-5 xl:grid-cols-2">
          {activeSection === 'camp-management' ? (
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
          ) : null}

          </div>
        ) : null}

        {isAdmin && activeSection === 'system' ? (
          <>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setIsAccountModalOpen(true)}>创建账号</Button>
            </div>
            {(['admin', 'staff', 'coach', 'judge'] as const).map((role) => {
              const accounts = operations?.users.filter((account) => account.role === role) ?? []
              const roleLabel = { admin: '管理员', staff: '工作人员', coach: '教练', judge: '评委' }[role]
              return (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle>{roleLabel}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-slate-500">
                            <th className="py-2 pr-4 font-medium">姓名</th>
                            <th className="py-2 pr-4 font-medium">账号</th>
                            <th className="py-2 pr-4 font-medium">状态</th>
                            <th className="py-2 pr-4 font-medium">关联档案</th>
                            <th className="py-2 pr-4 font-medium">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => (
                            <tr key={account.id} className="border-b border-slate-100">
                              <td className="py-3 pr-4 font-semibold">{account.display_name}</td>
                              <td className="py-3 pr-4">{account.username}</td>
                              <td className="py-3 pr-4">{account.is_active ? '启用' : '停用'}</td>
                              <td className="py-3 pr-4">{account.coach_name || account.judge_name || '无需关联'}</td>
                              <td className="py-3 pr-4">
                                <Button type="button" variant="outline" onClick={() => toggleAccount(account.id, account.is_active)}>
                                  {account.is_active ? '停用' : '启用'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        ) : null}

        {activeSection === 'assessment' ? (
          <>
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>创建测评会场</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3" onSubmit={submitAssessmentVenue}>
                    <input
                      className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                      placeholder="测评会场名称，如 A 测评室"
                      value={assessmentVenueName}
                      onChange={(event) => setAssessmentVenueName(event.target.value)}
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      {operations?.coaches.map((coach) => (
                        <label key={coach.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                          <input
                            checked={assessmentCoachIds.includes(String(coach.id))}
                            type="checkbox"
                            onChange={(event) => {
                              setAssessmentCoachIds((current) =>
                                event.target.checked
                                  ? [...current, String(coach.id)]
                                  : current.filter((id) => id !== String(coach.id)),
                              )
                            }}
                          />
                          {coach.name}
                        </label>
                      ))}
                    </div>
                    <Button type="submit" disabled={isSaving || !assessmentVenueName}>创建测评会场</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>分配测评学员</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3" onSubmit={submitAssessmentAssignment}>
                    <select
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={assessmentVenueId}
                      onChange={(event) => setAssessmentVenueId(event.target.value)}
                    >
                      <option value="">选择测评会场</option>
                      {operations?.assessmentVenues.map((venue) => (
                        <option key={venue.id} value={venue.id}>{venue.name}</option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                      value={assessmentEnrollmentId}
                      onChange={(event) => setAssessmentEnrollmentId(event.target.value)}
                    >
                      <option value="">选择学员</option>
                      {operations?.enrollments.map((enrollment) => (
                        <option key={enrollment.id} value={enrollment.id}>
                          {enrollment.nickname} · {enrollment.student_name}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" disabled={isSaving || !assessmentVenueId || !assessmentEnrollmentId}>分配学员</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>测评会场与分配情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {operations?.assessmentVenues.map((venue) => {
                    const assignments = operations.assessmentAssignments.filter((item) => item.venue === venue.id)
                    return (
                      <div key={venue.id} className="rounded-md border border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold">{venue.name}</p>
                          <p className="text-xs text-slate-500">教练：{venue.coach_names.join('、') || '未分配'}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignments.length ? assignments.map((assignment) => (
                            <span key={assignment.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {assignment.enrollment_nickname} · {assignment.student_name}
                            </span>
                          )) : <span className="text-xs text-slate-400">暂无学员</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {activeSection === 'schedule' ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700">编排轮次</span>
                {['1', '2', '3'].map((roundNumber) => (
                  <button
                    key={roundNumber}
                    className={
                      scheduleRoundNumber === roundNumber
                        ? 'rounded-md bg-slate-950 px-3 py-1.5 text-sm font-medium text-white'
                        : 'rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'
                    }
                    type="button"
                    onClick={() => {
                      const targetRound = operations?.rounds.find((round) => String(round.number) === roundNumber)
                      setScheduleRoundNumber(roundNumber)
                      if (targetRound) {
                        setTopicRoundId(String(targetRound.id))
                        setTopic(targetRound.topic)
                      }
                    }}
                  >
                    积分赛 {roundNumber}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                本期 {operations?.teams.length ?? 0} 支队伍，应设置 {requiredVenueCount} 个会场；同一会场本轮评委固定 2-3 人。
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>设置辩题</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid gap-3 md:grid-cols-[180px_1fr_auto]" onSubmit={submitTopic}>
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                    value={topicRoundId}
                    onChange={(event) => {
                      const targetRound = operations?.rounds.find((round) => String(round.id) === event.target.value)
                      setTopicRoundId(event.target.value)
                      if (targetRound) {
                        setScheduleRoundNumber(String(targetRound.number))
                        setTopic(targetRound.topic)
                      }
                    }}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>会场时间轴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 xl:grid-cols-2">
                  {venueSlots.map((slot) => {
                    const venue = slot.venue
                    const venueMatches = venue
                      ? selectedRoundMatches
                          .filter((match) => match.venue === venue.id)
                          .sort((a, b) => a.sequence - b.sequence)
                      : []
                    return (
                      <div key={slot.index} className="rounded-md border border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            {venue ? (
                              <>
                                <p className="font-semibold">{venue.name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  评委：{venue.judge_names.join('、') || '未分配'}
                                </p>
                              </>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  className="h-9 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                                  value={slot.draftName}
                                  onChange={(event) =>
                                    setVenueNameDrafts((current) => ({ ...current, [slot.index]: event.target.value }))
                                  }
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isSaving || !slot.draftName.trim()}
                                  onClick={() => saveVenueSlot(slot.draftName)}
                                >
                                  创建会场
                                </Button>
                              </div>
                            )}
                          </div>
                          {venue ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setEditingVenue({
                                  id: venue.id,
                                  name: venue.name,
                                  judgeIds: venue.judges.map(String),
                                })
                              }
                            >
                              编辑评委
                            </Button>
                          ) : null}
                        </div>
                        <div className="mt-4 grid gap-2">
                          {[1, 2, 3, 4, 5].map((sequence) => {
                            const match = venueMatches.find((item) => item.sequence === sequence)
                            const startsAt = match?.starts_at.slice(0, 5) ?? `${String(7 + sequence).padStart(2, '0')}:00`
                            return (
                              <div
                                key={sequence}
                                className="grid gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm md:grid-cols-[70px_1fr_auto]"
                              >
                                <span className="font-medium text-slate-500">{startsAt}</span>
                                {match ? (
                                  <div className="min-w-0">
                                    <span className="font-medium text-red-700">{match.affirmative_team_name}</span>
                                    <span className="px-2 text-slate-400">vs</span>
                                    <span className="font-medium text-blue-700">{match.negative_team_name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">{venue ? '尚未安排' : '请先创建会场'}</span>
                                )}
                                {venue ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      const firstTeam = operations?.teams[0]
                                      const secondTeam = operations?.teams[1]
                                      setEditingMatch({
                                        id: match?.id ?? null,
                                        venueId: venue.id,
                                        sequence,
                                        affirmativeTeamId: String(match?.affirmative_team ?? firstTeam?.id ?? ''),
                                        negativeTeamId: String(match?.negative_team ?? secondTeam?.id ?? ''),
                                      })
                                    }}
                                  >
                                    {match ? '编辑对阵' : '录入对阵'}
                                  </Button>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {activeSection === 'position-progress' ? (
          <Card>
            <CardHeader>
              <CardTitle>辩位录入进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {operations?.matchReviews.length ? (
                  operations.matchReviews.map((review) => {
                    const complete =
                      review.affirmative_position_count === 4 && review.negative_position_count === 4
                    return (
                      <div key={review.match} className="rounded-md border border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              积分赛 {review.round_number} · {review.venue_name} · 第 {review.sequence} 场
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {review.affirmative_team_name} vs {review.negative_team_name}
                            </p>
                          </div>
                          <span
                            className={
                              complete
                                ? 'rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700'
                                : 'rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700'
                            }
                          >
                            正 {review.affirmative_position_count}/4 · 反 {review.negative_position_count}/4
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-500">暂无比赛可检查。</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'review' ? (
        <>
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span className="text-sm font-medium text-slate-700">核对轮次</span>
          {['all', '1', '2', '3'].map((round) => (
            <button
              key={round}
              className={
                reviewRoundFilter === round
                  ? 'rounded-md bg-slate-950 px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50'
              }
              type="button"
              onClick={() => setReviewRoundFilter(round)}
            >
              {round === 'all' ? '全部' : `积分赛 ${round}`}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>积分核对与赛事记录完成情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {visibleReviews.length ? (
                visibleReviews.map((review) => (
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
                          review.is_verified
                            ? 'rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700'
                            : review.is_complete
                            ? 'rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700'
                            : 'rounded-md bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700'
                        }
                      >
                        {review.is_verified ? '已核验' : review.is_complete ? '待确认' : '待补齐'}
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
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="outline" onClick={() => setSelectedReviewId(review.match)}>
                        查看详情与核验
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无可核对的比赛。</p>
              )}
            </div>
          </CardContent>
        </Card>
        {selectedReview ? (
          <Card>
            <CardHeader>
              <CardTitle>
                比赛详情核对 · 积分赛 {selectedReview.round_number} · {selectedReview.venue_name} · 第 {selectedReview.sequence} 场
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-xs font-medium text-red-500">正方</p>
                    <p className="mt-1 font-semibold text-red-900">{selectedReview.affirmative_team_name}</p>
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-xs font-medium text-blue-500">反方</p>
                    <p className="mt-1 font-semibold text-blue-900">{selectedReview.negative_team_name}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {selectedReview.ballots.map((ballot) => (
                    <div key={ballot.id} className="rounded-md border border-slate-200 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">{ballot.judge_name}</p>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          正 {ballot.affirmative_votes} · 反 {ballot.negative_votes}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3">
                        {ballot.position_scores.map((score) => (
                          <div
                            key={`${ballot.id}-${score.position}`}
                            className={score.side === 'affirmative' ? 'rounded-md bg-red-50 px-3 py-2' : 'rounded-md bg-blue-50 px-3 py-2'}
                          >
                            <div className="flex flex-wrap justify-between gap-2 text-sm">
                              <span className="font-medium">{score.label} · {score.speaker}</span>
                              <span>{score.score.toFixed(1)} 分</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-600">发言记录：{score.speech_record || '未填写'}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">评委反馈：{score.judge_feedback || '未填写'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ballot.best_speaker_votes.map((vote) => (
                          <span key={`${ballot.id}-${vote.weight}`} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            {vote.weight} 票 · {vote.label} · {vote.speaker}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-md border border-slate-200 px-4 py-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      最佳辩手最终认定
                      <select
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        value={bestSpeakerOverride}
                        onChange={(event) => setBestSpeakerOverride(event.target.value)}
                      >
                        <option value="">按票数自动</option>
                        {selectedReview.positions.map((position) => (
                          <option key={position.id} value={position.id}>
                            {position.label} · {position.speaker}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium">
                      核验备注
                      <input
                        className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                        placeholder="例如：最佳辩手平票，由工作人员确认"
                        value={verificationNote}
                        onChange={(event) => setVerificationNote(event.target.value)}
                      />
                    </label>
                    <Button type="button" disabled={isSaving} onClick={() => submitMatchVerification(selectedReview.match, true)}>
                      标记已核验
                    </Button>
                    <Button type="button" variant="outline" disabled={isSaving} onClick={() => submitMatchVerification(selectedReview.match, false)}>
                      取消核验
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        </>
        ) : null}

        {activeSection === 'rankings' ? (
        <>
        <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <Button type="button" variant="outline" onClick={() => downloadExport('team-rankings', '队伍积分榜.xlsx')}>
            导出队伍积分榜
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadExport('student-stats', '学员个人赛事数据.xlsx')}>
            导出学员个人数据
          </Button>
          <Button type="button" variant="outline" onClick={() => downloadExport('judge-records', '评委记录汇总.xlsx')}>
            导出评委记录汇总
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>队伍积分榜</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-sm">
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
                        <td key={round.round_number} className="py-3 pr-4">
                          <p className="font-semibold">{round.score.toFixed(2)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            辩位 {round.position_score.toFixed(1)} · 投票 {round.votes}
                          </p>
                        </td>
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
            <CardTitle>学员个人赛事数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">学员</th>
                    <th className="py-2 pr-4 font-medium">真实姓名</th>
                    <th className="py-2 pr-4 font-medium">队伍</th>
                    <th className="py-2 pr-4 font-medium">轮次</th>
                    <th className="py-2 pr-4 font-medium">辩位</th>
                    <th className="py-2 pr-4 font-medium">平均分</th>
                    <th className="py-2 pr-4 font-medium">最佳辩手票</th>
                  </tr>
                </thead>
                <tbody>
                  {operations?.studentMatchStats.map((stat) => (
                    <tr key={stat.position} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold">{stat.speaker}</td>
                      <td className="py-3 pr-4">{stat.student_name}</td>
                      <td className="py-3 pr-4">{stat.team_name}</td>
                      <td className="py-3 pr-4">积分赛 {stat.round_number}</td>
                      <td className={stat.side === 'affirmative' ? 'py-3 pr-4 font-medium text-red-700' : 'py-3 pr-4 font-medium text-blue-700'}>
                        {stat.label}
                      </td>
                      <td className="py-3 pr-4">{stat.average_score ? stat.average_score.toFixed(1) : '-'}</td>
                      <td className="py-3 pr-4">{stat.best_speaker_votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
        ) : null}

        {activeSection === 'graduation' ? (
          <Card>
            <CardHeader>
              <CardTitle>结营评定完成情况</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {operations?.teams.map((team) => {
                  const members = operations.enrollments.filter((enrollment) => enrollment.team === team.id)
                  return (
                    <div key={team.id} className="rounded-md border border-slate-200 px-4 py-3">
                      <p className="font-semibold">{team.name}</p>
                      <p className="mt-1 text-sm text-slate-500">教练：{team.coach_name} · 队员：{members.length} 人</p>
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        结营评分、文字评价和评定图导出目前由教练端完成；这里作为运营侧完成情况入口，后续接入批量导出和完成度统计。
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'teams-coaches' ? (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <input
            className="h-10 min-w-72 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
            placeholder="搜索队伍或教练"
            value={teamSearch}
            onChange={(event) => setTeamSearch(event.target.value)}
          />
          <Button type="button" onClick={() => setIsTeamModalOpen(true)}>创建队伍</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>队伍列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">队名</th>
                    <th className="py-2 pr-4 font-medium">教练</th>
                    <th className="py-2 pr-4 font-medium">人数</th>
                    <th className="py-2 pr-4 font-medium">学员昵称</th>
                    <th className="py-2 pr-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team) => {
                    const members = operations?.enrollments.filter((enrollment) => enrollment.team === team.id) ?? []
                    return (
                      <tr key={team.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-semibold">{team.name}</td>
                        <td className="py-3 pr-4">{team.coach_name}</td>
                        <td className="py-3 pr-4">
                          {team.member_count}
                          {team.member_count < 7 || team.member_count > 8 ? <span className="ml-2 text-amber-600">需调整</span> : null}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            {members.map((member) => (
                              <span key={member.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                {member.nickname}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
        ) : null}

        {activeSection === 'camp-students' ? (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <input
            className="h-10 min-w-72 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
            placeholder="搜索本期昵称、真实姓名、电话或队伍"
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
          />
          <Button type="button" onClick={() => setIsImportModalOpen(true)}>Excel 导入本期学员</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>学员列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">本期昵称</th>
                    <th className="py-2 pr-4 font-medium">真实姓名</th>
                    <th className="py-2 pr-4 font-medium">队伍</th>
                    <th className="py-2 pr-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-semibold">{enrollment.nickname}</td>
                      <td className="py-3 pr-4">{enrollment.student_name}</td>
                      <td className="py-3 pr-4">{enrollment.team_name || '暂未分队'}</td>
                      <td className="py-3 pr-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
        ) : null}

        {activeSection === 'student-library' ? (
        <>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <input
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
            placeholder="搜索真实姓名、电话或历期昵称"
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>总学员库</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {filteredStudentHistories.length ? (
                filteredStudentHistories.map((student) => (
                  <div key={student.student} className="rounded-md border border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{student.real_name}</p>
                        <p className="mt-1 text-xs text-slate-500">{student.phone || '未填写电话'}</p>
                      </div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {student.participations.length} 期
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {student.participations.map((item) => (
                        <span key={`${item.camp}-${item.nickname}`} className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
                          {item.camp_name} · {item.nickname} · {item.team_name || '未分队'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无匹配学员。</p>
              )}
            </div>
          </CardContent>
        </Card>
        </>
        ) : null}

        <Modal title="创建账号" isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)}>
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
            <div className="grid gap-3 md:grid-cols-2">
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
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>取消</Button>
              <Button type="submit" disabled={isSaving || !accountUsername || !accountPassword || !accountDisplayName}>创建</Button>
            </div>
          </form>
        </Modal>

        <Modal title="Excel 导入本期学员" isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}>
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
            <div className="flex flex-wrap justify-end gap-3">
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
        </Modal>

        <Modal title="创建队伍" isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)}>
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
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsTeamModalOpen(false)}>取消</Button>
              <Button type="submit" disabled={isSaving || !bulkTeamName || !bulkTeamCoachId || !bulkTeamNicknames}>
                创建队伍
              </Button>
            </div>
          </form>
        </Modal>

        <Modal title="编辑会场评委" isOpen={Boolean(editingVenue)} onClose={() => setEditingVenue(null)}>
          {editingVenue ? (
            <form className="grid gap-4" onSubmit={submitVenue}>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                会场名称
                <input
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm font-normal outline-none focus:border-slate-400"
                  value={editingVenue.name}
                  onChange={(event) => setEditingVenue({ ...editingVenue, name: event.target.value })}
                />
              </label>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">分配评委</p>
                  <span
                    className={
                      editingVenue.judgeIds.length >= 2 && editingVenue.judgeIds.length <= 3
                        ? 'text-xs text-slate-500'
                        : 'text-xs text-red-600'
                    }
                  >
                    已选 {editingVenue.judgeIds.length} 人，必须 2-3 人
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {operations?.judges.map((judge) => (
                    <label key={judge.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <input
                        checked={editingVenue.judgeIds.includes(String(judge.id))}
                        type="checkbox"
                        onChange={(event) => {
                          setEditingVenue({
                            ...editingVenue,
                            judgeIds: event.target.checked
                              ? [...editingVenue.judgeIds, String(judge.id)]
                              : editingVenue.judgeIds.filter((id) => id !== String(judge.id)),
                          })
                        }}
                      />
                      {judge.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingVenue(null)}>取消</Button>
                <Button
                  type="submit"
                  disabled={
                    isSaving ||
                    !editingVenue.name.trim() ||
                    editingVenue.judgeIds.length < 2 ||
                    editingVenue.judgeIds.length > 3
                  }
                >
                  保存
                </Button>
              </div>
            </form>
          ) : null}
        </Modal>

        <Modal title={editingMatch?.id ? '编辑对阵' : '录入对阵'} isOpen={Boolean(editingMatch)} onClose={() => setEditingMatch(null)}>
          {editingMatch ? (
            <form className="grid gap-4" onSubmit={submitMatch}>
              <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
                积分赛 {scheduleRoundNumber} · 第 {editingMatch.sequence} 场 · {String(7 + editingMatch.sequence).padStart(2, '0')}:00
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-red-700">
                  正方队伍
                  <select
                    className="h-10 rounded-md border border-red-100 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-red-300"
                    value={editingMatch.affirmativeTeamId}
                    onChange={(event) => setEditingMatch({ ...editingMatch, affirmativeTeamId: event.target.value })}
                  >
                    <option value="">选择正方队伍</option>
                    {operations?.teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-blue-700">
                  反方队伍
                  <select
                    className="h-10 rounded-md border border-blue-100 bg-white px-3 text-sm font-normal text-slate-950 outline-none focus:border-blue-300"
                    value={editingMatch.negativeTeamId}
                    onChange={(event) => setEditingMatch({ ...editingMatch, negativeTeamId: event.target.value })}
                  >
                    <option value="">选择反方队伍</option>
                    {operations?.teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingMatch(null)}>取消</Button>
                <Button
                  type="submit"
                  disabled={
                    isSaving ||
                    !editingMatch.affirmativeTeamId ||
                    !editingMatch.negativeTeamId ||
                    editingMatch.affirmativeTeamId === editingMatch.negativeTeamId
                  }
                >
                  保存
                </Button>
              </div>
            </form>
          ) : null}
        </Modal>
      </section>
    </section>
  )
}

function Modal({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            type="button"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function CoachWorkspace({
  dashboard,
  assessments,
  error,
  token,
  onRefresh,
}: {
  dashboard: CoachDashboard | null
  assessments: CoachAssessmentDashboard | null
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

      <CoachAssessmentPanel assessments={assessments} token={token} onRefresh={onRefresh} />

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

const emptyFiveScores = {
  viewpoint: '3',
  personality: '3',
  emotion: '3',
  reasoning: '3',
  clash: '3',
}

function CoachAssessmentPanel({
  assessments,
  token,
  onRefresh,
}: {
  assessments: CoachAssessmentDashboard | null
  token: string | null
  onRefresh: () => void
}) {
  const [entranceForms, setEntranceForms] = useState<Record<number, typeof emptyFiveScores & { note: string }>>({})
  const [graduationForms, setGraduationForms] = useState<Record<number, typeof emptyFiveScores & {
    viewpoint_text: string
    personality_text: string
    emotion_text: string
    reasoning_text: string
    clash_text: string
    message: string
  }>>({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!assessments) return
    setEntranceForms(
      Object.fromEntries(
        assessments.entranceAssignments.map((assignment) => [
          assignment.id,
          {
            ...emptyFiveScores,
            viewpoint: assignment.score?.viewpoint ?? '3',
            personality: assignment.score?.personality ?? '3',
            emotion: assignment.score?.emotion ?? '3',
            reasoning: assignment.score?.reasoning ?? '3',
            clash: assignment.score?.clash ?? '3',
            note: assignment.score?.note ?? '',
          },
        ]),
      ),
    )
    setGraduationForms(
      Object.fromEntries(
        assessments.graduationMembers.map((member) => [
          member.enrollment,
          {
            ...emptyFiveScores,
            viewpoint: member.evaluation?.viewpoint ?? '3',
            personality: member.evaluation?.personality ?? '3',
            emotion: member.evaluation?.emotion ?? '3',
            reasoning: member.evaluation?.reasoning ?? '3',
            clash: member.evaluation?.clash ?? '3',
            viewpoint_text: member.evaluation?.viewpoint_text ?? '',
            personality_text: member.evaluation?.personality_text ?? '',
            emotion_text: member.evaluation?.emotion_text ?? '',
            reasoning_text: member.evaluation?.reasoning_text ?? '',
            clash_text: member.evaluation?.clash_text ?? '',
            message: member.evaluation?.message ?? '',
          },
        ]),
      ),
    )
  }, [assessments])

  function updateEntrance(id: number, field: keyof (typeof emptyFiveScores & { note: string }), value: string) {
    setEntranceForms((current) => ({ ...current, [id]: { ...current[id], [field]: value } }))
  }

  function updateGraduation(id: number, field: keyof (typeof emptyFiveScores & {
    viewpoint_text: string
    personality_text: string
    emotion_text: string
    reasoning_text: string
    clash_text: string
    message: string
  }), value: string) {
    setGraduationForms((current) => ({ ...current, [id]: { ...current[id], [field]: value } }))
  }

  async function saveEntrance(id: number) {
    if (!token) return
    setError('')
    setMessage('')
    try {
      await apiSubmitEntranceScore(token, id, entranceForms[id])
      setMessage('入营测评分数已保存。')
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败。')
    }
  }

  async function saveGraduation(id: number) {
    if (!token) return
    setError('')
    setMessage('')
    try {
      await apiSubmitGraduationEvaluation(token, id, graduationForms[id])
      setMessage('结营评定已保存。')
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败。')
    }
  }

  async function downloadGraduation(id: number, nickname: string) {
    if (!token) return
    setError('')
    setMessage('')
    try {
      const blob = await apiDownloadGraduationExport(token, id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${nickname}-结营评定图.png`
      link.click()
      URL.revokeObjectURL(url)
      setMessage('结营评定图已生成。')
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败。')
    }
  }


  const dimensionLabels: Array<[keyof typeof emptyFiveScores, string]> = [
    ['viewpoint', '观点生产'],
    ['personality', '个性张力'],
    ['emotion', '情感传达'],
    ['reasoning', '事理表述'],
    ['clash', '攻防交锋'],
  ]
  type GraduationTextField = 'viewpoint_text' | 'personality_text' | 'emotion_text' | 'reasoning_text' | 'clash_text' | 'message'
  const graduationTextFields: Array<[GraduationTextField, string]> = [
    ['viewpoint_text', '观点生产评价'],
    ['personality_text', '个性张力评价'],
    ['emotion_text', '情感传达评价'],
    ['reasoning_text', '事理表述评价'],
    ['clash_text', '攻防交锋评价'],
    ['message', '结营寄语'],
  ]

  return (
    <div className="grid gap-5">
      {error ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>入营测评打分</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {assessments?.entranceAssignments.length ? assessments.entranceAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{assignment.nickname}</p>
                    <p className="mt-1 text-xs text-slate-500">{assignment.student_name} · {assignment.venue_name}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => saveEntrance(assignment.id)}>保存测评分</Button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  {dimensionLabels.map(([field, label]) => (
                    <label key={field} className="flex flex-col gap-2 text-xs font-medium text-slate-600">
                      {label}
                      <input
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-slate-400"
                        max="5"
                        min="1"
                        step="0.5"
                        type="number"
                        value={entranceForms[assignment.id]?.[field] ?? '3'}
                        onChange={(event) => updateEntrance(assignment.id, field, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <input
                  className="mt-3 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                  placeholder="测评备注"
                  value={entranceForms[assignment.id]?.note ?? ''}
                  onChange={(event) => updateEntrance(assignment.id, 'note', event.target.value)}
                />
              </div>
            )) : <p className="text-sm text-slate-500">当前没有分配给你的入营测评学员。</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>结营评分与评定图</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {assessments?.graduationMembers.length ? assessments.graduationMembers.map((member) => (
              <div key={member.enrollment} className="rounded-md border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{member.nickname}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {member.student_name} · 初始五维：
                      {member.entrance_average
                        ? ` 观点${member.entrance_average.viewpoint} 个性${member.entrance_average.personality} 情感${member.entrance_average.emotion} 事理${member.entrance_average.reasoning} 攻防${member.entrance_average.clash}`
                        : ' 暂无'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => saveGraduation(member.enrollment)}>保存评定</Button>
                    <button
                      className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      type="button"
                      onClick={() => downloadGraduation(member.enrollment, member.nickname)}
                    >
                      导出评定图
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  {dimensionLabels.map(([field, label]) => (
                    <label key={field} className="flex flex-col gap-2 text-xs font-medium text-slate-600">
                      {label}
                      <input
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm outline-none focus:border-slate-400"
                        max="5"
                        min="1"
                        step="0.5"
                        type="number"
                        value={graduationForms[member.enrollment]?.[field] ?? '3'}
                        onChange={(event) => updateGraduation(member.enrollment, field, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {graduationTextFields.map(([field, label]) => (
                    <textarea
                      key={field}
                      className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      placeholder={label}
                      value={graduationForms[member.enrollment]?.[field] ?? ''}
                      onChange={(event) => updateGraduation(member.enrollment, field, event.target.value)}
                    />
                  ))}
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">当前队伍暂无可评定学员。</p>}
          </div>
        </CardContent>
      </Card>
    </div>
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
