<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import {
    Wallet,
    Plus,
    X,
    Save,
    Trash2,
    Settings2,
    Calculator,
    Users,
    TrendingUp,
    CheckCircle2,
    ChevronRight,
    Info,
  } from "lucide-svelte";
  import { fade, fly, slide } from "svelte/transition";
  import { toast } from "$lib/stores/toast.svelte";
  import type {
    SalaryPolicy,
    SalaryCondition,
    SettlementType,
  } from "$lib/types";

  let isDrawerOpen = $state(false);
  let editingPolicy = $state<Partial<SalaryPolicy>>({});
  let searchQuery = $state("");

  const settlementTypes: { value: SettlementType; label: string; icon: any }[] =
    [
      { value: "fixed", label: "고정 월급제", icon: Wallet },
      { value: "hourly", label: "시간제(시급)", icon: Calculator },
      { value: "perStudent", label: "인원 수당제", icon: Users },
      { value: "ratio", label: "지분제(비율)", icon: TrendingUp },
      { value: "equity", label: "순수익 지분제", icon: TrendingUp },
      { value: "custom", label: "복합/기타", icon: Settings2 },
    ];

  const filteredPolicies = $derived(
    settings.data.salaryPolicies.filter(
      (p) =>
        p.name.includes(searchQuery) || p.description.includes(searchQuery),
    ),
  );

  function openDetail(policy?: SalaryPolicy) {
    if (policy) {
      editingPolicy = JSON.parse(JSON.stringify(policy));
    } else {
      editingPolicy = {
        id: `sp_${Date.now()}`,
        name: "",
        type: "fixed",
        baseValue: 0,
        conditions: [],
        description: "",
      };
    }
    isDrawerOpen = true;
  }

  function addCondition() {
    const newCondition: SalaryCondition = {
      id: `sc_${Date.now()}`,
      type: "student_count",
      threshold: 0,
      rewardType: "bonus_amount",
      rewardValue: 0,
    };
    editingPolicy.conditions = [
      ...(editingPolicy.conditions || []),
      newCondition,
    ];
  }

  function removeCondition(id: string) {
    editingPolicy.conditions = editingPolicy.conditions?.filter(
      (c) => c.id !== id,
    );
  }

  function savePolicy() {
    if (!editingPolicy.name) {
      toast.show("정책 이름을 입력해주세요.", "error");
      return;
    }

    const idx = settings.data.salaryPolicies.findIndex(
      (p) => p.id === editingPolicy.id,
    );
    if (idx !== -1) {
      settings.data.salaryPolicies[idx] = editingPolicy as SalaryPolicy;
      toast.show("급여 정책 수정 완료", "success");
    } else {
      settings.data.salaryPolicies.push(editingPolicy as SalaryPolicy);
      toast.show("신규 급여 정책 등록 완료", "success");
    }
    isDrawerOpen = false;
  }

  function deletePolicy(id: string) {
    if (
      confirm(
        "정말 이 정책을 삭제하시겠습니까? 이 정책을 사용 중인 직원 데이터에 영향을 줄 수 있습니다.",
      )
    ) {
      settings.data.salaryPolicies = settings.data.salaryPolicies.filter(
        (p) => p.id !== id,
      );
      toast.show("정책이 삭제되었습니다.", "info");
      isDrawerOpen = false;
    }
  }
</script>

