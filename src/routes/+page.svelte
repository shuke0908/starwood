<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    FileText,
    MessageSquare,
    CreditCard,
    ArrowRight,
    Download,
    CheckCircle2,
    Clock,
    Users,
    BookOpen,
    Bell,
    LayoutDashboard,
    UserPlus,
    Calendar,
    ChevronRight,
    Plus,
    Send,
    Settings,
    Megaphone,
    Monitor,
    Gift,
    Heart,
    Activity,
    ArrowUpRight,
    DollarSign,
    PieChart,
    BarChart3,
    GraduationCap,
    Clock3,
    CheckCircle,
    History,
    Search,
    UserCheck,
    Briefcase,
    Zap,
  } from "lucide-svelte";
  import { fade, fly, slide, scale } from "svelte/transition";

  const role = $derived(settings.data.currentUserRole);

  // 1. Common Data Derived
  const students = $derived(settings.data.students);
  const payments = $derived(settings.data.payments);
  const consultations = $derived(settings.data.consultations);
  const classes = $derived(settings.data.classes);
  const teachers = $derived(settings.data.teachers);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  // KPI Logic with Improved Contrast
  const kpis = $derived.by(() => {
    if (role === "director") {
      const activeStudents = students.filter((s) => s.status === "재원").length;
      const todayTotal = payments
        .filter((p) => p.date === today)
        .reduce((acc, p) => acc + p.amount, 0);
      const monthTotal = payments
        .filter((p) => p.date.startsWith(thisMonth))
        .reduce((acc, p) => acc + p.amount, 0);
      const unpaidTotal = students.reduce((acc, s) => acc + (s.unpaid || 0), 0);
      const unpaidCount = students.filter((s) => (s.unpaid || 0) > 0).length;

      return [
        {
          label: "총 재원생",
          value: `${activeStudents}명`,
          trend: "+5명 ▲",
          icon: Users,
          color: "text-toss-blue",
          bg: "bg-toss-blue-light",
        },
        {
          label: "금일 수납액",
          value: `₩${todayTotal.toLocaleString()}`,
          trend: "목표 85%",
          icon: CreditCard,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "이번 달 매출",
          value: `₩${monthTotal.toLocaleString()}`,
          trend: "예상 120%",
          icon: TrendingUp,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          label: "총 미수금",
          value: `₩${unpaidTotal.toLocaleString()}`,
          trend: `${unpaidCount}명`,
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
        },
      ];
    } else if (role === "teacher") {
      return [
        {
          label: "오늘 내 수업",
          value: `${classes.length}개`,
          trend: "6시간",
          icon: Calendar,
          color: "text-toss-blue",
          bg: "bg-toss-blue-light",
        },
        {
          label: "내 담당 학생",
          value: `${students.length}명`,
          trend: "98%",
          icon: GraduationCap,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "과제 미제출",
          value: "12명",
          trend: "12%",
          icon: BookOpen,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          label: "확인 필요 알림",
          value: "3건",
          trend: "긴급",
          icon: Bell,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
      ];
    } else {
      return [
        {
          label: "금일 출석률",
          value: "94%",
          trend: "92/98",
          icon: CheckCircle2,
          color: "text-toss-blue",
          bg: "bg-toss-blue-light",
        },
        {
          label: "금일 수납",
          value: `${payments.filter((p) => p.date === today).length}건`,
          trend: "₩450K",
          icon: CreditCard,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "상담 문의",
          value: `${consultations.filter((c) => c.date === today).length}건`,
          trend: "+2",
          icon: MessageSquare,
          color: "text-purple-600",
          bg: "bg-purple-50",
        },
        {
          label: "환불 대기",
          value: "1건",
          trend: "대기",
          icon: AlertCircle,
          color: "text-red-600",
          bg: "bg-red-50",
        },
      ];
    }
  });

  const tasks = $derived.by(() => {
    // Task logic remains similar but with higher contrast in rendering
    if (role === "director") {
      return [
        {
          id: 1,
          title: "미확인 입금 확인",
          desc: "매칭되지 않은 통장 입금 내역 5건이 있습니다.",
          badge: "5건",
          link: "/finance/desk",
          type: "money",
        },
        {
          id: 2,
          title: "성적 하락 학생 상담",
          desc: "최근 월말평가 성적이 15% 이상 하락한 3명이 있습니다.",
          badge: "3명",
          link: "/students",
          type: "warning",
        },
        {
          id: 3,
          title: "퇴원/휴원 예정자 면담",
          desc: "이번 주 퇴원 예정 원세의 후속 조치가 필요합니다.",
          badge: "2명",
          link: "/students/consultations",
          type: "info",
        },
      ];
    } else if (role === "teacher") {
      return [
        {
          id: 1,
          title: "고1 심화반 출석 체크",
          desc: "오후 4:00 수업 시작 전 출석부를 확인하세요.",
          badge: "16:00",
          link: "/academic/attendance",
          type: "info",
        },
        {
          id: 2,
          title: "과제 피드백 대기",
          desc: "어제 제출된 에세이 과제 12건의 채점이 필요합니다.",
          badge: "12건",
          link: "/academic/homework",
          type: "money",
        },
        {
          id: 3,
          title: "상담 요청 (내 학생)",
          desc: "김철수 학생 학부모님이 학습 상담을 요청하셨습니다.",
          badge: "D-Day",
          link: "/students/consultations",
          type: "warning",
        },
      ];
    } else {
      return [
        {
          id: 1,
          title: "미납 수강료 안내 발송",
          desc: "수납일이 3일 경과한 12명에게 알림톡을 발송하세요.",
          badge: "12명",
          link: "/finance/desk",
          type: "warning",
        },
        {
          id: 2,
          title: "금일 상담 예약 확인",
          desc: "오후 3시 신규 등록 상담이 예약되어 있습니다.",
          badge: "15:00",
          link: "/students/consultations",
          type: "info",
        },
        {
          id: 3,
          title: "생일 학생 축하 메시지",
          desc: "오늘 생일을 맞이한 2명에게 기프티콘을 발송하세요.",
          badge: "2명",
          link: "/students",
          type: "success",
        },
      ];
    }
  });

  const quickActions = $derived.by(() => {
    if (role === "director") {
      return [
        { label: "전체 공지 발송", icon: Megaphone, link: "#" },
        { label: "매출 보고서 보기", icon: BarChart3, link: "#" },
        { label: "강사료 정산 현황", icon: DollarSign, link: "#" },
        { label: "시스템 설정", icon: Settings, link: "/settings/master" },
      ];
    } else if (role === "teacher") {
      return [
        { label: "과제 출제", icon: Plus, link: "/academic/homework" },
        { label: "공지 작성", icon: MessageSquare, link: "#" },
        { label: "상담 기록", icon: FileText, link: "/students/consultations" },
        { label: "시간표", icon: Calendar, link: "/academic/timetable" },
      ];
    } else {
      return [
        { label: "원생 등록", icon: UserPlus, link: "/students" },
        { label: "수납 데스크", icon: CreditCard, link: "/finance/desk" },
        { label: "상담 기록", icon: FileText, link: "/students/consultations" },
        { label: "출결 현황", icon: Activity, link: "/academic/attendance" },
      ];
    }
  });

  const feed = [
    { time: "14:05", msg: "문지호 학생 등원 완료", type: "attend" },
    { time: "14:02", msg: "이서윤 학부모님 수강료 결제 완료", type: "pay" },
    { time: "13:50", msg: "박민수 강사 '고1 영어' 과제 등록", type: "work" },
    {
      time: "13:30",
      msg: "전체 공지: 금일 에어컨 정밀 점검 예정",
      type: "notice",
    },
    { time: "12:10", msg: "최성훈 학생 신규 가입 상담 완료", type: "query" },
  ];

  let isEditMode = $state(false);
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
  <!-- Area 1: Header KPI Cards (High Contrast) -->
  <header class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each kpis as kpi, i}
      <div
        class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        in:fly={{ y: 20, delay: i * 50 }}
      >
        <div
          class="absolute -right-4 -top-4 w-28 h-28 {kpi.bg} rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-all duration-700"
        ></div>
        <div class="relative z-10 flex justify-between items-start">
          <div
            class="w-14 h-14 rounded-[20px] {kpi.bg} {kpi.color} flex items-center justify-center shadow-sm"
          >
            <kpi.icon size={26} strokeWidth={2.5} />
          </div>
          <div class="px-2.5 py-1 bg-toss-grey-100 rounded-lg">
            <span class="text-[11px] font-black {kpi.color} tracking-tight"
              >{kpi.trend}</span
            >
          </div>
        </div>
        <div class="mt-8 relative z-10">
          <p
            class="text-[14px] font-bold text-toss-grey-500 uppercase tracking-widest"
          >
            {kpi.label}
          </p>
          <h4
            class="text-[34px] font-black text-toss-grey-800 mt-1 tracking-tighter"
          >
            {kpi.value}
          </h4>
        </div>
      </div>
    {/each}
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
    <!-- Area 2: Left Main Panel -->
    <main class="lg:col-span-8 space-y-10">
      <!-- 2.1 Todo List (Improved Contrast) -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[22px] font-black text-toss-grey-700 flex items-center gap-3"
          >
            <TrendingUp size={24} class="text-toss-blue" /> 금일 업무 및 체크리스트
          </h3>
          <span
            class="px-4 py-1.5 bg-toss-grey-100 text-toss-grey-600 text-[12px] font-black rounded-full border border-toss-grey-200"
          >
            남은 업무 <span class="text-toss-blue">{tasks.length}건</span>
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4">
          {#each tasks as task, i}
            <a
              href={task.link}
              class="flex items-center justify-between p-7 rounded-[32px] bg-toss-grey-50 hover:bg-white border border-transparent hover:border-toss-grey-200 hover:shadow-xl transition-all group"
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 rounded-[24px] flex items-center justify-center {task.type ===
                  'money'
                    ? 'bg-toss-blue/10 text-toss-blue'
                    : task.type === 'warning'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-green-50 text-green-600'}"
                >
                  {#if task.type === "money"}<CreditCard
                      size={28}
                    />{:else if task.type === "warning"}<AlertCircle
                      size={28}
                    />{:else}<UserCheck size={28} />{/if}
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h4 class="text-[19px] font-black text-toss-grey-700">
                      {task.title}
                    </h4>
                    <span
                      class="px-2.5 py-0.5 rounded-lg {task.type === 'money'
                        ? 'bg-toss-blue text-white'
                        : 'bg-red-600 text-white'} text-[11px] font-black"
                      >{task.badge}</span
                    >
                  </div>
                  <p class="text-[15px] font-bold text-toss-grey-500 mt-1">
                    {task.desc}
                  </p>
                </div>
              </div>
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-toss-grey-300 group-hover:bg-toss-blue group-hover:text-white transition-all shadow-sm"
              >
                <ChevronRight size={24} />
              </div>
            </a>
          {/each}
        </div>
      </section>

      <!-- 2.2 Graphs (Darker Labels) -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[20px] font-black text-toss-grey-700 flex items-center gap-3"
          >
            <BarChart3 size={22} class="text-toss-blue" /> 주간 운영 지표
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <!-- Graph 1 -->
          <div
            class="p-8 bg-toss-grey-50 border border-toss-grey-100 rounded-[40px] space-y-8"
          >
            <p
              class="text-[13px] font-black text-toss-grey-600 uppercase tracking-widest pl-1"
            >
              활동 참여 지점
            </p>
            <div class="h-48 flex items-end gap-3 px-2">
              {#each [40, 65, 55, 80, 75, 95, 70] as h, i}
                <div class="flex-1 flex flex-col items-center gap-3 group">
                  <div
                    class="w-full bg-toss-blue/20 rounded-t-xl hover:bg-toss-blue transition-all cursor-pointer relative shadow-sm"
                    style="height: {h}%"
                  >
                    <div
                      class="absolute -top-10 left-1/2 -translate-x-1/2 bg-toss-grey-900 text-white px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {h}%
                    </div>
                  </div>
                  <span class="text-[11px] font-black text-toss-grey-500"
                    >{i + 1}일</span
                  >
                </div>
              {/each}
            </div>
          </div>
          <!-- Graph 2 -->
          <div
            class="p-8 bg-toss-grey-50 border border-toss-grey-100 rounded-[40px] flex flex-col items-center justify-center space-y-6"
          >
            <p
              class="text-[13px] font-black text-toss-grey-600 uppercase tracking-widest w-full"
            >
              오늘의 성과 목표
            </p>
            <div class="relative w-40 h-40">
              <svg viewBox="0 0 36 36" class="w-full h-full rotate-[-90deg]">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  class="stroke-toss-grey-200"
                  stroke-width="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  class="stroke-toss-blue"
                  stroke-width="4"
                  stroke-dasharray="75 100"
                  stroke-linecap="round"
                />
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <span class="text-[28px] font-black text-toss-grey-800"
                  >75%</span
                >
                <span class="text-[11px] font-bold text-toss-grey-500 uppercase"
                  >Target</span
                >
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Area 3: Right Side Panel -->
    <aside class="lg:col-span-4 space-y-10">
      <!-- 3.1 Feed (High Contrast) -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <h3
          class="text-[20px] font-black text-toss-grey-700 flex items-center gap-3"
        >
          <Activity size={22} class="text-toss-blue" /> 실시간 피드
        </h3>
        <div class="space-y-6">
          {#each feed as f}
            <div class="flex gap-4 group">
              <div class="flex flex-col items-center">
                <div
                  class="w-2.5 h-2.5 rounded-full bg-toss-grey-200 group-hover:bg-toss-blue transition-all mt-1.5 border-2 border-white shadow-sm"
                ></div>
                <div
                  class="w-[2px] flex-1 bg-toss-grey-100 my-1 group-hover:bg-toss-blue/20 transition-all"
                ></div>
              </div>
              <div
                class="flex-1 pb-4 border-b border-toss-grey-50 group-last:border-none"
              >
                <p class="text-[12px] font-black text-toss-grey-400">
                  {f.time}
                </p>
                <p
                  class="text-[14px] font-bold text-toss-grey-700 mt-1 leading-relaxed group-hover:text-toss-blue transition-colors"
                >
                  {f.msg}
                </p>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- 3.2 Quick Actions (Dark Mode with High Contrast Text) -->
      <section
        class="bg-toss-grey-900 p-10 rounded-[48px] shadow-2xl relative overflow-hidden ring-1 ring-white/10"
      >
        <div
          class="absolute -right-20 -top-20 w-64 h-64 bg-toss-blue/30 rounded-full blur-[100px] pointer-events-none"
        ></div>
        <div class="relative z-10 space-y-8">
          <div class="space-y-2">
            <h3
              class="text-[22px] font-black text-white flex items-center gap-3"
            >
              <div
                class="w-10 h-10 rounded-xl bg-toss-blue/30 flex items-center justify-center text-toss-blue border border-toss-blue/20"
              >
                <Zap size={22} fill="currentColor" />
              </div>
              빠른 실행
            </h3>
            <p class="text-[14px] font-bold text-toss-grey-400 pl-1">
              자주 쓰는 기능을 즉시 호출하세요.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            {#each quickActions as action}
              <a
                href={action.link}
                class="bg-white/10 hover:bg-toss-blue border border-white/5 p-7 rounded-[32px] flex flex-col items-center gap-4 transition-all hover:-translate-y-2 group shadow-xl"
              >
                <div
                  class="w-14 h-14 rounded-[22px] bg-white/10 flex items-center justify-center text-toss-blue group-hover:bg-white group-hover:text-toss-blue transition-all shadow-inner"
                >
                  <action.icon size={28} strokeWidth={2.5} />
                </div>
                <span
                  class="text-[14px] font-black text-white text-center leading-tight"
                >
                  {action.label}
                </span>
              </a>
            {/each}
          </div>
        </div>
      </section>
    </aside>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f7f9fc;
  }
</style>
