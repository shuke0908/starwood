<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import {
    Users2,
    Search,
    Plus,
    Phone,
    Mail,
    Calendar,
    Award,
    Briefcase,
    GraduationCap,
    Bus,
    Star,
    UserCheck,
    Timer,
    FileText,
    ChevronRight,
    X,
    Trash2,
    Save,
    User,
    Wallet,
    Calculator,
  } from "lucide-svelte";
  import { fade, fly, slide } from "svelte/transition";
  import Drawer from "$lib/components/Drawer.svelte";
  import Tabs from "$lib/components/Tabs.svelte";
  import { getDiff } from "$lib/logic";
  import { toast } from "$lib/stores/toast.svelte";

  let activeTab = $state<"teachers" | "drivers" | "staff">("teachers");
  let searchQuery = $state("");
  let isDrawerOpen = $state(false);
  let selectedItemId = $state<string | null>(null);
  let drawerTab = $state("info");
  let editingItem = $state<any>(null);
  let isClassModalOpen = $state(false);
  let classSearchQuery = $state("");

  // 실시간 예상 급여 계산
  const estimatedSalaryData = $derived.by(() => {
    if (!editingItem || activeTab !== "teachers")
      return { total: 0, breakdown: [] };

    const policy = settings.data.salaryPolicies.find(
      (p) => p.id === editingItem.salaryPolicyId,
    );
    if (!policy)
      return {
        total: editingItem.salary || 0,
        breakdown: ["정책 미지정 (수동 입력)"],
      };

    let base = policy.baseValue;
    let totalStudents = 0;
    let weeklyHours = 0;
    let totalMonthlyRevenue = 0;
    let breakdown: string[] = [];

    // 담당 클래스 정보 분석
    (editingItem.assignedClassIds || []).forEach((id: string) => {
      const cls = settings.data.classes.find((c) => c.id === id);
      if (cls) {
        const studentCount = (cls.studentIds || []).length;
        totalStudents += studentCount;
        totalMonthlyRevenue += (cls.fee || 0) * studentCount;

        // 시간 계산
        if (cls.time && cls.time.includes("-")) {
          const [start, end] = cls.time.split("-");
          const [sH, sM] = start.split(":").map(Number);
          const [eH, eM] = end.split(":").map(Number);
          const durationMinutes = eH * 60 + eM - (sH * 60 + sM);
          const hours = durationMinutes / 60;
          weeklyHours += hours * (cls.day?.length || 0);
        } else if (cls.duration) {
          weeklyHours += (cls.duration / 60) * (cls.day?.length || 0);
        }
      }
    });

    let bonus = 0;
    policy.conditions.forEach((cond) => {
      if (cond.type === "student_count" && totalStudents >= cond.threshold) {
        if (cond.rewardType === "bonus_amount") bonus += cond.rewardValue;
        else if (cond.rewardType === "bonus_percent")
          bonus += (base * cond.rewardValue) / 100;
      }
      // 매출 기반 보너스 등 추가 가능
    });

    let total = 0;
    if (policy.type === "fixed") {
      total = base + bonus;
      breakdown.push(`기본급: ${fmt(base)}원`);
    } else if (policy.type === "hourly") {
      total = base * weeklyHours * 4 + bonus; // 월 4주 기준
      breakdown.push(
        `시급: ${fmt(base)}원 x 주 ${weeklyHours.toFixed(1)}시간 x 4주`,
      );
    } else if (policy.type === "perStudent") {
      total = base * totalStudents + bonus;
      breakdown.push(`인원당: ${fmt(base)}원 x ${totalStudents}명`);
    } else if (policy.type === "ratio" || policy.type === "equity") {
      total = totalMonthlyRevenue * (base / 100) + bonus;
      breakdown.push(`매출: ${fmt(totalMonthlyRevenue)}원 x 배분율 ${base}%`);
    }

    if (bonus > 0) breakdown.push(`추가 수당: +${fmt(bonus)}원`);

    return { total: Math.round(total), breakdown };
  });

  const estimatedSalary = $derived(estimatedSalaryData.total);

  const filteredTeachers = $derived(
    settings.data.teachers.filter(
      (t) =>
        (t.name || "").includes(searchQuery) ||
        (t.majors || []).some((m) => m.includes(searchQuery)) ||
        (t.subjects || []).some((s) => s.includes(searchQuery)),
    ),
  );

  const filteredDrivers = $derived(
    settings.data.shuttleDrivers.filter(
      (d) => d.name.includes(searchQuery) || d.phone.includes(searchQuery),
    ),
  );

  const filteredStaff = $derived(
    settings.data.generalStaff.filter(
      (s) => s.name.includes(searchQuery) || s.role.includes(searchQuery),
    ),
  );

  const selectedItem = $derived.by(() => {
    if (!selectedItemId) return null;
    if (activeTab === "teachers")
      return settings.data.teachers.find((t) => t.id === selectedItemId);
    if (activeTab === "drivers")
      return settings.data.shuttleDrivers.find((d) => d.id === selectedItemId);
    return settings.data.generalStaff.find((s) => s.id === selectedItemId);
  });

  function toggleHoliday() {
    if (selectedItem) {
      selectedItem.isOnHoliday = !selectedItem.isOnHoliday;
    }
  }

  function openDetail(id: string) {
    selectedItemId = id;
    const item =
      activeTab === "teachers"
        ? settings.data.teachers.find((t) => t.id === id)
        : activeTab === "drivers"
          ? settings.data.shuttleDrivers.find((d) => d.id === id)
          : settings.data.generalStaff.find((s) => s.id === id);
    if (item) {
      editingItem = JSON.parse(JSON.stringify(item));
    }
    isDrawerOpen = true;
    drawerTab = "info";
  }

  function saveItem() {
    if (!editingItem) return;

    let targetArray: any[];
    let labels: Record<string, string> = {
      name: "이름",
      phone: "연락처",
      salary: "급여",
      role: "역할",
      email: "이메일",
      isOnHoliday: "휴가 상태",
      status: "재직 상태",
      memo: "메모",
      joinDate: "입사일",
      vehiclePlate: "차량번호",
      assignedClassIds: "배정 클래스 IDs",
      majors: "전공",
      subjects: "담당 과목",
    };

    if (activeTab === "teachers") {
      targetArray = settings.data.teachers;
    } else if (activeTab === "drivers") {
      targetArray = settings.data.shuttleDrivers;
    } else {
      targetArray = settings.data.generalStaff;
    }

    const idx = targetArray.findIndex((i) => i.id === editingItem.id);
    if (idx !== -1) {
      const original = targetArray[idx];
      const diff = getDiff(original, editingItem, labels);

      if (diff.length === 0) {
        toast.show("변경된 내용이 없습니다.", "info");
        isDrawerOpen = false;
        return;
      }

      // Sync class teacherIds
      if (activeTab === "teachers") {
        const originalClassIds = original.assignedClassIds || [];
        const newClassIds = editingItem.assignedClassIds || [];

        // 제거된 클래스들에서 강사 정보 삭제
        originalClassIds.forEach((id: string) => {
          if (!newClassIds.includes(id)) {
            const cls = settings.data.classes.find((c) => c.id === id);
            if (cls && cls.teacherId === editingItem.id) {
              cls.teacherId = "";
            }
          }
        });

        // 추가된 클래스들에 강사 정보 설정
        newClassIds.forEach((id: string) => {
          const cls = settings.data.classes.find((c) => c.id === id);
          if (cls) {
            cls.teacherId = editingItem.id;
          }
        });
      }

      targetArray[idx] = { ...targetArray[idx], ...editingItem };
      toast.show("직원 정보 수정 완료", "success", diff.join("\n"));
    }

    isDrawerOpen = false;
  }

  const fmt = (val?: number) => (val ? val.toLocaleString() : "0");