<div class="space-y-8 pb-20">
  <header class="flex justify-between items-end">
    <div>
      <h1
        class="text-[32px] font-black text-toss-grey-900 tracking-tight flex items-center gap-3"
      >
        <Wallet class="text-toss-blue" size={36} /> 월급/정산 정책 관리
      </h1>
      <p class="text-[16px] text-toss-grey-500 font-medium mt-2">
        학원의 다양한 급여 체계를 정의하고 관리합니다.
      </p>
    </div>
    <button
      onclick={() => openDetail()}
      class="h-14 px-8 bg-toss-blue text-white rounded-2xl font-black text-[16px] flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-toss-blue/20"
    >
      <Plus size={20} /> 신규 정책 추가
    </button>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {#each filteredPolicies as policy}
      <button
        onclick={() => openDetail(policy)}
        class="bg-white p-8 rounded-[40px] border border-toss-grey-100 text-left hover:shadow-xl hover:border-toss-blue/20 transition-all group"
      >
        <div class="flex justify-between items-start mb-6">
          <div
            class="w-14 h-14 rounded-2xl bg-toss-grey-50 flex items-center justify-center text-toss-grey-400 group-hover:bg-toss-blue/5 group-hover:text-toss-blue transition-colors text-2xl"
          >
            {#if policy.type === "fixed"}<Wallet />
            {:else if policy.type === "hourly"}<Calculator />
            {:else if policy.type === "perStudent"}<Users />
            {:else}<TrendingUp />{/if}
          </div>
          <span
            class="px-4 py-1.5 rounded-full bg-toss-grey-50 text-toss-grey-400 text-[12px] font-black uppercase tracking-wider"
          >
            {settlementTypes.find((t) => t.value === policy.type)?.label}
          </span>
        </div>

        <h3 class="text-[20px] font-black text-toss-grey-800 mb-2">
          {policy.name}
        </h3>
        <p
          class="text-[14px] text-toss-grey-400 font-medium line-clamp-2 min-h-[40px]"
        >
          {policy.description || "설명이 없습니다."}
        </p>

        <div
          class="mt-6 pt-6 border-t border-toss-grey-50 flex items-center justify-between"
        >
          <div class="text-[13px] font-bold text-toss-grey-500">
            조건 수: <span class="text-toss-blue"
              >{policy.conditions.length}개</span
            >
          </div>
          <ChevronRight
            size={18}
            class="text-toss-grey-300 group-hover:text-toss-blue group-hover:translate-x-1 transition-all"
          />
        </div>
      </button>
    {/each}
  </div>
</div>

{#if isDrawerOpen}
  <div class="fixed inset-0 z-[100] flex justify-end">
    <!-- Background Dimmer -->
    <button
      class="absolute inset-0 bg-black/20 backdrop-blur-sm border-none w-full h-full cursor-default"
      onclick={() => (isDrawerOpen = false)}
      transition:fade={{ duration: 200 }}
      aria-label="배경 클릭 시 닫기"
    ></button>

    <!-- Drawer Content -->
    <div
      transition:fly={{ x: 100, duration: 400 }}
      class="relative z-10 w-full max-w-2xl bg-toss-grey-50 h-full shadow-2xl overflow-y-auto flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <header
        class="p-10 flex justify-between items-center bg-white border-b border-toss-grey-50"
      >
        <div>
          <h2 class="text-[28px] font-black text-toss-grey-900 leading-tight">
            정책 설정
          </h2>
          <p class="text-toss-grey-400 font-bold mt-1">
            급여 계산 방식을 상세히 정의합니다.
          </p>
        </div>
        <button
          onclick={() => (isDrawerOpen = false)}
          class="w-14 h-14 rounded-[20px] bg-toss-grey-50 flex items-center justify-center text-toss-grey-400 hover:bg-toss-grey-100 transition-all"
        >
          <X size={24} />
        </button>
      </header>

      <div class="p-10 space-y-10 flex-1">
        <!-- 기본 정보 -->
        <section class="space-y-6">
          <div class="grid grid-cols-2 gap-6">
            <div class="space-y-3">
              <label
                class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                >정책 이름</label
              >
              <input
                bind:value={editingPolicy.name}
                placeholder="예: 전임교사 인센티브제"
                class="w-full h-16 bg-white border-none rounded-2xl px-6 font-bold text-toss-grey-800 shadow-sm focus:ring-4 focus:ring-toss-blue/5 outline-none"
              />
            </div>
            <div class="space-y-3">
              <label
                class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                >정산 유형</label
              >
              <select
                bind:value={editingPolicy.type}
                class="w-full h-16 bg-white border-none rounded-2xl px-6 font-bold text-toss-grey-800 shadow-sm focus:ring-4 focus:ring-toss-blue/5 outline-none appearance-none"
              >
                {#each settlementTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="space-y-3">
            <label
              class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
              >기본값 (기본급/시급/지분율)</label
            >
            <div class="relative">
              <input
                type="number"
                bind:value={editingPolicy.baseValue}
                class="w-full h-16 bg-white border-none rounded-2xl px-6 font-black text-[20px] text-toss-blue shadow-sm focus:ring-4 focus:ring-toss-blue/5 outline-none"
              />
              <span
                class="absolute right-6 top-1/2 -translate-y-1/2 font-black text-toss-grey-300"
              >
                {#if editingPolicy.type === "ratio" || editingPolicy.type === "equity"}%{:else}원{/if}
              </span>
            </div>
          </div>

          <div class="space-y-3">
            <label
              class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
              >정책 설명</label
            >
            <textarea
              bind:value={editingPolicy.description}
              rows="3"
              class="w-full bg-white border-none rounded-2xl p-6 font-medium text-toss-grey-600 shadow-sm focus:ring-4 focus:ring-toss-blue/5 outline-none resize-none"
              placeholder="정책에 대한 상세 설명을 입력하세요."
            ></textarea>
          </div>
        </section>

        <!-- 조건부 수당 -->
        <section class="space-y-6">
          <div class="flex justify-between items-center pl-1">
            <h4
              class="text-[14px] font-black text-toss-grey-500 uppercase tracking-widest flex items-center gap-2"
            >
              <TrendingUp size={18} class="text-toss-blue" /> 추가 수당 조건 (인센티브)
            </h4>
            <button
              onclick={addCondition}
              class="text-[12px] font-black text-toss-blue flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> 조건 추가
            </button>
          </div>

          {#if (editingPolicy.conditions || []).length === 0}
            <div
              class="bg-white p-10 rounded-[32px] border border-dashed border-toss-grey-200 flex flex-col items-center justify-center gap-3 text-toss-grey-300"
            >
              <Info size={32} />
              <p class="font-bold">설정된 추가 수당 조건이 없습니다.</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each editingPolicy.conditions as condition, i}
                <div
                  transition:slide
                  class="bg-white p-8 rounded-[32px] border border-toss-grey-50 shadow-sm space-y-6 relative group"
                >
                  <button
                    onclick={() => removeCondition(condition.id)}
                    class="absolute top-6 right-6 text-toss-grey-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={20} />
                  </button>

                  <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                      <label
                        class="text-[11px] font-black text-toss-grey-300 uppercase"
                        >조건 기준</label
                      >
                      <select
                        bind:value={condition.type}
                        class="w-full h-12 bg-toss-grey-50 border-none rounded-xl px-4 font-bold text-[14px] outline-none"
                      >
                        <option value="student_count">총 수강 인원 수</option>
                        <option value="revenue">총 매출액</option>
                        <option value="net_profit">순수익액</option>
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label
                        class="text-[11px] font-black text-toss-grey-300 uppercase"
                        >기준 수치 (N 이상)</label
                      >
                      <input
                        type="number"
                        bind:value={condition.threshold}
                        class="w-full h-12 bg-toss-grey-50 border-none rounded-xl px-4 font-bold text-[14px] outline-none"
                      />
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-4 bg-toss-blue/5 p-4 rounded-2xl"
                  >
                    <div class="flex-1 space-y-2">
                      <label
                        class="text-[11px] font-black text-toss-blue/50 uppercase"
                        >지급 방식</label
                      >
                      <select
                        bind:value={condition.rewardType}
                        class="w-full h-12 bg-white border-none rounded-xl px-4 font-bold text-[14px] outline-none"
                      >
                        <option value="bonus_amount">고정 금액 추가 (원)</option
                        >
                        <option value="bonus_percent">비율 추가 (%)</option>
                      </select>
                    </div>
                    <div class="flex-1 space-y-2">
                      <label
                        class="text-[11px] font-black text-toss-blue/50 uppercase"
                        >지급액/율</label
                      >
                      <input
                        type="number"
                        bind:value={condition.rewardValue}
                        class="w-full h-12 bg-white border-none rounded-xl px-4 font-black text-toss-blue outline-none"
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>

      <footer class="p-10 bg-white border-t border-toss-grey-50 flex gap-4">
        <button
          onclick={() => deletePolicy(editingPolicy.id!)}
          class="w-16 h-16 rounded-[24px] bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-100"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={savePolicy}
          class="flex-1 h-16 bg-toss-blue text-white rounded-[24px] font-black text-[18px] hover:bg-black transition-all shadow-xl shadow-toss-blue/20"
        >
          정책 저장하기
        </button>
      </footer>
    </div>
  </div>
{/if}

<style>
  textarea::placeholder {
    color: #cbd5e1;
    font-weight: 700;
  }
</style>
