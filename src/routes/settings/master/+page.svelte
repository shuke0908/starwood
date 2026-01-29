<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { toast } from "$lib/stores/toast.svelte";
  import { fade, fly, slide, scale } from "svelte/transition";
  import {
    Building2,
    GraduationCap,
    Package,
    Percent,
    Plus,
    Search,
    Trash2,
    Save,
    ChevronRight,
    MapPin,
    Users,
    Clock,
    Tag,
    AlertCircle,
    Info,
  } from "lucide-svelte";

  let activeTab = $state("rooms"); // 'rooms' | 'grades' | 'products' | 'discounts'

  const tabs = [
    { id: "rooms", label: "강의실", icon: Building2 },
    { id: "grades", label: "학년/레벨", icon: GraduationCap },
    { id: "products", label: "수강 상품", icon: Package },
    { id: "discounts", label: "할인 정책", icon: Percent },
  ];

  const fmt = (val: number) => val.toLocaleString();

  // Handlers
  function addRoom() {
    settings.data.roomSettings.push({
      id: `room_${Date.now()}`,
      name: "신규 강의실",
      capacity: 10,
      equipment: [],
      unavailableTimes: [],
    });
  }

  function addProduct() {
    settings.data.products.push({
      id: `prod_${Date.now()}`,
      name: "신규 강좌",
      baseFee: 150000,
      billingType: "flat",
      classIds: [],
    });
  }

  function addDiscount() {
    settings.data.discounts.push({
      id: `disc_${Date.now()}`,
      name: "신규 할인",
      value: 10000,
      type: "amount",
      description: "",
    });
  }

  function deleteRoom(id: string) {
    if (confirm("강의실을 삭제하시겠습니까?")) {
      settings.data.roomSettings = settings.data.roomSettings.filter(
        (r) => r.id !== id,
      );
    }
  }

  function deleteProduct(id: string) {
    if (confirm("수강 상품을 삭제하시겠습니까?")) {
      settings.data.products = settings.data.products.filter(
        (p) => p.id !== id,
      );
    }
  }

  function deleteDiscount(id: string) {
    if (confirm("할인 정책을 삭제하시겠습니까?")) {
      settings.data.discounts = settings.data.discounts.filter(
        (d) => d.id !== id,
      );
    }
  }

  function saveAll() {
    toast.show("모든 변경사항이 자동으로 동기화되었습니다.", "success");
  }
</script>

