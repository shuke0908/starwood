<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { fade, fly, slide, scale } from "svelte/transition";
  import {
    Users,
    ShieldCheck,
    Calendar,
    GraduationCap,
    Banknote,
    Percent,
    Database,
    FileLock,
    ChevronRight,
    Settings2,
    Building2,
    CreditCard,
    ArrowUpRight,
    Search,
    History,
    Bell,
  } from "lucide-svelte";

  const categories = [
    {
      id: "users",
      title: "사용자 및 권한",
      description: "직원 역할 정의 및 세부 권한(ACL)을 관리합니다.",
      icon: Users,
      color: "bg-toss-blue",
      href: "/settings/users",
      items: ["강사 및 직원 관리", "직급별 권한 설정", "접근 로그 확인"],
    },
    {
      id: "academic",
      title: "학사 및 운영 마스터",
      description: "강의실, 학년 체계 등 학사 기본 자산을 관리합니다.",
      icon: Building2,
      color: "bg-green-500",
      href: "/settings/master",
      items: ["강의실 시설 설정", "학년 및 레벨 체계", "시설 점검"],
    },
    {
      id: "finance",
      title: "재무 정책 마스터",
      description: "수강료 상품 및 자동 할인 정책을 설정합니다.",
      icon: Banknote,
      color: "bg-orange-500",
      href: "/settings/master",
      items: ["수강료 상품 관리", "할인 및 프로모션", "세금 설정"],
    },
    {
      id: "system",
      title: "시스템 및 데이터",
      description: "백업, 데이터 내보내기 및 전역 시스템 설정을 관리합니다.",
      icon: Database,
      color: "bg-toss-grey-600",
      href: "/settings/data",
      items: ["전체 데이터 백업/복구", "엑셀 일괄 업로드", "시스템 버전 관리"],
    },
  ];
</script>

<div class="max-w-[1200px] mx-auto space-y-12 pb-20">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600 tracking-tight">
        설정 허브
      </h2>
      <p class="text-toss-grey-400 font-bold mt-2">
        Starwood ERP의 모든 운영 정책을 중앙에서 관리합니다.
      </p>
    </div>
    <div class="flex gap-3">
      <div class="relative group">
        <Search
          size={18}
          class="absolute left-4 top-1/2 -translate-y-1/2 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors"
        />
        <input
          type="text"
          placeholder="설정 항목 검색..."
          class="h-12 pl-12 pr-6 bg-white border border-toss-grey-100 rounded-2xl w-64 focus:w-80 transition-all font-bold text-[14px] outline-none focus:border-toss-blue focus:ring-4 focus:ring-toss-blue/5"
        />
      </div>
      <button
        class="w-12 h-12 bg-white border border-toss-grey-100 rounded-2xl flex items-center justify-center text-toss-grey-400 hover:text-toss-blue transition-all"
      >
        <History size={20} />
      </button>
    </div>
  </header>

  <!-- Quick Access Summary -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div
      class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm flex flex-col items-center text-center space-y-2 group cursor-pointer hover:border-toss-blue/20 transition-all"
    >
      <div
        class="w-12 h-12 bg-toss-blue/10 rounded-2xl flex items-center justify-center text-toss-blue group-hover:scale-110 transition-transform"
      >
        <Building2 size={24} />
      </div>
      <p class="text-[12px] font-black text-toss-grey-300">현재 강의실</p>
      <p class="text-[20px] font-black text-toss-grey-600">
        {settings.data.roomSettings.length}개
      </p>
    </div>
    <div
      class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm flex flex-col items-center text-center space-y-2 group cursor-pointer hover:border-toss-blue/20 transition-all"
    >
      <div
        class="w-12 h-12 bg-green-50/50 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform"
      >
        <CreditCard size={24} />
      </div>
      <p class="text-[12px] font-black text-toss-grey-300">등록 상품</p>
      <p class="text-[20px] font-black text-toss-grey-600">
        {settings.data.products.length}건
      </p>
    </div>
    <div
      class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm flex flex-col items-center text-center space-y-2 group cursor-pointer hover:border-toss-blue/20 transition-all"
    >
      <div
        class="w-12 h-12 bg-orange-50/50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform"
      >
        <Percent size={24} />
      </div>
      <p class="text-[12px] font-black text-toss-grey-300">활성 할인정책</p>
      <p class="text-[20px] font-black text-toss-grey-600">
        {settings.data.discounts.length}건
      </p>
    </div>
    <div
      class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm flex flex-col items-center text-center space-y-2 group cursor-pointer hover:border-toss-blue/20 transition-all"
    >
      <div
        class="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform"
      >
        <ShieldCheck size={24} />
      </div>
      <p class="text-[12px] font-black text-toss-grey-300">직위/Role</p>
      <p class="text-[20px] font-black text-toss-grey-600">5개</p>
    </div>
  </div>

  <!-- Category List -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
    {#each categories as cat}
      <a
        href={cat.href}
        class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm hover:shadow-xl hover:border-toss-blue/10 transition-all group flex flex-col"
        in:fly={{ y: 20, delay: 100 }}
      >
        <div class="flex justify-between items-start">
          <div
            class="w-16 h-16 {cat.color} rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-{cat.color.split(
              '-',
            )[1]}-200 group-hover:scale-105 transition-transform"
          >
            <cat.icon size={32} />
          </div>
          <ArrowUpRight
            size={24}
            class="text-toss-grey-100 group-hover:text-toss-blue transition-colors"
          />
        </div>

        <div class="mt-8 space-y-2">
          <h3 class="text-[24px] font-black text-toss-grey-600 tracking-tight">
            {cat.title}
          </h3>
          <p class="text-toss-grey-400 font-bold leading-relaxed">
            {cat.description}
          </p>
        </div>

        <div
          class="mt-8 pt-8 border-t border-toss-grey-50 flex flex-wrap gap-2"
        >
          {#each cat.items as item}
            <span
              class="px-3 py-1 bg-toss-grey-50 text-toss-grey-300 text-[12px] font-black rounded-full group-hover:bg-toss-blue/5 group-hover:text-toss-blue transition-colors"
            >
              {item}
            </span>
          {/each}
        </div>
      </a>
    {/each}
  </div>

  <!-- Bottom Notice -->
  <div
    class="bg-toss-grey-700 p-10 rounded-[48px] text-white flex justify-between items-center relative overflow-hidden group"
  >
    <div
      class="absolute -left-10 -top-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000"
    >
      <Settings2 size={240} />
    </div>
    <div class="relative z-10">
      <h4 class="text-[20px] font-black flex items-center gap-3">
        <Bell size={24} class="text-toss-blue animate-bounce" />
        보안 및 무결성 알림
      </h4>
      <p class="text-white/50 font-bold mt-2">
        최근 24시간 동안 ‘재무 정책’에 2건의 변경사항이 기록되었습니다.
      </p>
    </div>
    <button
      class="relative z-10 px-8 h-14 bg-white/10 rounded-2xl text-[14px] font-black hover:bg-white/20 transition-all border border-white/10 flex items-center gap-2"
    >
      감사 로그 확인 <ChevronRight size={18} />
    </button>
  </div>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
