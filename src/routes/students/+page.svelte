<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import type {
    Student,
    PaymentRecord,
    Consultation,
    Score,
    Attendance,
  } from "$lib/types";
  import {
    Search,
    Plus,
    Phone,
    ChevronDown,
    X,
    Send,
    User,
    MessageCircle,
    MessageSquare,
    ClipboardList,
    ExternalLink,
    MoreHorizontal,
    ChevronRight,
    Save,
    Trash2,
    CreditCard,
    Calendar,
    TrendingUp,
    BookOpen,
    Clock,
    Star,
  } from "lucide-svelte";
  import { fade, slide, fly } from "svelte/transition";
  import Drawer from "$lib/components/Drawer.svelte";
  import Tabs from "$lib/components/Tabs.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import { getDiff } from "$lib/logic";
  import { toast } from "$lib/stores/toast.svelte";

  // State
  let searchQuery = $state("");
  let filterStatus = $state("전체");
  let filterSchool = $state("전체");
  let filterGrade = $state("전체");
  let filterClass = $state("전체");
  let selectedIds = $state<string[]>([]);
  let isDrawerOpen = $state(false);
  let isModalOpen = $state(false);
  let activeTab = $state("info");
  let selectedStudentId = $state<string | null>(null);

  // Editing State
  let isEditing = $state(false);
  let editingStudent = $state<Partial<Student>>({});

  const selectedStudent = $derived(
    selectedStudentId
      ? settings.data.students.find((s) => s.id === selectedStudentId)
      : null,
  );

  // Derived Data for Drawer Tabs
  const studentPayments = $derived(
    settings.data.payments.filter((p) => p.studentId === selectedStudentId),
  );
  const studentConsultations = $derived(
    selectedStudent
      ? settings.data.consultations.filter(
          (c) => c.name === selectedStudent.name,
        )
      : [],
  );
  const studentScores = $derived(
    settings.data.scores.filter((s) => s.studentId === selectedStudentId),
  );
  const studentAttendance = $derived(
    settings.data.attendance.filter((a) => a.studentId === selectedStudentId),
  );

  // Dynamic Filter Options
  const uniqueSchools = $derived([
    "전체",
    ...new Set(settings.data.students.map((s) => s.school).filter(Boolean)),
  ]);
  const uniqueGrades = $derived(["전체", ...settings.data.academy.gradeSystem]);
  const uniqueClasses = $derived([
    "전체",
    ...new Set(settings.data.classes.map((c) => c.name)),
  ]);

  const filteredStudents = $derived(
    settings.data.students.filter((s) => {
      const matchesSearch =
        s.name.includes(searchQuery) ||
        s.studentPhone.includes(searchQuery) ||
        s.parentContacts.some((p) => p.phone.includes(searchQuery));
      const matchesStatus =
        filterStatus === "전체" || s.status === filterStatus;
      const matchesSchool =
        filterSchool === "전체" || s.school === filterSchool;
      const matchesGrade = filterGrade === "전체" || s.grade === filterGrade;
      const matchesClass =
        filterClass === "전체" || s.classes.includes(filterClass);
      return (
        matchesSearch &&
        matchesStatus &&
        matchesSchool &&
        matchesGrade &&
        matchesClass
      );
    }),
  );

  const detailTabs = [
    { id: "info", label: "기본 정보" },
    { id: "record", label: "수강 이력" },
    { id: "payment", label: "수납 내역" },
    { id: "consult", label: "상담 기록" },
    { id: "score", label: "성적/출결" },
  ];

  function changeStudentStatus(id: string, newStatus: string) {
    const student = settings.data.students.find((s) => s.id === id);
    if (student) {
      const oldStatus = student.status;
      student.status = newStatus as any;

      // 워크플로우: 대기 -> 재원 전환 시 수강료 청구서(초안) 자동 생성
      if (oldStatus === "대기" && newStatus === "재원") {
        const defaultAmount = 350000;
        settings.data.payments.unshift({
          id: `pay_draft_${Date.now()}`,
          studentId: student.id,
          amount: defaultAmount,
          method: "이체",
          type: "이체",
          description: `입학 확정 자동 청구 (${student.name})`,
          date: new Date().toISOString().split("T")[0],
          status: "completed", // 데모용으로 즉시 완료 처리 또는 별도 상태 관리
        });
        toast.show(
          `${student.name} 원생의 입학 확정 및 수강료(₩${fmt(defaultAmount)}) 청구서가 자동 생성되었습니다.`,
          "success",
        );
      }
    }
  }

  function openDetail(id: string) {
    selectedStudentId = id;
    const student = settings.data.students.find((s) => s.id === id);
    if (student) {
      editingStudent = JSON.parse(JSON.stringify(student));
    }
    isDrawerOpen = true;
    activeTab = "info";
  }

  function startNewStudent() {
    editingStudent = {
      id: `s_${Date.now()}`,
      name: "",
      gender: "남",
      studentPhone: "",
      parentContacts: [{ type: "부", name: "", phone: "", isPrimary: true }],
      school: "",
      grade: "1학년",
      status: "재원",
      regDate: new Date().toISOString().split("T")[0],
      unpaid: 0,
      unpaidDays: 0,
      consultationCount: 0,
      productIds: [],
      classes: [],
    };
    isModalOpen = true;
  }

  function saveStudent() {
    if (!editingStudent.name || !editingStudent.studentPhone) return;
    const idx = settings.data.students.findIndex(
      (s) => s.id === editingStudent.id,
    );
    if (idx !== -1) {
      settings.data.students[idx] = {
        ...settings.data.students[idx],
        ...editingStudent,
      } as Student;
    } else {
      settings.data.students.push(editingStudent as Student);
    }
    isModalOpen = false;
    selectedStudentId = editingStudent.id as string;
  }

  function deleteStudent(id: string) {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    settings.data.students = settings.data.students.filter((s) => s.id !== id);
    isDrawerOpen = false;
  }

  const fmt = (val: number) => val.toLocaleString();

  // Virtualization Logic
  let containerHeight = $state(800);
  let scrollTop = $state(0);
  const rowHeight = 84;
  const buffer = 5;

  const visibleRange = $derived({
    start: Math.max(0, Math.floor(scrollTop / rowHeight) - buffer),
    end: Math.min(
      filteredStudents.length,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + buffer,
    ),
  });

  const visibleStudents = $derived(
    filteredStudents.slice(visibleRange.start, visibleRange.end),
  );
  const totalHeight = $derived(filteredStudents.length * rowHeight);
  const offsetY = $derived(visibleRange.start * rowHeight);

  function handleScroll(e: Event) {
    scrollTop = (e.target as HTMLDivElement).scrollTop;
  }

  // --- Smart Promotion & Mix-up Logic ---
  let isPromotionModalOpen = $state(false);
  let promotionStep = $state<"config" | "preview">("config");

  // 가상의 진급 데이터 (미리보기용)
  let promotionWorkspace = $state<
    {
      id: string;
      name: string;
      currentGrade: string;
      nextGrade: string;
      currentClasses: string[];
      targetClassId: string | null;
      fee: number;
      isSelected: boolean;
    }[]
  >([]);

  const promotionMapping = $derived.by(() => {
    const grades = settings.data.academy.gradeSystem;
    const mapping: Record<string, string> = {};
    grades.forEach((g, i) => {
      if (i < grades.length - 1) mapping[g] = grades[i + 1];
      else mapping[g] = "졸업/퇴원";
    });
    return mapping;
  });

  function openPromotion() {
    // 진급 데이터 초기화
    promotionWorkspace = settings.data.students
      .filter((s) => s.status !== "퇴원")
      .map((s) => {
        const next = promotionMapping[s.grade] || s.grade;
        return {
          id: s.id,
          name: s.name,
          currentGrade: s.grade,
          nextGrade: next,
          currentClasses: s.classes,
          targetClassId: null, // 초기값은 선택 안됨
          fee: 0,
          isSelected: true,
        };
      });
    promotionStep = "config";
    isPromotionModalOpen = true;
  }

  function handleClassChange(studentId: string, classId: string) {
    const student = promotionWorkspace.find((s) => s.id === studentId);
    if (student) {
      const cls = settings.data.classes.find((c) => c.id === classId);
      student.targetClassId = classId;
      student.fee = cls?.fee || 0;
    }
  }

  function applySmartPromotion() {
    const targets = promotionWorkspace.filter((s) => s.isSelected);
    if (targets.length === 0) {
      toast.show("선택된 학생이 없습니다.", "warning");
      return;
    }

    if (
      !confirm(
        `${targets.length}명의 진급 및 반 배정을 확정하시겠습니까? 수강료 청구서가 자동 갱신됩니다.`,
      )
    )
      return;

    targets.forEach((t) => {
      const student = settings.data.students.find((s) => s.id === t.id);
      if (student) {
        // 1. 학급 및 상태 변경
        if (t.nextGrade === "졸업/퇴원") {
          student.status = "퇴원";
          student.memo =
            (student.memo ? student.memo + " | " : "") +
            "일괄 진급으로 인한 자동 졸업";
        } else {
          student.grade = t.nextGrade;

          // 2. 반 배정 변경
          if (t.targetClassId) {
            const newCls = settings.data.classes.find(
              (c) => c.id === t.targetClassId,
            );
            if (newCls) {
              student.classes = [newCls.name];
              // 3. 수강료 청구 (초안 생성)
              settings.data.payments.unshift({
                id: `pay_${Date.now()}_${student.id}`,
                studentId: student.id,
                amount: newCls.fee,
                date: new Date().toISOString().slice(0, 10),
                description: `${t.nextGrade} 진급 정규 수강료 (${newCls.name})`,
                type: "이체",
                status: "pending",
              });
            }
          }
        }
      }
    });

    toast.show(
      `${targets.length}명의 스마트 진급 처리가 완료되었습니다.`,
      "success",
    );
    isPromotionModalOpen = false;
  }
