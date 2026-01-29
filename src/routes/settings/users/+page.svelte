<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import type { TeacherSetting, SettlementType } from "$lib/types";
  import {
    Users,
    GraduationCap,
    Calendar,
    CreditCard,
    Search,
    Plus,
    ChevronRight,
    MoreVertical,
    Wallet,
    Star,
    MessageSquare,
    ClipboardList,
    TrendingUp,
    FileText,
    X,
    Clock,
    Trash2,
    ShieldCheck,
    UserCheck,
    Briefcase,
    Settings2,
    Save,
    AlertCircle,
  } from "lucide-svelte";
  import { fade, fly, slide, scale } from "svelte/transition";

  let searchQuery = $state("");
  let isEditing = $state(false);
  let editingTeacher = $state<TeacherSetting | null>(null);

  const allStaff = $derived([
    ...settings.data.teachers.map((t) => ({
      ...t,
      role: "teacher" as const,
      typeLabel: "강사",
    })),
    ...settings.data.shuttleDrivers.map((d) => ({
      ...d,
      role: "driver" as const,
      typeLabel: "현장",
    })),
    ...settings.data.generalStaff.map((g) => ({ ...g, typeLabel: "행정" })),
  ]);

  const filteredStaff = $derived(
    allStaff.filter((s) => s.name.includes(searchQuery)),
  );

  function editTeacher(teacher: TeacherSetting) {
    editingTeacher = JSON.parse(JSON.stringify(teacher));
    isEditing = true;
  }

  function createTeacher() {
    editingTeacher = {
      id: `t_${Date.now()}`,
      name: "",
      settlementType: "fixed",
      settlementValue: 0,
      availability: [],
      salary: 0,
      majors: [],
      phone: "",
      status: "재직",
      isOnHoliday: false,
    } as any;
    isEditing = true;
  }

  function saveTeacher() {
    if (!editingTeacher || !editingTeacher.name) {
      alert("강사 성함을 입력해주세요.");
      return;
    }
    const idx = settings.data.teachers.findIndex(
      (t) => t.id === editingTeacher?.id,
    );
    if (idx !== -1) {
      settings.data.teachers[idx] = editingTeacher;
    } else {
      settings.data.teachers.push(editingTeacher);
    }
    isEditing = false;
    editingTeacher = null;
  }

  function deleteTeacher(id: string) {
    if (
      !confirm(
        "강사 정보를 영구히 삭제하시겠습니까? 관련 시간표 데이터가 손실될 수 있습니다.",
      )
    )
      return;
    settings.data.teachers = settings.data.teachers.filter((t) => t.id !== id);
    isEditing = false;
    editingTeacher = null;
  }

  function addTimeSlot() {
    if (editingTeacher) {
      editingTeacher.availability = [
        ...editingTeacher.availability,
        { day: "월", startTime: "14:00", endTime: "18:00" },
      ];
    }
  }

  const fmt = (val: number) => val.toLocaleString();

  function getSettlementLabel(type: SettlementType | string) {
    if (typeof type !== "string") return "고정급";
    switch (type) {
      case "fixed":
        return "월정액";
      case "ratio":
        return "비율제";
      case "equity":
        return "지분제";
      case "hourly":
        return "시급제";
      default:
        return "고정급";
    }
  }

  const permissionGroups = [
    { id: "crm", name: "원생 CRM", desc: "원생 관리 및 상담" },
    { id: "academics", name: "학사 운영", desc: "시간표 및 출결" },
    { id: "finance", name: "재무/회계", desc: "수납 및 환불" },
    { id: "management", name: "경영/분석", desc: "대시보드 및 정산" },
  ];
</script>

