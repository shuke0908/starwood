<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import { fade, fly, slide } from "svelte/transition";
  import {
    AlertCircle,
    Send,
    Search,
    Filter,
    ChevronRight,
    Ban,
    CheckCircle2,
    User,
    Phone,
    Calendar,
    Mail,
    MessageSquare,
  } from "lucide-svelte";

  let searchQuery = $state("");
  let filterGrade = $state("전체");

  // Derived Data
  const unpaidStudents = $derived(
    settings.data.students.filter((s) => {
      const matchesSearch =
        s.name.includes(searchQuery) || s.studentPhone.includes(searchQuery);
      const matchesGrade = filterGrade === "전체" || s.grade === filterGrade;
      return s.unpaid > 0 && matchesSearch && matchesGrade;
    }),
  );

  const totalUnpaidAmount = $derived(
    unpaidStudents.reduce((acc, s) => acc + s.unpaid, 0),
  );
  const averageUnpaid = $derived(
    unpaidStudents.length > 0 ? totalUnpaidAmount / unpaidStudents.length : 0,
  );

  const fmt = (val: number) => val.toLocaleString();

  function sendReminders() {
    alert(
      `${unpaidStudents.length}명의 원생에게 미납 안내 메시지를 발송했습니다.`,
    );
  }

  function sendIndividualReminder(name: string) {
    alert(`${name} 원생에게 미납 안내 알림톡을 발송했습니다.`);
  }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
  <!-- Header -->
  <header class="flex justify-between items-end">
    <div>
      <h2 class="text-[32px] font-black text-toss-grey-600">미수금 관리</h2>
    </div>
    <div class="flex gap-4">
      <button
        class="toss-btn-secondary px-6 flex items-center gap-2"
        onclick={sendReminders}
      >
        <Send size={18} /> 전체 미납 안내 발송
      </button>
    </div>
  </header>

  <!-- Summary Widgets -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div
      class="bg-red-50 p-10 rounded-[48px] border border-red-100 space-y-3 relative overflow-hidden group"
    >
      <div
        class="absolute -right-4 -bottom-4 text-red-100 opacity-50 group-hover:scale-110 transition-transform duration-500"
      >
        <AlertCircle size={160} />
      </div>
      <p
        class="text-[13px] font-black text-red-400 uppercase tracking-widest relative z-10"
      >
        총 미수금 합계
      </p>
      <h3 class="text-[40px] font-black text-red-600 relative z-10">
        ₩{fmt(totalUnpaidAmount)}
      </h3>
      <p class="text-[14px] font-bold text-red-400 relative z-10">
        총 {unpaidStudents.length}명의 원생
      </p>
    </div>

    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-3"
    >
      <p
        class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
      >
        1인당 평균 미납액
      </p>
      <h3 class="text-[32px] font-black text-toss-grey-600">
        ₩{fmt(Math.round(averageUnpaid))}
      </h3>
      <p class="text-[13px] font-bold text-toss-grey-400">전월 대비 -12.4%</p>
    </div>

    <div
      class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-3"
    >
      <p
        class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest"
      >
        납부 완료율 (이달)
      </p>
      <h3 class="text-[32px] font-black text-green-600">84.2%</h3>
      <div class="w-full h-2 bg-toss-grey-50 rounded-full overflow-hidden">
        <div class="h-full bg-green-500 w-[84.2%]"></div>
      </div>
    </div>
  </div>

  <!-- Filter Bar -->
  <div
    class="bg-white p-4 rounded-[32px] border border-toss-grey-100 shadow-sm flex gap-4 max-w-2xl w-full"
  >
    <div class="relative flex-1 flex items-center group">
      <Search
        class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
        size={24}
      />
      <input
        type="text"
        placeholder="원생 이름 또는 연락처 검색"
        bind:value={searchQuery}
        class="w-full h-[64px] pl-16 pr-8 bg-toss-grey-50 rounded-2xl border-none focus:ring-8 focus:ring-toss-blue/5 font-bold text-[17px] text-toss-grey-600 outline-none transition-all placeholder:text-toss-grey-300 group-hover:bg-toss-grey-100/50"
      />
    </div>
    <select
      bind:value={filterGrade}
      class="h-[64px] px-8 bg-toss-grey-50 rounded-2xl border-none font-bold text-[15px] text-toss-grey-600 outline-none focus:ring-2 focus:ring-toss-blue/20 transition-all appearance-none cursor-pointer shrink-0 whitespace-nowrap"
    >
      <option value="전체">모든 학년</option>
      <option value="초1">초1</option>
      <option value="초2">초2</option>
      <option value="초3">초3</option>
      <option value="초4">초4</option>
      <option value="초5">초5</option>
      <option value="초6">초6</option>
      <option value="중1">중1</option>
      <option value="중2">중2</option>
      <option value="중3">중3</option>
      <option value="고1">고1</option>
      <option value="고2">고2</option>
      <option value="고3">고3</option>
    </select>
  </div>

  <!-- List -->
  <div
    class="bg-white rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden"
  >
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-toss-grey-50/50">
          <tr
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest border-b border-toss-grey-100"
          >
            <th class="py-2.5 px-10 text-left">원생 정보</th>
            <th class="py-2.5 px-8 text-left">학년</th>
            <th class="py-2.5 px-8 text-right">미납 금액</th>
            <th class="py-2.5 px-8 text-center">미납 기간</th>
            <th class="py-2.5 px-10 text-right">관리 액션</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-toss-grey-50">
          {#each unpaidStudents as s (s.id)}
            <tr
              class="hover:bg-toss-grey-50/20 transition-all group border-b border-toss-grey-50"
            >
              <td class="py-2.5 px-10">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-xl bg-toss-grey-100 flex items-center justify-center font-black text-[13px] text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all"
                  >
                    {s.name[0]}
                  </div>
                  <div>
                    <p
                      class="text-[14px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors outline-none"
                    >
                      {s.name}
                    </p>
                    <p class="text-[11px] font-bold text-toss-grey-300">
                      {s.studentPhone}
                    </p>
                  </div>
                </div>
              </td>
              <td class="py-2.5 px-8 font-bold text-[13px] text-toss-grey-500">
                {s.grade}
              </td>
              <td class="py-2.5 px-8 text-right">
                <p class="text-[15px] font-black text-red-500 font-mono">
                  ₩{fmt(s.unpaid)}
                </p>
              </td>
              <td class="py-2.5 px-8 text-center">
                <span
                  class="px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-black rounded"
                  >32일 경과</span
                >
              </td>
              <td class="py-2.5 px-10 text-right">
                <div
                  class="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    onclick={() => sendIndividualReminder(s.name)}
                    class="p-2 bg-toss-grey-100 text-toss-grey-600 rounded-lg hover:bg-toss-blue hover:text-white transition-all"
                    title="독촉 메시지 발송"
                  >
                    <MessageSquare size={14} />
                  </button>
                  <button
                    class="p-2 bg-toss-grey-100 text-toss-grey-600 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    title="제명/정지 검토"
                  >
                    <Ban size={14} />
                  </button>
                  <a
                    href="/finance/desk"
                    class="p-2 bg-toss-blue text-white rounded-lg hover:bg-toss-blue-dark transition-all flex items-center gap-1.5 px-3 font-bold text-[11px]"
                  >
                    수납 처리 <ChevronRight size={12} />
                  </a>
                </div>
              </td>
            </tr>
          {/each}
          {#if unpaidStudents.length === 0}
            <tr>
              <td
                colspan="5"
                class="py-32 text-center text-toss-grey-200 font-bold space-y-4"
              >
                <div
                  class="w-20 h-20 bg-toss-grey-50 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 size={40} />
                </div>
                <p>
                  미납 내역이 없습니다. 학원이 아주 건강하게 운영되고 있네요!
                </p>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