</script>

<div class="space-y-8 pb-10">
  <!-- Enhanced Filters & Actions -->
  <div class="flex gap-6 items-center justify-between">
    <div class="flex gap-6 items-center flex-1">
      <div class="relative max-w-[500px] w-full group flex items-center">
        <Search
          class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
          size={24}
        />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="원생 이름, 전화번호, 학교 등으로 검색하세요"
          class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md"
        />
      </div>
      <div class="flex gap-2">
        <!-- Status Filter -->
        <div class="relative group shrink-0">
          <select
            bind:value={filterStatus}
            class="appearance-none pl-5 pr-10 h-[56px] rounded-[20px] bg-white border border-toss-grey-50 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm outline-none cursor-pointer whitespace-nowrap"
          >
            <option value="전체">상태</option>
            {#each ["재원", "미납", "휴원", "신규", "퇴원"] as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
          <ChevronDown
            size={14}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-toss-grey-300 pointer-events-none"
          />
        </div>

        <!-- School Filter -->
        <div class="relative group shrink-0">
          <select
            bind:value={filterSchool}
            class="appearance-none pl-5 pr-10 h-[56px] rounded-[20px] bg-white border border-toss-grey-50 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm outline-none cursor-pointer"
          >
            <option value="전체">학교</option>
            {#each uniqueSchools.filter((s) => s !== "전체") as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
          <ChevronDown
            size={14}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-toss-grey-300 pointer-events-none"
          />
        </div>

        <!-- Grade Filter -->
        <div class="relative group shrink-0">
          <select
            bind:value={filterGrade}
            class="appearance-none pl-5 pr-10 h-[56px] rounded-[20px] bg-white border border-toss-grey-50 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm outline-none cursor-pointer"
          >
            <option value="전체">학년</option>
            {#each uniqueGrades.filter((g) => g !== "전체") as g}
              <option value={g}>{g}</option>
            {/each}
          </select>
          <ChevronDown
            size={14}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-toss-grey-300 pointer-events-none"
          />
        </div>

        <!-- Class Filter -->
        <div class="relative group">
          <select
            bind:value={filterClass}
            class="appearance-none pl-5 pr-10 h-[56px] rounded-[20px] bg-white border border-toss-grey-50 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm outline-none cursor-pointer"
          >
            <option value="전체">반 배정</option>
            {#each uniqueClasses.filter((c) => c !== "전체") as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
          <ChevronDown
            size={14}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-toss-grey-300 pointer-events-none"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4 shrink-0">
      <!-- Bulk Action Bar (Internal) -->
      {#if selectedIds.length > 0}
        <div
          class="flex items-center gap-4 bg-toss-grey-50 px-5 h-[56px] rounded-[20px] border border-toss-grey-100 animate-in fade-in zoom-in-95 duration-200"
        >
          <p class="text-[14px] font-black whitespace-nowrap shrink-0">
            <span class="text-toss-blue">{selectedIds.length}명</span> 선택됨
          </p>
          <div class="h-4 w-[1px] bg-toss-grey-200"></div>
          <div class="flex gap-3">
            <button
              class="flex items-center gap-1.5 text-[13px] font-bold text-toss-grey-500 hover:text-toss-blue transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare size={16} /> 메시지
            </button>
            <button
              class="flex items-center gap-1.5 text-[13px] font-bold text-toss-grey-500 hover:text-red-500 transition-colors whitespace-nowrap shrink-0"
              onclick={() => {
                if (
                  confirm(
                    `${selectedIds.length}명의 원생을 일괄 삭제하시겠습니까?`,
                  )
                ) {
                  settings.data.students = settings.data.students.filter(
                    (s) => !selectedIds.includes(s.id),
                  );
                  selectedIds = [];
                }
              }}
            >
              <Trash2 size={16} /> 삭제
            </button>
          </div>
          <button
            onclick={() => (selectedIds = [])}
            class="ml-1 p-1 hover:bg-white rounded-lg transition-colors text-toss-grey-300"
          >
            <X size={14} />
          </button>
        </div>
      {/if}

      <button
        onclick={openPromotion}
        class="px-5 h-[56px] rounded-[20px] bg-white border border-toss-grey-100 text-[15px] font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
      >
        <TrendingUp size={18} class="text-toss-blue" /> 학년/진급 관리
      </button>
      <button
        onclick={startNewStudent}
        class="toss-btn-primary flex items-center gap-2 px-8 h-[56px] rounded-[20px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
      >
        <Plus size={20} class="stroke-[3]" /> 학생 등록
      </button>
    </div>
  </div>

  <!-- Table Area with Virtual Scroll -->
  <div
    class="bg-white rounded-[40px] border border-toss-grey-50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)] relative"
  >
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse whitespace-nowrap">
        <thead class="bg-toss-grey-50 border-b border-toss-grey-100">
          <tr
            class="text-[12px] font-black text-toss-grey-600 uppercase tracking-tight"
          >
            <th class="w-[60px] p-4 text-center">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredStudents.length &&
                  filteredStudents.length > 0}
                onchange={(e) => {
                  if ((e.target as HTMLInputElement).checked)
                    selectedIds = filteredStudents.map((s) => s.id);
                  else selectedIds = [];
                }}
                class="w-4 h-4 rounded-md border-toss-grey-200 text-toss-blue focus:ring-toss-blue/20 transition-all cursor-pointer"
              />
            </th>
            <th class="w-[140px] p-4">이름</th>
            <th class="w-[140px] p-4">학교 / 학년</th>
            <th class="w-[180px] p-4">연락처</th>
            <th class="w-[200px] p-4">메모</th>
            <th class="p-4">수강 클래스</th>
            <th class="w-[120px] p-4 text-center">최근 출결</th>
            <th class="w-[120px] p-4 text-center">최근 상담일</th>
            <th class="text-right w-[140px] p-4 pr-10">납부 상태</th>
          </tr>
        </thead>
      </table>
    </div>

    <div
      class="flex-1 overflow-y-auto relative custom-scroll h-full"
      onscroll={handleScroll}
    >
      <div
        style="height: {filteredStudents.length * 72}px; position: relative;"
      >
        <table
          class="w-full text-left border-collapse absolute top-0 left-0"
          style="transform: translateY({offsetY}px)"
        >
          <tbody class="divide-y divide-toss-grey-50/50">
            {#each visibleStudents as s (s.id)}
              <tr
                class="hover:bg-toss-blue-light/15 transition-all cursor-pointer {selectedIds.includes(
                  s.id,
                )
                  ? 'bg-toss-blue-light/5'
                  : ''} group"
                style="height: 72px"
                onclick={() => openDetail(s.id)}
              >
                <td
                  class="w-[60px] text-center"
                  onclick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onchange={(e) => {
                      if ((e.target as HTMLInputElement).checked)
                        selectedIds = [...selectedIds, s.id];
                      else
                        selectedIds = selectedIds.filter((id) => id !== s.id);
                    }}
                    class="w-4 h-4 rounded-md border-toss-grey-100 text-toss-blue focus:ring-toss-blue/20 transition-all cursor-pointer"
                  />
                </td>
                <td class="w-[140px] p-4">
                  <div
                    class="text-[15px] font-black text-toss-grey-600 transition-colors group-hover:text-toss-blue"
                  >
                    {s.name}
                  </div>
                </td>
                <td class="w-[140px] p-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[14px] font-black text-toss-grey-800"
                      >{s.school}</span
                    >
                    <span class="text-[11px] font-bold text-toss-grey-500"
                      >{s.grade}</span
                    >
                  </div>
                </td>
                <td class="w-[180px] p-4">
                  <div class="flex flex-col gap-0.5">
                    <div
                      class="flex items-center gap-2 text-[13px] font-bold text-toss-grey-600"
                    >
                      <Phone size={12} class="text-toss-grey-400" />
                      <span>{s.studentPhone}</span>
                    </div>
                    {#if s.parentContacts.find((p) => p.isPrimary)}
                      {@const primary = s.parentContacts.find(
                        (p) => p.isPrimary,
                      )}
                      <div
                        class="text-[11px] font-bold text-toss-grey-500 flex items-center gap-1.5 px-0.5"
                      >
                        <div
                          class="w-1 h-1 rounded-full bg-toss-grey-300"
                        ></div>
                        {primary?.phone}
                        <span class="text-[10px] text-toss-grey-500 font-medium"
                          >({primary?.type})</span
                        >
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="w-[200px] p-4">
                  <p
                    class="text-[13px] font-medium text-toss-grey-600 truncate max-w-[180px]"
                    title={s.memo}
                  >
                    {s.memo || "-"}
                  </p>
                </td>
                <td class="p-4">
                  <div class="flex flex-wrap gap-1">
                    {#each s.classes.slice(0, 3) as cls}
                      <span
                        class="px-2.5 py-1 rounded-lg bg-toss-blue/[0.08] border border-toss-blue/10 text-[11px] font-black text-toss-blue hover:bg-toss-blue hover:text-white transition-all cursor-default"
                      >
                        {cls}
                      </span>
                    {/each}
                    {#if s.classes.length > 3}
                      <span
                        class="text-[10px] font-black text-toss-blue/40 ml-1"
                        >+{s.classes.length - 3}</span
                      >
                    {/if}
                  </div>
                </td>
                <td class="w-[120px] p-4 text-center">
                  <span class="text-[13px] font-bold text-toss-grey-600"
                    >{s.recentAttendance || "-"}</span
                  >
                </td>
                <td class="w-[120px] p-4 text-center">
                  <span class="text-[13px] font-bold text-toss-grey-600"
                    >{s.lastConsultationDate || "-"}</span
                  >
                </td>
                <td class="text-right w-[140px] p-4 pr-10">
                  <div class="flex flex-col items-end gap-1">
                    <span
                      class="px-3 py-1.5 rounded-full text-[11px] font-black transition-all {s.status ===
                      '재원'
                        ? 'bg-toss-blue/10 text-toss-blue'
                        : s.status === '미납'
                          ? 'bg-red-50 text-red-500 animate-pulse'
                          : 'bg-toss-grey-50 text-toss-grey-400'}"
                    >
                      {s.status === "재원" ? "납부완료" : s.status}
                    </span>
                    {#if s.unpaid > 0}
                      <span class="text-[12px] font-black text-red-500"
                        >₩{fmt(s.unpaid)}</span
                      >
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Student Detail Drawer -->
<Drawer
  bind:isOpen={isDrawerOpen}
  title={selectedStudent?.name + " 원생 상세 정보"}
  width="620px"
>
  {#if selectedStudent}
    <Tabs tabs={detailTabs} bind:activeTab>
      {#if activeTab === "info"}
        <div class="space-y-8 h-full overflow-y-auto pr-2 pb-20" in:fade>
          <!-- Quick Stats (Editable) -->
          <section class="grid grid-cols-3 gap-3">
            <div class="p-5 bg-toss-blue-light/30 rounded-[28px] space-y-2">
              <label
                for="student-status-edit"
                class="text-[10px] font-black text-toss-blue uppercase tracking-widest pl-1"
                >수강 상태</label
              >
              <select
                id="student-status-edit"
                bind:value={editingStudent.status}
                onchange={(e) =>
                  changeStudentStatus(
                    editingStudent.id!,
                    (e.target as HTMLSelectElement).value,
                  )}
                class="w-full bg-transparent border-none font-black text-toss-blue text-[18px] outline-none cursor-pointer"
              >
                <option value="재원">재원</option>
                <option value="휴원">휴원</option>
                <option value="퇴원">퇴원</option>
                <option value="대기">대기</option>
                <option value="미납">미납</option>
              </select>
            </div>
            <div class="p-5 bg-toss-grey-50 rounded-[28px] space-y-2">
              <label
                for="student-regdate-edit"
                class="text-[10px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                >등록일</label
              >
              <input
                id="student-regdate-edit"
                type="date"
                bind:value={editingStudent.regDate}
                class="w-full bg-transparent border-none font-black text-toss-grey-600 text-[16px] outline-none"
              />
            </div>
            <div class="p-5 bg-toss-grey-50 rounded-[28px] space-y-2">
              <label
                for="student-admission-edit"
                class="text-[10px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                >입학일</label
              >
              <input
                id="student-admission-edit"
                type="date"
                bind:value={editingStudent.admissionDate}
                class="w-full bg-transparent border-none font-black text-toss-grey-600 text-[16px] outline-none"
              />
            </div>
          </section>

          <!-- Profile Details (Editable) -->
          <section class="space-y-4">
            <h4
              class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest flex items-center gap-2"
            >
              <User size={16} class="text-toss-blue" /> 기본 인적사항
            </h4>
            <div
              class="bg-white border border-toss-grey-100 rounded-[32px] overflow-hidden divide-y divide-toss-grey-50"
            >
              <!-- 학생 이름 -->
              <div
                class="p-6 flex justify-between items-center bg-toss-blue-light/5"
              >
                <label
                  for="student-name-edit"
                  class="font-bold text-toss-grey-400">학생 성명</label
                >
                <input
                  id="student-name-edit"
                  bind:value={editingStudent.name}
                  class="text-right font-black text-toss-blue text-[18px] bg-transparent border-none outline-none w-1/2"
                />
              </div>

              <!-- 학부모 번호 영역 -->
              <div class="p-6 space-y-4">
                <div class="flex items-center gap-2 mb-1">
                  <span
                    class="text-[11px] font-black text-toss-blue uppercase tracking-widest"
                    >학부모 연락처</span
                  >
                </div>
                {#each editingStudent.parentContacts || [] as parent, i}
                  <div
                    class="space-y-2 p-4 bg-toss-grey-50 rounded-2xl relative group/contact"
                  >
                    <div class="flex gap-2">
                      <select
                        bind:value={parent.type}
                        class="bg-white border border-toss-grey-100 rounded-lg px-2 py-1 text-[12px] font-bold outline-none"
                      >
                        <option value="부">부</option>
                        <option value="모">모</option>
                        <option value="조부">조부</option>
                        <option value="조모">조모</option>
                        <option value="기타">기타</option>
                      </select>
                      <input
                        bind:value={parent.name}
                        placeholder="성함"
                        class="flex-1 bg-white border border-toss-grey-100 rounded-lg px-3 py-1 text-[13px] font-bold outline-none"
                      />
                      <button
                        onclick={() => {
                          if (editingStudent.parentContacts) {
                            editingStudent.parentContacts =
                              editingStudent.parentContacts.map((p, idx) => ({
                                ...p,
                                isPrimary: i === idx,
                              }));
                          }
                        }}
                        class="px-2 py-1 rounded-lg text-[10px] font-black transition-all {parent.isPrimary
                          ? 'bg-toss-blue text-white'
                          : 'bg-toss-grey-100 text-toss-grey-300'}"
                      >
                        {parent.isPrimary ? "대표" : "대표 지정"}
                      </button>
                    </div>
                    <div class="flex gap-2">
                      <input
                        bind:value={parent.phone}
                        placeholder="010-0000-0000"
                        class="flex-1 bg-white border border-toss-grey-100 rounded-lg px-3 py-2 text-[14px] font-black text-toss-blue outline-none"
                      />
                      {#if i > 0}
                        <button
                          onclick={() => {
                            if (editingStudent.parentContacts) {
                              editingStudent.parentContacts =
                                editingStudent.parentContacts.filter(
                                  (_, idx) => idx !== i,
                                );
                            }
                          }}
                          class="p-2 text-red-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
                <button
                  onclick={() => {
                    editingStudent.parentContacts = [
                      ...(editingStudent.parentContacts || []),
                      { type: "부", name: "", phone: "", isPrimary: false },
                    ];
                  }}
                  class="w-full py-3 border border-dashed border-toss-grey-200 rounded-2xl text-[13px] font-black text-toss-grey-300 hover:text-toss-blue hover:border-toss-blue hover:bg-toss-blue-light/5 transition-all mt-2"
                >
                  + 부번호 추가
                </button>
              </div>

              <!-- 학생 번호 영역 -->
              <div class="p-6 flex justify-between items-center">
                <label
                  for="student-phone-edit"
                  class="font-bold text-toss-grey-400 text-[15px]"
                  >학생 본인 휴대폰</label
                >
                <input
                  id="student-phone-edit"
                  bind:value={editingStudent.studentPhone}
                  class="text-right font-black text-toss-grey-600 text-[17px] bg-transparent border-none outline-none w-1/2"
                  placeholder="010-0000-0000"
                />
              </div>

              <!-- 학교 / 학년 -->
              <div class="p-6 grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label
                    for="student-school-edit"
                    class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                    >학교명</label
                  >
                  <input
                    id="student-school-edit"
                    bind:value={editingStudent.school}
                    class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-bold text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label
                    for="student-grade-edit"
                    class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                    >학년</label
                  >
                  <select
                    id="student-grade-edit"
                    bind:value={editingStudent.grade}
                    class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-bold text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all"
                  >
                    {#each settings.data.academy.gradeSystem as grade}
                      <option value={grade}>{grade}</option>
                    {/each}
                  </select>
                </div>
              </div>

              <!-- 주소 -->
              <div class="p-6 space-y-2">
                <label
                  for="student-address-edit"
                  class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                  >집 주소</label
                >
                <input
                  id="student-address-edit"
                  bind:value={editingStudent.address}
                  class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-bold text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all text-[14px]"
                />
              </div>

              <!-- 특이사항 -->
              <div class="p-6 space-y-2">
                <label
                  for="student-notes-edit"
                  class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
                  >특이사항 (알러지, 수업태도 등)</label
                >
                <textarea
                  id="student-notes-edit"
                  bind:value={editingStudent.specialNotes}
                  class="w-full bg-toss-grey-50 px-4 py-3 rounded-xl border-none font-medium text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 transition-all text-[14px] min-h-[100px] resize-none"
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Action Buttons -->
          <footer class="flex gap-4 pt-10">
            <button
              onclick={() => deleteStudent(editingStudent.id!)}
              class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
              title="원생 삭제"
            >
              <Trash2 size={24} />
            </button>
            <button
              onclick={saveStudent}
              class="flex-1 h-16 bg-toss-blue text-white rounded-[28px] font-black text-[18px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> 변경사항 저장하기
            </button>
          </footer>
        </div>
      {:else if activeTab === "record"}
        <div class="space-y-6 h-full overflow-y-auto pr-2" in:fade>
          <div class="grid grid-cols-1 gap-4">
            {#each selectedStudent.classes as clsName}
              {@const cls = settings.data.classes.find(
                (c) => c.name === clsName,
              )}
              <div
                class="p-6 bg-white border border-toss-grey-100 rounded-[32px] flex justify-between items-center group hover:border-toss-blue/30 transition-all shadow-sm"
              >
                <div class="flex items-center gap-5">
                  <div
                    class="w-14 h-14 rounded-2xl bg-toss-blue/5 text-toss-blue flex items-center justify-center font-black text-[20px]"
                  >
                    {clsName[0]}
                  </div>
                  <div>
                    <p class="text-[17px] font-black text-toss-grey-600">
                      {clsName}
                    </p>
                    <p class="text-[13px] font-bold text-toss-grey-300">
                      {cls?.day?.join(", ") || "요일 미정"} | {cls?.time ||
                        "시간 미정"}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-[15px] font-black text-toss-blue">
                    ₩{fmt(cls?.fee || 350000)}
                  </p>
                  <p class="text-[12px] font-bold text-toss-grey-300">
                    {cls?.billingType === "flat" ? "월정액" : "회수제"}
                  </p>
                </div>
              </div>
            {:else}
              <div
                class="py-20 text-center bg-toss-grey-50 rounded-[40px] border border-dashed border-toss-grey-100"
              >
                <p class="text-toss-grey-300 font-bold">
                  등록된 수강 정보가 없습니다.
                </p>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeTab === "payment"}
        <div class="space-y-6 h-full overflow-y-auto pr-2" in:fade>
          <div
            class="bg-red-50 p-8 rounded-[32px] border border-red-100 flex justify-between items-center shadow-sm"
          >
            <div>
              <p
                class="text-[13px] font-black text-red-400 uppercase tracking-widest mb-1"
              >
                현재 납부할 금액
              </p>
              <p class="text-[32px] font-black text-red-500">
                ₩{fmt(selectedStudent.unpaid)}
              </p>
            </div>
            {#if selectedStudent.unpaid > 0}
              <button
                onclick={() => {
                  const amount = selectedStudent.unpaid;
                  settings.data.payments.unshift({
                    id: `pay_${Date.now()}`,
                    studentId: selectedStudent.id,
                    amount: amount,
                    method: "카드",
                    type: "카드",
                    description: `${selectedStudent.name} 수납 정산 (드로어)`,
                    date: new Date().toISOString().split("T")[0],
                    status: "completed",
                    productIds: selectedStudent.productIds,
                  });
                  selectedStudent.unpaid = 0;
                  alert("수납 처리가 완료되었습니다.");
                }}
                class="bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-[16px] hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-200"
              >
                즉시 수납
              </button>
            {/if}
          </div>

          <div class="space-y-4">
            <h4
              class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest"
            >
              결제 이력
            </h4>
            <div
              class="bg-white border border-toss-grey-100 rounded-[32px] overflow-hidden"
            >
              <table class="w-full">
                <thead class="bg-toss-grey-50">
                  <tr
                    class="text-[11px] font-black text-toss-grey-300 text-left"
                  >
                    <th class="py-4 px-6">결제일</th>
                    <th class="py-4 px-6">내용</th>
                    <th class="py-4 px-6 text-right">금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-toss-grey-50">
                  {#each studentPayments as pay}
                    <tr class="hover:bg-toss-grey-50/50 transition-colors">
                      <td
                        class="py-5 px-6 font-bold text-toss-grey-400 text-[13px]"
                        >{pay.date}</td
                      >
                      <td
                        class="py-5 px-6 font-black text-toss-grey-600 text-[14px]"
                        >{pay.description}</td
                      >
                      <td class="py-5 px-6 text-right font-black text-[14px]"
                        >₩{fmt(pay.amount)}</td
                      >
                    </tr>
                  {:else}
                    <tr
                      ><td
                        colspan="3"
                        class="py-10 text-center text-toss-grey-300 font-bold"
                        >결제 이력이 없습니다.</td
                      ></tr
                    >
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {:else if activeTab === "consult"}
        <div class="grid grid-cols-2 gap-6 h-full overflow-hidden pt-2" in:fade>
          <!-- 왼쪽: 과거 상담 타임라인 -->
          <div
            class="space-y-4 overflow-y-auto pr-2 custom-scroll max-h-[600px] pb-10"
          >
            <h4
              class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest px-2"
            >
              과거 상담 히스토리
            </h4>
            {#each studentConsultations as c}
              <div
                class="p-5 bg-white border border-toss-grey-100 rounded-[28px] relative group hover:border-toss-blue/30 transition-all shadow-sm"
              >
                <div class="flex justify-between items-start mb-3">
                  <div class="flex flex-col gap-1">
                    <span
                      class="text-[11px] font-black text-toss-blue bg-toss-blue-light/50 px-2 py-0.5 rounded-lg w-fit"
                      >{c.type || "전화"}</span
                    >
                    <span
                      class="text-[14px] font-black text-toss-grey-600 leading-tight"
                      >{c.date}</span
                    >
                  </div>
                  {#if c.tags?.length}
                    <div class="flex flex-wrap gap-1 justify-end max-w-[80px]">
                      {#each c.tags as tag}
                        <span
                          class="text-[9px] font-black text-toss-grey-300 border border-toss-grey-100 px-1 py-0.5 rounded"
                          >{tag}</span
                        >
                      {/each}
                    </div>
                  {/if}
                </div>
                <p
                  class="text-[13px] font-medium text-toss-grey-500 line-clamp-3 leading-relaxed"
                >
                  "{c.note}"
                </p>
              </div>
            {:else}
              <div
                class="bg-toss-grey-25 border border-dashed border-toss-grey-100 rounded-[28px] p-10 text-center"
              >
                <p class="text-toss-grey-300 font-bold text-[13px]">
                  상담 이력이 없습니다.
                </p>
              </div>
            {/each}
          </div>

          <!-- 오른쪽: 신규 상담 작성 (D) -->
          <div
            class="space-y-6 bg-toss-grey-50/50 p-6 rounded-[32px] border border-toss-grey-100 overflow-y-auto custom-scroll max-h-[600px] pb-10"
          >
            <h4
              class="text-[15px] font-black text-toss-grey-600 border-l-4 border-toss-blue pl-4 mb-2"
            >
              신규 상담 작성
            </h4>

            <div class="space-y-4">
              <div class="space-y-2">
                <label
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >상담 유형</label
                >
                <div class="grid grid-cols-3 gap-2">
                  {#each ["전화", "대면", "카톡"] as type}
                    <button
                      class="py-3 rounded-2xl bg-white border border-toss-grey-100 text-[13px] font-black text-toss-grey-400 hover:border-toss-blue hover:text-toss-blue transition-all"
                    >
                      {type}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >상담 내용 (메모)</label
                >
                <textarea
                  class="w-full bg-white border border-toss-grey-100 rounded-2xl p-4 h-32 text-[14px] font-medium text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 focus:border-toss-blue transition-all resize-none"
                  placeholder="상담 상세 내용을 입력하세요..."
                ></textarea>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >태그 설정</label
                >
                <div class="flex flex-wrap gap-2">
                  {#each ["미납", "성적", "출결", "태도"] as tag}
                    <button
                      class="px-3 py-1.5 rounded-xl bg-toss-blue/[0.04] border border-toss-blue/10 text-[11px] font-black text-toss-blue/60 hover:bg-toss-blue hover:text-white hover:border-toss-blue transition-all"
                    >
                      #{tag}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="space-y-2">
                <label
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >후속 조치 (다음 상담일/숙제 등)</label
                >
                <input
                  type="text"
                  class="w-full bg-white border border-toss-grey-100 rounded-2xl px-5 h-12 text-[14px] font-medium text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 focus:border-toss-blue transition-all"
                  placeholder="예: 보강 제안, 다음주 월요일 확인 상담"
                />
              </div>

              <button
                class="w-full h-14 bg-toss-blue text-white rounded-2xl font-black text-[16px] shadow-lg shadow-toss-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
              >
                상담기록 저장하기
              </button>
            </div>
          </div>
        </div>
      {:else if activeTab === "score"}
        <div class="space-y-8 h-full overflow-y-auto pr-2" in:fade>
          <!-- Scores -->
          <section class="space-y-4">
            <h4
              class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest ml-2"
            >
              성적 분석 리포트
            </h4>
            <div class="grid grid-cols-1 gap-4">
              {#each studentScores as s}
                <div
                  class="p-8 bg-white border border-toss-grey-100 rounded-[40px] flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p
                      class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest mb-1"
                    >
                      Exam Title
                    </p>
                    <p class="text-[20px] font-black text-toss-grey-600">
                      {settings.data.exams.find((e) => e.id === s.examId)
                        ?.name || "알 수 없는 시험"}
                    </p>
                    <div class="flex items-center gap-3 mt-3">
                      {#if s.prevTotal && s.total > s.prevTotal}
                        <span
                          class="px-2 py-0.5 rounded bg-blue-50 text-toss-blue text-[11px] font-black"
                          >↑ {s.total - s.prevTotal}점 상승</span
                        >
                      {/if}
                      <span class="text-[13px] font-bold text-toss-grey-400"
                        >{settings.data.exams.find((e) => e.id === s.examId)
                          ?.date} 시행</span
                      >
                    </div>
                  </div>
                  <div class="text-right flex flex-col items-end">
                    <div
                      class="w-16 h-16 rounded-2xl bg-toss-blue-light/50 flex items-center justify-center mb-2"
                    >
                      <TrendingUp size={28} class="text-toss-blue" />
                    </div>
                    <p
                      class="text-[36px] font-black text-toss-blue leading-none"
                    >
                      {s.total}<span class="text-[16px] text-toss-grey-300 ml-1"
                        >/ 100</span
                      >
                    </p>
                  </div>
                </div>
              {:else}
                <div
                  class="py-20 text-center bg-toss-grey-50 rounded-[40px] border border-dashed border-toss-grey-100"
                >
                  <p class="text-toss-grey-300 font-bold">
                    등록된 성적 데이터가 없습니다.
                  </p>
                </div>
              {/each}
            </div>
          </section>

          <!-- Homeworks -->
          <section class="space-y-4">
            <h4
              class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest ml-2"
            >
              최근 과제 제출 현황
            </h4>
            <div class="space-y-3">
              {#each settings.data.submissions.filter((sub) => sub.studentId === selectedStudent.id) as sub}
                <div
                  class="p-6 bg-white border border-toss-grey-100 rounded-[32px] flex justify-between items-center"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="w-10 h-10 rounded-xl {sub.status === 'done'
                        ? 'bg-green-50 text-green-500'
                        : 'bg-red-50 text-red-500'} flex items-center justify-center"
                    >
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p class="text-[15px] font-black text-toss-grey-600">
                        {settings.data.homework.find(
                          (h) => h.id === sub.homeworkId,
                        )?.title || "알 수 없는 과제"}
                      </p>
                      <p class="text-[12px] font-bold text-toss-grey-400">
                        마감: {settings.data.homework.find(
                          (h) => h.id === sub.homeworkId,
                        )?.dueDate}
                      </p>
                    </div>
                  </div>
                  <span
                    class="px-3 py-1 rounded-xl text-[12px] font-black {sub.status ===
                    'done'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'}"
                  >
                    {sub.status === "done" ? "제출 완료" : "미제출"}
                  </span>
                </div>
              {/each}
            </div>
          </section>
        </div>
      {:else if activeTab === "attendance"}
        <div class="space-y-6 h-full overflow-y-auto pr-2" in:fade>
          <div
            class="bg-white border border-toss-grey-100 rounded-[40px] p-8 space-y-6"
          >
            <div class="flex justify-between items-center">
              <h4 class="text-[17px] font-black text-toss-grey-600">
                월간 출결 캘린더
              </h4>
              <div class="flex gap-2">
                <span
                  class="flex items-center gap-1.5 text-[12px] font-bold text-toss-grey-400"
                  ><div class="w-2 h-2 rounded-full bg-green-400"></div>
                  출석</span
                >
                <span
                  class="flex items-center gap-1.5 text-[12px] font-bold text-toss-grey-400"
                  ><div class="w-2 h-2 rounded-full bg-red-400"></div>
                  결석</span
                >
              </div>
            </div>

            <div class="grid grid-cols-7 gap-3 text-center">
              {#each ["일", "월", "화", "수", "목", "금", "토"] as d}
                <span
                  class="text-[11px] font-black text-toss-grey-200 uppercase"
                  >{d}</span
                >
              {/each}
              <!-- Dummy empty cells for grid -->
              {#each Array(4) as _}<div></div>{/each}
              {#each Array(27) as _, i}
                {@const date = `2026-01-${String(i + 1).padStart(2, "0")}`}
                {@const att = studentAttendance.find((a) => a.date === date)}
                <div
                  class="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-toss-grey-50 hover:border-toss-blue/20 transition-all cursor-default group relative"
                >
                  <span class="text-[12px] font-bold text-toss-grey-400"
                    >{i + 1}</span
                  >
                  {#if att}
                    <div
                      class="w-2 h-2 rounded-full {att.status === '출석'
                        ? 'bg-green-400'
                        : 'bg-red-400'}"
                    ></div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </Tabs>

    <footer class="pt-10 border-t border-toss-grey-50 flex gap-3 mt-10">
      <button
        onclick={() => deleteStudent(selectedStudent.id)}
        class="h-14 w-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
      >
        <Trash2 size={24} />
      </button>
      <button
        onclick={() => {
          editingStudent = { ...selectedStudent };
          isModalOpen = true;
        }}
        class="flex-1 h-14 bg-toss-grey-600 text-white rounded-2xl font-black text-[16px] hover:bg-toss-grey-700 transition-all"
      >
        상세 정보 수정
      </button>
    </footer>
  {/if}
</Drawer>

<!-- Edit Modal -->
<Modal
  bind:isOpen={isModalOpen}
  title={editingStudent.id ? "원생 정보 수정" : "학생 등록"}
>
  <div class="space-y-6 h-[70vh] overflow-y-auto pr-2 custom-scroll">
    <section class="space-y-4">
      <h4
        class="text-[14px] font-black text-toss-grey-600 border-l-4 border-toss-blue pl-3"
      >
        기본 정보
      </h4>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label
            for="student-name"
            class="text-[12px] font-black text-toss-grey-400">이름</label
          >
          <input
            id="student-name"
            bind:value={editingStudent.name}
            class="toss-input"
            placeholder="이름 입력"
          />
        </div>
        <div class="space-y-2">
          <label class="text-[12px] font-black text-toss-grey-400">성별</label>
          <div class="flex gap-2">
            {#each ["남", "여"] as g}
              <button
                onclick={() => (editingStudent.gender = g as "남" | "여")}
                class="flex-1 h-[48px] rounded-xl font-bold transition-all {editingStudent.gender ===
                g
                  ? 'bg-toss-blue text-white shadow-md'
                  : 'bg-toss-grey-50 text-toss-grey-400'}"
              >
                {g}
              </button>
            {/each}
          </div>
        </div>
      </div>
      <div class="space-y-2">
        <label
          for="student-phone"
          class="text-[12px] font-black text-toss-grey-400">학생 연락처</label
        >
        <input
          id="student-phone"
          bind:value={editingStudent.studentPhone}
          class="toss-input"
          placeholder="010-0000-0000"
        />
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex justify-between items-center">
        <h4
          class="text-[14px] font-black text-toss-grey-600 border-l-4 border-toss-blue pl-3"
        >
          보호자 정보
        </h4>
        <button
          onclick={() =>
            (editingStudent.parentContacts = [
              ...(editingStudent.parentContacts || []),
              { type: "모", name: "", phone: "", isPrimary: false },
            ])}
          class="text-[12px] font-black text-toss-blue hover:underline"
        >
          + 보호자 추가
        </button>
      </div>
      <div class="space-y-4">
        {#each editingStudent.parentContacts || [] as parent, i}
          <div class="p-4 bg-toss-grey-50 rounded-2xl space-y-3 relative group">
            {#if i > 0}
              <button
                onclick={() =>
                  (editingStudent.parentContacts = (
                    editingStudent.parentContacts || []
                  ).filter((_, idx) => idx !== i))}
                class="absolute right-2 top-2 p-1 text-toss-grey-200 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            {/if}
            <div class="grid grid-cols-3 gap-3">
              <select
                bind:value={parent.type}
                class="toss-input bg-white h-[44px]"
              >
                <option value="부">부</option>
                <option value="모">모</option>
                <option value="조부">조부</option>
                <option value="조모">조모</option>
                <option value="기타">기타</option>
              </select>
              <input
                bind:value={parent.name}
                class="toss-input bg-white h-[44px] col-span-2"
                placeholder="보호자 명칭"
              />
            </div>
            <div class="flex gap-3">
              <input
                bind:value={parent.phone}
                class="toss-input bg-white h-[44px] flex-1"
                placeholder="연락처"
              />
              <button
                onclick={() => {
                  (editingStudent.parentContacts || []).forEach(
                    (p) => (p.isPrimary = false),
                  );
                  parent.isPrimary = true;
                }}
                class="px-4 rounded-xl text-[12px] font-black transition-all {parent.isPrimary
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-toss-grey-300 border border-toss-grey-100'}"
              >
                {parent.isPrimary ? "주보호자" : "지정"}
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="space-y-4">
      <h4
        class="text-[14px] font-black text-toss-grey-600 border-l-4 border-toss-blue pl-3"
      >
        학적 정보
      </h4>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label
            for="student-school"
            class="text-[12px] font-black text-toss-grey-400">학교</label
          >
          <input
            id="student-school"
            bind:value={editingStudent.school}
            class="toss-input"
            placeholder="학교명"
          />
        </div>
        <div class="space-y-2">
          <label
            for="student-grade"
            class="text-[12px] font-black text-toss-grey-400">학년</label
          >
          <select
            id="student-grade"
            bind:value={editingStudent.grade}
            class="toss-input"
          >
            {#each settings.data.academy.gradeSystem as g}
              <option value={g}>{g}</option>
            {/each}
          </select>
        </div>
      </div>
    </section>

    <button
      onclick={saveStudent}
      class="w-full h-16 bg-toss-blue text-white rounded-[28px] font-black text-[18px] mt-4 shadow-xl shadow-toss-blue/20 hover:bg-toss-blue-dark transition-all active:scale-95"
    >
      저장하기
    </button>
  </div>
</Modal>

<!-- Promotion & Grade Management Drawer -->
<Drawer
  bind:isOpen={isPromotionModalOpen}
  title="학년 체계 및 일괄 진급 관리"
  width="1100px"
>
  <div class="px-12 py-10 space-y-12 pb-40">
    <!-- Header with Steps -->
    <header class="flex justify-between items-center">
      <div class="space-y-1">
        <h2 class="text-[32px] font-black text-toss-grey-800 tracking-tight">
          스마트 진급 가이드 🚀
        </h2>
        <p class="text-[16px] font-bold text-toss-grey-500">
          학년 상향 및 반 배정을 직관적으로 관리하세요.
        </p>
      </div>
      <div
        class="flex p-1.5 bg-toss-grey-50 rounded-[24px] border border-toss-grey-100 shadow-inner"
      >
        <button
          onclick={() => (promotionStep = "config")}
          class="px-8 py-3 rounded-2xl text-[14px] font-black transition-all {promotionStep ===
          'config'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400'}">1. 체계 설정</button
        >
        <button
          onclick={() => (promotionStep = "preview")}
          class="px-8 py-3 rounded-2xl text-[14px] font-black transition-all {promotionStep ===
          'preview'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400'}">2. 대상 및 반 배정</button
        >
      </div>
    </header>

    {#if promotionStep === "config"}
      <!-- Config Section -->
      <section class="space-y-8" in:fade>
        <div class="flex justify-between items-end">
          <div class="space-y-4">
            <h4
              class="text-[18px] font-black text-toss-grey-800 flex items-center gap-2"
            >
              <Settings size={20} class="text-toss-blue" /> 학원 학년 체계 정의
            </h4>
            <p class="text-[14px] font-bold text-toss-grey-500 ml-7">
              콤마(,)로 구분하여 낮은 학년부터 순서대로 입력하세요. 마지막
              단계는 졸업 처리됩니다.
            </p>
          </div>
        </div>

        <div class="relative">
          <textarea
            value={settings.data.academy.gradeSystem.join(", ")}
            oninput={(e) => {
              settings.data.academy.gradeSystem = (
                e.target as HTMLTextAreaElement
              ).value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            }}
            class="w-full h-40 p-8 rounded-[40px] bg-toss-grey-50 border-2 border-transparent focus:border-toss-blue focus:bg-white font-black text-[19px] text-toss-grey-700 outline-none transition-all shadow-inner leading-relaxed"
            placeholder="초1, 초2, 초3..."
          ></textarea>
        </div>

        <div
          class="bg-white border border-toss-grey-100 rounded-[40px] overflow-hidden shadow-sm"
        >
          <table class="w-full text-left">
            <thead class="bg-toss-grey-50 border-b border-toss-grey-100">
              <tr class="text-[12px] font-black text-toss-grey-400">
                <th class="p-6 text-center">순서</th>
                <th class="p-6 pl-10">현재 학년</th>
                <th class="p-6 text-center"></th>
                <th class="p-6">진급 후 대상</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-50">
              {#each Object.entries(promotionMapping) as [curr, next], i}
                <tr class="hover:bg-toss-grey-50/50 transition-all">
                  <td class="p-6 text-center">
                    <span
                      class="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-toss-grey-100 text-[12px] font-black text-toss-grey-500"
                      >{i + 1}</span
                    >
                  </td>
                  <td
                    class="p-6 pl-10 text-[17px] font-black text-toss-grey-700"
                    >{curr}</td
                  >
                  <td class="text-center"
                    ><ChevronRight
                      size={18}
                      class="text-toss-grey-200 inline"
                    /></td
                  >
                  <td
                    class="p-6 text-[17px] font-black {next === '졸업/퇴원'
                      ? 'text-red-500'
                      : 'text-toss-blue'}">{next}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-10">
          <button
            onclick={() => (promotionStep = "preview")}
            class="toss-btn-primary px-12 h-20 rounded-[32px] font-black text-[18px] flex items-center gap-4 shadow-xl shadow-toss-blue/20"
          >
            다음 단계: 원생별 반 배정하기 <ChevronRight size={24} />
          </button>
        </div>
      </section>
    {:else}
      <!-- Preview & Assign Section -->
      <section class="space-y-10" in:fade>
        <div
          class="flex justify-between items-center bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm"
        >
          <div class="space-y-2">
            <h4 class="text-[20px] font-black text-toss-grey-800">
              진급 대상 원생 검토 ({promotionWorkspace.length}명)
            </h4>
            <p class="text-[14px] font-bold text-toss-grey-500">
              각 학생이 이동할 새로운 반을 선택하세요. 수강료가 자동 연동됩니다.
            </p>
          </div>
          <div class="flex gap-4">
            <button
              onclick={() => (promotionStep = "config")}
              class="px-6 h-14 bg-toss-grey-100 rounded-2xl font-black text-toss-grey-600 hover:bg-toss-grey-200 transition-all"
              >설정으로 돌아가기</button
            >
          </div>
        </div>

        <div class="space-y-6">
          {#each settings.data.academy.gradeSystem as grade}
            {@const gradeStudents = promotionWorkspace.filter(
              (s) => s.currentGrade === grade,
            )}
            {#if gradeStudents.length > 0}
              <div class="space-y-4">
                <h5
                  class="text-[16px] font-black text-toss-blue pl-4 border-l-4 border-toss-blue"
                >
                  {grade} 대상자
                  <span class="text-toss-grey-400 font-bold ml-2"
                    >({gradeStudents.length}명)</span
                  >
                </h5>
                <div
                  class="bg-white border border-toss-grey-100 rounded-[32px] overflow-hidden shadow-sm"
                >
                  <table class="w-full text-left">
                    <thead class="bg-toss-grey-25 border-b border-toss-grey-50">
                      <tr
                        class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest"
                      >
                        <th class="w-[60px] p-5 text-center">선택</th>
                        <th class="p-5 pl-8">이름</th>
                        <th class="p-5 w-[140px]">기존 학년</th>
                        <th class="p-5 w-[140px]">진급 학년</th>
                        <th class="p-5">배정 될 반 (이동)</th>
                        <th class="p-5 text-right pr-10">예상 수강료</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-50">
                      {#each gradeStudents as s (s.id)}
                        <tr
                          class="hover:bg-toss-grey-50/50 transition-all {s.nextGrade ===
                          '졸업/퇴원'
                            ? 'opacity-60 bg-red-50/10'
                            : ''}"
                        >
                          <td class="p-5 text-center">
                            <input
                              type="checkbox"
                              bind:checked={s.isSelected}
                              class="w-5 h-5 rounded-md border-toss-grey-200 text-toss-blue focus:ring-toss-blue/20"
                            />
                          </td>
                          <td class="p-5 pl-8 font-black text-toss-grey-700"
                            >{s.name}</td
                          >
                          <td
                            class="p-5 text-[14px] font-bold text-toss-grey-400"
                            >{s.currentGrade}</td
                          >
                          <td
                            class="p-5 text-[14px] font-black {s.nextGrade ===
                            '졸업/퇴원'
                              ? 'text-red-500'
                              : 'text-toss-blue'}"
                          >
                            {s.nextGrade}
                          </td>
                          <td class="p-5">
                            {#if s.nextGrade !== "졸업/퇴원"}
                              <select
                                onchange={(e) =>
                                  handleClassChange(
                                    s.id,
                                    (e.target as HTMLSelectElement).value,
                                  )}
                                class="w-full h-12 px-4 rounded-xl bg-toss-grey-50 border border-toss-grey-100 text-[13px] font-black text-toss-grey-600 focus:bg-white focus:border-toss-blue outline-none transition-all cursor-pointer"
                              >
                                <option value="">반을 선택하세요..</option>
                                {#each settings.data.classes as cls}
                                  <option value={cls.id}
                                    >{cls.name} (定 {cls.fee.toLocaleString()}원)</option
                                  >
                                {/each}
                              </select>
                            {:else}
                              <span class="text-[12px] font-bold text-red-400"
                                >자동 졸업 (반 배정 제외)</span
                              >
                            {/if}
                          </td>
                          <td
                            class="p-5 text-right pr-10 font-black text-toss-grey-700"
                          >
                            {s.fee > 0 ? `₩${s.fee.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/if}
          {/each}
        </div>

        <div class="fixed bottom-10 right-10 flex gap-4">
          <button
            class="px-10 h-20 bg-white border border-toss-grey-200 rounded-[32px] font-black text-[18px] text-toss-grey-500 shadow-xl hover:bg-toss-grey-50 transition-all"
            onclick={() => (isPromotionModalOpen = false)}>취소</button
          >
          <button
            onclick={applySmartPromotion}
            class="px-16 h-20 bg-toss-blue text-white rounded-[32px] font-black text-[20px] shadow-2xl shadow-toss-blue/30 hover:scale-[1.05] transition-all flex items-center gap-4 animate-bounce-subtle"
          >
            <TrendingUp size={24} strokeWidth={3} />
            {promotionWorkspace.filter((s) => s.isSelected).length}명 진급 확정
            및 수강료 청구
          </button>
        </div>
      </section>
    {/if}
  </div>
</Drawer>