<div class="space-y-10 pb-20">
  <!-- Header -->
  <header class="flex justify-between items-end px-2">
    <div>
      <h2 class="toss-title">인적 자원 관리</h2>
    </div>
    <button
      onclick={createTeacher}
      class="toss-btn-primary px-8 flex items-center gap-2"
    >
      <Plus size={20} /> 신규 강사 등록
    </button>
  </header>

  <!-- Search -->
  <div
    class="flex gap-4 items-center bg-white p-3 rounded-[28px] border border-toss-grey-100 shadow-sm mx-2"
  >
    <div class="relative flex-1 group flex items-center">
      <Search
        class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
        size={20}
      />
      <input
        bind:value={searchQuery}
        placeholder="성함으로 빠른 검색.."
        class="w-full pl-16 pr-6 bg-transparent h-[56px] text-[17px] font-bold text-toss-grey-600 outline-none border-none"
      />
    </div>
  </div>

  <!-- High-Density Teacher Table -->
  <div
    class="bg-white rounded-[32px] border border-toss-grey-100 shadow-sm overflow-hidden mx-2"
  >
    <table class="w-full text-left border-collapse">
      <thead class="bg-toss-grey-50/50 border-b border-toss-grey-100">
        <tr
          class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest text-left"
        >
          <th class="py-2 px-8">강사 프로필</th>
          <th class="py-2 px-8">정산 정책</th>
          <th class="py-2 px-8">정산 수치</th>
          <th class="py-2 px-8">근무 요일</th>
          <th class="py-2 px-8 text-right">상태</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-toss-grey-50">
        {#each filteredStaff as s (s.id)}
          <tr
            class="hover:bg-toss-grey-50 transition-all cursor-pointer group"
            onclick={() => editTeacher(s as any)}
          >
            <td class="py-2 px-8">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-2xl bg-toss-grey-50 flex items-center justify-center font-black text-[15px] text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all shadow-sm"
                >
                  {s.name[0]}
                </div>
                <div>
                  <p
                    class="text-[15px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors"
                  >
                    {s.name}
                    {#if s.isOnHoliday}
                      <span
                        class="ml-1 text-[10px] text-orange-500 bg-orange-50 px-1 rounded-sm uppercase"
                        >연차</span
                      >
                    {/if}
                  </p>
                  <p class="text-[11px] font-bold text-toss-grey-300 mt-0.5">
                    {s.typeLabel} • {s.phone || "연락처 미등록"}
                  </p>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-8">
              <span
                class="px-2.5 py-1 rounded-lg bg-toss-grey-50 text-[11px] font-black text-toss-grey-400 group-hover:bg-toss-blue/5 group-hover:text-toss-blue transition-colors"
              >
                {getSettlementLabel((s as any).settlementType || "fixed")}
              </span>
            </td>
            <td class="py-2.5 px-8">
              <p class="text-[15px] font-black text-toss-grey-600">
                {#if (s as any).settlementValue}
                  {(s as any).settlementType === "ratio"
                    ? (s as any).settlementValue + "%"
                    : "₩" + fmt((s as any).settlementValue)}
                {:else}
                  ₩{fmt((s as any).salary || 0)}
                {/if}
              </p>
            </td>
            <td class="py-2.5 px-8">
              <div class="flex gap-1.5">
                {#each ["월", "화", "수", "목", "금", "토", "일"] as d}
                  {@const isWorking = s.availability.some((a) => a.day === d)}
                  <span
                    class="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black {isWorking
                      ? 'bg-toss-grey-700 text-white'
                      : 'bg-toss-grey-50 text-toss-grey-200'}">{d}</span
                  >
                {/each}
              </div>
            </td>
            <td class="py-2.5 px-8 text-right">
              <div class="flex items-center justify-end gap-2">
                <span
                  class="text-[12px] font-black {(s as any).status === '재직'
                    ? 'text-green-500'
                    : 'text-toss-grey-300'}">{(s as any).status || "재직"}</span
                >
                <ChevronRight
                  size={16}
                  class="text-toss-grey-100 group-hover:text-toss-blue transition-colors"
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if filteredStaff.length === 0}
      <div
        class="py-40 flex flex-col items-center justify-center text-center opacity-40"
      >
        <Users size={48} class="text-toss-grey-300 mb-4" />
        <p class="text-[20px] font-black text-toss-grey-600">
          등록된 강사가 없습니다
        </p>
      </div>
    {/if}
  </div>
</div>

<!-- Edit Modal -->
{#if isEditing && editingTeacher}
  {@const staff = editingTeacher as any}
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-end"
    transition:fade
  >
    <div
      class="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col"
      in:fly={{ x: 400, duration: 400 }}
    >
      <div
        class="p-8 border-b border-toss-grey-100 flex justify-between items-center bg-toss-grey-50/20"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 {staff.role === 'teacher'
              ? 'bg-toss-blue'
              : 'bg-orange-500'} rounded-2xl flex items-center justify-center text-white shadow-lg"
          >
            <Users size={24} />
          </div>
          <div>
            <h3
              class="text-[20px] font-black text-toss-grey-600 truncate max-w-[200px]"
            >
              {staff.name || "신규 등록"}
            </h3>
            <p class="text-[12px] font-bold text-toss-grey-300">
              사용자 권한 및 정책 설정
            </p>
          </div>
        </div>
        <button
          onclick={() => (isEditing = false)}
          class="w-10 h-10 rounded-2xl bg-white border border-toss-grey-100 flex items-center justify-center text-toss-grey-400 hover:text-red-500 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto custom-scroll p-8 space-y-10">
        <!-- Basic Info -->
        <section class="space-y-6">
          <h4
            class="text-[13px] font-black text-toss-grey-300 uppercase tracking-widest border-b border-toss-grey-50 pb-2"
          >
            기본 정보
          </h4>
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label
                for="staff-name"
                class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                >성함 / 닉네임</label
              >
              <input
                id="staff-name"
                bind:value={staff.name}
                class="toss-input h-[56px] text-[16px]"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label
                  for="staff-role"
                  class="text-[12px] font-bold text-toss-grey-400 pl-1"
                  >직군 분류</label
                >
                <select
                  id="staff-role"
                  bind:value={staff.role}
                  class="toss-input h-[56px] font-bold"
                >
                  <option value="teacher">강사 (Academic)</option>
                  <option value="driver">현장/셔틀 (Field)</option>
                  <option value="desk">행정/데스크 (Admin)</option>
                  <option value="manager">관리자 (Manager)</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label
                  for="staff-status"
                  class="text-[12px] font-bold text-toss-grey-400 pl-1"
                  >재직 상태</label
                >
                <select
                  id="staff-status"
                  bind:value={staff.status}
                  class="toss-input h-[56px] font-bold text-green-600"
                >
                  <option value="재직">재직 중</option>
                  <option value="휴가">연차/휴가</option>
                  <option value="퇴직">퇴직</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <!-- ACL (Permissions) -->
        <section class="space-y-6">
          <h4
            class="text-[13px] font-black text-toss-grey-300 uppercase tracking-widest border-b border-toss-grey-50 pb-2"
          >
            기능 접근 권한 (ACL)
          </h4>
          <div class="space-y-4 bg-toss-grey-50/50 p-6 rounded-[32px]">
            {#each permissionGroups as group}
              <div class="flex items-center justify-between group/perm">
                <div>
                  <p class="text-[15px] font-black text-toss-grey-600">
                    {group.name}
                  </p>
                  <p class="text-[11px] font-bold text-toss-grey-300">
                    {group.desc}
                  </p>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input
                    id="perm-{group.id}"
                    type="checkbox"
                    class="sr-only peer"
                    checked={staff.role === "manager" ||
                      staff.role === "director"}
                  />
                  <label for="perm-{group.id}" class="sr-only"
                    >{group.name} 권한</label
                  >
                  <div
                    class="w-11 h-6 bg-toss-grey-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toss-blue"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Settlement -->
        <section class="space-y-6">
          <h4
            class="text-[13px] font-black text-toss-grey-300 uppercase tracking-widest border-b border-toss-grey-50 pb-2"
          >
            정산 및 급여 계약
          </h4>
          <div class="space-y-4">
            <div class="space-y-1.5">
              <p class="text-[12px] font-bold text-toss-grey-400 pl-1">
                정산 모델
              </p>
              <div class="grid grid-cols-2 gap-2">
                {#each ["fixed", "ratio", "equity", "hourly"] as mode}
                  <button
                    onclick={() => {
                      staff.settlementType = mode;
                      if (!staff.availability) staff.availability = [];
                    }}
                    class="h-12 rounded-xl text-[13px] font-black transition-all {staff.settlementType ===
                    mode
                      ? 'bg-toss-blue text-white shadow-lg shadow-toss-blue/20'
                      : 'bg-toss-grey-50 text-toss-grey-300 hover:bg-toss-grey-100'}"
                  >
                    {getSettlementLabel(mode)}
                  </button>
                {/each}
              </div>
            </div>
            <div class="space-y-1.5">
              <label
                for="settlement-value"
                class="text-[12px] font-bold text-toss-grey-400 pl-1"
                >계약 금액 / 비율</label
              >
              <div class="relative">
                <input
                  id="settlement-value"
                  type="number"
                  bind:value={staff.settlementValue}
                  class="toss-input h-[64px] text-right pr-16 text-[20px] font-black"
                />
                <span
                  class="absolute right-6 top-1/2 -translate-y-1/2 font-black text-toss-grey-300"
                  >{(staff as any).settlementType === "ratio" ||
                  (staff as any).settlementType === "equity"
                    ? "%"
                    : "원"}</span
                >
              </div>
            </div>
          </div>
        </section>

        <!-- Danger Zone -->
        <section class="pt-10 border-t border-toss-grey-50">
          <button
            onclick={() => deleteTeacher(staff.id)}
            class="w-full h-[56px] rounded-2xl font-black text-red-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
          >
            <Trash2 size={18} /> 사용 기록 영구 삭제
          </button>
        </section>
      </div>

      <div
        class="p-8 bg-white border-t border-toss-grey-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] selection:bg-toss-blue"
      >
        <button
          onclick={saveTeacher}
          class="w-full h-16 bg-toss-blue text-white rounded-2xl font-black text-[17px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Save size={20} /> 변경사항 저장하기
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(.toss-title) {
    font-size: 38px;
    font-weight: 950;
    letter-spacing: -0.04em;
    line-height: 1.1;
    color: #191f28;
  }
  :global(.toss-desc) {
    font-size: 17px;
    font-weight: 600;
    color: #6b7684;
    margin-top: 12px;
  }
  .toss-input {
    width: 100%;
    background-color: #f2f4f6;
    border-radius: 16px;
    padding: 0 24px;
    outline: none;
    border: 2px solid transparent;
    transition: all 0.2s;
  }
  .toss-input:focus {
    background-color: white;
    border-color: #3182f6;
    box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.1);
  }
  .toss-btn-primary {
    background-color: #3182f6;
    color: white;
    height: 56px;
    border-radius: 16px;
    font-weight: 800;
    font-size: 16px;
    transition: all 0.2s;
    box-shadow: 0 8px 16px rgba(49, 130, 246, 0.2);
  }
  .toss-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(49, 130, 246, 0.3);
  }
  th {
    white-space: nowrap;
  }
</style>