<div class="max-w-[1200px] mx-auto space-y-10 pb-20">
  <!-- Header -->
  <header class="flex justify-between items-end px-2">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600 tracking-tight">
        마스터 설정
      </h2>
      <p class="text-toss-grey-400 font-bold mt-2">
        학원 운영의 근간이 되는 기초 데이터를 관리합니다.
      </p>
    </div>
    <div class="flex gap-4 shrink-0">
      <button class="toss-btn-secondary px-6 shrink-0 whitespace-nowrap"
        >전체 백업</button
      >
      <button
        onclick={saveAll}
        class="toss-btn-primary px-8 flex items-center gap-2 shrink-0 whitespace-nowrap"
      >
        <Save size={20} /> 모든 변경사항 저장
      </button>
    </div>
  </header>

  <!-- Tabs Navigation -->
  <div
    class="flex p-2 bg-toss-grey-50 rounded-[28px] mx-2 gap-2 shadow-inner border border-toss-grey-100/50"
  >
    {#each tabs as tab}
      <button
        onclick={() => (activeTab = tab.id)}
        class="flex-1 h-14 rounded-[20px] flex items-center justify-center gap-3 font-black text-[15px] transition-all {activeTab ===
        tab.id
          ? 'bg-white text-toss-blue shadow-lg shadow-toss-blue/5'
          : 'text-toss-grey-300 hover:text-toss-grey-500 hover:bg-white/50'}"
      >
        <tab.icon size={20} />
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Content Area -->
  <main class="mx-2" in:fade>
    {#if activeTab === "rooms"}
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-[20px] font-black text-toss-grey-600">
            강의실 및 시설 관리
          </h3>
          <button
            onclick={addRoom}
            class="text-[14px] font-black text-toss-blue flex items-center gap-1"
            ><Plus size={16} /> 신규 추가</button
          >
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each settings.data.roomSettings as room (room.id)}
            <div
              class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div class="flex justify-between items-start">
                <div
                  class="w-12 h-12 bg-toss-grey-50 rounded-2xl flex items-center justify-center text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all"
                >
                  <MapPin size={24} />
                </div>
                <button
                  onclick={() => deleteRoom(room.id)}
                  class="text-toss-grey-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div class="mt-6 space-y-4">
                <input
                  bind:value={room.name}
                  class="w-full text-[20px] font-black text-toss-grey-600 border-none outline-none focus:text-toss-blue bg-transparent"
                />
                <div class="flex items-center gap-6">
                  <div class="flex items-center gap-2">
                    <Users size={16} class="text-toss-grey-200" />
                    <span class="text-[14px] font-bold text-toss-grey-300"
                      >정원</span
                    >
                    <input
                      type="number"
                      bind:value={room.capacity}
                      class="w-12 text-[14px] font-black text-toss-grey-500 bg-toss-grey-50 rounded-lg px-2 py-1 outline-none focus:bg-toss-blue/5 focus:text-toss-blue"
                    />
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === "grades"}
      <div
        class="bg-white p-12 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-10 text-center"
      >
        <div
          class="w-20 h-20 bg-green-50 rounded-[32px] flex items-center justify-center text-green-500 mx-auto"
        >
          <GraduationCap size={40} />
        </div>
        <div class="space-y-4 max-w-lg mx-auto">
          <h3 class="text-[28px] font-black text-toss-grey-600">
            학년 및 레벨 체계 설정
          </h3>
          <p class="text-toss-grey-400 font-bold leading-relaxed">
            학원의 수업 대상(미취학, 초/중/고) 및 레벨(Starter, Advanced 등)
            구분을 설정합니다. 이 데이터는 통계 분석의 핵심 차원으로 사용됩니다.
          </p>
        </div>
        <div
          class="bg-toss-grey-50 p-6 rounded-3xl flex items-center gap-4 text-left border border-toss-grey-100"
        >
          <Info size={24} class="text-toss-blue shrink-0" />
          <p class="text-[13px] font-bold text-toss-grey-400 leading-relaxed">
            학년 체계 변경 시 기존 원생들의 통계 데이터에 영향을 줄 수 있으니
            주의하시기 바랍니다.
          </p>
        </div>
        <button class="toss-btn-secondary px-10"
          >레벨 체계 마스터 편집기 열기</button
        >
      </div>
    {:else if activeTab === "products"}
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-[20px] font-black text-toss-grey-600">
            수강 상품(Product) 마스터
          </h3>
          <button
            onclick={addProduct}
            class="text-[14px] font-black text-toss-blue flex items-center gap-1"
            ><Plus size={16} /> 상품 등록</button
          >
        </div>
        <div class="grid grid-cols-1 gap-4">
          {#each settings.data.products as prod}
            <div
              class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm flex items-center justify-between hover:border-toss-blue transition-all group"
            >
              <div class="flex items-center gap-6">
                <div
                  class="w-14 h-14 bg-toss-grey-50 rounded-2xl flex items-center justify-center text-toss-grey-400 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all"
                >
                  <Package size={24} />
                </div>
                <div class="space-y-1">
                  <input
                    bind:value={prod.name}
                    class="text-[17px] font-black text-toss-grey-600 outline-none border-none bg-transparent group-hover:text-toss-blue"
                  />
                  <p class="text-[12px] font-bold text-toss-grey-300">
                    {prod.billingType === "session" ? "횟수제" : "정액제"}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-10">
                <div class="text-right">
                  <span class="text-[12px] font-black text-toss-grey-200 block"
                    >수강료</span
                  >
                  <div class="flex items-center gap-1">
                    <span class="text-toss-grey-400 font-bold text-[14px]"
                      >₩</span
                    >
                    <input
                      type="number"
                      bind:value={prod.baseFee}
                      class="w-32 text-[18px] font-black text-toss-grey-600 text-right bg-transparent outline-none"
                    />
                  </div>
                </div>
                <button
                  onclick={() => deleteProduct(prod.id)}
                  class="p-2 text-toss-grey-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if activeTab === "discounts"}
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-[20px] font-black text-toss-grey-600">
            자동 할인 및 프로모션 정책
          </h3>
          <button
            onclick={addDiscount}
            class="text-[14px] font-black text-toss-blue flex items-center gap-1"
            ><Plus size={16} /> 정책 추가</button
          >
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each settings.data.discounts as disc}
            <div
              class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-6"
            >
              <div class="flex justify-between items-start">
                <div
                  class="px-3 py-1 bg-orange-50 text-orange-500 rounded-lg text-[11px] font-black uppercase tracking-wider"
                >
                  {disc.type === "amount" ? "정액 할인" : "정률 할인"}
                </div>
                <button
                  onclick={() => deleteDiscount(disc.id)}
                  class="text-toss-grey-100 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div class="space-y-4">
                <input
                  bind:value={disc.name}
                  class="w-full text-[18px] font-black text-toss-grey-600 outline-none"
                  placeholder="정책 명칭"
                />
                <div
                  class="flex items-center justify-between p-4 bg-toss-grey-50 rounded-2xl"
                >
                  <div class="flex gap-2">
                    <Tag size={18} class="text-toss-grey-200" />
                    <span class="text-[14px] font-bold text-toss-grey-400"
                      >할인 금액/비율</span
                    >
                  </div>
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      bind:value={disc.value}
                      class="w-24 text-right font-black text-[17px] bg-transparent outline-none"
                    />
                    <span class="font-black text-toss-grey-300"
                      >{disc.type === "amount" ? "원" : "%"}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    background-color: #f9fafb;
  }
</style>
