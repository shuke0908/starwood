<script lang="ts">
  import "./layout.css";
  import { settings } from "$lib/settings.svelte";
  import {
    Users,
    GraduationCap,
    Users2,
    CreditCard,
    BarChart3,
    Settings,
    CheckCircle2,
    BookOpen,
    MessageSquare,
    LayoutDashboard,
    Calendar,
    MessageCircle,
    AlertCircle,
    TrendingUp,
    PieChart,
    Wallet,
    Megaphone,
    Send,
    History,
    UserCog,
    ShoppingBag,
    Database,
    FolderOpen,
    ClipboardList,
    UserPlus,
    Monitor,
    Building,
    Search,
    Star,
    X,
    Command,
    ChevronRight,
    Bus,
  } from "lucide-svelte";
  import { page } from "$app/state";
  import { fade, slide, fly } from "svelte/transition";
  import { onMount, untrack } from "svelte";
  import Toast from "$lib/components/Toast.svelte";
  import RoleSelection from "$lib/components/RoleSelection.svelte";

  let { children } = $props();

  const menuGroups = [
    {
      group: "핵심",
      items: [
        { id: "dashboard", name: "대시보드", icon: LayoutDashboard, href: "/" },
      ],
    },
    {
      group: "원생 CRM",
      items: [
        { id: "students", name: "학생 목록", icon: Users, href: "/students" },
        {
          id: "consultations",
          name: "상담/입학 관리",
          icon: MessageCircle,
          href: "/students/consultations",
        },
      ],
    },
    {
      group: "학사 운영",
      items: [
        {
          id: "timetable",
          name: "스마트 시간표",
          icon: Calendar,
          href: "/academic/timetable",
        },
        {
          id: "classes",
          name: "반(클래스) 관리",
          icon: GraduationCap,
          href: "/academic/classes",
        },
        {
          id: "attendance",
          name: "출결 관리",
          icon: CheckCircle2,
          href: "/academic/attendance",
        },
        {
          id: "homework",
          name: "과제 관리",
          icon: BookOpen,
          href: "/academic/homework",
        },
        {
          id: "reports",
          name: "성적 관리",
          icon: ClipboardList,
          href: "/academic/reports",
        },
      ],
    },
    {
      group: "재무/회계",
      items: [
        {
          id: "finance-desk",
          name: "수납 데스크",
          icon: Monitor,
          href: "/finance/desk",
        },
        {
          id: "finance-unpaid",
          name: "미수금 관리",
          icon: AlertCircle,
          href: "/finance/unpaid",
        },
        {
          id: "finance-refund",
          name: "환불 관리",
          icon: History,
          href: "/finance/refunds",
        },
        {
          id: "finance-bank",
          name: "입금 내역 확인",
          icon: Building,
          href: "/finance/bank",
        },
      ],
    },
    {
      group: "경영/분석",
      items: [
        {
          id: "management-sales",
          name: "매출 보고서",
          icon: TrendingUp,
          href: "/management/sales",
        },
        {
          id: "management-expenses",
          name: "비용 분석",
          icon: PieChart,
          href: "/management/expenses",
        },
        {
          id: "management-settlement",
          name: "강사료 정산",
          icon: Wallet,
          href: "/management/settlement",
        },
      ],
    },
    {
      group: "학원 설정",
      items: [
        {
          id: "settings-base",
          name: "학원 정보/정책",
          icon: Settings,
          href: "/settings/base",
        },
        {
          id: "settings-users",
          name: "사용자/권한 관리",
          icon: UserCog,
          href: "/staff", // 기존 /staff 페이지를 사용자 관리 겸용으로 사용 (추후 통합)
        },
        {
          id: "rooms",
          name: "학사 설정(강의실)",
          icon: Building,
          href: "/academic/rooms",
        },
        {
          id: "settings-products",
          name: "재무 설정(상품/정책)",
          icon: ShoppingBag,
          href: "/settings/products",
        },
        {
          id: "settings-data",
          name: "데이터 관리 (Excel)",
          icon: Database,
          href: "/settings/data",
        },
      ],
    },
  ];

  // Role-based Menu Filtering
  const filteredMenuGroups = $derived(
    menuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const role = settings.data.currentUserRole;
          if (role === "director") return true;

          // 일반 직원
          if (role === "manager") {
            return ![
              "management-sales",
              "management-expenses",
              "management-settlement",
              "settings-base",
              "settings-products",
            ].includes(item.id);
          }

          // 강사
          if (role === "teacher") {
            return [
              "dashboard",
              "students",
              "consultations",
              "timetable",
              "classes",
              "attendance",
              "homework",
              "reports",
            ].includes(item.id);
          }

          // 셔틀 기사
          if (role === "driver") {
            return ["dashboard", "students"].includes(item.id);
          }

          return true;
        }),
      }))
      .filter((group) => group.items.length > 0),
  );

  let expandedGroups = $state<string[]>([]);
  let isSpotlightOpen = $state(false);
  let spotlightSearchTrigger = $state("");

  // Spotlight & History Core logic
  const allMenuItems = $derived(filteredMenuGroups.flatMap((g) => g.items));

  // Spotlight results calculation
  let spotlightResults = $derived(
    spotlightSearchTrigger === ""
      ? settings.data.history.map((h) => {
          const menu = allMenuItems.find((m) => m.id === h.id);
          return { ...h, isRecent: true, icon: menu?.icon };
        })
      : [
          ...allMenuItems
            .filter((i) => i.name.includes(spotlightSearchTrigger))
            .map((i) => {
              const group =
                filteredMenuGroups.find((g) =>
                  g.items.some((m) => m.id === i.id),
                )?.group || "메뉴";
              return { ...i, type: "menu" as const, group };
            }),
          ...settings.data.students
            .filter(
              (s) =>
                s.name.includes(spotlightSearchTrigger) ||
                s.studentPhone.endsWith(spotlightSearchTrigger) ||
                s.studentPhone
                  .replace(/-/g, "")
                  .endsWith(spotlightSearchTrigger),
            )
            .map((s) => ({
              id: s.id,
              name: s.name,
              type: "student" as const,
              href: `/students?id=${s.id}`,
            })),
        ],
  );

  // Auto-expand group of current page
  $effect(() => {
    const currentPath = page.url.pathname;
    untrack(() => {
      filteredMenuGroups.forEach((g) => {
        if (g.items.some((i) => i.href === currentPath)) {
          if (!expandedGroups.includes(g.group)) {
            expandedGroups = [...expandedGroups, g.group];
          }
        }
      });
    });
  });

  onMount(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        isSpotlightOpen = !isSpotlightOpen;
      }
      if (e.key === "Escape") {
        isSpotlightOpen = false;
        if (settings.data.uiState.isZenMode)
          settings.data.uiState.isZenMode = false;
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

  function toggleGroup(group: string) {
    if (expandedGroups.includes(group)) {
      expandedGroups = expandedGroups.filter((g) => g !== group);
    } else {
      expandedGroups = [...expandedGroups, group];
    }
  }

  function toggleFavorite(e: MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (settings.data.favorites.includes(id)) {
      settings.data.favorites = settings.data.favorites.filter((f) => f !== id);
    } else {
      settings.data.favorites = [...settings.data.favorites, id];
    }
  }

  // Smart History Tracking
  $effect(() => {
    const path = page.url.pathname;
    const search = page.url.searchParams;

    untrack(() => {
      let item: {
        id: string;
        name: string;
        href: string;
        type: "student" | "class" | "menu";
      } | null = null;

      if (path === "/students" && search.has("id")) {
        const id = search.get("id") || "";
        const student = settings.data.students.find((s) => s.id === id);
        if (student)
          item = {
            id,
            name: student.name,
            href: `/students?id=${id}`,
            type: "student",
          };
      } else if (path.startsWith("/academic/classes/") && path.length > 18) {
        const id = path.split("/").pop() || "";
        const cls = settings.data.classes.find((c) => c.id === id);
        if (cls) item = { id, name: cls.name, href: path, type: "class" };
      } else {
        const menu = allMenuItems.find(
          (m) => m.href === path && m.id !== "dashboard",
        );
        if (menu)
          item = {
            id: menu.id,
            name: menu.name,
            href: menu.href,
            type: "menu",
          };
      }

      if (item) {
        const currentItem = item;
        const newList = settings.data.history.filter(
          (h) => h.id !== currentItem.id,
        );
        newList.unshift({ ...currentItem, date: new Date().toISOString() });
        settings.data.history = newList.slice(0, 10);
      }
    });
  });
</script>

{#if !settings.data.isAuthenticated}
  <RoleSelection />
{:else}
  <div class="flex min-h-screen bg-[#f9fafb]">
    <!-- Sidebar (항시 노출) -->
    <aside
      class="w-[300px] bg-white border-r border-toss-grey-100 flex flex-col fixed h-full z-50 shadow-sm"
    >
      <div class="p-8 pb-4">
        <h1
          class="text-[24px] font-black tracking-tight text-toss-blue flex items-center justify-between"
        >
          <span class="flex items-center gap-2">
            STARWOOD
            <span
              class="text-[10px] bg-toss-blue-light px-2 py-0.5 rounded-full font-bold"
              >ERP</span
            >
          </span>
          <button
            onclick={() => (isSpotlightOpen = true)}
            class="w-10 h-10 flex items-center justify-center rounded-xl bg-toss-grey-100/50 text-toss-grey-300 hover:text-toss-blue hover:bg-toss-blue-light transition-all"
            title="검색 (Ctrl+K)"
          >
            <Command size={18} />
          </button>
        </h1>
      </div>

      <nav class="flex-1 px-4 py-4 space-y-6 overflow-y-auto scrollbar-hide">
        <!-- Favorites Section -->
        {#if settings.data.favorites.length > 0}
          <div class="space-y-1">
            <p
              class="px-4 py-2 text-[12px] font-black text-toss-grey-300 uppercase tracking-widest flex items-center gap-2"
            >
              <Star size={12} class="fill-yellow-400 text-yellow-400" /> 즐겨찾기
            </p>
            {#each settings.data.favorites as id}
              {@const item = allMenuItems.find((i) => i.id === id)}
              {#if item}
                {@const isActive = page.url.pathname === item.href}
                {@const Icon = item.icon}
                <a
                  href={item.href}
                  class="flex items-center group/fav justify-between px-4 py-3 rounded-2xl text-[14px] font-bold transition-all {isActive
                    ? 'bg-toss-blue-light text-toss-blue'
                    : 'text-toss-grey-500 hover:bg-toss-grey-50'}"
                >
                  <div class="flex items-center gap-3">
                    <Icon
                      size={20}
                      class={isActive
                        ? "text-toss-blue"
                        : "text-toss-grey-300 group-hover:text-toss-grey-500"}
                    />
                    {item.name}
                  </div>
                  <button
                    onclick={(e) => toggleFavorite(e, id)}
                    class="opacity-0 group-hover/fav:opacity-100 text-toss-grey-300 hover:text-red-400 transition-all p-1"
                  >
                    <X size={14} />
                  </button>
                </a>
              {/if}
            {/each}
          </div>
          <div class="h-[1px] bg-toss-grey-100 mx-4"></div>
        {/if}

        {#each filteredMenuGroups as group}
          <div class="space-y-1">
            {#if group.group !== "핵심"}
              <button
                onclick={() => toggleGroup(group.group)}
                class="w-full flex items-center justify-between px-4 py-2 text-[12px] font-black text-toss-grey-300 uppercase tracking-widest hover:text-toss-blue transition-colors group"
              >
                {group.group}
                <span
                  class="transition-transform duration-300 {expandedGroups.includes(
                    group.group,
                  )
                    ? 'rotate-180'
                    : ''}">▾</span
                >
              </button>
            {/if}

            {#if group.group === "핵심" || expandedGroups.includes(group.group)}
              <div>
                {#each group.items as item}
                  {@const isActive = page.url.pathname === item.href}
                  {@const Icon = item.icon}
                  {@const isFav = settings.data.favorites.includes(item.id)}
                  <a
                    href={item.href}
                    class="flex items-center justify-between px-4 py-3 rounded-2xl text-[14px] font-bold transition-all group {isActive
                      ? 'bg-toss-blue-light text-toss-blue'
                      : 'text-toss-grey-500 hover:bg-toss-grey-50'}"
                  >
                    <div class="flex items-center gap-3">
                      <Icon
                        size={20}
                        class={isActive
                          ? "text-toss-blue"
                          : "text-toss-grey-300 group-hover/fav:text-toss-grey-500"}
                      />
                      {item.name}
                    </div>
                    <button
                      onclick={(e) => toggleFavorite(e, item.id)}
                      class="opacity-0 group-hover:opacity-100 transition-all {isFav
                        ? 'text-yellow-400 opacity-100'
                        : 'text-toss-grey-200 hover:text-yellow-400'}"
                    >
                      <Star size={16} class={isFav ? "fill-yellow-400" : ""} />
                    </button>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </nav>

      <div class="mt-auto border-t border-toss-grey-50 overflow-hidden">
        <div class="p-6 pb-2">
          <div class="flex items-center gap-4 px-2">
            <div
              class="w-10 h-10 rounded-2xl bg-toss-blue/10 flex items-center justify-center text-toss-blue"
            >
              <UserCog size={20} />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[14px] font-black text-toss-grey-600 truncate">
                {settings.data.academy.director}
              </p>
              <p class="text-[11px] font-bold text-toss-grey-300">
                {settings.data.currentUserRole === "director"
                  ? "원장"
                  : settings.data.currentUserRole === "teacher"
                    ? "강사"
                    : settings.data.currentUserRole === "driver"
                      ? "기사"
                      : "직원"}
              </p>
            </div>
          </div>
        </div>
        <div class="p-6 pt-2 space-y-4">
          <button
            onclick={() => (settings.data.isAuthenticated = false)}
            class="w-full h-12 bg-toss-grey-50 text-toss-grey-400 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] hover:bg-red-50 hover:text-red-500 transition-all group"
          >
            <X
              size={14}
              class="mt-0.5 group-hover:rotate-90 transition-transform"
            />
            데모 로그아웃 (역할 변경)
          </button>
          <div class="p-4 bg-toss-grey-100 rounded-2xl">
            <p class="text-[12px] font-bold text-toss-grey-500">
              V2.0.7 Role Ready
            </p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 ml-[300px] flex flex-col min-h-screen relative">
      <!-- 상단 GNB -->
      {#if !settings.data.uiState.isZenMode}
        <header
          class="h-20 bg-white/80 backdrop-blur-md border-b border-toss-grey-100 flex items-center justify-between px-10 sticky top-0 z-40"
        >
          <div class="flex items-center gap-4">
            <span class="text-[14px] font-bold text-toss-grey-300">경로</span>
            <ChevronRight size={14} class="text-toss-grey-200" />
            <span class="text-[16px] font-black text-toss-grey-600">
              {allMenuItems.find((i) => i.href === page.url.pathname)?.name ||
                "페이지"}
            </span>
          </div>

          <!-- Page Specific Stats (Center) -->
          <div
            class="absolute left-1/2 -translate-x-1/2 flex items-center gap-6"
          >
            {#if page.url.pathname === "/students"}
              <div
                class="flex items-center gap-3 px-4 h-12 bg-toss-blue-light/30 rounded-2xl"
              >
                <Users size={18} class="text-toss-blue" />
                <span class="text-[14px] font-black text-toss-blue"
                  >재원생 {settings.data.students.filter(
                    (s) => s.status === "재원",
                  ).length}명</span
                >
              </div>
              <div
                class="flex items-center gap-3 px-4 h-12 bg-red-50 rounded-2xl"
              >
                <AlertCircle size={18} class="text-red-500" />
                <span class="text-[14px] font-black text-red-500"
                  >미납 ₩{settings.data.students
                    .reduce((acc, s) => acc + (s.unpaid || 0), 0)
                    .toLocaleString()}</span
                >
              </div>
            {:else if page.url.pathname === "/staff"}
              <div
                class="flex items-center gap-3 px-4 h-12 bg-toss-blue-light/30 rounded-2xl"
              >
                <GraduationCap size={18} class="text-toss-blue" />
                <span class="text-[14px] font-black text-toss-blue"
                  >교수진 {settings.data.teachers.length}명</span
                >
              </div>
              <div
                class="flex items-center gap-3 px-4 h-12 bg-purple-50 rounded-2xl"
              >
                <Bus size={18} class="text-purple-500" />
                <span class="text-[14px] font-black text-purple-500"
                  >셔틀 {settings.data.shuttleDrivers.length}명</span
                >
              </div>
              <div
                class="flex items-center gap-3 px-4 h-12 bg-green-50 rounded-2xl"
              >
                <Users2 size={18} class="text-green-600" />
                <span class="text-[14px] font-black text-green-600"
                  >행정 {settings.data.generalStaff.length}명</span
                >
              </div>
            {:else if page.url.pathname === "/students/consultations"}
              <div
                class="flex items-center gap-3 px-4 h-12 bg-toss-blue-light/30 rounded-2xl"
              >
                <div class="w-2 h-2 rounded-full bg-toss-blue"></div>
                <span class="text-[14px] font-black text-toss-blue"
                  >신규 {settings.data.consultations.filter(
                    (c) => c.stage === "new",
                  ).length}건</span
                >
              </div>
              <div
                class="flex items-center gap-3 px-4 h-12 bg-orange-50 rounded-2xl"
              >
                <div class="w-2 h-2 rounded-full bg-orange-400"></div>
                <span class="text-[14px] font-black text-orange-500"
                  >진행 {settings.data.consultations.filter(
                    (c) => c.stage === "consulting",
                  ).length}건</span
                >
              </div>
              <div
                class="flex items-center gap-3 px-4 h-12 bg-green-50 rounded-2xl"
              >
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span class="text-[14px] font-black text-green-600"
                  >입학대기 {settings.data.students.filter(
                    (s) => s.status === "대기",
                  ).length}명</span
                >
              </div>
            {/if}
          </div>

          <div class="flex items-center gap-6">
            <!-- Smart History Icons -->
            <div
              class="flex items-center gap-2 border-r border-toss-grey-100 pr-6 mr-2"
            >
              {#each settings.data.history.slice(0, 3) as hist}
                <a
                  href={hist.href}
                  class="w-10 h-10 rounded-xl flex items-center justify-center transition-all {hist.type ===
                  'student'
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-toss-blue-light text-toss-blue hover:bg-toss-blue-light/80'}"
                  title={hist.name}
                >
                  {#if hist.type === "student"}
                    <Users size={18} />
                  {:else if hist.type === "class"}
                    <GraduationCap size={18} />
                  {:else}
                    <History size={18} />
                  {/if}
                </a>
              {/each}
            </div>

            <button
              class="w-10 h-10 rounded-xl bg-toss-grey-100 flex items-center justify-center text-toss-grey-400 hover:text-toss-blue transition-all relative"
            >
              <MessageSquare size={20} />
              <span
                class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"
              ></span>
            </button>

            <div
              class="flex items-center gap-3 pl-4 border-l border-toss-grey-100"
            >
              <div class="text-right">
                <p class="text-[14px] font-black text-toss-grey-600">
                  {settings.data.academy.director || "원장님"}
                </p>
                <p
                  class="text-[11px] font-bold text-toss-grey-300 uppercase tracking-tighter"
                >
                  {settings.data.currentUserRole}
                </p>
              </div>
              <div
                class="w-10 h-10 rounded-2xl bg-toss-blue flex items-center justify-center text-white font-black shadow-lg shadow-toss-blue/20"
              >
                {(settings.data.academy.director || "원")[0]}
              </div>
            </div>
          </div>
        </header>
      {/if}

      <!-- Page View Area -->
      <main
        class="{settings.data.uiState.isZenMode
          ? 'p-0'
          : 'p-6 lg:p-10'} pb-20 overflow-x-hidden flex-1 contain-paint"
      >
        {@render children()}
      </main>
    </div>

    <!-- Spotlight Modal -->
    {#if isSpotlightOpen}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-start justify-center pt-[15vh] px-4"
        onclick={() => (isSpotlightOpen = false)}
        transition:fade={{ duration: 200 }}
      >
        <div
          class="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-toss-grey-100"
          onclick={(e) => e.stopPropagation()}
          transition:fly={{ y: -20, duration: 300 }}
        >
          <div
            class="p-6 border-b border-toss-grey-100 flex items-center gap-4 bg-toss-grey-50/50"
          >
            <Search size={22} class="text-toss-blue" />
            <input
              type="text"
              bind:value={spotlightSearchTrigger}
              placeholder="이름, 메뉴, 번호 뒷자리 검색 (Ctrl+K)"
              class="flex-1 bg-transparent border-none outline-none text-[18px] font-bold text-toss-grey-600 placeholder:text-toss-grey-300"
            />
            <div
              class="px-2 py-1 bg-white border border-toss-grey-200 rounded-lg text-[10px] font-black text-toss-grey-400 shadow-sm"
            >
              ESC
            </div>
          </div>

          <div class="max-h-[500px] overflow-y-auto p-4 space-y-2">
            {#if spotlightSearchTrigger === ""}
              <div class="p-10 text-center space-y-4">
                <div
                  class="w-16 h-16 bg-toss-blue-light text-toss-blue rounded-3xl flex items-center justify-center mx-auto"
                >
                  <Command size={32} />
                </div>
                <div>
                  <p class="text-[18px] font-black text-toss-grey-600">
                    무엇이든 검색하세요
                  </p>
                  <p class="text-[14px] font-bold text-toss-grey-300 mt-1">
                    학생, 메뉴, 반 등 학원 내 모든 정보에 즉시 접근합니다.
                  </p>
                </div>
              </div>
            {:else if spotlightResults.length === 0}
              <div class="p-12 text-center text-toss-grey-300 font-bold">
                검색 결과가 없습니다.
              </div>
            {:else}
              {#each spotlightResults as res}
                <a
                  href={res.href}
                  onclick={() => (isSpotlightOpen = false)}
                  class="flex items-center justify-between p-4 rounded-2xl hover:bg-toss-blue/5 transition-all group"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center {res.type ===
                      'menu'
                        ? 'bg-toss-blue-light text-toss-blue'
                        : 'bg-green-50 text-green-600'}"
                    >
                      {#if res.type === "menu" && "icon" in res}
                        <!-- svelte-ignore svelte_component_deprecated -->
                        <svelte:component this={res.icon as any} size={20} />
                      {:else}
                        <Users size={20} />
                      {/if}
                    </div>
                    <div>
                      <p
                        class="text-[16px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors"
                      >
                        {res.name}
                        {#if "isRecent" in res}
                          <span
                            class="ml-2 text-[10px] bg-toss-grey-100 text-toss-grey-400 px-1.5 py-0.5 rounded uppercase"
                            >최근</span
                          >
                        {/if}
                      </p>
                      <p class="text-[12px] font-bold text-toss-grey-300">
                        {res.type === "menu"
                          ? `${(res as any).group} 바로가기`
                          : res.type === "student"
                            ? "원생 정보"
                            : "클래스 정보"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    class="text-toss-grey-200 group-hover:text-toss-blue transition-all"
                  />
                </a>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <Toast />
  </div>
{/if}

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
