<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import type { PaymentRecord, Student } from "$lib/types";
  import { MOCK_DEPOSITS } from "$lib/mock-data";
  import {
    CreditCard,
    Wallet,
    AlertCircle,
    CheckCircle2,
    Search,
    Filter,
    Send,
    Download,
    History,
    ArrowUpRight,
    Calculator,
    UserCheck,
    MessageSquare,
    X,
    ChevronRight,
    RotateCcw,
    Percent,
    Calendar,
  } from "lucide-svelte";
  import { fade, fly, slide, scale } from "svelte/transition";

  let activeTab = $state("unpaid"); // unpaid, deposits, history
  let searchQuery = $state("");
  let selectedStudentId = $state<string | null>(null);

  // Filter unpaid students from global store
  const unpaidStudents = $derived(
    settings.data.students.filter(
      (s) => s.unpaid > 0 && s.name.includes(searchQuery),
    ),
  );

  let deposits = $state(MOCK_DEPOSITS);

  const selectedStudent = $derived(
    selectedStudentId
      ? settings.data.students.find((s) => s.id === selectedStudentId)
      : null,
  );

  // Refund State
  let refundAmount = $state(0);
  let refundCalcMode = $state(settings.data.academy.refundMode);

  function processPayment(method: "카드" | "현금" | "이체") {
    if (!selectedStudent) return;

    const amount = selectedStudent.unpaid; // Assuming full payment for now

    // 1. Record Transaction
    const record: PaymentRecord = {
      id: `pay_${Date.now()}`,
      studentId: selectedStudent.id,
      amount,
      method,
      type: method, // 보완
      description: `${selectedStudent.name} 수납 처리`, // 보완
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      productIds: selectedStudent.productIds,
    };
    settings.data.payments.push(record);

    // 2. Update Student Balance
    const sIdx = settings.data.students.findIndex(
      (s) => s.id === selectedStudent.id,
    );
    if (sIdx !== -1) {
      settings.data.students[sIdx].unpaid = 0;
    }

    alert(
      `${selectedStudent.name} 학생의 수납(${method}) 처리가 완료되었습니다.`,
    );
    selectedStudentId = null;
  }

  const fmt = (val: number) => val.toLocaleString();

  // Mock Public Holidays for 2026.01
  const mockHolidays = [
    { date: "2026-01-01", name: "신정", deduct: true },
    { date: "2026-01-28", name: "설날 연휴", deduct: true },
  ];

  function showHistory() {
    toast.show("전체 수납 이력을 불러옵니다.", "info");
  }

  function sendBulkReminders() {
    if (
      confirm(
        `${unpaidStudents.length}명의 미납 학생 보호자에게 알림톡을 발송하시겠습니까?`,
      )
    ) {
      toast.show(
        "알림톡 발송 예약 완료",
        "success",
        "카카오 알림톡 서버로 전송되었습니다.",
      );
    }
  }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600">
        청구 및 수납 데스크
      </h2>
    </div>
    <div class="flex gap-4 shrink-0">
      <button
        onclick={showHistory}
        class="toss-btn-secondary px-8 flex items-center gap-2 whitespace-nowrap shrink-0"
      >
        <History size={18} /> 전체 수납 이력
      </button>
      <button
        onclick={sendBulkReminders}
        class="toss-btn-primary px-8 flex items-center gap-2 shadow-lg shadow-toss-blue/20 whitespace-nowrap shrink-0"
      >
        <Send size={18} /> 미납 알림톡 일괄 발송
      </button>
    </div>
  </header>

  <!-- Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden group"
    >
      <div
        class="absolute -right-10 -top-10 w-40 h-40 bg-red-50 rounded-full blur-3xl group-hover:bg-red-100/50 transition-colors"
      ></div>
      <p
        class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest mb-2 relative z-10"
      >
        미수금 총액
      </p>
      <p class="text-[36px] font-black text-red-500 relative z-10">
        ₩{fmt(unpaidStudents.reduce((acc, s) => acc + s.unpaid, 0))}
      </p>
      <p class="text-[14px] font-bold text-toss-grey-400 mt-2 relative z-10">
        총 {unpaidStudents.length}명의 원생 미납 중
      </p>
    </div>
    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden group"
    >
      <div
        class="absolute -right-10 -top-10 w-40 h-40 bg-toss-blue-light rounded-full blur-3xl group-hover:bg-toss-blue/10 transition-colors"
      ></div>
      <p
        class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest mb-2 relative z-10"
      >
        오늘의 입금 (매칭 완료)
      </p>
      <p class="text-[36px] font-black text-toss-blue relative z-10">
        ₩4,250,000
      </p>
      <p class="text-[14px] font-bold text-toss-grey-400 mt-2 relative z-10">
        통장 자동 매칭 12건
      </p>
    </div>
    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden group"
    >
      <div
        class="absolute -right-10 -top-10 w-40 h-40 bg-orange-50 rounded-full blur-3xl group-hover:bg-orange-100/50 transition-colors"
      ></div>
      <p
        class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest mb-2 relative z-10"
      >
        미확인 수납 (통장)
      </p>
      <p class="text-[36px] font-black text-orange-500 relative z-10">
        {deposits.filter((d) => d.status !== "matched").length}건
      </p>
      <button
        onclick={() => (activeTab = "deposits")}
        class="text-[14px] font-black text-toss-blue mt-2 relative z-10 hover:underline"
        >지금 매칭하기 ➔</button
      >
    </div>
  </div>

  <!-- Navigation -->
  <div class="flex gap-1 bg-toss-grey-100 p-1.5 rounded-[24px] w-fit">
    <button
      onclick={() => (activeTab = "unpaid")}
      class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab ===
      'unpaid'
        ? 'bg-white shadow-sm text-toss-blue'
        : 'text-toss-grey-400 hover:text-toss-grey-600'}">미수금 및 청구</button
    >
    <button
      onclick={() => (activeTab = "deposits")}
      class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab ===
      'deposits'
        ? 'bg-white shadow-sm text-toss-blue'
        : 'text-toss-grey-400 hover:text-toss-grey-600'}">통장 자동 매칭</button
    >
  </div>

  <div class="flex gap-10 items-start">
    <main
      class="flex-1 transition-all duration-300 {selectedStudentId
        ? 'opacity-40 scale-[0.98] pointer-events-none'
        : ''}"
    >
      {#if activeTab === "unpaid"}
        <div
          class="bg-white rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden"
        >
          <div class="p-8 border-b border-toss-grey-50">
            <div class="relative max-w-md flex items-center group">
              <Search
                size={22}
                class="absolute left-5 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
              />
              <input
                type="text"
                bind:value={searchQuery}
                placeholder="이름으로 검색하여 수납 처리.."
                class="w-full h-[60px] pl-16 pr-8 bg-toss-grey-50 rounded-[20px] border-none focus:ring-8 focus:ring-toss-blue/5 outline-none font-bold text-[17px] transition-all"
              />
            </div>
          </div>
          <table class="w-full">
            <thead class="bg-toss-grey-50">
              <tr
                class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest px-8"
              >
                <th class="py-2.5 px-10 text-left">원생명 / 연락처</th>
                <th class="py-2.5 px-8 text-left">수강 중인 클래스</th>
                <th class="py-2.5 px-8 text-right">미수금 총액</th>
                <th class="py-2.5 px-8 text-center">미납 기간</th>
                <th class="py-2.5 px-10 text-right">작업</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-100">
              {#each unpaidStudents as s (s.id)}
                <tr
                  class="hover:bg-toss-grey-50 transition-all group cursor-pointer"
                  onclick={() => (selectedStudentId = s.id)}
                >
                  <td class="py-2.5 px-10">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-9 h-9 rounded-xl bg-toss-grey-100 flex items-center justify-center font-black text-[13px] text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all"
                      >
                        {s.name[0]}
                      </div>
                      <div>
                        <p
                          class="text-[14px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors"
                        >
                          {s.name}
                        </p>
                        <p class="text-[11px] font-bold text-toss-grey-300">
                          {s.studentPhone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="py-2.5 px-8">
                    <div class="flex flex-wrap gap-1">
                      {#each s.productIds.slice(0, 2) as pid}
                        {@const prod = settings.data.products.find(
                          (p) => p.id === pid,
                        )}
                        <span
                          class="px-2 py-0.5 rounded bg-toss-grey-100 text-[10px] font-bold text-toss-grey-400"
                          >{prod?.name || pid}</span
                        >
                      {/each}
                      {#if s.productIds.length > 2}
                        <span class="text-[10px] font-black text-toss-grey-300"
                          >+{s.productIds.length - 2}</span
                        >
                      {/if}
                    </div>
                  </td>
                  <td class="py-2.5 px-8 text-right">
                    <p class="text-[15px] font-black text-red-500">
                      ₩{fmt(s.unpaid)}
                    </p>
                  </td>
                  <td class="py-2.5 px-8 text-center">
                    <span
                      class="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[11px] font-black"
                      >{Math.floor(Math.random() * 10) + 1}일</span
                    >
                  </td>
                  <td class="py-2.5 px-10 text-right">
                    <button class="toss-btn-primary h-8 px-4 text-[12px]"
                      >수납 처리</button
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <!-- Deposits Tab Content -->
        <div class="grid grid-cols-1 gap-6">
          {#each deposits as d}
            <div
              class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all group"
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 bg-toss-grey-100 rounded-3xl flex items-center justify-center font-black text-[20px] text-toss-grey-500 group-hover:bg-toss-blue group-hover:text-white transition-all"
                >
                  ₩
                </div>
                <div>
                  <div class="flex items-center gap-3">
                    <h4 class="text-[20px] font-black text-toss-grey-600">
                      {d.sender}
                    </h4>
                    <span class="text-[18px] font-black text-toss-blue"
                      >₩{fmt(d.amount)}</span
                    >
                  </div>
                  <p class="text-[14px] font-bold text-toss-grey-400 mt-1">
                    {d.date} · {d.status === "matched"
                      ? "매칭 완료"
                      : "미확인 입금"}
                  </p>
                </div>
              </div>
              <button
                class="toss-btn-secondary px-8 h-[52px] flex items-center gap-2"
              >
                <UserCheck size={18} />
                {d.status === "matched" ? "매칭 세부 내역" : "수동 매칭하기"}
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </main>

    <!-- Dynamic Payment Drawer -->
    {#if selectedStudent}
      <aside
        class="w-[550px] bg-white rounded-[48px] border border-toss-grey-100 shadow-2xl p-10 space-y-10 sticky top-10"
        transition:fly={{ x: 100, duration: 400 }}
      >
        <header
          class="flex justify-between items-start border-b border-toss-grey-50 pb-8"
        >
          <div class="flex items-center gap-5">
            <div
              class="w-16 h-16 bg-toss-blue text-white rounded-[24px] flex items-center justify-center text-[24px] font-black"
            >
              {selectedStudent.name[0]}
            </div>
            <div>
              <h3 class="text-[24px] font-black text-toss-grey-600">
                {selectedStudent.name} 원생
              </h3>
              <p class="text-toss-grey-400 font-bold">
                미수금 ₩{fmt(selectedStudent.unpaid)}
              </p>
            </div>
          </div>
          <button
            onclick={() => (selectedStudentId = null)}
            class="p-2 hover:bg-toss-grey-100 rounded-2xl transition-all"
            ><X /></button
          >
        </header>

        <!-- Step-by-Step Billing -->
        <div class="space-y-10">
          <!-- 1. Auto Calculation & Holiday Handling -->
          <section class="space-y-6">
            <div class="flex justify-between items-center">
              <h4
                class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2"
              >
                <Calculator size={18} class="text-toss-blue" /> 이번 달 수강료 계산
              </h4>
              <span
                class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
                >2026년 01월</span
              >
            </div>
            <div class="bg-toss-grey-50 p-6 rounded-[32px] space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-toss-grey-500 font-bold"
                  >기본 수강료 (정액제)</span
                >
                <span class="text-toss-grey-600 font-black">₩350,000</span>
              </div>
              <!-- Holiday Deduction UI -->
              <div class="space-y-3 pt-4 border-t border-toss-grey-200">
                <p
                  class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest"
                >
                  공휴일/휴강일 차감 설정
                </p>
                {#each mockHolidays as holiday}
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                      <Calendar size={14} class="text-toss-grey-300" />
                      <span class="text-[14px] font-bold text-toss-grey-500"
                        >{holiday.date} ({holiday.name})</span
                      >
                    </div>
                    <label
                      class="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        bind:checked={holiday.deduct}
                        class="sr-only peer"
                      />
                      <div
                        class="w-11 h-6 bg-toss-grey-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toss-blue"
                      ></div>
                    </label>
                  </div>
                {/each}
                <p class="text-[12px] font-bold text-toss-blue mt-1">
                  ✓ 공휴일 {mockHolidays.filter((h) => h.deduct).length}일 차감
                  적용됨 (-₩35,000)
                </p>
              </div>
            </div>
          </section>

          <!-- 2. Discount Policy -->
          <section class="space-y-6">
            <h4
              class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2"
            >
              <Percent size={18} class="text-purple-500" /> 할인 및 추가 공제
            </h4>
            <div class="flex flex-wrap gap-2">
              {#each settings.data.discounts as d}
                <button
                  class="px-5 py-3 rounded-2xl border-2 border-toss-grey-100 font-bold text-[14px] text-toss-grey-400 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
                >
                  {d.name} (-{d.value}{d.type === "percent" ? "%" : "원"})
                </button>
              {/each}
              <button
                class="px-5 py-3 rounded-2xl border-2 border-dashed border-toss-grey-200 font-bold text-[14px] text-toss-grey-300 hover:border-toss-grey-300 transition-all"
                >+ 기타 할인</button
              >
            </div>
          </section>

          <!-- 3. Integrated Refund Tool -->
          <section
            class="p-6 rounded-[32px] bg-red-50/50 border border-red-100 space-y-4"
          >
            <div class="flex justify-between items-center">
              <h4
                class="text-[15px] font-black text-red-500 flex items-center gap-2"
              >
                <RotateCcw size={18} /> 환불 계산기
              </h4>
              <button class="text-[12px] font-black text-red-400 underline"
                >정책 보기</button
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="경과 수업 횟수"
                class="h-12 bg-white rounded-xl border-red-50 flex-1 px-4 text-[13px] font-bold outline-none"
              />
              <button
                class="bg-red-500 text-white rounded-xl font-black text-[13px]"
                >자동계산</button
              >
            </div>
            <p class="text-[13px] font-bold text-red-400">
              학원법 기준 예상 환불액: <span class="text-red-600">₩157,500</span
              >
            </p>
          </section>
        </div>

        <!-- Final Payment Actions -->
        <footer class="pt-10 border-t border-toss-grey-50 space-y-6">
          <div class="flex justify-between items-center px-4">
            <span class="text-[18px] font-black text-toss-grey-600"
              >최종 결제 금액</span
            >
            <span class="text-[32px] font-black text-toss-blue">₩297,500</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <button
              class="h-16 rounded-[24px] bg-toss-grey-50 font-black text-toss-grey-600 hover:bg-toss-grey-100 transition-all"
              onclick={() => processPayment("현금")}>현금</button
            >
            <button
              class="h-16 rounded-[24px] bg-toss-grey-50 font-black text-toss-grey-600 hover:bg-toss-grey-100 transition-all"
              onclick={() => processPayment("이체")}>이체</button
            >
            <button
              class="h-16 rounded-[24px] bg-toss-blue text-white font-black hover:bg-toss-blue-dark transition-all shadow-lg shadow-toss-blue/20"
              onclick={() => processPayment("카드")}>카드 결제</button
            >
          </div>
        </footer>
      </aside>
    {/if}
  </div>
</div>
