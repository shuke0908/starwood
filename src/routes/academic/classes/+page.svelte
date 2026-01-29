<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import type { AcademyClass } from "$lib/types";
  import {
    Search,
    Plus,
    Calendar,
    Clock,
    User,
    ChevronDown,
    LayoutGrid,
    List,
    Wallet,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    MoreVertical,
    X,
    Save,
    Trash2,
    UserCheck,
    ClipboardList,
    TrendingUp,
  } from "lucide-svelte";
  import { fade, fly, slide, scale } from "svelte/transition";
  import Drawer from "$lib/components/Drawer.svelte";
  import { getDiff } from "$lib/logic";
  import { toast } from "$lib/stores/toast.svelte";

  let searchQuery = $state("");
  let selectedClassId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  // Editing State
  let isEditing = $state(false);
  let editingClass = $state<Partial<AcademyClass>>({});

  const selectedClass = $derived(
    selectedClassId
      ? settings.data.classes.find((c) => c.id === selectedClassId)
      : null,
  );

  const filteredClasses = $derived(
    settings.data.classes.filter((c) => {
      const teacherName =
        settings.data.teachers.find((t) => t.id === c.teacherId)?.name || "";
      return c.name.includes(searchQuery) || teacherName.includes(searchQuery);
    }),
  );

  function openDetail(id: string) {
    selectedClassId = id;
    editingClass = { ...settings.data.classes.find((c) => c.id === id) };
    isDrawerOpen = true;
    isEditing = false;
  }

  function startNewClass() {
    editingClass = {
      id: `cls_${Date.now()}`,
      name: "",
      teacherId: settings.data.teachers[0]?.id || "",
      studentIds: [],
      billingType: "flat",
      maxStudents: 15,
      time: "00:00-00:00",
      day: [],
    };
    selectedClassId = null;
    isDrawerOpen = true;
    isEditing = true;
  }

  function saveClass() {
    if (!editingClass.name || !editingClass.teacherId) {
      toast.show("필수 항목을 입력해주세요.", "error");
      return;
    }

    const idx = settings.data.classes.findIndex(
      (c) => c.id === editingClass.id,
    );

    const labels: Record<string, string> = {
      name: "클래스 명칭",
      teacherId: "담당 강사 ID",
      billingType: "수정 방식",
      maxStudents: "최대 정원",
      time: "수업 시간",
      day: "수업 요일",
      fee: "수강료",
    };

    if (idx !== -1) {
      const original = settings.data.classes[idx];
      const diff = getDiff(original, editingClass, labels);

      if (diff.length === 0) {
        toast.show("변경된 내용이 없습니다.", "info");
        isDrawerOpen = false;
        return;
      }

      settings.data.classes[idx] = {
        ...settings.data.classes[idx],
        ...editingClass,
      } as AcademyClass;

      toast.show("수업 정보 수정 완료", "success", diff.join("\n"));
    } else {
      settings.data.classes.push(editingClass as AcademyClass);
      toast.show(
        "신규 클래스 개설 완료",
        "success",
        `${editingClass.name} 클래스가 생성되었습니다.`,
      );
    }

    isEditing = false;
    isDrawerOpen = false;
  }

  function deleteClass(id: string) {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    settings.data.classes = settings.data.classes.filter((c) => c.id !== id);
    isDrawerOpen = false;
  }

  const fmt = (val?: number) => (val ? val.toLocaleString() : "0");

  function getClassStats(c: AcademyClass) {
    const classStudents = settings.data.students.filter((s) =>
      c.studentIds.includes(s.id),
    );
    return { count: classStudents.length };
  }
</script>

