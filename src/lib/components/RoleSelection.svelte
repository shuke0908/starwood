<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import {
    LayoutDashboard,
    GraduationCap,
    Users2,
    Bus,
    ChevronRight,
    Sparkles,
  } from "lucide-svelte";
  import { fade, fly, scale } from "svelte/transition";
  import type { UserRole } from "$lib/types";

  const roles: {
    id: UserRole;
    name: string;
    desc: string;
    icon: any;
    color: string;
    bg: string;
  }[] = [
    {
      id: "director",
      name: "원장님 로그인",
      desc: "학원의 모든 지표와 정책을 관리합니다.",
      icon: LayoutDashboard,
      color: "text-toss-blue",
      bg: "bg-toss-blue/5",
    },
    {
      id: "teacher",
      name: "강사 로그인",
      desc: "수업 준비, 학생 출결 및 과제를 관리합니다.",
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      id: "manager",
      name: "직원 로그인",
      desc: "상담, 수납 및 일반 행정 업무를 처리합니다.",
      icon: Users2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      id: "driver",
      name: "셔틀 기사 로그인",
      desc: "배정된 노선과 탑승 학생 명단을 확인합니다.",
      icon: Bus,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  function selectRole(role: UserRole) {
    settings.data.currentUserRole = role;
    settings.data.isAuthenticated = true;
  }
</script>

<div
  class="fixed inset-0 z-[1000] bg-toss-grey-25 flex items-center justify-center p-6 overflow-y-auto"
>
  <div class="w-full max-w-5xl space-y-12 py-12">
    <header class="text-center space-y-4" in:fade={{ duration: 800 }}>
      <div
        class="inline-flex items-center gap-2 px-4 py-1.5 bg-toss-blue/10 rounded-full text-toss-blue text-[13px] font-black uppercase tracking-widest leading-none"
      >
        <Sparkles size={14} /> starwood academy demo
      </div>
      <h1 class="text-[48px] font-black text-toss-grey-800 tracking-tight">
        서비스 시작하기
      </h1>
      <p class="text-[18px] text-toss-grey-400 font-bold">
        체험하실 역할을 선택하여 학원 관리 시스템에 접속하세요.
      </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {#each roles as role, i}
        <button
          onclick={() => selectRole(role.id)}
          class="group relative bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm hover:shadow-2xl hover:border-toss-blue/20 hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden"
          in:fly={{ y: 40, delay: i * 100, duration: 800 }}
        >
          <!-- Background Decoration -->
          <div
            class="absolute -right-10 -bottom-10 w-40 h-40 {role.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
          ></div>

          <div class="relative z-10 flex items-start gap-8">
            <div
              class="w-20 h-20 {role.bg} {role.color} rounded-[32px] flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
            >
              <svelte:component this={role.icon} size={36} />
            </div>

            <div class="flex-1 space-y-2">
              <h3
                class="text-[24px] font-black text-toss-grey-800 flex items-center gap-2"
              >
                {role.name}
                <ChevronRight
                  size={20}
                  class="text-toss-grey-200 group-hover:text-toss-blue group-hover:translate-x-1 transition-all"
                />
              </h3>
              <p
                class="text-[15px] text-toss-grey-400 font-bold leading-relaxed"
              >
                {role.desc}
              </p>
            </div>
          </div>

          <div class="mt-8 flex gap-2">
            {#if role.id === "director"}
              <span
                class="px-3 py-1 bg-toss-blue/5 text-toss-blue text-[11px] font-black rounded-lg"
                >전체 권한</span
              >
            {:else if role.id === "teacher"}
              <span
                class="px-3 py-1 bg-purple-50 text-purple-500 text-[11px] font-black rounded-lg"
                >강의 관리</span
              >
              <span
                class="px-3 py-1 bg-purple-50 text-purple-500 text-[11px] font-black rounded-lg"
                >과제/출결</span
              >
            {:else if role.id === "manager"}
              <span
                class="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black rounded-lg"
                >행정/회계</span
              >
              <span
                class="px-3 py-1 bg-green-50 text-green-600 text-[11px] font-black rounded-lg"
                >원생 상담</span
              >
            {:else if role.id === "driver"}
              <span
                class="px-3 py-1 bg-orange-50 text-orange-500 text-[11px] font-black rounded-lg"
                >배차 확인</span
              >
            {/if}
          </div>
        </button>
      {/each}
    </div>

    <footer class="text-center pt-8" in:fade={{ duration: 1000, delay: 600 }}>
      <p class="text-toss-grey-300 text-[13px] font-bold">
        © 2026 Starwood Academy. 실시간 데이터 동기화 및 보안 기능이 적용되어
        있습니다.
      </p>
    </footer>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f7f8f9;
  }
</style>