</script>

<div class="space-y-8 pb-10">
  <!-- Header: Search & Tab Actions -->
  <div class="flex gap-6 items-center justify-between">
    <div class="flex gap-6 items-center flex-1">
      <div class="relative w-[500px] group flex items-center">
        <Search
          class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
          size={24}
        />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="성함, 담당, 연락처 등으로 검색하세요"
          class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md"
        />
      </div>

      <div
        class="bg-toss-grey-50 p-1.5 rounded-[24px] flex border border-toss-grey-100/50 shadow-inner"
      >
        <button
          onclick={() => (activeTab = "teachers")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab ===
          'teachers'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}"
          >교수진(강사)</button
        >
        <button
          onclick={() => (activeTab = "drivers")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab ===
          'drivers'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}"
          >운전원(셔틀)</button
        >
        <button
          onclick={() => (activeTab = "staff")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab ===
          'staff'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}">일반 직원</button
        >
      </div>
    </div>

    <button
      class="toss-btn-primary flex items-center gap-2 px-8 h-[64px] rounded-[24px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
    >
      <Plus size={22} class="stroke-[3]" />
      {#if activeTab === "teachers"}강사 임명{:else if activeTab === "drivers"}기사
        등록{:else}직원 등록{/if}
    </button>
  </div>

  <!-- Data Table Area -->
  <div
    class="bg-white rounded-[40px] border border-toss-grey-50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)] relative"
  >
    <div class="overflow-x-auto flex-1 custom-scroll">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead
          class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10"
        >
          <tr
            class="text-[12px] font-black text-toss-grey-400 uppercase tracking-tight"
          >
            {#if activeTab === "teachers"}
              <th class="p-6 pl-10">성명 / 담당(전공)</th>
              <th class="p-6">연락처</th>
              <th class="p-6">수강 클래스</th>
              <th class="p-6">메모</th>
              <th class="p-6">급여</th>
              <th class="p-6">입사일</th>
              <th class="p-6 text-center">상태</th>
              <th class="p-6 text-right pr-10">관리</th>
            {:else if activeTab === "drivers"}
              <th class="p-6 pl-10">성명 / 차량번호</th>
              <th class="p-6">연락처</th>
              <th class="p-6">메모</th>
              <th class="p-6 text-right">급여</th>
              <th class="p-6">입사일</th>
              <th class="p-6 text-center">상태</th>
              <th class="p-6 text-right pr-10">관리</th>
            {:else}
              <th class="p-6 pl-10">성명 / 담당</th>
              <th class="p-6">연락처</th>
              <th class="p-6">메모</th>
              <th class="p-6 text-right">급여</th>
              <th class="p-6">입사일</th>
              <th class="p-6 text-center">상태</th>
              <th class="p-6 text-right pr-10">관리</th>
            {/if}
          </tr>
        </thead>
        <tbody class="divide-y divide-toss-grey-50/50">
          {#if activeTab === "teachers"}
            {#each filteredTeachers as t}
              <tr
                onclick={() => openDetail(t.id)}
                class="hover:bg-toss-blue-light/15 cursor-pointer group transition-all"
                style="height: 84px"
              >
                <td class="p-6 pl-10">
                  <div>
                    <p
                      class="text-[16px] font-black text-toss-grey-700 leading-tight group-hover:text-toss-blue transition-colors"
                    >
                      {t.name}
                    </p>
                    <p class="text-[12px] font-bold text-toss-blue mt-1">
                      {t.subjects?.join(", ") || "담당 미정"}
                      <span class="text-toss-grey-200 ml-1"
                        >({t.majors?.join(", ")})</span
                      >
                    </p>
                  </div>
                </td>
                <td class="p-6 font-bold text-toss-grey-400 text-[14px]"
                  >{t.phone}</td
                >
                <td class="p-6">
                  <div class="flex flex-wrap gap-1 max-w-[250px]">
                    {#if t.assignedClassIds && t.assignedClassIds.length > 0}
                      {#each t.assignedClassIds as cid}
                        {@const cls = settings.data.classes.find(
                          (c) => c.id === cid,
                        )}
                        <span
                          class="px-2 py-0.5 rounded-md bg-toss-blue-light/50 border border-toss-blue/10 text-[11px] font-black text-toss-blue"
                          >{cls?.name || cid}</span
                        >
                      {/each}
                    {:else}
                      <span class="text-[13px] font-medium text-toss-grey-200"
                        >배정 클래스 없음</span
                      >
                    {/if}
                  </div>
                </td>
                <td
                  class="p-6 font-medium text-toss-grey-400 text-[13px] truncate max-w-[150px]"
                  >{t.memo || "-"}</td
                >
                <td class="p-6 font-bold text-toss-grey-600"
                  >₩{fmt(t.salary)}</td
                >
                <td class="p-6 font-bold text-toss-grey-400"
                  >{t.joinDate || "2023.01.01"}</td
                >
                <td class="p-6 text-center">
                  <div class="flex items-center justify-center gap-2">
                    {#if t.status === "휴가"}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-600 border border-orange-100"
                        >휴가 중</span
                      >
                    {:else if t.status === "퇴직"}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-red-50 text-red-600 border border-red-100"
                        >퇴사</span
                      >
                    {:else}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-green-50 text-green-600 border border-green-100"
                        >재직 중</span
                      >
                    {/if}
                  </div>
                </td>
                <td class="p-6 text-right pr-10">
                  <button
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            {/each}
          {:else if activeTab === "drivers"}
            {#each filteredDrivers as d}
              <tr
                onclick={() => openDetail(d.id)}
                class="hover:bg-toss-blue-light/15 cursor-pointer group transition-all"
                style="height: 84px"
              >
                <td class="p-6 pl-10">
                  <div>
                    <p
                      class="text-[16px] font-black text-toss-grey-700 group-hover:text-toss-blue transition-colors"
                    >
                      {d.name}
                    </p>
                    <p class="text-[12px] font-bold text-orange-500 mt-1">
                      {d.vehiclePlate || "차량 미등록"}
                    </p>
                  </div>
                </td>
                <td class="p-6 font-bold text-toss-grey-400">{d.phone}</td>
                <td
                  class="p-6 font-medium text-toss-grey-400 text-[13px] truncate max-w-[200px]"
                  >{(d as any).memo || "-"}</td
                >
                <td class="p-6 text-right font-bold text-toss-grey-600"
                  >₩{fmt(d.salary || 0)}</td
                >
                <td class="p-6 font-bold text-toss-grey-400">{d.joinDate}</td>
                <td class="p-6 text-center">
                  <div class="flex items-center justify-center gap-2">
                    {#if d.status === "휴가" || d.isOnHoliday}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-600 border border-orange-100"
                        >휴가 중</span
                      >
                    {:else if d.status === "퇴직"}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-red-50 text-red-600 border border-red-100"
                        >퇴사</span
                      >
                    {:else}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-green-50 text-green-600 border border-green-100"
                        >재직 중</span
                      >
                    {/if}
                  </div>
                </td>
                <td class="p-6 text-right pr-10">
                  <button
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            {/each}
          {:else}
            {#each filteredStaff as s}
              <tr
                onclick={() => openDetail(s.id)}
                class="hover:bg-toss-blue-light/15 cursor-pointer group transition-all"
                style="height: 84px"
              >
                <td class="p-6 pl-10">
                  <div>
                    <p
                      class="text-[16px] font-black text-toss-grey-700 leading-tight group-hover:text-toss-blue transition-colors"
                    >
                      {s.name}
                    </p>
                    <p class="text-[12px] font-bold text-green-600 mt-1">
                      {s.role}
                    </p>
                  </div>
                </td>
                <td class="p-6 font-bold text-toss-grey-400">{s.phone}</td>
                <td
                  class="p-6 font-medium text-toss-grey-400 text-[13px] truncate max-w-[200px]"
                  >{(s as any).memo || "-"}</td
                >
                <td class="p-6 text-right font-bold text-toss-grey-600"
                  >₩{fmt(s.salary || 0)}</td
                >
                <td class="p-6 font-bold text-toss-grey-400">{s.joinDate}</td>
                <td class="p-6 text-center">
                  <div class="flex items-center justify-center gap-2">
                    {#if s.status === "휴가" || s.isOnHoliday}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-600 border border-orange-100"
                        >휴가 중</span
                      >
                    {:else if s.status === "퇴직"}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-red-50 text-red-600 border border-red-100"
                        >퇴사</span
                      >
                    {:else}
                      <span
                        class="px-3 py-1.5 rounded-full text-[11px] font-black bg-green-50 text-green-600 border border-green-100"
                        >재직 중</span
                      >
                    {/if}
                  </div>
                </td>
                <td class="p-6 text-right pr-10">
                  <button
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<Drawer
  bind:isOpen={isDrawerOpen}
  title={(selectedItem?.name ?? "") + " 직원 상세 정보"}
  width="620px"
>
  {#if selectedItem}
    <div class="space-y-8 pr-2 pb-20" in:fade>
      <!-- Quick Stats & Status -->
      <section class="grid grid-cols-2 gap-4">
        <div
          class="p-6 bg-toss-blue-light/20 rounded-[32px] space-y-2 border border-toss-blue/5"
        >
          <label
            for="staff-status-edit"
            class="text-[11px] font-black text-toss-blue uppercase tracking-widest pl-1"
            >재직 상태</label
          >
          <select
            id="staff-status-edit"
            bind:value={editingItem.status}
            class="w-full bg-transparent border-none font-black text-toss-blue text-[20px] outline-none cursor-pointer"
          >
            <option value="재직">재직 중</option>
            <option value="휴가">휴원/휴가</option>
            <option value="퇴직">퇴직</option>
          </select>
        </div>
        <div
          class="p-6 bg-toss-grey-50 rounded-[32px] space-y-2 border border-toss-grey-100/50"
        >
          <label
            for="staff-salary-edit"
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
            >월 급여 (₩)</label
          >
          <input
            id="staff-salary-edit"
            type="number"
            bind:value={editingItem.salary}
            class="w-full bg-transparent border-none font-black text-toss-grey-600 text-[20px] outline-none"
          />
        </div>
      </section>

      <!-- Basic Info -->
      <section class="space-y-4">
        <h4
          class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest flex items-center gap-2 pl-1"
        >
          <User size={16} class="text-toss-blue" /> 기본 정보
        </h4>
        <div
          class="bg-white border border-toss-grey-100 rounded-[32px] overflow-hidden divide-y divide-toss-grey-50"
        >
          <div class="p-6 flex justify-between items-center">
            <label for="staff-name" class="font-bold text-toss-grey-400"
              >성함</label
            >
            <input
              id="staff-name"
              bind:value={editingItem.name}
              class="text-right font-black text-toss-grey-700 text-[17px] bg-transparent border-none outline-none"
            />
          </div>
          <div class="p-6 flex justify-between items-center">
            <label for="staff-phone" class="font-bold text-toss-grey-400"
              >연락처</label
            >
            <input
              id="staff-phone"
              bind:value={editingItem.phone}
              class="text-right font-black text-toss-blue text-[17px] bg-transparent border-none outline-none"
            />
          </div>
          <div class="p-6 flex justify-between items-center">
            <label for="staff-joindate" class="font-bold text-toss-grey-400"
              >입사일</label
            >
            <input
              id="staff-joindate"
              type="date"
              bind:value={editingItem.joinDate}
              class="text-right font-black text-toss-grey-600 text-[17px] bg-transparent border-none outline-none"
            />
          </div>
          {#if activeTab === "staff"}
            <div class="p-6 flex justify-between items-center">
              <label for="staff-role" class="font-bold text-toss-grey-400"
                >직위/역할</label
              >
              <input
                id="staff-role"
                bind:value={editingItem.role}
                class="text-right font-black text-green-600 text-[17px] bg-transparent border-none outline-none"
              />
            </div>
          {/if}
          {#if activeTab === "drivers"}
            <div class="p-6 flex justify-between items-center">
              <label for="staff-plate" class="font-bold text-toss-grey-400"
                >차량번호</label
              >
              <input
                id="staff-plate"
                bind:value={editingItem.vehiclePlate}
                class="text-right font-black text-orange-600 text-[17px] bg-transparent border-none outline-none"
              />
            </div>
          {/if}
        </div>
      </section>

      <!-- Salary Policy -->
      <section class="space-y-4">
        <h4
          class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest flex items-center gap-2 pl-1"
        >
          <Wallet size={16} class="text-toss-blue" /> 급여/정산 정책
        </h4>
        <div
          class="bg-white border border-toss-grey-100 rounded-[32px] overflow-hidden divide-y divide-toss-grey-50"
        >
          <div class="p-6 space-y-3">
            <label
              for="staff-salary-policy"
              class="text-[12px] font-black text-toss-grey-300 uppercase pl-1"
              >적용 정책 선택</label
            >
            <select
              id="staff-salary-policy"
              bind:value={editingItem.salaryPolicyId}
              onchange={() => {
                const policy = settings.data.salaryPolicies.find(
                  (p) => p.id === editingItem.salaryPolicyId,
                );
                if (policy) {
                  editingItem.settlementType = policy.type;
                  editingItem.settlementValue = policy.baseValue;
                  // salary 필드는 자동 업데이트하지 않음 (사용자 요청 반영)
                }
              }}
              class="w-full h-14 bg-toss-grey-50 border-none rounded-2xl px-5 font-bold text-toss-grey-700 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all appearance-none"
            >
              <option value="">정책 미지정 (수동 입력)</option>
              {#each settings.data.salaryPolicies as policy}
                <option value={policy.id}>{policy.name}</option>
              {/each}
            </select>
          </div>

          <div class="p-6 grid grid-cols-2 gap-6 bg-toss-grey-25/50">
            <div class="space-y-2">
              <span
                class="text-[11px] font-black text-toss-grey-300 uppercase pl-1"
                >정산 방식</span
              >
              <div
                class="h-12 flex items-center px-4 bg-white rounded-xl border border-toss-grey-100 font-bold text-toss-grey-600 text-[14px]"
              >
                {editingItem.settlementType || "미설정"}
              </div>
            </div>
            <div class="space-y-2">
              <span
                class="text-[11px] font-black text-toss-grey-300 uppercase pl-1"
                >정산 기준값</span
              >
              <div
                class="h-12 flex items-center px-4 bg-white rounded-xl border border-toss-grey-100 font-bold text-toss-blue text-[14px]"
              >
                {fmt(
                  editingItem.settlementValue,
                )}{editingItem.settlementType === "ratio" ||
                editingItem.settlementType === "equity"
                  ? "%"
                  : "원"}
              </div>
            </div>
          </div>
        </div>

        <!-- 예상 급여 미리보기 -->
        {#if editingItem?.salaryPolicyId}
          <div
            transition:slide
            class="p-6 bg-toss-blue/5 rounded-[24px] border border-toss-blue/10 space-y-4"
          >
            <div class="flex justify-between items-end">
              <div class="space-y-1">
                <span
                  class="text-[13px] font-bold text-toss-blue/70 flex items-center gap-1"
                >
                  <Calculator size={14} /> 정책 기반 예상 월급
                </span>
                <div class="flex flex-col gap-0.5">
                  {#each estimatedSalaryData.breakdown as line}
                    <span class="text-[11px] text-toss-blue/60 font-medium"
                      >{line}</span
                    >
                  {/each}
                </div>
              </div>
              <span class="text-[22px] font-black text-toss-blue"
                >{fmt(estimatedSalary)}원</span
              >
            </div>

            <button
              onclick={() => {
                if (editingItem) editingItem.salary = estimatedSalary;
              }}
              class="w-full h-12 bg-white border border-toss-blue/20 rounded-2xl text-[13px] font-black text-toss-blue hover:bg-toss-blue hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Save size={16} /> 나타난 금액을 실제 급여로 적용하기
            </button>
          </div>
        {/if}
      </section>

      {#if activeTab === "teachers"}
        <section class="space-y-4">
          <h4
            class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest flex items-center gap-2 pl-1"
          >
            <GraduationCap size={16} class="text-toss-blue" /> 담당 및 전공
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div
              class="p-5 bg-white border border-toss-grey-100 rounded-2xl space-y-2"
            >
              <label
                for="staff-majors"
                class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest block"
                >전공</label
              >
              <input
                id="staff-majors"
                value={editingItem.majors?.join(", ")}
                oninput={(e) =>
                  (editingItem.majors = e.currentTarget.value
                    .split(",")
                    .map((s) => s.trim()))}
                class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-bold text-toss-grey-600 outline-none text-[14px]"
                placeholder="컴퓨터공학, 교육학 등"
              />
            </div>
            <div
              class="p-5 bg-white border border-toss-grey-100 rounded-2xl space-y-2"
            >
              <label
                for="staff-subjects"
                class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest block"
                >담당 과목</label
              >
              <input
                id="staff-subjects"
                value={editingItem.subjects?.join(", ")}
                oninput={(e) =>
                  (editingItem.subjects = e.currentTarget.value
                    .split(",")
                    .map((s) => s.trim()))}
                class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-bold text-toss-grey-600 outline-none text-[14px]"
                placeholder="수학, 영어 등"
              />
            </div>
          </div>

          <div
            class="p-6 bg-toss-grey-25 border border-toss-grey-100 rounded-[32px] space-y-4"
          >
            <div class="flex justify-between items-center">
              <label
                class="text-[13px] font-black text-toss-grey-400 flex items-center gap-2"
              >
                <Briefcase size={16} /> 배정 클래스
              </label>
              <button
                onclick={() => (isClassModalOpen = true)}
                class="text-[12px] font-black text-toss-blue bg-white px-3 py-1.5 rounded-xl border border-toss-grey-100 shadow-sm hover:bg-toss-blue hover:text-white transition-all"
              >
                수업 추가/변경
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              {#if (editingItem.assignedClassIds || []).length === 0}
                <p class="text-[13px] text-toss-grey-300 font-medium pl-1 py-2">
                  배정된 수업이 없습니다.
                </p>
              {:else}
                {#each editingItem.assignedClassIds as classId}
                  {@const cls = settings.data.classes.find(
                    (c) => c.id === classId,
                  )}
                  {#if cls}
                    <div
                      class="bg-white px-4 py-2.5 rounded-2xl border border-toss-grey-100 flex items-center gap-2 shadow-sm group"
                    >
                      <span class="text-[14px] font-bold text-toss-grey-600"
                        >{cls.name}</span
                      >
                      <button
                        onclick={() => {
                          editingItem.assignedClassIds =
                            editingItem.assignedClassIds.filter(
                              (id: string) => id !== classId,
                            );
                        }}
                        class="text-toss-grey-300 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  {/if}
                {/each}
              {/if}
            </div>
          </div>
        </section>
      {/if}

      <!-- Memo -->
      <section class="space-y-4">
        <h4
          class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest flex items-center gap-2 pl-1"
        >
          <FileText size={16} class="text-toss-blue" /> 관리 메모
        </h4>
        <textarea
          bind:value={editingItem.memo}
          class="w-full bg-white border border-toss-grey-100 p-6 rounded-[32px] font-medium text-toss-grey-600 outline-none focus:ring-8 focus:ring-toss-blue/5 min-h-[150px] resize-none text-[15px] leading-relaxed"
          placeholder="직원 특이사항, 상담 이력 등을 자유롭게 입력하세요."
        ></textarea>
      </section>

      <footer class="pt-10 border-t border-toss-grey-50 flex gap-4">
        <button
          onclick={() => (isDrawerOpen = false)}
          class="h-16 w-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={saveItem}
          class="flex-1 h-16 bg-toss-blue text-white rounded-3xl font-black text-[18px] hover:bg-black transition-all shadow-xl shadow-toss-blue/20"
        >
          저장하기
        </button>
      </footer>
    </div>
  {/if}
</Drawer>

<!-- 클래스 선택 모달 -->
{#if isClassModalOpen}
  <div
    transition:fade={{ duration: 200 }}
    class="fixed inset-0 z-[100] flex items-center justify-start p-6 pl-10 bg-black/40 backdrop-blur-sm"
  >
    <div
      transition:fly={{ x: -100, duration: 400 }}
      class="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <header
        class="p-8 border-b border-toss-grey-50 flex justify-between items-center bg-toss-grey-25"
      >
        <div>
          <h3 class="text-[22px] font-black text-toss-grey-800">
            배정 클래스 선택
          </h3>
          <p class="text-[14px] text-toss-grey-400 font-medium mt-1">
            이 강사가 담당할 반을 목록에서 선택하세요.
          </p>
        </div>
        <button
          onclick={() => (isClassModalOpen = false)}
          class="w-12 h-12 rounded-full bg-white border border-toss-grey-100 flex items-center justify-center text-toss-grey-400 hover:bg-toss-grey-50 transition-all shadow-sm"
        >
          <X size={20} />
        </button>
      </header>

      <div class="p-6 border-b border-toss-grey-50">
        <div class="relative group">
          <Search
            class="absolute left-6 top-1/2 -translate-y-1/2 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors"
            size={20}
          />
          <input
            bind:value={classSearchQuery}
            placeholder="수업 이름 또는 과목 검색..."
            class="w-full h-14 bg-toss-grey-50 pl-14 pr-6 rounded-2xl border-none font-bold text-toss-grey-700 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-2">
        {#each settings.data.classes.filter((c) => c.name.includes(classSearchQuery) || (c.subject || "").includes(classSearchQuery)) as cls}
          {@const isSelected = (editingItem.assignedClassIds || []).includes(
            cls.id,
          )}
          <button
            onclick={() => {
              const current = editingItem.assignedClassIds || [];
              if (isSelected) {
                editingItem.assignedClassIds = current.filter(
                  (id: string) => id !== cls.id,
                );
              } else {
                editingItem.assignedClassIds = [...current, cls.id];
              }
            }}
            class="w-full p-5 rounded-2xl flex items-center justify-between transition-all border {isSelected
              ? 'bg-toss-blue/5 border-toss-blue ring-2 ring-toss-blue/10'
              : 'bg-white border-toss-grey-100 hover:border-toss-blue/30 hover:bg-toss-grey-50'}"
          >
            <div class="text-left">
              <div
                class="text-[15px] font-black {isSelected
                  ? 'text-toss-blue'
                  : 'text-toss-grey-700'}"
              >
                {cls.name}
              </div>
              <div class="text-[12px] text-toss-grey-400 font-medium mt-1">
                {cls.subject || "과목 미지정"} • {cls.time} • {(
                  cls.day || []
                ).join("")}
              </div>
            </div>
            {#if isSelected}
              <div
                class="w-6 h-6 rounded-full bg-toss-blue flex items-center justify-center text-white"
              >
                <Plus size={14} class="rotate-45" />
              </div>
            {:else}
              <div
                class="w-6 h-6 rounded-full border border-toss-grey-200 bg-white"
              ></div>
            {/if}
          </button>
        {/each}
      </div>

      <footer class="p-8 bg-toss-grey-25 border-t border-toss-grey-50">
        <button
          onclick={() => (isClassModalOpen = false)}
          class="w-full h-14 bg-black text-white rounded-2xl font-black text-[16px] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          확인
        </button>
      </footer>
    </div>
  </div>
{/if}
