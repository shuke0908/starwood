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

  // 2. Role-based KPI Logic
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
          bg: "bg-toss-blue-light/30",
        },
        {
          label: "금일 수납액",
          value: `₩${todayTotal.toLocaleString()}`,
          trend: "목표 85%",
          icon: CreditCard,
          color: "text-green-500",
          bg: "bg-green-50",
        },
        {
          label: "이번 달 매출",
          value: `₩${monthTotal.toLocaleString()}`,
          trend: `예상 ₩${(monthTotal * 1.2).toLocaleString()}`,
          icon: TrendingUp,
          color: "text-purple-500",
          bg: "bg-purple-50",
        },
        {
          label: "총 미수금",
          value: `₩${unpaidTotal.toLocaleString()}`,
          trend: `${unpaidCount}명`,
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-50",
        },
      ];
    } else if (role === "teacher") {
      const myClasses = classes.length; // Mock: all classes for now
      const myStudents = students.length;
      const missingHw = settings.data.submissions.filter(
        (s) => s.status === "none",
      ).length;

      return [
        {
          label: "오늘 내 수업",
          value: `${myClasses}개`,
          trend: "총 6시간",
          icon: Calendar,
          color: "text-toss-blue",
          bg: "bg-toss-blue-light/30",
        },
        {
          label: "내 담당 학생",
          value: `${myStudents}명`,
          trend: "재원 98%",
          icon: GraduationCap,
          color: "text-green-500",
          bg: "bg-green-50",
        },
        {
          label: "과제 미제출",
          value: `${missingHw}명`,
          trend: "평균 12%",
          icon: BookOpen,
          color: "text-orange-500",
          bg: "bg-orange-50",
        },
        {
          label: "확인 필요 알림",
          value: "3건",
          trend: "긴급 1건",
          icon: Bell,
          color: "text-purple-500",
          bg: "bg-purple-50",
        },
      ];
    } else {
      // Staff (Administrative)
      const attendanceRate = "94%";
      const todayPayments = payments.filter((p) => p.date === today).length;
      const newQueries = consultations.filter((c) => c.date === today).length;

      return [
        {
          label: "금일 출석률",
          value: attendanceRate,
          trend: "92/98명",
          icon: CheckCircle2,
          color: "text-toss-blue",
          bg: "bg-toss-blue-light/30",
        },
        {
          label: "금일 수납 건수",
          value: `${todayPayments}건`,
          trend: "₩450,000",
          icon: CreditCard,
          color: "text-green-500",
          bg: "bg-green-50",
        },
        {
          label: "신규 상담/문의",
          value: `${newQueries}건`,
          trend: "어제 +2건",
          icon: MessageSquare,
          color: "text-purple-500",
          bg: "bg-purple-50",
        },
        {
          label: "대기중 환불",
          value: "1건",
          trend: "승인 대기",
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-50",
        },
      ];
    }
  });

  // 3. Todo / Main Business Logic
  const tasks = $derived.by(() => {
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
          desc: "이번 주 퇴원 예정 원생의 후속 조치가 필요합니다.",
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

  // 4. Quick Actions
  const quickActions = $derived.by(() => {
    if (role === "director") {
      return [
        { label: "전체 공지 발송", icon: Megaphone, link: "#" },
        { label: "매출 보고서 보기", icon: BarChart3, link: "#" },
        { label: "강사료 정산 현황", icon: DollarSign, link: "#" },
        {
          label: "시스템 마스터 설정",
          icon: Settings,
          link: "/settings/master",
        },
      ];
    } else if (role === "teacher") {
      return [
        { label: "반별 과제 출제", icon: Plus, link: "/academic/homework" },
        { label: "반별 공지 작성", icon: MessageSquare, link: "#" },
        {
          label: "상담 기록 작성",
          icon: FileText,
          link: "/students/consultations",
        },
        { label: "시간표 확인", icon: Calendar, link: "/academic/timetable" },
      ];
    } else {
      return [
        { label: "신규 원생 등록", icon: UserPlus, link: "/students" },
        { label: "수납 데스크 열기", icon: CreditCard, link: "/finance/desk" },
        {
          label: "상담 기록 작성",
          icon: FileText,
          link: "/students/consultations",
        },
        {
          label: "출결 대시보드",
          icon: Activity,
          link: "/academic/attendance",
        },
      ];
    }
  });

  // 5. Feed Data (Mock)
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

  const fmt = (v: number) => v.toLocaleString();
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20">
  <!-- Area 1: Header KPI Cards -->
  <header class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
    {#each kpis as kpi, i}
      <div
        class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
        in:fly={{ y: 20, delay: i * 50 }}
      >
        <div
          class="absolute -right-6 -top-6 w-24 h-24 {kpi.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"
        ></div>
        <div class="relative z-10 flex justify-between items-start">
          <div
            class="w-14 h-14 rounded-2xl {kpi.bg} {kpi.color} flex items-center justify-center transition-transform group-hover:scale-110"
          >
            <kpi.icon size={28} />
          </div>
          <span
            class="text-[12px] font-black {kpi.color} tracking-wider opacity-80"
            >{kpi.trend}</span
          >
        </div>
        <div class="mt-6 relative z-10">
          <p
            class="text-[14px] font-bold text-toss-grey-300 uppercase tracking-widest"
          >
            {kpi.label}
          </p>
          <h4
            class="text-[32px] font-black text-toss-grey-600 mt-1 tracking-tight"
          >
            {kpi.value}
          </h4>
        </div>
      </div>
    {/each}
  </header>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
    <!-- Area 2: Left Main Panel (To-Do & Trends) -->
    <main class="lg:col-span-8 space-y-10">
      <!-- 2.1 금일 주요 업무 (Action-Oriented) -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[22px] font-black text-toss-grey-600 flex items-center gap-3"
          >
            <TrendingUp size={24} class="text-toss-blue" />
            금일 현황 및 주요 업무
          </h3>
          <span
            class="px-4 py-1.5 bg-toss-grey-50 text-toss-grey-400 text-[12px] font-black rounded-full border border-toss-grey-100"
          >
            오늘 <span class="text-toss-blue">{tasks.length}건</span>의 중요
            체크사항
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4">
          {#each tasks as task, i}
            <a
              href={task.link}
              class="flex items-center justify-between p-7 rounded-[32px] bg-toss-grey-50/50 hover:bg-white border border-transparent hover:border-toss-grey-100 hover:shadow-xl transition-all group"
              in:fly={{ x: -20, delay: 200 + i * 100 }}
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 rounded-3xl flex items-center justify-center {task.type ===
                  'money'
                    ? 'bg-toss-blue/10 text-toss-blue'
                    : task.type === 'warning'
                      ? 'bg-red-50 text-red-500'
                      : 'bg-green-50 text-green-500'} transition-transform group-hover:scale-110"
                >
                  {#if task.type === "money"}
                    <CreditCard size={28} />
                  {:else if task.type === "warning"}
                    <AlertCircle size={28} />
                  {:else}
                    <UserCheck size={28} />
                  {/if}
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h4 class="text-[19px] font-black text-toss-grey-600">
                      {task.title}
                    </h4>
                    <span
                      class="px-2.5 py-0.5 rounded-lg {task.type === 'money'
                        ? 'bg-toss-blue text-white'
                        : 'bg-red-500 text-white'} text-[11px] font-black"
                    >
                      {task.badge}
                    </span>
                  </div>
                  <p class="text-[15px] font-bold text-toss-grey-300 mt-1">
                    {task.desc}
                  </p>
                </div>
              </div>
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue group-hover:text-white transition-all"
              >
                <ChevronRight size={24} />
              </div>
            </a>
          {/each}
        </div>
      </section>

      <!-- 2.2 트렌드 시각화 (Mock Graphs) -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3"
          >
            <BarChart3 size={22} class="text-toss-blue" />
            주간/월간 운영 트렌드
          </h3>
          <div class="flex gap-2 p-1 bg-toss-grey-50 rounded-xl">
            <button
              class="px-3 py-1.5 text-[11px] font-black rounded-lg bg-white shadow-sm text-toss-blue"
              >최근 7일</button
            >
            <button
              class="px-3 py-1.5 text-[11px] font-black rounded-lg text-toss-grey-300"
              >최근 30일</button
            >
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Graph 1: Placeholder -->
          <div
            class="p-8 bg-toss-grey-50/50 rounded-[40px] border border-toss-grey-100 space-y-6"
          >
            <p
              class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest"
            >
              {role === "director"
                ? "월별 수익 추이"
                : role === "teacher"
                  ? "과제 제출률"
                  : "출결 성공률"}
            </p>
            <div class="h-48 flex items-end gap-3 px-2">
              {#each [40, 65, 55, 80, 75, 95, 70] as height, i}
                <div class="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    class="w-full bg-toss-blue-light/50 rounded-t-xl hover:bg-toss-blue transition-all cursor-pointer relative"
                    style="height: {height}%"
                  >
                    <div
                      class="absolute -top-10 left-1/2 -translate-x-1/2 bg-toss-grey-600 text-white px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {height}%
                    </div>
                  </div>
                  <span class="text-[10px] font-bold text-toss-grey-200"
                    >{i + 1}일</span
                  >
                </div>
              {/each}
            </div>
          </div>

          <!-- Graph 2: Placeholder -->
          <div
            class="p-8 bg-toss-grey-50/50 rounded-[40px] border border-toss-grey-100 space-y-6"
          >
            <p
              class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest"
            >
              {role === "director" ? "신규 등록생 비율" : "학생 만족도 커브"}
            </p>
            <div class="h-48 flex items-center justify-center">
              <div class="relative w-36 h-36">
                <svg viewBox="0 0 36 36" class="w-full h-full rotate-[-90deg]">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    class="stroke-toss-blue-light/50"
                    stroke-width="4"
                    stroke-dasharray="100 100"
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
                  <span class="text-[24px] font-black text-toss-grey-600"
                    >75%</span
                  >
                  <span class="text-[10px] font-bold text-toss-grey-300"
                    >Target 90%</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Area 3: Right Side Panel (Feed & Quick Actions) -->
    <aside class="lg:col-span-4 space-y-10">
      <!-- 3.1 실시간 피드 및 소통 -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3"
          >
            <Activity size={22} class="text-toss-blue" />
            실시간 피드
          </h3>
          <span class="relative flex h-3 w-3">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-toss-blue opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-toss-blue"
            ></span>
          </span>
        </div>

        <div class="space-y-6">
          {#each feed as item, i}
            <div class="flex gap-4 group" in:fade={{ delay: 500 + i * 50 }}>
              <div class="flex flex-col items-center">
                <div
                  class="w-2 h-2 rounded-full bg-toss-grey-100 group-hover:bg-toss-blue transition-colors mt-2"
                ></div>
                <div class="w-[1px] flex-1 bg-toss-grey-50 my-1"></div>
              </div>
              <div class="flex-1 pb-4">
                <p class="text-[12px] font-bold text-toss-grey-300">
                  {item.time}
                </p>
                <p
                  class="text-[14px] font-black text-toss-grey-600 mt-0.5 group-hover:text-toss-blue transition-colors"
                >
                  {item.msg}
                </p>
              </div>
            </div>
          {/each}
        </div>

        <button
          class="w-full h-14 bg-toss-grey-50 text-toss-grey-400 font-black text-[14px] rounded-2xl border border-toss-grey-100 hover:bg-white hover:text-toss-blue hover:border-toss-blue transition-all"
        >
          전체 활동 로그 보기
        </button>
      </section>

      <!-- 3.2 빠른 실행 버튼 -->
      <section
        class="bg-toss-grey-800 p-10 rounded-[48px] shadow-2xl space-y-8 relative overflow-hidden"
      >
        <Zap
          size={100}
          class="absolute -right-8 -bottom-8 text-white/5 rotate-12"
        />

        <h3
          class="text-[20px] font-black text-white flex items-center gap-3 relative z-10"
        >
          <Zap size={22} class="text-toss-blue" />
          빠른 실행 (Quick)
        </h3>

        <div class="grid grid-cols-2 gap-4 relative z-10">
          {#each quickActions as action}
            <a
              href={action.link}
              class="bg-white/10 hover:bg-white/20 border border-white/5 p-6 rounded-[32px] flex flex-col items-center gap-4 transition-all hover:-translate-y-1 group"
            >
              <div
                class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-toss-blue group-hover:bg-toss-blue group-hover:text-white transition-all"
              >
                <action.icon size={24} />
              </div>
              <span
                class="text-[13px] font-black text-white text-center leading-tight"
              >
                {action.label}
              </span>
            </a>
          {/each}
        </div>
      </section>
    </aside>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
