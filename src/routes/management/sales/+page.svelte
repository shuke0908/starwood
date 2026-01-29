<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import {
    TrendingUp,
    CreditCard,
    Wallet,
    Banknote,
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Users,
    PieChart,
    History as HistoryIcon,
    Filter,
  } from "lucide-svelte";

  let activeMonth = $state("2026-01");

  // Derived Data
  const monthlyPayments = $derived(
    (settings.data.payments || []).filter(
      (p) => p.date.startsWith(activeMonth) && p.status === "completed",
    ),
  );

  const totalRevenue = $derived(
    monthlyPayments.reduce((acc, p) => acc + p.amount, 0),
  );
  const transactionCount = $derived(monthlyPayments.length);
  const averageTicket = $derived(
    transactionCount > 0 ? totalRevenue / transactionCount : 0,
  );

  const methodStats = $derived.by(() => {
    const stats = {
      카드: { amount: 0, count: 0 },
      현금: { amount: 0, count: 0 },
      이체: { amount: 0, count: 0 },
    };
    monthlyPayments.forEach((p) => {
      const method = (p.method as keyof typeof stats) || "카드";
      if (stats[method]) {
        stats[method].amount += p.amount;
        stats[method].count += 1;
      }
    });
    return stats;
  });

  const fmt = (val: number) => val.toLocaleString();

  function prevMonth() {
    let d = new Date(activeMonth + "-01");
    d.setMonth(d.getMonth() - 1);
    activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  function nextMonth() {
    let d = new Date(activeMonth + "-01");
    d.setMonth(d.getMonth() + 1);
    activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600">매출 보고서</h2>
    </div>
    <div class="flex gap-4">
      <div class="bg-toss-grey-100 p-1.5 rounded-[20px] flex items-center pr-4">
        <button
          onclick={prevMonth}
          class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <span class="px-4 font-black text-[15px] text-toss-grey-600"
          >{activeMonth.replace("-", ".")} 매출</span
        >
        <button
          onclick={nextMonth}
          class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <button class="toss-btn-secondary px-6 flex items-center gap-2">
        <Download size={18} /> 보고서 내보내기
      </button>
    </div>
  </header>

  <!-- Main Stats Overlay -->
  <div
    class="bg-toss-blue p-12 rounded-[48px] text-white shadow-2xl shadow-toss-blue/20 relative overflow-hidden group"
  >
    <div
      class="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"
    >
      <TrendingUp size={240} />
    </div>
    <div class="relative z-10 space-y-4">
      <div
        class="flex items-center gap-2 text-toss-blue-light font-black uppercase tracking-widest text-[13px]"
      >
        <div
          class="w-1.5 h-1.5 bg-toss-blue-light rounded-full animate-pulse"
        ></div>
        Real-time Monthly Revenue
      </div>
      <h3 class="text-[64px] font-black py-2 tracking-tight">
        ₩{fmt(totalRevenue)}
      </h3>
      <div class="flex gap-10">
        <div class="space-y-1">
          <p class="text-[13px] font-bold opacity-60">총 결제 건수</p>
          <p class="text-[20px] font-black">{transactionCount}건</p>
        </div>
        <div class="w-px h-10 bg-white/20 my-auto"></div>
        <div class="space-y-1">
          <p class="text-[13px] font-bold opacity-60">건당 평균 결제액</p>
          <p class="text-[20px] font-black">
            ₩{fmt(Math.round(averageTicket))}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Grid for deeper analysis -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
    <!-- left: Breakdown -->
    <div class="lg:col-span-4 space-y-8">
      <!-- Payment Methods -->
      <div
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-[20px] font-black text-toss-grey-600">
            결제 수단 비중
          </h3>
          <PieChart size={20} class="text-toss-grey-200" />
        </div>
        <div class="space-y-6">
          {#each Object.entries(methodStats) as [method, stats]}
            {@const percentage =
              totalRevenue > 0 ? (stats.amount / totalRevenue) * 100 : 0}
            <div class="space-y-3">
              <div class="flex justify-between items-end">
                <span class="font-black text-[14px] text-toss-grey-400"
                  >{method}</span
                >
                <span class="font-black text-[15px] text-toss-grey-600"
                  >{percentage.toFixed(1)}%</span
                >
              </div>
              <div
                class="h-3 bg-toss-grey-50 rounded-full overflow-hidden flex"
              >
                <div
                  class="h-full bg-toss-blue transition-all duration-1000 ease-out"
                  style="width: {percentage}%"
                ></div>
              </div>
              <p class="text-[12px] font-bold text-toss-grey-300 text-right">
                ₩{fmt(stats.amount)}
              </p>
            </div>
          {/each}
        </div>
      </div>

      <!-- Promotion Card -->
      <div
        class="bg-green-600 p-10 rounded-[48px] text-white shadow-xl shadow-green-100 relative overflow-hidden group cursor-pointer"
      >
        <div
          class="absolute -right-6 -bottom-6 opacity-20 group-hover:scale-110 transition-transform duration-500"
        >
          <ArrowUpRight size={140} />
        </div>
        <div class="relative z-10 space-y-4">
          <div
            class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"
          >
            <Package size={24} />
          </div>
          <div>
            <h4 class="text-[22px] font-black">신규 패키지 효과 분석</h4>
            <p class="text-green-50/60 font-medium leading-relaxed mt-2">
              최근 출시한 '겨울방학 특강' 상품의 전체 매출 기여도가 15.2%
              상승했습니다.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- right: Trends & Table -->
    <div class="lg:col-span-8 space-y-10">
      <!-- Recent Activity -->
      <div
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden"
      >
        <div class="flex justify-between items-center mb-10">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 bg-toss-grey-50 rounded-2xl flex items-center justify-center text-toss-blue"
            >
              <HistoryIcon size={24} />
            </div>
            <h3 class="text-[20px] font-black text-toss-grey-600">
              실시간 수납 히스토리
            </h3>
          </div>
          <button
            class="toss-btn-secondary px-5 h-11 text-[13px] font-black flex items-center gap-2"
          >
            <Filter size={16} /> 필터링
          </button>
        </div>

        <div class="space-y-2">
          {#if monthlyPayments.length === 0}
            <div class="py-20 text-center space-y-4 opacity-30">
              <Package size={48} class="mx-auto" />
              <p class="font-bold text-[18px]">조회된 결제 내역이 없습니다.</p>
            </div>
          {:else}
            <div class="grid grid-cols-1 gap-4">
              {#each monthlyPayments.slice(0, 8) as p (p.id)}
                {@const student = settings.data.students.find(
                  (s) => s.id === p.studentId,
                )}
                <div
                  class="group flex items-center justify-between p-6 rounded-3xl bg-toss-grey-50/50 border border-transparent hover:border-toss-grey-100 hover:bg-white hover:shadow-xl transition-all duration-300"
                >
                  <div class="flex items-center gap-6">
                    <div
                      class="w-14 h-14 rounded-2xl bg-white border border-toss-grey-100 flex items-center justify-center text-[20px] font-black text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white group-hover:border-toss-blue transition-all"
                    >
                      {student?.name[0] || "?"}
                    </div>
                    <div>
                      <p class="text-[17px] font-black text-toss-grey-600">
                        {student?.name || "알 수 없음"}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <span
                          class="px-2 py-0.5 bg-toss-grey-100 text-toss-grey-400 text-[10px] font-black rounded-md"
                          >{p.method}</span
                        >
                        <span class="text-[12px] font-bold text-toss-grey-300"
                          >{p.date} • {p.description}</span
                        >
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-[18px] font-black text-toss-grey-700">
                      ₩{fmt(p.amount)}
                    </p>
                    <p class="text-[12px] font-black text-green-500 mt-1">
                      결제완료
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <button
          class="w-full mt-8 h-16 bg-toss-grey-50 rounded-2xl text-toss-grey-300 font-black text-[15px] hover:text-toss-blue transition-colors flex items-center justify-center gap-2"
        >
          데이터 더 보기 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </div>
</div>