<div class="space-y-8 pb-10">
  <!-- Search & Action -->
  <div class="flex gap-6 items-center justify-between">
    <div class="relative max-w-[500px] w-full group flex items-center">
      <Search
        class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
        size={24}
      />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="반 이름, 강사, 과목명으로 검색..."
        class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md"
      />
    </div>
    <div class="flex gap-4 shrink-0">
      <div class="flex gap-2">
        <button
          class="px-6 h-[64px] rounded-[24px] bg-white border border-toss-grey-100 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <ClipboardList size={18} /> 출결 합계
        </button>
      </div>
      <button
        onclick={startNewClass}
        class="toss-btn-primary flex items-center gap-2 px-8 h-[64px] rounded-[24px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
      >
        <Plus size={22} class="stroke-[3]" /> 신규 클래스 개설
      </button>
    </div>
  </div>

  <!-- Data Table Area -->
  <div
    class="bg-white rounded-[40px] border border-toss-grey-50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)]"
  >
    <div class="overflow-x-auto flex-1 custom-scroll">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead
          class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10"
        >
          <tr
            class="text-[12px] font-black text-toss-grey-400 uppercase tracking-tight"
          >
            <th class="p-6 pl-10">클래스 명칭</th>
            <th class="p-6">수업 일정</th>
            <th class="p-6">담당 강사</th>
            <th class="p-6 text-center">인원 / 정원</th>
            <th class="p-6">수강생 미리보기</th>
            <th class="p-6 text-right pr-10">관리</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-toss-grey-50/50">
          {#each filteredClasses as c (c.id)}
            {@const stats = getClassStats(c)}
            {@const teacher = settings.data.teachers.find(
              (t) => t.id === c.teacherId,
            )}
            {@const unpaidCount = settings.data.students.filter(
              (s) => s.classes.includes(c.name) && s.status === "미납",
            ).length}
            <tr
              class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group"
              style="height: 84px"
              onclick={() => openDetail(c.id)}
            >
              <td class="p-6 pl-10">
                <div>
                  <p
                    class="text-[16px] font-black text-toss-grey-700 group-hover:text-toss-blue transition-colors leading-tight"
                  >
                    {c.name}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <span
                      class="text-[11px] font-bold text-toss-grey-300 uppercase tracking-wider"
                      >{c.billingType === "session" ? "횟수제" : "정액제"}</span
                    >
                    <span class="w-1 h-1 rounded-full bg-toss-grey-100"></span>
                    <span
                      class="text-[11px] font-bold text-toss-blue uppercase tracking-wider"
                      >Active</span
                    >
                    {#if unpaidCount > 0}
                      <span class="w-1 h-1 rounded-full bg-red-400"></span>
                      <span
                        class="text-[11px] font-bold text-red-500 animate-pulse"
                        >미납 {unpaidCount}명</span
                      >
                    {/if}
                  </div>
                </div>
              </td>
              <td class="p-6">
                <div class="flex flex-col gap-2">
                  <div class="flex gap-1">
                    {#each ["월", "화", "수", "목", "금", "토", "일"] as d}
                      <span
                        class="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all {(
                          c.day || []
                        ).includes(d)
                          ? 'bg-toss-blue text-white shadow-sm'
                          : 'bg-toss-grey-50 text-toss-grey-200'}">{d}</span
                      >
                    {/each}
                  </div>
                  <div
                    class="flex items-center gap-1.5 text-[13px] font-bold text-toss-grey-400 pl-0.5"
                  >
                    <Clock size={12} class="text-toss-blue/40" />
                    <span>{c.time}</span>
                  </div>
                </div>
              </td>
              <td class="p-6">
                <span
                  class="text-[15px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors"
                  >{teacher?.name || "미배정"}</span
                >
              </td>
              <td class="p-6 text-center">
                <div class="flex flex-col items-center">
                  <span class="text-[15px] font-black text-toss-grey-600"
                    >{c.studentIds.length}
                    <span class="text-toss-grey-200"
                      >/ {c.maxStudents || 10}</span
                    ></span
                  >
                  <div
                    class="w-12 h-1 bg-toss-grey-100 rounded-full mt-1.5 overflow-hidden"
                  >
                    <div
                      class="h-full bg-toss-blue transition-all"
                      style="width: {Math.min(
                        100,
                        (c.studentIds.length / (c.maxStudents || 10)) * 100,
                      )}%"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="p-6">
                <div class="flex -space-x-2 overflow-hidden">
                  {#each settings.data.students
                    .filter((s) => c.studentIds.includes(s.id))
                    .slice(0, 5) as s}
                    <div
                      class="w-8 h-8 rounded-full bg-toss-blue-light border-2 border-white flex items-center justify-center text-[10px] font-black text-toss-blue"
                      title={s.name}
                    >
                      {s.name[0]}
                    </div>
                  {/each}
                  {#if c.studentIds.length > 5}
                    <div
                      class="w-8 h-8 rounded-full bg-toss-grey-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-toss-grey-300"
                    >
                      +{c.studentIds.length - 5}
                    </div>
                  {/if}
                </div>
              </td>
              <td class="p-6 text-right pr-10">
                <button
                  class="w-8 h-8 rounded-full flex items-center justify-center text-toss-grey-300 hover:bg-toss-grey-50 hover:text-toss-grey-500 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<Drawer bind:isOpen={isDrawerOpen} title="클래스 상세 설정" width="600px">
  {#if editingClass}
    <div class="space-y-10" in:fade>
      <section class="grid grid-cols-2 gap-4">
        <div class="p-6 bg-toss-blue-light/30 rounded-[32px] space-y-2">
          <label
            for="class-billing-edit"
            class="text-[11px] font-black text-toss-blue uppercase tracking-widest pl-1"
            >수업 방식</label
          >
          <select
            id="class-billing-edit"
            bind:value={editingClass.billingType}
            class="w-full bg-transparent border-none font-black text-toss-blue text-[20px] outline-none cursor-pointer"
          >
            <option value="flat">정액제</option>
            <option value="session">횟수제</option>
          </select>
        </div>
        <div class="p-6 bg-toss-grey-50 rounded-[32px] space-y-2">
          <label
            for="class-max-edit"
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
            >최대 정원</label
          >
          <div class="flex items-center gap-2">
            <input
              id="class-max-edit"
              type="number"
              bind:value={editingClass.maxStudents}
              class="w-20 bg-transparent border-none font-black text-toss-grey-600 text-[20px] outline-none"
            />
            <span class="text-toss-grey-400 font-bold">명</span>
          </div>
        </div>
      </section>

      <section
        class="space-y-6 bg-toss-grey-25 p-8 rounded-[40px] border border-toss-grey-50"
      >
        <div class="space-y-2">
          <label
            for="class-name-input"
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
            >클래스 명칭</label
          >
          <input
            id="class-name-input"
            bind:value={editingClass.name}
            class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 outline-none shadow-sm h-16 text-[18px]"
          />
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <label
              for="class-teacher-select"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >담당 강사</label
            >
            <select
              id="class-teacher-select"
              bind:value={editingClass.teacherId}
              class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 outline-none shadow-sm h-16"
            >
              {#each settings.data.teachers as teacher}
                <option value={teacher.id}>{teacher.name} 강사</option>
              {/each}
            </select>
          </div>
          <div class="space-y-2">
            <label
              for="class-time-input"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >수업 시간</label
            >
            <input
              id="class-time-input"
              bind:value={editingClass.time}
              class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 outline-none shadow-sm h-16"
              placeholder="HH:mm-HH:mm"
            />
          </div>
          <div class="space-y-3">
            <label
              for="class-days"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >수업 요일</label
            >
            <div id="class-days" class="flex gap-2">
              {#each ["월", "화", "수", "목", "금", "토", "일"] as d}
                <button
                  onclick={() => {
                    if (editingClass.day?.includes(d)) {
                      editingClass.day = editingClass.day.filter(
                        (item) => item !== d,
                      );
                    } else {
                      editingClass.day = [...(editingClass.day || []), d];
                    }
                  }}
                  class="flex-1 h-12 rounded-xl font-black transition-all {editingClass.day?.includes(
                    d,
                  )
                    ? 'bg-toss-blue text-white shadow-lg'
                    : 'bg-white text-toss-grey-300 border border-toss-grey-100 shadow-sm'}"
                >
                  {d}
                </button>
              {/each}
            </div>
          </div>

          <div class="space-y-2">
            <label
              for="class-fee-edit"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >수강료 (월)</label
            >
            <div class="relative">
              <input
                id="class-fee-edit"
                type="number"
                bind:value={editingClass.fee}
                class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 outline-none shadow-sm h-16 text-[18px] pr-12"
              />
              <span
                class="absolute right-5 top-1/2 -translate-y-1/2 text-toss-grey-300 font-bold"
                >원</span
              >
            </div>
          </div>
        </div>
      </section>

      <footer class="pt-6 flex gap-4">
        <button
          onclick={() => deleteClass(editingClass.id!)}
          class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={saveClass}
          class="flex-1 h-16 bg-toss-blue text-white rounded-[28px] font-black text-[18px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] transition-all"
        >
          내용 저장하기
        </button>
      </footer>
    </div>
  {/if}
</Drawer>
