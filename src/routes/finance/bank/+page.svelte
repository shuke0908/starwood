<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { fade, fly, slide, scale } from "svelte/transition";
  import {
    Search,
    Banknote,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    Filter,
    Download,
    History,
    User,
    DollarSign,
    Wallet,
    MoreVertical,
    Layers,
    Check,
    X,
  } from "lucide-svelte";
  import type { PaymentRecord, Student } from "$lib/types";

  // Mock Bank Statements (What would come from Scraper/XLS)
  let statements = $state([
    {
      id: "st_1",
      date: "2026-01-29",
      sender: "김철수",
      amount: 350000,
      status: "pending",
      matchedId: null as string | null,
    },
    {
      id: "st_2",
      date: "2026-01-29",
      sender: "이영희(스타우드)",
      amount: 480000,
      status: "pending",
      matchedId: null as string | null,
    },
    {
      id: "st_3",
      date: "2026-01-28",
      sender: "박태양수강료",
      amount: 250000,
      status: "pending",
      matchedId: null as string | null,
    },
    {
      id: "st_4",
      date: "2026-01-28",
      sender: "에이비씨학원",
      amount: 1500000,
      status: "pending",
      matchedId: null as string | null,
    },
  ]);

  // Unpaid/Pending Payments from ERP
  let pendingPayments = $derived(
    settings.data.payments.filter(
      (p) => p.status === "pending" || p.status === "unpaid",
    ),
  );

  function getStudent(id: string) {
    return settings.data.students.find((s) => s.id === id);
  }

  // Matching Engine Logic
  function attemptAutoMatch() {
    let count = 0;
    statements.forEach((st) => {
      if (st.status !== "pending") return;

      const match = pendingPayments.find((p) => {
        const s = getStudent(p.studentId);
        const nameMatch =
          s && (st.sender.includes(s.name) || s.name.includes(st.sender));
        return p.amount === st.amount && nameMatch;
      });

      if (match) {
        st.matchedId = match.id;
        count++;
      }
    });
    toast.show(
      "자동 매칭 완료",
      "success",
      `${count}건의 내역을 성공적으로 매칭했습니다.`,
    );
  }

  function confirmMatch(stId: string) {
    const st = statements.find((s) => s.id === stId);
    if (!st || !st.matchedId) return;

    const payIdx = settings.data.payments.findIndex(
      (p) => p.id === st.matchedId,
    );
    if (payIdx !== -1) {
      settings.data.payments[payIdx].status = "completed";
      settings.data.payments[payIdx].date = st.date;

      const p = settings.data.payments[payIdx];
      const student = settings.data.students.find((s) => s.id === p.studentId);
      if (student) {
        student.unpaid = Math.max(0, student.unpaid - p.amount);
      }
    }

    st.status = "confirmed";
    toast.show(
      "수납 처리 완료",
      "success",
      `${st.sender}님의 입금이 확인되었습니다.`,
    );
  }

  function ignoreStatement(stId: string) {
    const idx = statements.findIndex((s) => s.id === stId);
    if (idx !== -1) statements[idx].status = "ignored";
  }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600 tracking-tight">
        은행 내역 매칭 (Recon)
      </h2>
      <div class="flex items-center gap-3 mt-2">
        <span
          class="px-3 py-1 bg-toss-blue/10 text-toss-blue text-[12px] font-black rounded-full uppercase tracking-widest"
          >Bank Data Matching Engine</span
        >
      </div>
    </div>
    <div class="flex gap-4">
      <button
        onclick={attemptAutoMatch}
        class="toss-btn-primary px-8 h-16 rounded-[28px] shadow-lg shadow-toss-blue/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <RefreshCw size={20} class="animate-spin-slow" /> AI 자동 매칭 시작
      </button>
      <button
        class="bg-white px-8 h-16 rounded-[28px] border border-toss-grey-100 font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all flex items-center gap-2"
      >
        <Download size={20} /> 엑셀 업로드
      </button>
    </div>
  </header>

  <div class="grid grid-cols-12 gap-10">
    <!-- Left: Bank Statements -->
    <div class="col-span-12 lg:col-span-7 space-y-6">
      <div
        class="bg-white rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden flex flex-col min-h-[700px]"
      >
        <div
          class="p-10 border-b border-toss-grey-50 flex justify-between items-center bg-toss-grey-50/20"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"
            >
              <Wallet size={24} class="text-toss-grey-400" />
            </div>
            <h3 class="text-[20px] font-black text-toss-grey-600">
              은행 입금 내역
            </h3>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scroll">
          <table class="w-full text-left">
            <thead
              class="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-toss-grey-50"
            >
              <tr
                class="text-toss-grey-300 text-[12px] font-black uppercase tracking-widest"
              >
                <th class="px-10 py-6">일시</th>
                <th class="px-8 py-6">입금자명</th>
                <th class="px-8 py-6 text-right">금액</th>
                <th class="px-10 py-6 text-right">상태 / 제어</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-50">
              {#each statements.filter((s) => s.status !== "confirmed" && s.status !== "ignored") as st (st.id)}
                <tr
                  class="hover:bg-toss-grey-50/50 transition-all group"
                  in:slide
                >
                  <td
                    class="px-10 py-8 text-[14px] font-black text-toss-grey-300"
                    >{st.date}</td
                  >
                  <td class="px-8 py-8">
                    <p class="text-[17px] font-black text-toss-grey-600">
                      {st.sender}
                    </p>
                  </td>
                  <td
                    class="px-8 py-8 text-right font-black text-[18px] text-toss-grey-700"
                  >
                    ₩{st.amount.toLocaleString()}
                  </td>
                  <td class="px-10 py-8">
                    {#if st.matchedId}
                      {@const p = pendingPayments.find(
                        (p) => p.id === st.matchedId,
                      )}
                      {@const s = getStudent(p?.studentId || "")}
                      <div class="flex items-center justify-end gap-3" in:scale>
                        <div
                          class="px-4 py-3 bg-green-50 rounded-2xl border border-green-100 flex flex-col items-end"
                        >
                          <span
                            class="text-[10px] font-black text-green-600 uppercase"
                            >Matched with</span
                          >
                          <span class="text-[13px] font-black text-green-700"
                            >{s?.name} ({p?.description})</span
                          >
                        </div>
                        <button
                          onclick={() => confirmMatch(st.id)}
                          class="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-green-200"
                        >
                          <Check size={24} />
                        </button>
                      </div>
                    {:else}
                      <div class="flex justify-end gap-2">
                        <button
                          onclick={() => ignoreStatement(st.id)}
                          class="h-10 px-4 rounded-xl text-toss-grey-300 font-bold hover:text-red-500 transition-colors"
                          >제외</button
                        >
                        <button
                          class="h-10 px-4 rounded-xl text-toss-blue font-bold hover:bg-toss-blue-light transition-all"
                          >수동 매칭</button
                        >
                      </div>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>

          {#if statements.filter((s) => s.status === "pending").length === 0}
            <div class="p-40 text-center space-y-4">
              <CheckCircle2 size={60} class="mx-auto text-green-200" />
              <p class="text-toss-grey-300 font-bold">
                모든 내역이 확인되었거나 수납 완료되었습니다.
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right: Stats -->
    <div class="col-span-12 lg:col-span-5 space-y-6">
      <div
        class="bg-toss-grey-700 rounded-[48px] p-10 text-white shadow-xl space-y-8 relative overflow-hidden"
      >
        <div class="absolute -right-10 -top-10 opacity-10 rotate-12">
          <DollarSign size={200} />
        </div>
        <div class="space-y-2">
          <p
            class="text-[14px] font-black opacity-60 uppercase tracking-widest"
          >
            Total Outstanding
          </p>
          <h3 class="text-[40px] font-black">
            ₩{pendingPayments
              .reduce((acc, p) => acc + p.amount, 0)
              .toLocaleString()}
          </h3>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-6 bg-white/10 rounded-3xl border border-white/5">
            <p class="text-[12px] opacity-60 font-black">미수 건수</p>
            <p class="text-[20px] font-black mt-1">
              {pendingPayments.length}건
            </p>
          </div>
          <div class="p-6 bg-white/10 rounded-3xl border border-white/5">
            <p class="text-[12px] opacity-60 font-black">매칭 대기</p>
            <p class="text-[20px] font-black mt-1">
              {statements.filter((s) => s.status === "pending").length}건
            </p>
          </div>
        </div>
      </div>

      <div
        class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm p-8 space-y-6"
      >
        <div class="flex justify-between items-center">
          <h4 class="text-[14px] font-black text-toss-grey-600">
            미수 명단 (Top 10)
          </h4>
          <button class="text-[12px] font-black text-toss-blue">전체보기</button
          >
        </div>
        <div class="space-y-4">
          {#each pendingPayments.slice(0, 5) as p}
            {@const s = getStudent(p.studentId)}
            <div
              class="flex justify-between items-center p-4 bg-toss-grey-50 rounded-2xl"
            >
              <span class="font-bold text-toss-grey-600">{s?.name}</span>
              <span class="font-black text-toss-blue"
                >₩{p.amount.toLocaleString()}</span
              >
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
  .animate-spin-slow {
    animation: spin 3s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
