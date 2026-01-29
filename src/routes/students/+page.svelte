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
    Settings,
    UserCheck,
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
      grade: "초1",
      status: "재원",
      regDate: new Date().toISOString().split("T")[0],
      unpaid: 0,
      unpaidDays: 0,
      consultationCount: 0,
      productIds: [],
      classes: [],
      memo: "",
      specialNotes: "",
    };
    isDrawerOpen = true;
    activeTab = "info";
  }

  function saveStudent() {
    if (!editingStudent.name || !editingStudent.studentPhone) {
      toast.show("필수 정보를 입력해주세요.", "error");
      return;
    }

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
    isDrawerOpen = false;
    toast.show("저장되었습니다.", "success");
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
  let activePreviewGrade = $state(""); // 현재 보고 있는 학년 탭

  // 가상의 진급 데이터 (미리보기용)
  let promotionWorkspace = $state<
    {
      id: string;
      name: string;
      currentGrade: string;
      nextGrade: string;
      assignments: {
        currentClassName: string;
        targetClassId: string | null;
        fee: number;
        originalFee: number;
      }[];
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

  // 진급 데이터 그룹화 (성능 최적화: 필터링 부하 감소)
  const groupedPromotionWorkspace = $derived.by(() => {
    const groups: Record<string, typeof promotionWorkspace> = {};
    settings.data.academy.gradeSystem.forEach((g) => (groups[g] = []));
    promotionWorkspace.forEach((s) => {
      if (groups[s.currentGrade]) groups[s.currentGrade].push(s);
    });
    return groups;
  });

  function openPromotion() {
    // 진급 데이터 초기화 (기본값으로 기존 반 유지 로직 추가)
    promotionWorkspace = settings.data.students
      .filter((s) => s.status !== "퇴원")
      .map((s) => {
        const next = promotionMapping[s.grade] || s.grade;

        // 다중 반 배정 데이터 초기화
        const assignments = s.classes.map((className) => {
          const currentClassObj = settings.data.classes.find(
            (c) => c.name === className,
          );
          return {
            currentClassName: className,
            targetClassId: currentClassObj?.id || null,
            fee: currentClassObj?.fee || 0,
            originalFee: currentClassObj?.fee || 0,
          };
        });

        // 반이 하나도 없는 경우 (신규생 등) 대비
        if (assignments.length === 0) {
          assignments.push({
            currentClassName: "없음",
            targetClassId: null,
            fee: 0,
            originalFee: 0,
          });
        }

        return {
          id: s.id,
          name: s.name,
          currentGrade: s.grade,
          nextGrade: next,
          assignments,
          isSelected: true,
        };
      });
    promotionStep = "config";
    isPromotionModalOpen = true;
    activePreviewGrade = settings.data.academy.gradeSystem[0] || "";
  }

  function handleClassChange(
    studentId: string,
    assignmentIdx: number,
    classId: string,
  ) {
    const student = promotionWorkspace.find((s) => s.id === studentId);
    if (student && student.assignments[assignmentIdx]) {
      const cls = settings.data.classes.find((c) => c.id === classId);
      student.assignments[assignmentIdx].targetClassId = classId;
      student.assignments[assignmentIdx].fee = cls?.fee || 0;
    }
  }

  function applySmartPromotion() {
    const targets = promotionWorkspace.filter((s) => s.isSelected);
    if (targets.length === 0) {
      toast.show("선택된 학생이 없습니다.", "info");
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
          student.classes = [];
        } else {
          student.grade = t.nextGrade;

          // 2. 다중 반 배정 처리
          const newClasses: string[] = [];
          t.assignments.forEach((assign) => {
            const newCls = settings.data.classes.find(
              (c) => c.id === assign.targetClassId,
            );
            if (newCls) {
              newClasses.push(newCls.name);

              // 3. 수강료 청구서 생성 (각 과목별)
              settings.data.payments.unshift({
                id: `pay_${Date.now()}_${student.id}_${newCls.id}`,
                studentId: student.id,
                amount: newCls.fee,
                date: new Date().toISOString().slice(0, 10),
                description: `${t.nextGrade} 진급 수강료 (${newCls.name})`,
                type: "이체",
                status: "pending",
              });
            }
          });
          student.classes = newClasses;
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
    class="bg-white rounded-[40px] border border-toss-grey-50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)]"
  >
    <!-- Table Header (Synced with body) -->
    <div
      class="overflow-x-auto bg-toss-grey-50 border-b border-toss-grey-100 pr-[10px]"
    >
      <table
        class="w-full text-left border-collapse table-fixed whitespace-nowrap"
      >
        <thead>
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
            <th class="w-[120px] p-4">이름</th>
            <th class="w-[140px] p-4">학교 / 학년</th>
            <th class="w-[180px] p-4">연락처</th>
            <th class="w-[180px] p-4">메모</th>
            <th class="p-4">수강 클래스</th>
            <th class="w-[100px] p-4 text-center">최근 출결</th>
            <th class="w-[100px] p-4 text-center">최근 상담일</th>
            <th class="w-[140px] p-4 pr-10 text-right">납부 상태</th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- Table Body (Virtual Scroll) -->
    <div
      class="flex-1 overflow-y-auto overflow-x-auto relative custom-scroll h-full"
      onscroll={handleScroll}
    >
      <div
        style="height: {filteredStudents.length * 72}px; position: relative;"
      >
        <table
          class="w-full text-left border-collapse table-fixed absolute top-0 left-0"
          style="transform: translateY({offsetY}px)"
        >
          <tbody class="divide-y divide-toss-grey-50/50">
            {#each visibleStudents as s (s.id)}
              {@const studentTotalFee = settings.data.classes
                .filter((c) => s.classes.includes(c.name))
                .reduce((sum, c) => sum + c.fee, 0)}
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
                <td class="w-[120px] p-4 truncate">
                  <div
                    class="text-[15px] font-black text-toss-grey-600 transition-colors group-hover:text-toss-blue"
                  >
                    {s.name}
                  </div>
                </td>
                <td class="w-[140px] p-4">
                  <div class="flex flex-col gap-0.5 whitespace-normal">
                    <span
                      class="text-[14px] font-black text-toss-grey-800 line-clamp-1"
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
                <td class="w-[180px] p-4">
                  <p
                    class="text-[13px] font-medium text-toss-grey-600 truncate"
                    title={s.memo}
                  >
                    {s.memo || "-"}
                  </p>
                </td>
                <td class="p-4 overflow-hidden">
                  <div
                    class="flex flex-wrap gap-1 max-h-[56px] overflow-hidden"
                  >
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
                <td class="w-[100px] p-4 text-center">
                  <span class="text-[13px] font-bold text-toss-grey-600"
                    >{s.recentAttendance || "-"}</span
                  >
                </td>
                <td class="w-[100px] p-4 text-center">
                  <span class="text-[13px] font-bold text-toss-grey-600"
                    >{s.lastConsultationDate || "-"}</span
                  >
                </td>
                <td class="w-[140px] p-4 pr-10 text-right">
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
                    {#if s.status === "재원" && studentTotalFee > 0}
                      <span class="text-[12px] font-black text-toss-blue"
                        >₩{fmt(studentTotalFee)}</span
                      >
                    {:else if s.unpaid > 0}
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
          <section class="grid grid-cols-2 gap-3">
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

          <!-- Tab-specific footer removed, using common drawer footer -->
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
              <div class="space-y-3">
                <label
                  for="consult-type"
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >상담 유형</label
                >
                <div class="grid grid-cols-3 gap-2" id="consult-type">
                  {#each ["전화", "대면", "카톡"] as type}
                    <button
                      class="py-3 rounded-2xl bg-white border border-toss-grey-100 text-[13px] font-black text-toss-grey-400 hover:border-toss-blue hover:text-toss-blue transition-all"
                    >
                      {type}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="space-y-3">
                <label
                  for="consult-note"
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >상담 내용 (메모)</label
                >
                <textarea
                  id="consult-note"
                  class="w-full bg-white border border-toss-grey-100 rounded-2xl p-4 h-32 text-[14px] font-medium text-toss-grey-600 outline-none focus:ring-4 focus:ring-toss-blue/5 focus:border-toss-blue transition-all resize-none"
                  placeholder="상담 상세 내용을 입력하세요..."
                ></textarea>
              </div>

              <div class="space-y-3">
                <label
                  for="consult-tags"
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >태그 설정</label
                >
                <div class="flex flex-wrap gap-2" id="consult-tags">
                  {#each ["미납", "성적", "출결", "태도"] as tag}
                    <button
                      class="px-3 py-1.5 rounded-xl bg-toss-blue/[0.04] border border-toss-blue/10 text-[11px] font-black text-toss-blue/60 hover:bg-toss-blue hover:text-white hover:border-toss-blue transition-all"
                    >
                      #{tag}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="space-y-3">
                <label
                  for="consult-followup"
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest pl-1"
                  >후속 조치</label
                >
                <input
                  id="consult-followup"
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

    <footer class="pt-8 border-t border-toss-grey-50 flex gap-4 mt-8">
      <button
        onclick={() => deleteStudent(selectedStudent.id!)}
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
  {/if}
</Drawer>

<!-- Edit Modal Removed since drawer is fully editable -->

<!-- Promotion & Grade Management Drawer -->
<Drawer bind:isOpen={isPromotionModalOpen} title="" width="1100px">
  <div class="px-10 py-6 space-y-8 pb-40">
    <!-- Compact Header with Steps -->
    <header class="flex justify-between items-start">
      <div class="flex items-center gap-3">
        <h2 class="text-[22px] font-black text-toss-grey-800 tracking-tight">
          스마트 진급 가이드 🚀
        </h2>
        <div class="h-4 w-[1px] bg-toss-grey-100"></div>
        <p class="text-[13px] font-bold text-toss-grey-400">
          학년 상향 및 반 배정을 직관적으로 관리하세요.
        </p>
      </div>
      <div
        class="flex p-1 bg-toss-grey-50 rounded-[18px] border border-toss-grey-100 shadow-inner mr-14"
      >
        <button
          onclick={() => (promotionStep = "config")}
          class="px-5 py-1.5 rounded-2xl text-[12px] font-black transition-all {promotionStep ===
          'config'
            ? 'bg-white shadow-sm text-toss-blue'
            : 'text-toss-grey-400'}">1. 체계 설정</button
        >
        <button
          onclick={() => (promotionStep = "preview")}
          class="px-5 py-1.5 rounded-2xl text-[12px] font-black transition-all {promotionStep ===
          'preview'
            ? 'bg-white shadow-sm text-toss-blue'
            : 'text-toss-grey-400'}">2. 대상 및 반 배정</button
        >
      </div>
    </header>

    {#if promotionStep === "config"}
      <!-- Config Section: Split Layout (Left: Input, Right: Map) -->
      <section class="grid grid-cols-2 gap-10 h-full" in:fade>
        <div class="space-y-6">
          <div class="space-y-3">
            <h4
              class="text-[16px] font-black text-toss-grey-800 flex items-center gap-2"
            >
              <Settings size={18} class="text-toss-blue" /> 1. 학급 학년 체계
            </h4>
            <p
              class="text-[13px] font-bold text-toss-grey-400 leading-relaxed pl-7"
            >
              콤마(,)로 구분하여 입력하세요. 마지막 단계는 졸업 처리됩니다.
            </p>
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
              class="w-full h-64 p-6 rounded-[32px] bg-toss-grey-50 border-2 border-transparent focus:border-toss-blue focus:bg-white font-bold text-[16px] text-toss-grey-700 outline-none transition-all shadow-inner leading-relaxed"
              placeholder="초1, 초2, 초3..."
            ></textarea>
            <div
              class="absolute right-6 bottom-6 px-3 py-1 bg-white rounded-full border border-toss-grey-100 text-[11px] font-black text-toss-blue shadow-sm"
            >
              총 {settings.data.academy.gradeSystem.length}단계
            </div>
          </div>

          <div
            class="p-6 bg-toss-blue-light/10 rounded-3xl border border-toss-blue/5 space-y-2"
          >
            <p
              class="text-[14px] font-black text-toss-blue flex items-center gap-2"
            >
              <Clock size={16} /> 변경 시 주의사항
            </p>
            <p
              class="text-[12px] font-medium text-toss-grey-500 leading-relaxed"
            >
              매핑 순서가 바뀌면 진급 대상 학년도 함께 변경됩니다. 데이터
              정합성을 위해 배열 순서에 유의해 주세요.
            </p>
          </div>
        </div>

        <div
          class="space-y-6 border-l border-toss-grey-100 pl-10 flex flex-col h-[650px]"
        >
          <h4
            class="text-[16px] font-black text-toss-grey-800 flex items-center gap-2"
          >
            <TrendingUp size={18} class="text-toss-blue" /> 2. 진급 매핑 미리보기
          </h4>

          <div
            class="bg-white border border-toss-grey-100 rounded-[28px] overflow-hidden shadow-sm flex-1 overflow-y-auto custom-scroll"
          >
            <table class="w-full text-left">
              <thead
                class="bg-toss-grey-50 border-b border-toss-grey-100 sticky top-0"
              >
                <tr
                  class="text-[11px] font-black text-toss-grey-400 uppercase tracking-tighter"
                >
                  <th class="p-3 text-center w-[50px]">순서</th>
                  <th class="p-3 pl-5">현재 학년</th>
                  <th class="p-3 text-center w-[30px]"></th>
                  <th class="p-3">진급 후</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-toss-grey-50">
                {#each Object.entries(promotionMapping) as [curr, next], i}
                  <tr class="hover:bg-toss-grey-50/50 transition-all">
                    <td class="p-3 text-center">
                      <span
                        class="w-5 h-5 inline-flex items-center justify-center rounded-lg bg-toss-grey-100 text-[10px] font-black text-toss-grey-500"
                        >{i + 1}</span
                      >
                    </td>
                    <td
                      class="p-3 pl-5 text-[13px] font-black text-toss-grey-700"
                      >{curr}</td
                    >
                    <td class="text-center"
                      ><ChevronRight
                        size={12}
                        class="text-toss-grey-200 inline"
                      /></td
                    >
                    <td
                      class="p-3 text-[13px] font-black {next === '졸업/퇴원'
                        ? 'text-red-500'
                        : 'text-toss-blue'}">{next}</td
                    >
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-2">
            <button
              onclick={() => (promotionStep = "preview")}
              class="toss-btn-primary px-10 h-16 rounded-[24px] font-black text-[16px] flex items-center gap-3 shadow-lg shadow-toss-blue/20"
            >
              상세 원생 배정 단계로 이동 <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    {:else}
      <!-- Preview & Assign Section: Tab Based (No separate header card to pull higher) -->
      <section class="space-y-4" in:fade>
        <div class="flex justify-between items-center">
          <!-- Grade Tabs (More compact) -->
          <div
            class="flex flex-wrap gap-1.5 p-1 bg-toss-grey-50 rounded-[18px] border border-toss-grey-100 shadow-inner"
          >
            {#each settings.data.academy.gradeSystem as grade}
              {@const count = promotionWorkspace.filter(
                (s) => s.currentGrade === grade,
              ).length}
              {#if count > 0}
                <button
                  onclick={() => (activePreviewGrade = grade)}
                  class="px-3 py-1.5 rounded-xl text-[12px] font-black transition-all flex items-center gap-1.5 {activePreviewGrade ===
                  grade
                    ? 'bg-white shadow-sm text-toss-blue'
                    : 'text-toss-grey-400 hover:text-toss-grey-600'}"
                >
                  {grade} <span class="text-[10px] opacity-40">{count}</span>
                </button>
              {/if}
            {/each}
          </div>
          <p class="text-[12px] font-bold text-toss-grey-400 italic">
            * 기존 반이 기본 유지됩니다. 조정이 필요한 학생만 변경하세요.
          </p>
        </div>

        <div class="h-[calc(100vh-320px)] overflow-y-auto custom-scroll pr-2">
          {#each Object.entries(groupedPromotionWorkspace) as [grade, gradeStudents]}
            {#if grade === activePreviewGrade}
              <div
                class="bg-white border border-toss-grey-100 rounded-[28px] overflow-hidden shadow-sm"
              >
                <table class="w-full text-left border-collapse">
                  <thead
                    class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10"
                  >
                    <tr
                      class="text-[10px] font-black text-toss-grey-400 uppercase tracking-widest"
                    >
                      <th class="w-[50px] p-3 text-center">선택</th>
                      <th class="p-3 pl-5">이름</th>
                      <th class="p-3 w-[80px]">학년</th>
                      <th class="p-3 w-[150px]">기존 수강 정보</th>
                      <th class="p-3 w-[250px]">진급 후 배정 반 (이동)</th>
                      <th class="p-3 text-right pr-6">예상 수강료 (변동)</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-toss-grey-50">
                    {#each gradeStudents as s (s.id)}
                      {@const totalOriginalFee = s.assignments.reduce(
                        (sum, a) => sum + a.originalFee,
                        0,
                      )}
                      {@const totalNewFee = s.assignments.reduce(
                        (sum, a) => sum + a.fee,
                        0,
                      )}
                      {@const totalPriceDiff = totalNewFee - totalOriginalFee}
                      <tr
                        class="hover:bg-toss-grey-50/50 transition-all {s.nextGrade ===
                        '졸업/퇴원'
                          ? 'opacity-60 bg-red-50/10'
                          : ''}"
                      >
                        <td class="p-3 text-center align-top pt-5">
                          <input
                            type="checkbox"
                            bind:checked={s.isSelected}
                            class="w-4 h-4 rounded-md border-toss-grey-200 text-toss-blue focus:ring-toss-blue/20"
                          />
                        </td>
                        <td
                          class="p-3 pl-5 font-black text-[13px] text-toss-grey-700 align-top pt-5"
                        >
                          {s.name}
                          <div class="text-[10px] text-toss-grey-400 font-bold">
                            {s.currentGrade} → {s.nextGrade}
                          </div>
                        </td>
                        <td
                          class="p-3 text-[12px] font-bold text-toss-grey-400 align-top pt-5"
                          >{s.nextGrade}</td
                        >
                        <td
                          class="p-3 align-top pt-5 border-l border-toss-grey-50"
                        >
                          <div class="space-y-4">
                            {#each s.assignments as assign}
                              <div class="h-10 flex flex-col justify-center">
                                <div
                                  class="text-[11px] font-bold text-toss-grey-600 truncate max-w-[140px]"
                                  title={assign.currentClassName}
                                >
                                  {assign.currentClassName}
                                </div>
                                {#if assign.originalFee > 0}
                                  <div
                                    class="text-[10px] text-toss-grey-400 font-medium"
                                  >
                                    ₩{assign.originalFee.toLocaleString()}
                                  </div>
                                {/if}
                              </div>
                            {/each}
                          </div>
                        </td>
                        <td
                          class="p-3 align-top pt-5 border-l border-toss-grey-50"
                        >
                          <div class="space-y-4">
                            {#if s.nextGrade !== "졸업/퇴원"}
                              {#each s.assignments as assign, idx}
                                <div class="flex items-center gap-2">
                                  <select
                                    onchange={(e) =>
                                      handleClassChange(
                                        s.id,
                                        idx,
                                        (e.target as HTMLSelectElement).value,
                                      )}
                                    bind:value={assign.targetClassId}
                                    class="w-full h-10 px-3 rounded-lg bg-toss-grey-50 border border-toss-grey-100 text-[11px] font-black text-toss-grey-600 focus:bg-white focus:border-toss-blue outline-none transition-all cursor-pointer"
                                  >
                                    <option value="">취소 (배정 제외)</option>
                                    {#each settings.data.classes as cls}
                                      <option value={cls.id}
                                        >{cls.name} (₩{cls.fee.toLocaleString()})</option
                                      >
                                    {/each}
                                  </select>
                                  {#if settings.data.classes.find((c) => c.id === assign.targetClassId)?.name !== assign.currentClassName}
                                    <span
                                      class="bg-orange-50 text-orange-500 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-orange-100 whitespace-nowrap uppercase"
                                      >Moved</span
                                    >
                                  {/if}
                                </div>
                              {/each}
                            {:else}
                              <span
                                class="text-[10px] font-bold text-red-400 pt-3 block"
                                >자동 졸업 (반 배정 제외)</span
                              >
                            {/if}
                          </div>
                        </td>
                        <td
                          class="p-3 text-right pr-6 font-black text-[13px] text-toss-grey-700 align-top pt-5"
                        >
                          <div
                            class={totalPriceDiff !== 0 ? "text-toss-blue" : ""}
                          >
                            {totalNewFee > 0
                              ? `₩${totalNewFee.toLocaleString()}`
                              : "-"}
                          </div>
                          {#if totalPriceDiff !== 0}
                            <div
                              class="text-[10px] font-black {totalPriceDiff > 0
                                ? 'text-red-400'
                                : 'text-toss-blue'}"
                            >
                              ({totalPriceDiff > 0
                                ? "+"
                                : ""}{totalPriceDiff.toLocaleString()})
                            </div>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          {/each}
        </div>

        <div class="fixed bottom-10 right-10 flex gap-4">
          <button
            class="px-8 h-16 bg-white border border-toss-grey-200 rounded-[24px] font-black text-[16px] text-toss-grey-500 shadow-xl hover:bg-toss-grey-50 transition-all"
            onclick={() => (isPromotionModalOpen = false)}>취소</button
          >
          <button
            onclick={applySmartPromotion}
            class="px-12 h-16 bg-toss-blue text-white rounded-[24px] font-black text-[18px] shadow-2xl shadow-toss-blue/30 hover:scale-[1.05] transition-all flex items-center gap-4 animate-bounce-subtle"
          >
            <TrendingUp size={22} strokeWidth={3} />
            {promotionWorkspace.filter((s) => s.isSelected).length}명 진급 확정
            및 수강료 청구
          </button>
        </div>
      </section>
    {/if}
  </div>
</Drawer>
