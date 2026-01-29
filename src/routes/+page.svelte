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
  } from "lucide-svelte";
  import { fade, fly, slide, scale } from "svelte/transition";

  // 1. Data Derived
  const students = $derived(settings.data.students);
  const payments = $derived(settings.data.payments);
  const queries = $derived(settings.data.consultations);

  // Date logic
  const todayStr = new Date().toISOString().slice(5, 10); // MM-DD
  const todayFullStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // Financial Stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyPayments = $derived(
    payments.filter((p) => p.date.startsWith(thisMonth)),
  );
  const revenueStats = $derived({
    total: monthlyPayments.reduce((acc, p) => acc + p.amount, 0),
    card: monthlyPayments
      .filter((p) => p.type === "카드" || p.method === "카드")
      .reduce((acc, p) => acc + p.amount, 0),
    transfer: monthlyPayments
      .filter((p) => p.type === "이체" || p.method === "이체")
      .reduce((acc, p) => acc + p.amount, 0),
    cash: monthlyPayments
      .filter((p) => p.type === "현금" || p.method === "현금")
      .reduce((acc, p) => acc + p.amount, 0),
    unpaidTotal: students.reduce((acc, s) => acc + s.unpaid, 0),
  });

  // Today's To-Do logic
  const birthdayStudents = $derived(
    students.filter((s) => s.birthday?.slice(5, 10) === todayStr),
  );
  const unpaidUrgent = $derived(students.filter((s) => s.unpaid > 300000));
  const todayConsultations = $derived(
    queries.filter((q) => q.date === new Date().toISOString().slice(0, 10)),
  );

  const todos = $derived([
    ...birthdayStudents.map((s) => ({
      id: `b-${s.id}`,
      type: "birthday",
      title: `${s.name} 학생 생일`,
      desc: "기프티콘 발송 및 축하 메시지",
      icon: Gift,
      color: "text-pink-500",
      bg: "bg-pink-50",
      link: "/communication/send",
    })),
    ...unpaidUrgent
      .slice(0, 3)
      .map((s) => ({
        id: `u-${s.id}`,
        type: "unpaid",
        title: `${s.name} 미납 안내`,
        desc: `₩${s.unpaid.toLocaleString()} 미납 중`,
        icon: AlertCircle,
        color: "text-red-500",
        bg: "bg-red-50",
        link: "/finance/unpaid",
      })),
    ...todayConsultations.map((q) => ({
      id: `c-${q.id}`,
      type: "query",
      title: `${q.name} 상담 예정`,
      desc: `${q.type} 상담`,
      icon: MessageSquare,
      color: "text-toss-blue",
      bg: "bg-toss-blue-light",
      link: "/students/consultations",
    })),
  ]);

  // Attendance Donut
  const totalStudents = $derived(students.length);
  const presentCount = $derived(Math.floor(totalStudents * 0.92)); // Mock
  const attendanceRate = $derived(
    totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0,
  );

  const fmt = (val: number) => val.toLocaleString();

  let isEditMode = $state(false);
</script>

