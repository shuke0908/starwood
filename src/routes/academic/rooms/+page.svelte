<script lang="ts">
  import { settings } from "$lib/settings.svelte";
  import type { RoomSetting } from "$lib/types";
  import {
    Search,
    Plus,
    DoorOpen,
    Users,
    StickyNote,
    ChevronRight,
    MoreVertical,
    X,
    Save,
    Trash2,
    Building,
  } from "lucide-svelte";
  import { fade, fly, slide } from "svelte/transition";
  import Drawer from "$lib/components/Drawer.svelte";
  import { getDiff } from "$lib/logic";
  import { toast } from "$lib/stores/toast.svelte";

  let searchQuery = $state("");
  let selectedRoomId = $state<string | null>(null);
  let isDrawerOpen = $state(false);

  // Editing State
  let isEditing = $state(false);
  let editingRoom = $state<Partial<RoomSetting>>({});

  const filteredRooms = $derived(
    settings.data.roomSettings.filter(
      (r) =>
        r.name.includes(searchQuery) ||
        (r.building && r.building.includes(searchQuery)),
    ),
  );

  function openDetail(id: string) {
    selectedRoomId = id;
    editingRoom = { ...settings.data.roomSettings.find((r) => r.id === id) };
    isDrawerOpen = true;
    isEditing = false;
  }

  function startNewRoom() {
    editingRoom = {
      id: `room_${Date.now()}`,
      name: "",
      capacity: 10,
      building: "본관",
      equipment: [],
      unavailableTimes: [],
      memo: "",
    };
    selectedRoomId = null;
    isDrawerOpen = true;
    isEditing = true;
  }

  function saveRoom() {
    if (!editingRoom.name) {
      toast.show("강의실 이름을 입력해주세요.", "error");
      return;
    }

    const idx = settings.data.roomSettings.findIndex(
      (r) => r.id === editingRoom.id,
    );

    const labels: Record<string, string> = {
      name: "강의실 이름",
      building: "소속 건물",
      capacity: "수용 정원",
      memo: "메모",
    };

    if (idx !== -1) {
      const original = settings.data.roomSettings[idx];
      const diff = getDiff(original, editingRoom, labels);

      if (diff.length === 0) {
        toast.show("변경된 내용이 없습니다.", "info");
        isDrawerOpen = false;
        return;
      }

      settings.data.roomSettings[idx] = {
        ...settings.data.roomSettings[idx],
        ...editingRoom,
      } as RoomSetting;

      toast.show("강의실 정보 수정 완료", "success", diff.join("\n"));
    } else {
      settings.data.roomSettings.push(editingRoom as RoomSetting);
      toast.show(
        "신규 강의실 등록 완료",
        "success",
        `${editingRoom.name} 강의실이 등록되었습니다.`,
      );
    }

    isEditing = false;
    isDrawerOpen = false;
  }

  function deleteRoom(id: string) {
    if (!confirm("정말로 이 강의실을 삭제하시겠습니까?")) return;
    settings.data.roomSettings = settings.data.roomSettings.filter(
      (r) => r.id !== id,
    );
    isDrawerOpen = false;
  }
</script>

