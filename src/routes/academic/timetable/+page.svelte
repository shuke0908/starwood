<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import type { TimetableEvent, AcademyClass, RoomSetting, TeacherSetting } from '$lib/types';
    import { fade, fly, slide, scale } from 'svelte/transition';
    import { 
        Calendar as CalendarIcon, Clock, Users, 
        Plus, Save, Trash2, ChevronLeft, ChevronRight,
        MoreVertical, MapPin, Search, Layout, X,
        Sparkles, Wand2, Info, CheckCircle2, AlertTriangle,
        ChevronDown, ChevronUp, History, Monitor,
        Layers, MousePointer2, Copy, Clipboard, Filter,
        Maximize2, Minimize2, ZoomIn, ZoomOut, AlertOctagon, AlertCircle
    } from 'lucide-svelte';
    import { onMount } from 'svelte';
    import { toast } from '$lib/stores/toast.svelte';

    // Zen Mode Auto-Entry
    onMount(() => {
        settings.data.uiState.isZenMode = true;
        return () => {
            settings.data.uiState.isZenMode = false;
        };
    });

    // View States
    let activeDay = $state('월');
    let viewMode = $state<'room' | 'teacher' | 'grade'>('room');
    let zoomLevel = $state(1); // 1: Detailed, 0.5: Overview
    let colorFilter = $state<'subject' | 'grade' | 'status'>('subject');
    let isRightPanelOpen = $state(true);
    let teacherFilter = $state<string | null>(null);

    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const timeSlots = Array.from({ length: 15 }, (_, i) => `${i + 8}:00`);

    // Resource Grouping
    const roomsByBuilding = $derived.by(() => {
        const groups: Record<string, RoomSetting[]> = {};
        settings.data.roomSettings.forEach(r => {
            const b = r.building || '기타';
            if (!groups[b]) groups[b] = [];
            groups[b].push(r);
        });
        return groups;
    });

    // Unassigned classes (Dock)
    const unassignedClasses = $derived.by(() => {
        return settings.data.classes.map(cls => {
            const assignedEvents = settings.data.timetable.filter(e => e.classId === cls.id);
            const academicSessionCount = cls.sessionCount ?? 0;
            return {
                ...cls,
                remainingCount: Math.max(0, academicSessionCount - assignedEvents.length)
            };
        }).filter(c => c.remainingCount > 0);
    });

    // Conflicts logic
    const conflicts = $derived.by(() => {
        const list: { id: string; type: 'teacher' | 'room' | 'capacity'; message: string; eventId: string }[] = [];
        const events = settings.data.timetable.filter(e => e.day === activeDay);

        events.forEach((e1, idx) => {
            // Teacher Conflict
            const tConflict = events.find((e2, idx2) => 
                idx !== idx2 && e1.teacherId === e2.teacherId && isOverlap(e1, e2)
            );
            if (tConflict) list.push({ id: `c_${e1.id}_t`, type: 'teacher', message: `강사 중복: ${getTeacherName(e1.teacherId)}`, eventId: e1.id });

            // Room Conflict
            const rConflict = events.find((e2, idx2) => 
                idx !== idx2 && e1.roomId === e2.roomId && isOverlap(e1, e2)
            );
            if (rConflict) list.push({ id: `c_${e1.id}_r`, type: 'room', message: `강의실 중복: ${getRoomName(e1.roomId)}`, eventId: e1.id });

            // Capacity Conflict
            const room = settings.data.roomSettings.find(r => r.id === e1.roomId);
            const cls = settings.data.classes.find(c => c.id === e1.classId);
            if (room && cls && cls.studentIds.length > room.capacity) {
                list.push({ id: `c_${e1.id}_cap`, type: 'capacity', message: `인원 초과: ${room.name}(${room.capacity}명) < 수업(${cls.studentIds.length}명)`, eventId: e1.id });
            }
        });
        return list;
    });

    function isOverlap(e1: TimetableEvent, e2: TimetableEvent) {
        const s1 = timeToMin(e1.startTime);
        const e1End = timeToMin(e1.endTime);
        const s2 = timeToMin(e2.startTime);
        const e2End = timeToMin(e2.endTime);
        return (s1 < e2End && e1End > s2);
    }

    function getTeacherName(id: string) { return settings.data.teachers.find(t => t.id === id)?.name || '미지정'; }
    function getRoomName(id: string) { return settings.data.roomSettings.find(r => r.id === id)?.name || '미지정'; }

    function timeToMin(t: string) {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    function minToTime(min: number) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Drag & Drop
    let draggedClassId = $state<string | null>(null);
    let draggedEventId = $state<string | null>(null);
    let dropPreview = $state<{ time: string; roomId: string; isValid: boolean } | null>(null);

    function onDragOver(e: DragEvent, time: string, roomId: string) {
        e.preventDefault();
        const cls = draggedClassId ? settings.data.classes.find(c => c.id === draggedClassId) : null;
        if (cls) {
            const isColliding = settings.data.timetable.some(ev => 
                ev.day === activeDay && ev.roomId === roomId && 
                isOverlap({ startTime: time, endTime: minToTime(timeToMin(time) + (cls.duration || 60)) } as any, ev)
            );
            dropPreview = { time, roomId, isValid: !isColliding };
        }
    }

    function onDrop(time: string, roomId: string) {
        if (draggedClassId) {
            const cls = settings.data.classes.find(c => c.id === draggedClassId);
            if (cls) {
                const duration = cls.duration || 60;
                settings.data.timetable.push({
                    id: `e_${Date.now()}`,
                    classId: cls.id,
                    className: cls.name,
                    teacherId: cls.teacherId,
                    day: activeDay,
                    startTime: time,
                    endTime: minToTime(timeToMin(time) + duration),
                    roomId,
                    isFixed: true,
                    color: cls.color
                });
                toast.show(`${cls.name} 수업이 배정되었습니다.`, "success");
            }
        } else if (draggedEventId) {
            const ev = settings.data.timetable.find(e => e.id === draggedEventId);
            if (ev) {
                const dur = timeToMin(ev.endTime) - timeToMin(ev.startTime);
                ev.day = activeDay;
                ev.startTime = time;
                ev.endTime = minToTime(timeToMin(time) + dur);
                ev.roomId = roomId;
            }
        }
        draggedClassId = null;
        draggedEventId = null;
        dropPreview = null;
    }

    // Power User Features: Copy/Paste
    let clipboard = $state<Partial<TimetableEvent> | null>(null);
    function copyEvent(ev: TimetableEvent) {
        clipboard = { ...ev, id: undefined };
        toast.show("일정이 복사되었습니다.", "info");
    }
    function pasteEvent(time: string, roomId: string) {
        if (!clipboard) return;
        const dur = timeToMin(clipboard.endTime!) - timeToMin(clipboard.startTime!);
        settings.data.timetable.push({
            ...clipboard,
            id: `e_${Date.now()}`,
            day: activeDay,
            startTime: time,
            endTime: minToTime(timeToMin(time) + dur),
            roomId
        } as TimetableEvent);
        toast.show("일정이 붙여넣기 되었습니다.", "success");
    }

    // Zoom Context
    const cellHeight = $derived(128 * zoomLevel);
</script>

<div class="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden select-none">
    <!-- Top Control Bar (Zen Mode Style) -->
    <header class="h-16 bg-white border-b border-toss-grey-100 flex items-center justify-between px-6 z-50 shadow-sm">
        <div class="flex items-center gap-6">
            <button onclick={() => settings.data.uiState.isZenMode = false} class="w-10 h-10 rounded-xl hover:bg-toss-grey-100 flex items-center justify-center transition-all text-toss-grey-400">
                <Minimize2 size={20} />
            </button>
            <h2 class="text-[18px] font-black text-toss-grey-600 flex items-center gap-2">
                <Monitor size={18} class="text-toss-blue" /> 스마트 시간표 v2.0 <span class="text-[11px] bg-toss-blue-light text-toss-blue px-2 py-0.5 rounded-full uppercase tracking-tighter">Zen Mode</span>
            </h2>
            
            <div class="h-8 w-[1px] bg-toss-grey-100 mx-2"></div>
            
            <div class="flex bg-toss-grey-50 p-1 rounded-xl">
                {#each days as d}
                    <button 
                        onclick={() => activeDay = d}
                        class="px-4 py-1.5 rounded-lg text-[13px] font-black transition-all {activeDay === d ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}"
                    >{d}</button>
                {/each}
            </div>
        </div>

        <div class="flex items-center gap-6">
            <div class="flex items-center gap-3 bg-toss-grey-50 px-4 py-2 rounded-xl border border-toss-grey-100">
                <ZoomOut size={14} class="text-toss-grey-300" />
                <input type="range" min="0.5" max="1.5" step="0.1" bind:value={zoomLevel} class="w-24 accent-toss-blue" />
                <ZoomIn size={14} class="text-toss-grey-300" />
            </div>

            <div class="flex items-center gap-2">
                <div class="bg-toss-grey-50 p-1 rounded-xl flex">
                    <button onclick={() => colorFilter = 'subject'} class="px-3 py-1.5 rounded-lg text-[12px] font-black {colorFilter === 'subject' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-300'}">과목별</button>
                    <button onclick={() => colorFilter = 'status'} class="px-3 py-1.5 rounded-lg text-[12px] font-black {colorFilter === 'status' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-300'}">인원별</button>
                </div>
            </div>

            <button class="toss-btn-primary px-6 h-10 text-[13px] bg-toss-blue flex items-center gap-2">
                <Sparkles size={16} /> 매칭 인텔리전스 실행
            </button>
            
            <button onclick={() => isRightPanelOpen = !isRightPanelOpen} class="w-10 h-10 rounded-xl bg-toss-grey-600 text-white flex items-center justify-center hover:scale-105 transition-all">
                <AlertOctagon size={20} />
            </button>
        </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
        <!-- Dashboard Dock (Left) -->
        <aside class="w-[280px] bg-white border-r border-toss-grey-100 flex flex-col z-40 shadow-xl">
            <div class="p-6 border-b border-toss-grey-50">
                <h3 class="text-[15px] font-black text-toss-grey-600 flex items-center justify-between">
                    Unassigned Dock
                    <span class="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[10px] font-black">{unassignedClasses.length}건 대기</span>
                </h3>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {#each unassignedClasses as cls}
                    <div 
                        draggable="true"
                        ondragstart={() => draggedClassId = cls.id}
                        class="p-4 rounded-2xl bg-toss-grey-50 border border-toss-grey-100 hover:border-toss-blue hover:bg-white transition-all cursor-grab group active:rotate-2"
                    >
                        <div class="flex justify-between items-start">
                            <h4 class="text-[14px] font-black text-toss-grey-600 group-hover:text-toss-blue">{cls.name}</h4>
                        </div>
                        <div class="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-toss-grey-400">
                            <span class="flex items-center gap-1"><Users size={12} /> {cls.studentIds.length}/{cls.maxStudents}</span>
                            <span class="flex items-center gap-1"><Clock size={12} /> {cls.duration}분</span>
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                            <div class="flex-1 h-1.5 bg-toss-grey-200 rounded-full overflow-hidden">
                                <div class="h-full bg-toss-blue" style="width: {(cls.sessionCount! - cls.remainingCount) / cls.sessionCount! * 100}%"></div>
                            </div>
                            <span class="text-[10px] font-black text-toss-blue">{cls.sessionCount! - cls.remainingCount}/{cls.sessionCount}회</span>
                        </div>
                    </div>
                {/each}
            </div>

            <div class="p-6 bg-toss-blue/5 border-t border-toss-blue/10">
                <p class="text-[11px] font-bold text-toss-blue/60 leading-relaxed">
                    팁: 카드를 드래그하여 중앙 캔버스의 빈 슬롯에 배치하세요. 충돌 시 붉은색으로 표시됩니다.
                </p>
            </div>
        </aside>

        <!-- Main Scheduler Canvas (Center) -->
        <main class="flex-1 overflow-auto bg-[#f8f9fa] relative group" oncontextmenu={(e) => e.preventDefault()}>
            <div class="inline-flex min-w-full flex-col min-h-full">
                <!-- Sticky Header (Rooms) -->
                <div class="flex sticky top-0 z-30 bg-white border-b border-toss-grey-100 shadow-sm">
                    <div class="w-20 flex-shrink-0 bg-white border-r border-toss-grey-100 flex items-center justify-center">
                        <History size={20} class="text-toss-grey-200" />
                    </div>
                    <div class="flex">
                        {#each Object.entries(roomsByBuilding) as [building, rooms]}
                            <div class="flex flex-col border-r border-toss-grey-100 bg-toss-grey-50">
                                <div class="h-8 px-4 flex items-center border-b border-toss-grey-100">
                                    <span class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">{building}</span>
                                </div>
                                <div class="flex">
                                    {#each rooms as room}
                                        <div class="w-[280px] py-6 px-4 bg-white text-center border-r border-toss-grey-50">
                                            <h4 class="text-[15px] font-black text-toss-grey-600">{room.name}</h4>
                                            <p class="text-[11px] font-bold text-toss-grey-300 mt-1 uppercase">CAP: {room.capacity}명</p>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- Canvas Grid -->
                <div class="flex flex-1">
                    <!-- Sticky Time Column -->
                    <div class="w-20 flex-shrink-0 bg-white border-r border-toss-grey-100 sticky left-0 z-20">
                        {#each timeSlots as time}
                            <div class="border-b border-toss-grey-50 flex items-center justify-center font-black text-toss-grey-200 text-[13px]" style="height: {cellHeight}px;">
                                {time}
                            </div>
                        {/each}
                    </div>

                    <!-- Cells -->
                    <div class="flex flex-1 relative">
                        {#each Object.values(roomsByBuilding).flat() as room}
                            <div class="w-[280px] border-r border-toss-grey-50/50 relative">
                                {#each timeSlots as time}
                                    <div 
                                        class="border-b border-toss-grey-50/30 relative group/cell transition-colors"
                                        style="height: {cellHeight}px;"
                                        ondragover={(e) => onDragOver(e, time, room.id)}
                                        ondrop={() => onDrop(time, room.id)}
                                        oncontextmenu={() => pasteEvent(time, room.id)}
                                    >
                                        <!-- Drop Preview -->
                                        {#if dropPreview?.time === time && dropPreview?.roomId === room.id}
                                            <div class="absolute inset-2 rounded-2xl border-2 border-dashed {dropPreview.isValid ? 'border-green-400 bg-green-50/50' : 'border-red-400 bg-red-50/50'} z-10 flex items-center justify-center shadow-lg">
                                                {#if !dropPreview.isValid}
                                                    <span class="bg-red-500 text-white text-[10px] font-black p-1 px-2 rounded">충돌 주의</span>
                                                {/if}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}

                                <!-- Events in this room -->
                                {#each settings.data.timetable.filter(e => e.day === activeDay && e.roomId === room.id) as ev (ev.id)}
                                    {@const startM = timeToMin(ev.startTime)}
                                    {@const endM = timeToMin(ev.endTime)}
                                    {@const top = (startM - 8 * 60) * (cellHeight / 60)}
                                    {@const height = (endM - startM) * (cellHeight / 60)}
                                    {@const hasConflict = conflicts.some(c => c.eventId === ev.id)}
                                    {@const cls = settings.data.classes.find(c => c.id === ev.classId)}
                                    
                                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div 
                                        draggable="true"
                                        ondragstart={() => draggedEventId = ev.id}
                                        oncontextmenu={(e) => { e.preventDefault(); copyEvent(ev); }}
                                        class="absolute left-2 right-2 rounded-2xl p-4 shadow-xl border-2 z-20 transition-all cursor-grab active:cursor-grabbing group/ev overflow-hidden {hasConflict ? 'border-red-500 shadow-red-200' : 'border-white'}"
                                        style="top: {top}px; height: {height}px; background-color: {ev.color || '#3182f6'};"
                                        in:scale={{ duration: 200 }}
                                    >
                                        <div class="relative z-10 text-white flex flex-col h-full">
                                            {#if zoomLevel > 0.8}
                                                <div class="flex justify-between items-start">
                                                    <h5 class="text-[14px] font-black leading-tight line-clamp-1">{ev.className}</h5>
                                                    <div class="flex gap-1">
                                                        {#if ev.isFixed}<span class="text-[9px] font-black bg-white/20 px-1 rounded-sm">FIX</span>{/if}
                                                        {#if hasConflict}<AlertTriangle size={14} class="text-white animate-pulse" />{/if}
                                                    </div>
                                                </div>
                                                <div class="mt-1 flex items-center gap-2 text-[11px] font-bold opacity-80">
                                                    <Clock size={12} /> {ev.startTime} - {ev.endTime}
                                                </div>
                                                <div class="mt-auto flex items-center justify-between">
                                                    <span class="text-[12px] font-black border-b border-white/30">{getTeacherName(ev.teacherId)}</span>
                                                    <div class="flex -space-x-1.5 overflow-hidden">
                                                        {#each Array(3) as _, i}
                                                            <div class="inline-block h-4 w-4 rounded-full ring-2 ring-white/10 bg-white/20 text-[8px] flex items-center justify-center font-bold">{i+1}</div>
                                                        {/each}
                                                    </div>
                                                </div>
                                            {:else}
                                                <h5 class="text-[12px] font-black truncate">{ev.className}</h5>
                                                {#if hasConflict}
                                                    <AlertTriangle size={12} class="text-white mt-1" />
                                                {/if}
                                            {/if}
                                        </div>

                                        <!-- Hatch pattern for overlaps -->
                                        {#if hasConflict}
                                            <div class="absolute inset-0 bg-red-600/10 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);"></div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </main>

        <!-- Conflict & Alert Panel (Right) -->
        {#if isRightPanelOpen}
            <aside class="w-[320px] bg-white border-l border-toss-grey-100 flex flex-col z-40 shadow-2xl" transition:fly={{ x: 20, duration: 300 }}>
                <div class="p-6 border-b border-toss-grey-50 flex items-center justify-between">
                    <h3 class="text-[16px] font-black text-toss-grey-600">Validation Insights</h3>
                    <button onclick={() => isRightPanelOpen = false} class="text-toss-grey-300 hover:text-toss-grey-600 transition-colors"><X size={20} /></button>
                </div>

                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    {#if conflicts.length > 0}
                        <div class="space-y-4">
                            <h4 class="text-[12px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> 치명적 문제 ({conflicts.length})
                            </h4>
                            {#each conflicts as conf}
                                <div class="p-4 rounded-3xl bg-red-50 border border-red-100 space-y-2 group hover:shadow-lg transition-all cursor-pointer">
                                    <div class="flex items-center gap-2">
                                        {#if conf.type === 'teacher'}<Users size={16} class="text-red-400" />
                                        {:else if conf.type === 'room'}<MapPin size={16} class="text-red-400" />
                                        {:else}<AlertTriangle size={16} class="text-red-400" />{/if}
                                        <span class="text-[13px] font-black text-red-600">{conf.message}</span>
                                    </div>
                                    <p class="text-[11px] font-bold text-red-400 opacity-80">수정이 필요합니다. 드래그하여 다른 슬롯으로 옮기세요.</p>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="h-60 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <div class="w-16 h-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <p class="text-[15px] font-black text-toss-grey-600">완벽한 시간표</p>
                                <p class="text-[12px] font-bold text-toss-grey-300 mt-1">현재 감지된 충돌 사항이 <br/> 없습니다.</p>
                            </div>
                        </div>
                    {/if}

                    <div class="h-[1px] bg-toss-grey-50"></div>

                    <div class="space-y-4">
                        <h4 class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest">강사 근무 현황</h4>
                        {#each settings.data.teachers as teacher}
                            <div class="flex items-center justify-between">
                                <span class="text-[13px] font-bold text-toss-grey-500">{teacher.name}</span>
                                <div class="flex gap-0.5">
                                    {#each Array(5) as _, i}
                                        <div class="w-2.5 h-6 rounded-sm {i < 3 ? 'bg-toss-blue' : 'bg-toss-grey-100'}"></div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="p-6 bg-toss-grey-50 border-t border-toss-grey-100">
                    <button class="w-full h-14 bg-white border border-toss-grey-200 text-toss-grey-600 rounded-2xl font-black text-[14px] shadow-sm hover:bg-toss-grey-100 transition-all flex items-center justify-center gap-2">
                        <Filter size={18} /> 정전체 필터링
                    </button>
                </div>
            </aside>
        {/if}
    </div>
</div>

<style>
    .no-scrollbar::-webkit-scrollbar { display: none; }
    
    :global(.toss-btn-primary) {
        border-radius: 12px;
        font-weight: 800;
        transition: all 0.2s;
        color: white;
    }
    
    input[type="range"] {
        -webkit-appearance: none;
        background: transparent;
    }
    input[type="range"]::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        background: #e5e8eb;
        border-radius: 2px;
    }
    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3182f6;
        margin-top: -6px;
        box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
    }
</style>