<div class="space-y-10 pb-20 max-w-[1700px] mx-auto">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <span class="text-toss-grey-300 font-bold text-[15px]"
          >{todayFullStr}</span
        >
        <span class="w-1 h-1 rounded-full bg-toss-grey-200"></span>
        <span class="text-toss-blue font-black text-[15px]"
          >운영 시스템 정상이 작동 중</span
        >
      </div>
      <h1
        class="text-[36px] font-black text-toss-grey-600 tracking-tight leading-tight"
      >
        반가워요, <span class="text-toss-blue">
          {settings.data.currentUserRole === "director"
            ? `${settings.data.academy.director} 원장님`
            : settings.data.currentUserRole === "teacher"
              ? "강사님"
              : settings.data.currentUserRole === "driver"
                ? "기사님"
                : "선생님"}
        </span>
      </h1>
    </div>
    <div class="flex gap-4">
      <button
        onclick={() => {
          isEditMode = !isEditMode;
          if (!isEditMode)
            toast.show("대시보드 레이아웃이 저장되었습니다.", "success");
        }}
        class="h-[56px] px-6 rounded-2xl border {isEditMode
          ? 'bg-toss-blue text-white border-toss-blue'
          : 'bg-white border-toss-grey-100 text-toss-grey-500'} font-black text-[14px] transition-all flex items-center gap-2 hover:shadow-lg"
      >
        <Settings size={18} class={isEditMode ? "animate-spin-slow" : ""} />
        {isEditMode ? "레이아웃 저장" : "대시보드 편집"}
      </button>
    </div>
  </header>

  <!-- 1. 경영 브리핑 (Wide Widget) -->
  <section
    class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden group"
  >
    <div
      class="absolute -right-20 -top-20 w-80 h-80 bg-toss-blue-light/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"
    ></div>

    <div class="relative z-10 space-y-10">
      <div class="flex justify-between items-center">
        <h3
          class="text-[22px] font-black text-toss-grey-600 flex items-center gap-3"
        >
          <TrendingUp size={24} class="text-toss-blue" /> 이번 달 경영 브리핑
        </h3>
        <div class="flex gap-8">
          <div class="text-right">
            <p
              class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest mb-1"
            >
              총 매출
            </p>
            <p class="text-[28px] font-black text-toss-grey-600">
              ₩{fmt(revenueStats.total)}
            </p>
          </div>
          <div class="text-right border-l border-toss-grey-100 pl-8">
            <p
              class="text-[12px] font-black text-red-500 uppercase tracking-widest mb-1"
            >
              미수금 총액
            </p>
            <p class="text-[28px] font-black text-red-500">
              ₩{fmt(revenueStats.unpaidTotal)}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="p-6 bg-toss-grey-50 rounded-[32px] space-y-3">
          <p class="text-[13px] font-bold text-toss-grey-400">
            결제 수단별 비중
          </p>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-[14px] font-black">
              <span class="text-toss-grey-500">카드</span>
              <span>₩{fmt(revenueStats.card)}</span>
            </div>
            <div
              class="w-full h-1.5 bg-toss-grey-200 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-toss-blue"
                style="width: {(revenueStats.card / revenueStats.total) * 100}%"
              ></div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-[14px] font-black">
              <span class="text-toss-grey-500">계좌이체</span>
              <span>₩{fmt(revenueStats.transfer)}</span>
            </div>
            <div
              class="w-full h-1.5 bg-toss-grey-200 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-green-500"
                style="width: {(revenueStats.transfer / revenueStats.total) *
                  100}%"
              ></div>
            </div>
          </div>
        </div>

        <div
          class="p-6 bg-toss-grey-50 rounded-[32px] flex items-center justify-between"
        >
          <div>
            <p class="text-[13px] font-bold text-toss-grey-400">
              재원생 성장률
            </p>
            <p class="text-[24px] font-black text-toss-blue mt-1">+12.4%</p>
          </div>
          <div
            class="w-12 h-12 bg-toss-blue/10 rounded-2xl flex items-center justify-center text-toss-blue"
          >
            <ArrowUpRight size={24} />
          </div>
        </div>

        <div
          class="p-6 bg-toss-grey-50 rounded-[32px] flex items-center justify-between"
        >
          <div>
            <p class="text-[13px] font-bold text-toss-grey-400">상담 전환율</p>
            <p class="text-[24px] font-black text-purple-600 mt-1">45.2%</p>
          </div>
          <div
            class="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"
          >
            <Activity size={24} />
          </div>
        </div>

        <div
          class="p-6 bg-toss-grey-600 text-white rounded-[32px] flex flex-col justify-between overflow-hidden relative"
        >
          <DollarSign
            size={80}
            class="absolute -right-6 -bottom-6 text-white/10"
          />
          <p class="text-[13px] font-bold opacity-60">미수금 안내 대상</p>
          <div class="mt-4 flex items-end justify-between">
            <h4 class="text-[32px] font-black">
              {unpaidUrgent.length}<span class="text-[18px]">명</span>
            </h4>
            <a
              href="/finance/unpaid"
              class="text-[12px] font-black underline underline-offset-4"
              >안내하러 가기</a
            >
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content Area -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
    <!-- Left Column (To-Do & Attendance) -->
    <div class="lg:col-span-8 space-y-10">
      <!-- 2. Today's To-Do -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3
            class="text-[22px] font-black text-toss-grey-600 flex items-center gap-3"
          >
            <CheckCircle2 size={24} class="text-toss-blue" /> Today's To-Do
          </h3>
          <span
            class="px-4 py-1 bg-toss-grey-100 text-toss-grey-400 text-[12px] font-black rounded-full"
            >오늘 {todos.length}건의 업무 남음</span
          >
        </div>

        <div class="space-y-4">
          {#each todos as todo (todo.id)}
            <div
              class="flex items-center justify-between p-6 rounded-[32px] bg-toss-grey-50/50 hover:bg-white border border-transparent hover:border-toss-grey-100 hover:shadow-xl transition-all group"
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 rounded-3xl flex items-center justify-center {todo.bg} {todo.color} transition-transform group-hover:scale-110"
                >
                  <svelte:component this={todo.icon} size={28} />
                </div>
                <div>
                  <h4 class="text-[18px] font-black text-toss-grey-600">
                    {todo.title}
                  </h4>
                  <p class="text-[14px] font-bold text-toss-grey-300 mt-1">
                    {todo.desc}
                  </p>
                </div>
              </div>
              <a
                href={todo.link}
                class="px-6 h-[52px] rounded-2xl bg-white border border-toss-grey-100 text-toss-grey-500 font-black text-[14px] flex items-center gap-2 group-hover:bg-toss-blue group-hover:text-white group-hover:border-toss-blue transition-all shadow-sm"
              >
                실행하기 <ChevronRight size={16} />
              </a>
            </div>
          {/each}
          {#if todos.length === 0}
            <div class="py-12 text-center text-toss-grey-200 font-bold">
              오늘 처리할 특별한 업무가 없습니다. :)
            </div>
          {/if}
        </div>
      </section>

      <!-- 3. 실시간 출결 현황 -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10"
      >
        <div class="space-y-6">
          <h3
            class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3"
          >
            <Clock size={22} class="text-toss-blue" /> 실시간 출결 현황
          </h3>

          <div class="flex items-center gap-10">
            <div class="relative w-32 h-32">
              <svg class="w-full h-full" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  class="stroke-toss-grey-100"
                  stroke-width="3"
                ></circle>
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  class="stroke-toss-blue"
                  stroke-width="3"
                  stroke-dasharray="{attendanceRate}, 100"
                  stroke-linecap="round"
                ></circle>
              </svg>
              <div
                class="absolute inset-0 flex flex-col items-center justify-center"
              >
                <span class="text-[22px] font-black text-toss-grey-600"
                  >{Math.round(attendanceRate)}%</span
                >
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-toss-blue"></span>
                <span class="text-[14px] font-bold text-toss-grey-400"
                  >등원 완료: {presentCount}명</span
                >
              </div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-toss-grey-100"></span>
                <span class="text-[14px] font-bold text-toss-grey-400"
                  >미등원: {totalStudents - presentCount}명</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-toss-grey-50 rounded-[32px] p-8 flex flex-col justify-between"
        >
          <div>
            <h4 class="text-[16px] font-black text-toss-grey-600 mb-2">
              셔틀 운행 현황
            </h4>
            <div class="space-y-2 mt-4">
              <div class="flex justify-between text-[13px] font-bold">
                <span class="text-toss-grey-400">정상 운행</span>
                <span class="text-toss-blue"
                  >{settings.data.shuttleVehicles.filter(
                    (v) => v.status === "정상",
                  ).length}대</span
                >
              </div>
              <div class="flex justify-between text-[13px] font-bold">
                <span class="text-toss-grey-400">정비/휴무</span>
                <span class="text-orange-500"
                  >{settings.data.shuttleVehicles.filter(
                    (v) => v.status !== "정상",
                  ).length}대</span
                >
              </div>
            </div>
          </div>
          <a
            href="/academic/shuttle"
            class="w-full h-[52px] mt-6 bg-white border border-toss-grey-100 text-toss-grey-600 font-black text-[14px] rounded-2xl hover:bg-toss-blue hover:text-white hover:border-toss-blue transition-all flex items-center justify-center gap-2"
          >
            셔틀 관제실 이동 <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>

    <!-- Right Column (Funnel & Quick Actions) -->
    <div class="lg:col-span-4 space-y-10">
      <!-- 4. 신규 문의 파이프라인 -->
      <section
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <h3
          class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3"
        >
          <Activity size={22} class="text-purple-500" /> 신규 문의 퍼널
        </h3>

        <div class="space-y-3">
          {#each [{ label: "단순 문의", count: 12, color: "bg-purple-100 text-purple-600" }, { label: "상담 완료", count: 8, color: "bg-purple-200 text-purple-700" }, { label: "레벨테스트", count: 5, color: "bg-purple-400 text-white" }, { label: "최종 등록", count: 3, color: "bg-purple-600 text-white" }] as stage, i}
            <div class="relative group">
              <div
                class="h-14 rounded-2xl {stage.color} px-5 flex items-center justify-between font-black transition-all group-hover:-translate-y-1 group-hover:shadow-lg"
                style="opacity: {1 - i * 0.1}; width: {100 - i * 5}%"
              >
                <span>{stage.label}</span>
                <span>{stage.count}건</span>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- 5. 빠른 작업 & 공지사항 -->
      <section
        class="bg-toss-grey-600 p-10 rounded-[48px] text-white shadow-xl space-y-8"
      >
        <h3 class="text-[20px] font-black flex items-center gap-3">
          <TrendingUp size={22} class="text-toss-blue" /> 액션 퀵 패널
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <a
            href="/students"
            class="p-6 rounded-[32px] bg-white/10 hover:bg-white/20 transition-all border border-white/5 flex flex-col items-center gap-4 group"
          >
            <UserPlus
              size={28}
              class="text-toss-blue transition-transform group-hover:scale-125"
            />
            <span class="text-[15px] font-black">원생 등록</span>
          </a>
          <a
            href="/finance/desk"
            class="p-6 rounded-[32px] bg-white/10 hover:bg-white/20 transition-all border border-white/5 flex flex-col items-center gap-4 group"
          >
            <CreditCard
              size={28}
              class="text-toss-blue transition-transform group-hover:scale-125"
            />
            <span class="text-[15px] font-black">수납 처리</span>
          </a>
          <a
            href="/communication/send"
            class="p-6 rounded-[32px] bg-white/10 hover:bg-white/20 transition-all border border-white/5 flex flex-col items-center gap-4 group"
          >
            <Send
              size={28}
              class="text-toss-blue transition-transform group-hover:scale-125"
            />
            <span class="text-[15px] font-black">안내 문자</span>
          </a>
          <a
            href="/academic/timetable"
            class="p-6 rounded-[32px] bg-white/10 hover:bg-white/20 transition-all border border-white/5 flex flex-col items-center gap-4 group"
          >
            <Calendar
              size={28}
              class="text-toss-blue transition-transform group-hover:scale-125"
            />
            <span class="text-[15px] font-black">시간표 관리</span>
          </a>
        </div>
      </section>
    </div>
  </div>
</div>

<style>
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin-slow 8s linear infinite;
  }
</style>
