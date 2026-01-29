<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import {
    Wallet,
    TrendingUp,
    Users,
    Clock,
    ChevronRight,
    ChevronLeft,
    Download,
    CheckCircle2,
    ArrowUpRight,
    FileText,
    PieChart,
    Landmark,
    Trophy,
    Percent,
    Banknote,
    Calendar as CalendarIcon,
    Calculator,
  } from "lucide-svelte";

  let activeMonth = $state("2026-01");

  // Logic to calculate settlement for each teacher
  const teacherSettlements = $derived.by(() => {
    const teachers = settings.data.teachers || [];
    const payments = settings.data.payments || [];
    const timetable = settings.data.timetable || [];
    const classes = settings.data.classes || [];
    const products = settings.data.products || [];

    const monthlyPayments = payments.filter(
      (p) =>
        p.date && p.date.startsWith(activeMonth) && p.status === "completed",
    );

    return teachers
      .map((t) => {
        if (!t) return null;

        const teacherRevenue = monthlyPayments.reduce((acc, p) => {
          const pProductIds = p.productIds || [];
          const paidProducts = products.filter((prod) =>
            pProductIds.includes(prod.id),
          );
          const linkedClasses = classes.filter(
            (cls) =>
              paidProducts.some((prod) =>
                (prod.classIds || []).includes(cls.id),
              ) && cls.teacherId === t.id,
          );

          if (linkedClasses.length > 0) {
            return acc + p.amount / (paidProducts.length || 1);
          }
          return acc;
        }, 0);

        const teacherEvents = timetable.filter((e) => e.teacherId === t.id);
        const totalHours = teacherEvents.length * 1.5;

        let baseAmount = Number(t.settlementValue) || 0;
        let settlementDetail = "";

        if (t.settlementType === "fixed") {
          settlementDetail = "고정 월급";
        } else if (t.settlementType === "ratio") {
          baseAmount = teacherRevenue * ((t.settlementValue || 0) / 100);
          settlementDetail = `매출의 ${t.settlementValue}% 정산`;
        } else if (t.settlementType === "hourly") {
          baseAmount = totalHours * (t.settlementValue || 0);
          settlementDetail = `시간당 ₩${(t.settlementValue || 0).toLocaleString()} 정산`;
        } else if (t.settlementType === "equity") {
          const totalRevenue = monthlyPayments.reduce(
            (acc, p) => acc + p.amount,
            0,
          );
          baseAmount = totalRevenue * ((t.settlementValue || 0) / 100);
          settlementDetail = `전체 매출의 ${t.settlementValue}% 지분`;
        }

        return {
          ...t,
          finalAmount: baseAmount,
          detail: settlementDetail,
          stats: {
            hours: totalHours,
            revenue: teacherRevenue,
          },
        };
      })
      .filter((item) => item !== null);
  });

  const totalSettlement = $derived(
    teacherSettlements.reduce((acc, s) => acc + (s?.finalAmount || 0), 0),
  );
  const academyRevenue = $derived(
    (settings.data.payments || [])
      .filter((p) => p.date.startsWith(activeMonth) && p.status === "completed")
      .reduce((acc, p) => acc + p.amount, 0),
  );

  const fmt = (val: any) => Math.floor(Number(val)).toLocaleString();

  function finalizeSettlement() {
    alert(
      `${activeMonth} 정산이 확정되었습니다. 지출 결의서에 자동 반영됩니다.`,
    );
  }
</script>

