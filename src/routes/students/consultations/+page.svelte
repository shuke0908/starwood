<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import type { Consultation } from "$lib/types";
  import { fade, fly, slide, scale } from "svelte/transition";
  import {
    ClipboardList,
    Layout,
    Plus,
    Search,
    Clock,
    User,
    Phone,
    MessageSquare,
    MoreVertical,
    ChevronRight,
    CheckCircle2,
    Trash2,
    Calendar,
    Tag,
    Edit3,
    Save,
    X,
    UserPlus,
    UserMinus,
    UserCheck,
    Download,
  } from "lucide-svelte";
  import Drawer from "$lib/components/Drawer.svelte";

  let activeTab = $state<"ticket" | "record" | "admission">("ticket");
  let activeAdmissionSubTab = $state<"waiting" | "former">("waiting");
  let searchQuery = $state("");
  let isConsultationDrawerOpen = $state(false);
  let isAdmissionDrawerOpen = $state(false);
  let selectedTicketId = $state<string | null>(null);
  let selectedStudentId = $state<string | null>(null);

  const stages = [
    {
      id: "new",
      label: "신규 문의",
      color: "bg-toss-blue",
      desc: "새로운 상담 신청",
    },
    {
      id: "consulting",
      label: "상담 진행",
      color: "bg-orange-400",
      desc: "현재 상담 처리 중",
    },
    {
      id: "payment",
      label: "결제 대기",
      color: "bg-purple-500",
      desc: "수강 등록 결정",
    },
    {
      id: "completed",
      label: "완료",
      color: "bg-green-500",
      desc: "등록 완료 및 종료",
    },
  ];

  const selectedTicket = $derived(
    selectedTicketId
      ? settings.data.consultations.find((t) => t.id === selectedTicketId)
      : null,
  );

  const stageCounts = $derived(
    stages.reduce(
      (acc, s) => {
        acc[s.id] = settings.data.consultations.filter(
          (t) => t.stage === s.id,
        ).length;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  const filteredConsultations = $derived(
    settings.data.consultations.filter(
      (c) => c.name.includes(searchQuery) || c.phone.includes(searchQuery),
    ),
  );

  // Admission derived data
  const waitingList = $derived(
    settings.data.students.filter(
      (s) => s.status === "대기" && s.name.includes(searchQuery),
    ),
  );
  const formerStudents = $derived(
    settings.data.students.filter(
      (s) => s.status === "퇴원" && s.name.includes(searchQuery),
    ),
  );
  const currentAdmissionData = $derived(
    activeAdmissionSubTab === "waiting" ? waitingList : formerStudents,
  );
  const selectedStudent = $derived(
    selectedStudentId
      ? settings.data.students.find((s) => s.id === selectedStudentId)
      : null,
  );

  function openTicket(id: string) {
    selectedTicketId = id;
    isConsultationDrawerOpen = true;
  }

  function openAdmissionDetail(id: string) {
    selectedStudentId = id;
    isAdmissionDrawerOpen = true;
  }

  function moveTicket(id: string, newStage: string) {
    const ticket = settings.data.consultations.find((t) => t.id === id);
    if (ticket) {
      ticket.stage = newStage as any;
    }
  }

  let draggedTicketId = $state<string | null>(null);
  function onDragStart(id: string) {
    draggedTicketId = id;
  }
  function onDrop(stage: string) {
    if (draggedTicketId) {
      moveTicket(draggedTicketId, stage);
      draggedTicketId = null;
    }
  }

  function addTicket() {
    const newTicket: Consultation = {
      id: `c_${Date.now()}`,
      name: "신규 상담자",
      phone: "010-0000-0000",
      stage: "new",
      date: new Date().toISOString().split("T")[0],
      note: "",
      type: "전화문의",
    };
    settings.data.consultations.unshift(newTicket);
    openTicket(newTicket.id);
  }

  function deleteTicket(id: string) {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    settings.data.consultations = settings.data.consultations.filter(
      (t) => t.id !== id,
    );
    selectedTicketId = null;
    isConsultationDrawerOpen = false;
  }

  function changeStudentStatus(id: string, newStatus: any) {
    const student = settings.data.students.find((s) => s.id === id);
    if (student) {
      student.status = newStatus;
      isAdmissionDrawerOpen = false;
    }
  }

  function deleteStudent(id: string) {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    settings.data.students = settings.data.students.filter((s) => s.id !== id);
    isAdmissionDrawerOpen = false;
  }
</script>

<div class="space-y-8 pb-10">
  <!-- Header: Pure Actions & Search -->
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
          placeholder="상담자 이름, 연락처 등으로 검색하세요"
          class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md"
        />
      </div>

      <div
        class="bg-toss-grey-50 p-1.5 rounded-[24px] flex border border-toss-grey-100/50 shadow-inner shrink-0"
      >
        <button
          onclick={() => (activeTab = "ticket")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all flex items-center gap-2 whitespace-nowrap {activeTab ===
          'ticket'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}"
        >
          <Layout size={18} /> 티켓 보드
        </button>
        <button
          onclick={() => (activeTab = "admission")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all flex items-center gap-2 whitespace-nowrap {activeTab ===
          'admission'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}"
        >
          <UserPlus size={18} /> 입학/대기 명단
        </button>
        <button
          onclick={() => (activeTab = "record")}
          class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all flex items-center gap-2 whitespace-nowrap {activeTab ===
          'record'
            ? 'bg-white shadow-md text-toss-blue'
            : 'text-toss-grey-400 hover:text-toss-grey-600'}"
        >
          <ClipboardList size={18} /> 전체 이력
        </button>
      </div>
    </div>

    <button
      onclick={activeTab === "admission" ? () => {} : addTicket}
      class="toss-btn-primary flex items-center gap-2 px-8 h-[64px] rounded-[24px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[16px] whitespace-nowrap shrink-0"
    >
      {#if activeTab === "admission"}
        <Download size={22} class="stroke-[3]" /> 명단 다운로드
      {:else}
        <Plus size={22} class="stroke-[3]" /> 신규 상담 등록
      {/if}
    </button>
  </div>

  {#if activeTab === "admission"}
    <div
      class="flex gap-2 bg-toss-grey-50 p-1 rounded-2xl border border-toss-grey-100 w-fit"
    >
      <button
        onclick={() => (activeAdmissionSubTab = "waiting")}
        class="px-5 py-2 rounded-xl text-[14px] font-black transition-all {activeAdmissionSubTab ===
        'waiting'
          ? 'bg-white shadow-sm text-toss-blue'
          : 'text-toss-grey-400'}">대기자 ({waitingList.length})</button
      >
      <button
        onclick={() => (activeAdmissionSubTab = "former")}
        class="px-5 py-2 rounded-xl text-[14px] font-black transition-all {activeAdmissionSubTab ===
        'former'
          ? 'bg-white shadow-sm text-toss-blue'
          : 'text-toss-grey-400'}">퇴원/졸업 ({formerStudents.length})</button
      >
    </div>
  {/if}

  {#if activeTab === "ticket"}
    <!-- Kanban Board Area -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start h-[calc(100vh-260px)] overflow-x-auto custom-scroll pb-4"
    >
      {#each stages as stage}
        <div
          class="flex flex-col gap-5 bg-white p-5 rounded-[40px] border border-toss-grey-100 h-full shadow-sm"
          ondragover={(e) => e.preventDefault()}
          ondrop={() => onDrop(stage.id)}
        >
          <div class="px-3 pt-2">
            <div class="flex items-center justify-between">
              <span
                class="px-3 py-1.5 rounded-xl {stage.color} text-white text-[11px] font-black uppercase tracking-wider shadow-sm"
                >{stage.label}</span
              >
              <span
                class="text-toss-blue font-black text-[16px] bg-toss-blue-light w-8 h-8 rounded-full flex items-center justify-center"
                >{stageCounts[stage.id] || 0}</span
              >
            </div>
            <p class="text-[13px] font-bold text-toss-grey-300 mt-3">
              {stage.desc}
            </p>
          </div>

          <div class="flex-1 space-y-4 overflow-y-auto custom-scroll pr-1">
            {#each settings.data.consultations.filter((t) => t.stage === stage.id) as ticket (ticket.id)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                draggable="true"
                ondragstart={() => onDragStart(ticket.id)}
                onclick={() => openTicket(ticket.id)}
                class="bg-toss-grey-25/50 p-6 rounded-[32px] border border-toss-grey-50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group relative"
                in:fly={{ y: 20, duration: 400 }}
              >
                <div class="flex justify-between items-start mb-4">
                  <span
                    class="text-[10px] font-black text-white px-2 py-0.5 rounded-lg bg-toss-blue-light text-toss-blue"
                    >{ticket.type}</span
                  >
                  <span class="text-[11px] font-bold text-toss-grey-300"
                    >{ticket.date.slice(5)}</span
                  >
                </div>

                <h4
                  class="text-[18px] font-black text-toss-grey-700 group-hover:text-toss-blue transition-colors"
                >
                  {ticket.name}
                </h4>
                <p class="text-[14px] font-bold text-toss-grey-400 mt-1">
                  {ticket.phone}
                </p>

                {#if ticket.note}
                  <p
                    class="mt-4 text-[13px] font-medium text-toss-grey-500 line-clamp-2 leading-relaxed bg-white/50 p-4 rounded-2xl border border-toss-grey-50/50 shadow-inner"
                  >
                    {ticket.note || "상담 내용 없음"}
                  </p>
                {/if}
              </div>
            {/each}

            <button
              onclick={addTicket}
              class="w-full py-6 rounded-[32px] border-2 border-dashed border-toss-grey-100 text-toss-grey-300 font-black text-[14px] hover:border-toss-blue/30 hover:bg-toss-blue-light/10 hover:text-toss-blue transition-all"
            >
              + 새 문의 추가
            </button>
          </div>
        </div>
      {/each}
    </div>
  {:else if activeTab === "admission"}
    <!-- Admissions Table Area -->
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
              <th class="p-6 pl-10">신청자 정보</th>
              <th class="p-6">연락처</th>
              <th class="p-6"
                >{activeAdmissionSubTab === "waiting"
                  ? "대기 신청일"
                  : "종료 일자"}</th
              >
              <th class="p-6">메모</th>
              <th class="p-6 text-right pr-10">현황 상태</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-toss-grey-50/50">
            {#each currentAdmissionData as item (item.id)}
              <tr
                onclick={() => openAdmissionDetail(item.id)}
                class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group"
                style="height: 84px"
              >
                <td class="p-6 pl-10">
                  <p
                    class="text-[16px] font-black text-toss-grey-700 leading-tight group-hover:text-toss-blue transition-colors"
                  >
                    {item.name}
                  </p>
                  <p class="text-[11px] font-bold text-toss-grey-300 mt-1">
                    {item.school} · {item.grade}
                  </p>
                </td>
                <td class="p-6 font-bold text-toss-grey-500"
                  >{item.studentPhone}</td
                >
                <td class="p-6">
                  <div
                    class="flex items-center gap-2 font-bold text-toss-grey-400"
                  >
                    <Calendar size={14} class="text-toss-blue/50" />
                    {item.regDate}
                  </div>
                </td>
                <td
                  class="p-6 text-[14px] font-medium text-toss-grey-400 max-w-sm truncate"
                  >{item.memo || "-"}</td
                >
                <td class="p-6 text-right pr-10">
                  <span
                    class="px-4 py-1.5 rounded-full text-[11px] font-black {activeAdmissionSubTab ===
                    'waiting'
                      ? 'bg-toss-blue-light text-toss-blue'
                      : 'bg-red-50 text-red-500'}"
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="5" class="py-40 text-center opacity-30">
                  <Search size={48} class="mx-auto mb-4" />
                  <p class="text-[18px] font-black">데이터가 없습니다.</p>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <!-- All Records Table Area -->
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
              <th class="p-6 pl-10">등록 일시</th>
              <th class="p-6">상담 대상</th>
              <th class="p-6">접수 유형</th>
              <th class="p-6">상담 내용</th>
              <th class="p-6 text-center">진행 단계</th>
              <th class="p-6 text-right pr-10">관리</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-toss-grey-50/50">
            {#each filteredConsultations as ticket (ticket.id)}
              <tr
                onclick={() => openTicket(ticket.id)}
                class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group"
                style="height: 84px"
              >
                <td class="p-6 pl-10 text-[14px] font-bold text-toss-grey-400"
                  >{ticket.date}</td
                >
                <td class="p-6">
                  <p
                    class="text-[16px] font-black text-toss-grey-700 group-hover:text-toss-blue transition-colors"
                  >
                    {ticket.name}
                  </p>
                  <p class="text-[11px] font-bold text-toss-grey-300 mt-1">
                    {ticket.phone}
                  </p>
                </td>
                <td class="p-6">
                  <span
                    class="px-3 py-1 rounded-xl bg-toss-grey-25 border border-toss-grey-50 text-[11px] font-black text-toss-grey-400"
                    >{ticket.type}</span
                  >
                </td>
                <td
                  class="p-6 text-[14px] font-medium text-toss-grey-500 max-w-sm truncate"
                  >{ticket.note || "내용 없음"}</td
                >
                <td class="p-6 text-center">
                  <span
                    class="px-3 py-1.5 rounded-full text-[12px] font-black {ticket.stage ===
                    'completed'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-toss-blue-light text-toss-blue'}"
                  >
                    {stages.find((s) => s.id === ticket.stage)?.label}
                  </span>
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
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Consultation Detail Drawer -->
<Drawer
  bind:isOpen={isConsultationDrawerOpen}
  title="상담 상세 내역"
  width="600px"
>
  {#if selectedTicket}
    <div class="space-y-10" in:fade>
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <h4 class="text-[18px] font-black text-toss-grey-600">
            문의 기본 정보
          </h4>
          <div class="flex gap-2">
            {#each stages as s}
              <button
                onclick={() => moveTicket(selectedTicket.id, s.id)}
                class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all {selectedTicket.stage ===
                s.id
                  ? s.color + ' text-white shadow-md scale-105'
                  : 'bg-toss-grey-50 text-toss-grey-300 hover:border-toss-grey-100 border border-transparent'}"
              >
                {s.label}
              </button>
            {/each}
          </div>
        </div>

        <div
          class="grid grid-cols-2 gap-6 bg-toss-grey-25 p-8 rounded-[40px] border border-toss-grey-50"
        >
          <div class="space-y-2">
            <label
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >성함</label
            >
            <input
              bind:value={selectedTicket.name}
              class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 transition-all outline-none shadow-sm"
            />
          </div>
          <div class="space-y-2">
            <label
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >연락처</label
            >
            <input
              bind:value={selectedTicket.phone}
              class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 transition-all outline-none shadow-sm"
            />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <label
          class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
          >상담 상세 내용</label
        >
        <textarea
          bind:value={selectedTicket.note}
          placeholder="상담 내용을 상세히 기록하세요..."
          class="w-full h-80 p-8 rounded-[40px] bg-toss-grey-25 border-none focus:bg-white focus:shadow-2xl transition-all font-medium text-[16px] text-toss-grey-600 outline-none resize-none leading-relaxed"
        ></textarea>
      </section>

      <footer class="pt-6 flex gap-4">
        <button
          onclick={() => deleteTicket(selectedTicket.id)}
          class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={() => (isConsultationDrawerOpen = false)}
          class="flex-1 h-16 bg-toss-blue text-white rounded-[28px] font-black text-[18px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] transition-all"
        >
          저장 후 닫기
        </button>
      </footer>
    </div>
  {/if}
</Drawer>

<!-- Admission Detail Drawer -->
<Drawer
  bind:isOpen={isAdmissionDrawerOpen}
  title="원생 상태 관리 (대기/퇴원)"
  width="520px"
>
  {#if selectedStudent}
    <div class="space-y-10" in:fade>
      <div
        class="p-8 bg-toss-grey-25 rounded-[40px] border border-toss-grey-50 flex items-center gap-6"
      >
        <div>
          <h3 class="text-[24px] font-black text-toss-grey-600 leading-tight">
            {selectedStudent.name}
          </h3>
          <p class="text-[15px] font-bold text-toss-grey-300 mt-1">
            {selectedStudent.school} · {selectedStudent.grade}
          </p>
        </div>
      </div>

      <section class="space-y-6">
        <h4
          class="text-[16px] font-black text-toss-grey-600 border-l-4 border-toss-blue pl-4"
        >
          상태 전환
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <button
            onclick={() => changeStudentStatus(selectedStudent.id, "재원")}
            class="p-8 rounded-[40px] border-2 border-toss-grey-50 hover:border-toss-blue hover:bg-toss-blue/5 transition-all flex flex-col items-center gap-4 text-toss-grey-400 hover:text-toss-blue shadow-sm"
          >
            <UserCheck size={32} />
            <span class="font-black">재원으로 전환</span>
          </button>
          <button
            onclick={() => changeStudentStatus(selectedStudent.id, "퇴원")}
            class="p-8 rounded-[40px] border-2 border-toss-grey-50 hover:border-red-400 hover:bg-red-50 transition-all flex flex-col items-center gap-4 text-toss-grey-400 hover:text-red-500 shadow-sm"
          >
            <UserMinus size={32} />
            <span class="font-black">퇴원/졸업 처리</span>
          </button>
        </div>
      </section>

      <footer class="pt-6 flex gap-4">
        <button
          onclick={() => deleteStudent(selectedStudent.id)}
          class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={() => (isAdmissionDrawerOpen = false)}
          class="flex-1 h-16 bg-toss-grey-700 text-white rounded-[28px] font-black text-[18px]"
        >
          창 닫기
        </button>
      </footer>
    </div>
  {/if}
</Drawer>