<div class="space-y-8 pb-10">
  <!-- Search & Action -->
  <div class="flex gap-6 items-center justify-between">
    <div class="relative w-[500px] group flex items-center">
      <Search
        class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none"
        size={24}
      />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="강의실 이름, 건물명으로 검색..."
        class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md"
      />
    </div>
    <button
      onclick={startNewRoom}
      class="toss-btn-primary flex items-center gap-2 px-8 h-[64px] rounded-[24px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      <Plus size={22} class="stroke-[3]" /> 신규 강의실 등록
    </button>
  </div>

  <!-- Room Cards Grid -->
  <div class="h-[calc(100vh-260px)] overflow-y-auto custom-scroll pr-2">
    <div
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
    >
      {#each filteredRooms as r (r.id)}
        <button
          onclick={() => openDetail(r.id)}
          class="group bg-white p-8 rounded-[40px] border border-toss-grey-50 shadow-sm hover:shadow-2xl hover:border-toss-blue/20 hover:-translate-y-2 transition-all duration-500 text-left relative overflow-hidden flex flex-col justify-between min-h-[220px]"
          in:fly={{ y: 20, duration: 400 }}
        >
          <!-- Background Decor -->
          <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-toss-blue/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          ></div>

          <div class="space-y-4 relative z-10">
            <div class="flex justify-between items-start">
              <div
                class="w-14 h-14 bg-toss-grey-50 rounded-[24px] flex items-center justify-center text-toss-grey-300 group-hover:bg-toss-blue group-hover:text-white transition-all duration-500 shadow-sm"
              >
                <DoorOpen size={28} />
              </div>
              <div class="text-right">
                <span
                  class="px-3 py-1 bg-toss-grey-50 text-toss-grey-400 text-[11px] font-black rounded-lg group-hover:bg-toss-blue/10 group-hover:text-toss-blue transition-colors"
                >
                  {r.building || "건물 미지정"}
                </span>
              </div>
            </div>

            <div>
              <h3
                class="text-[22px] font-black text-toss-grey-700 group-hover:text-toss-blue transition-colors"
              >
                {r.name}
              </h3>
              {#if r.memo}
                <p
                  class="text-[14px] font-bold text-toss-grey-400 mt-1 line-clamp-2"
                >
                  {r.memo}
                </p>
              {/if}
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-3 relative z-10">
            <div class="flex justify-between items-end">
              <span class="text-[13px] font-bold text-toss-grey-400"
                >수용 가능 인원</span
              >
              <span class="text-[18px] font-black text-toss-grey-600">
                {r.capacity}<span class="text-[13px] ml-0.5">명</span>
              </span>
            </div>
            <div
              class="w-full h-2.5 bg-toss-grey-50 rounded-full overflow-hidden"
            >
              <div
                class="h-full bg-toss-blue transition-all duration-1000 group-hover:scale-x-105 origin-left"
                style="width: {Math.min(100, (r.capacity / 50) * 100)}%"
              ></div>
            </div>
          </div>

          <!-- Bottom Decorative Line -->
          <div
            class="absolute bottom-0 left-0 w-0 h-1.5 bg-toss-blue group-hover:w-full transition-all duration-700"
          ></div>
        </button>
      {/each}

      <!-- Add New Card Slot -->
      <button
        onclick={startNewRoom}
        class="group p-8 rounded-[40px] border-2 border-dashed border-toss-grey-100 hover:border-toss-blue/30 hover:bg-toss-blue/5 transition-all duration-500 flex flex-col items-center justify-center gap-4 text-toss-grey-300 hover:text-toss-blue min-h-[220px]"
      >
        <div
          class="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center group-hover:scale-110 transition-transform"
        >
          <Plus size={32} class="stroke-[3]" />
        </div>
        <span class="text-[16px] font-black">새로운 강의실 추가</span>
      </button>
    </div>
  </div>
</div>

<Drawer bind:isOpen={isDrawerOpen} title="강의실 상세 설정" width="500px">
  {#if editingRoom}
    <div class="space-y-8" in:fade>
      <section
        class="p-8 bg-toss-grey-50 rounded-[40px] border border-toss-grey-100 space-y-6"
      >
        <div class="space-y-2">
          <label
            for="room-name"
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
            >강의실 이름</label
          >
          <input
            id="room-name"
            bind:value={editingRoom.name}
            class="toss-input-large"
            placeholder="예: 101호, 세미나실"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label
              for="room-building"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >소속 건물</label
            >
            <input
              id="room-building"
              bind:value={editingRoom.building}
              class="toss-input-large"
              placeholder="예: 본관"
            />
          </div>
          <div class="space-y-2">
            <label
              for="room-capacity"
              class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
              >수용 정원</label
            >
            <div class="relative">
              <input
                id="room-capacity"
                type="number"
                bind:value={editingRoom.capacity}
                class="toss-input-large pr-12"
              />
              <span
                class="absolute right-5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-toss-grey-300"
                >명</span
              >
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <label
            for="room-memo"
            class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1"
            >메모</label
          >
          <textarea
            id="room-memo"
            bind:value={editingRoom.memo}
            class="w-full bg-white px-5 py-4 rounded-2xl border-none font-bold text-toss-grey-600 focus:ring-4 focus:ring-toss-blue/5 outline-none shadow-sm min-h-[120px] resize-none"
            placeholder="시설 상태, 특이사항 등을 입력하세요."
          ></textarea>
        </div>
      </section>

      <footer class="flex gap-4">
        <button
          onclick={() => deleteRoom(editingRoom.id!)}
          class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 size={24} />
        </button>
        <button
          onclick={saveRoom}
          class="flex-1 h-16 bg-toss-blue text-white rounded-[28px] font-black text-[18px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] transition-all"
        >
          저장하기
        </button>
      </footer>
    </div>
  {/if}
</Drawer>

<style>
  .toss-input-large {
    width: 100%;
    background-color: white;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    height: 4rem;
    border-radius: 1rem;
    border: none;
    font-weight: 800;
    color: #4e5968; /* toss-grey-600 */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
    outline: none;
    font-size: 1.125rem;
  }
  .toss-input-large:focus {
    box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.05); /* ring-4 ring-toss-blue/5 */
  }
</style>