<div class="space-y-10 pb-20">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="toss-title">급여 정산 엔진</h2>
    </div>
    <div class="flex gap-4">
      <div class="bg-toss-grey-100 p-1.5 rounded-[24px] flex items-center">
        <button
          onclick={() => {
            let d = new Date(activeMonth + "-01");
            d.setMonth(d.getMonth() - 1);
            activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          }}
          class="w-10 h-10 rounded-2xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <span class="px-6 font-black text-[15px] text-toss-grey-600"
          >{activeMonth.replace("-", ".")} 정산</span
        >
        <button
          onclick={() => {
            let d = new Date(activeMonth + "-01");
            d.setMonth(d.getMonth() + 1);
            activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          }}
          class="w-10 h-10 rounded-2xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <button
        onclick={finalizeSettlement}
        class="toss-btn-primary px-8 flex items-center gap-2"
      >
        <CheckCircle2 size={18} /> 정산 확정
      </button>
    </div>
  </header>

  <!-- Stats Card Grid -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div
      class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4 group hover:shadow-xl transition-all"
    >
      <div
        class="w-12 h-12 bg-toss-blue/10 rounded-2xl flex items-center justify-center text-toss-blue"
      >
        <Banknote size={24} />
      </div>
      <div>
        <p
          class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
        >
          총 인건비 선출
        </p>
        <p class="text-[32px] font-black text-toss-grey-600 mt-1">
          ₩{fmt(totalSettlement)}
        </p>
      </div>
      <div class="pt-2 border-t border-toss-grey-50">
        <p class="text-[13px] font-bold text-toss-blue flex items-center gap-1">
          <TrendingUp size={14} /> 매출액의 {(
            (totalSettlement / academyRevenue) *
            100
          ).toFixed(1)}% 수준
        </p>
      </div>
    </div>
    <div
      class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4 group hover:shadow-xl transition-all"
    >
      <div
        class="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"
      >
        <Users size={24} />
      </div>
      <div>
        <p
          class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
        >
          정산 대상 강사
        </p>
        <p class="text-[32px] font-black text-toss-grey-600 mt-1">
          {teacherSettlements.length}명
        </p>
      </div>
      <div class="pt-2 border-t border-toss-grey-50">
        <p class="text-[13px] font-bold text-toss-grey-400 italic">
          지급 대기 중인 인원 포함
        </p>
      </div>
    </div>
    <div
      class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4 group hover:shadow-xl transition-all"
    >
      <div
        class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600"
      >
        <Trophy size={24} />
      </div>
      <div>
        <p
          class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
        >
          최고 매출 기여
        </p>
        <p class="text-[32px] font-black text-toss-grey-600 mt-1">
          ₩{fmt(
            Math.max(...teacherSettlements.map((s) => s?.stats?.revenue || 0)),
          )}
        </p>
      </div>
      <div class="pt-2 border-t border-toss-grey-50">
        <p class="text-[13px] font-bold text-green-600 flex items-center gap-1">
          우수 성과자 보상이 포함됨
        </p>
      </div>
    </div>
    <div
      class="bg-toss-grey-700 p-8 rounded-[40px] text-white space-y-4 shadow-xl shadow-toss-grey-700/20 relative overflow-hidden group"
    >
      <div
        class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform"
      >
        <Landmark size={120} />
      </div>
      <div
        class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"
      >
        <Calculator size={24} />
      </div>
      <div>
        <p class="text-[12px] font-black opacity-60 uppercase tracking-widest">
          예상 원천징수 (3.3%)
        </p>
        <p class="text-[32px] font-black mt-1 text-white">
          ₩{fmt(totalSettlement * 0.033)}
        </p>
      </div>
      <div class="pt-2 border-t border-white/5">
        <p class="text-[13px] font-bold opacity-80">익월 10일 신고분 기준</p>
      </div>
    </div>
  </div>

  <!-- Settlement Table -->
  <div
    class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm overflow-hidden"
  >
    <div
      class="p-8 border-b border-toss-grey-100 flex justify-between items-center bg-toss-grey-50/10"
    >
      <h3
        class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3"
      >
        <Banknote size={24} class="text-toss-blue" />
        강사별 상세 정산표
      </h3>
      <button
        class="toss-btn-secondary h-11 px-6 flex items-center gap-2 border-toss-grey-100 text-[14px]"
      >
        <Download size={18} /> 명세서 일괄 추출
      </button>
    </div>

    <table class="w-full">
      <thead class="bg-toss-grey-50">
        <tr
          class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest text-left"
        >
          <th class="py-2.5 px-10">강사 정보 / 계약</th>
          <th class="py-2.5 px-8">정산 근거</th>
          <th class="py-2.5 px-8 text-center">시수</th>
          <th class="py-2.5 px-8 text-right">기여 매출</th>
          <th class="py-2.5 px-10 text-right">정산액</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-toss-grey-100">
        {#each teacherSettlements as s (s.id)}
          <tr class="hover:bg-toss-grey-50/50 transition-all group">
            <td class="py-2.5 px-10">
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-xl bg-toss-grey-100 flex items-center justify-center font-black text-[13px] text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all"
                >
                  {s.name[0]}
                </div>
                <div>
                  <p
                    class="text-[14px] font-black text-toss-grey-600 leading-tight outline-none"
                  >
                    {s.name}
                  </p>
                  <span
                    class="text-[10px] font-black text-toss-blue bg-toss-blue-light px-1.5 py-0.5 rounded-lg mt-0.5 inline-block uppercase"
                    >{s.settlementType}</span
                  >
                </div>
              </div>
            </td>
            <td class="py-2.5 px-8">
              <p class="text-[13px] font-bold text-toss-grey-500">{s.detail}</p>
            </td>
            <td class="py-2.5 px-8 text-center">
              <p class="text-[14px] font-black text-toss-grey-600">
                {s.stats.hours}H
              </p>
            </td>
            <td class="py-2.5 px-8 text-right">
              <p class="text-[13px] font-bold text-toss-grey-400">
                ₩{fmt(s.stats.revenue)}
              </p>
            </td>
            <td class="py-2.5 px-10 text-right">
              <div class="flex flex-col items-end">
                <p
                  class="text-[18px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors"
                >
                  ₩{fmt(s.finalAmount)}
                </p>
                <button
                  class="text-[10px] font-black text-toss-grey-300 hover:text-toss-blue transition-colors"
                  >명세서 발송 ➔</button
                >
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Bottom Actions -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div
      class="bg-toss-grey-600 p-10 rounded-[48px] text-white space-y-6 shadow-2xl shadow-toss-grey-200 cursor-pointer group"
    >
      <div class="flex items-center justify-between">
        <div class="p-4 bg-white/10 rounded-2xl">
          <PieChart size={32} class="text-toss-blue" />
        </div>
        <ArrowUpRight
          size={24}
          class="text-white/20 group-hover:text-white transition-all"
        />
      </div>
      <div>
        <h4 class="text-[22px] font-black">인건비 비율 최적화 분석</h4>
        <p class="text-white/50 font-medium leading-relaxed mt-2">
          강사별 정산 방식(고정/비율)에 따른 학원 수익 성패를 시뮬레이션합니다.
        </p>
      </div>
    </div>
    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6 cursor-pointer group hover:border-toss-blue/20 transition-all"
    >
      <div class="flex items-center justify-between">
        <div class="p-4 bg-toss-blue/5 rounded-2xl">
          <Landmark size={32} class="text-toss-blue" />
        </div>
        <ArrowUpRight
          size={24}
          class="text-toss-grey-100 group-hover:text-toss-blue transition-all"
        />
      </div>
      <div>
        <h4 class="text-[22px] font-black text-toss-grey-600">
          은행 이체용 대량 송금 파일
        </h4>
        <p class="text-toss-grey-400 font-bold leading-relaxed mt-2">
          확정된 급여 내역을 엑셀 파일로 내려받아 은행 시스템에 업로드하세요.
        </p>
      </div>
    </div>
  </div>
</div>
