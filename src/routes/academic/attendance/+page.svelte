<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { toast } from '$lib/stores/toast.svelte';
    import type { Attendance, Student } from '$lib/types';
    import { 
        CheckCircle2, Clock, AlertCircle, XCircle, 
        ChevronRight, Send, Search, Calendar,
        LayoutGrid, User, Bell, ChevronDown, Check,
        AlertTriangle, MessageSquare, History, ListFilter,
        PlusCircle, RefreshCw, Smartphone, Activity, Download,
        CheckCircle
    } from 'lucide-svelte';
    import { fade, fly, slide, scale } from 'svelte/transition';

    // Tabs state
    let activeTab = $state<'live' | 'monthly' | 'reinforce'>('live');
    
    // Filter states
    let selectedClassId = $state(settings.data.classes[0]?.id || "");
    let selectedClass = $derived(settings.data.classes.find(c => c.id === selectedClassId));
    let searchQuery = $state("");
    let autoNotify = $state(true);
    
    // Live Attendance Data
    let today = new Date().toISOString().split('T')[0];
    let classStudents = $derived(
        settings.data.students
            .filter(s => selectedClass?.studentIds.includes(s.id))
            .filter(s => s.name.includes(searchQuery))
    );

    function getAttendance(studentId: string) {
        return settings.data.attendance.find(a => a.studentId === studentId && a.date === today && a.classId === selectedClassId);
    }

    function toggleStatus(student: Student) {
        const att = getAttendance(student.id);
        const statusCycle: ('출석' | '지각' | '결석' | '조퇴')[] = ['출석', '지각', '결석', '조퇴'];
        let nextStatus: '출석' | '지각' | '결석' | '조퇴' = '출석';

        if (att) {
            const currentIdx = statusCycle.indexOf(att.status as any);
            nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
            att.status = nextStatus;
        } else {
            settings.data.attendance.push({
                id: `att_${Date.now()}_${student.id}`,
                studentId: student.id,
                classId: selectedClassId,
                date: today,
                status: '출석'
            });
            if (autoNotify) {
                toast.show(`${student.name} 학생 등원 처리가 완료되었습니다.`, "success", "학부모님께 안심 문자가 발송되었습니다.");
            }
        }
    }

    function setSpecificStatus(studentId: string, status: any) {
        const att = getAttendance(studentId);
        if (att) {
            att.status = status;
        } else {
            settings.data.attendance.push({
                id: `att_${Date.now()}_${studentId}`,
                studentId,
                classId: selectedClassId,
                date: today,
                status
            });
        }
    }

    const stats = $derived({
        total: classStudents.length,
        present: classStudents.filter(s => getAttendance(s.id)?.status === '출석').length,
        late: classStudents.filter(s => getAttendance(s.id)?.status === '지각').length,
        absent: classStudents.filter(s => getAttendance(s.id)?.status === '결석').length,
    });
</script>

<div class="space-y-10 pb-20 max-w-[1600px] mx-auto">
    <!-- Header -->
    <header class="flex justify-between items-end px-2">
        <div>
            <h2 class="toss-title">실시간 출결 매니저</h2>
        </div>
        <div class="flex gap-4">
            <div class="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-toss-grey-100 shadow-sm">
                <span class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest">자동 알림톡</span>
                <button 
                    onclick={() => autoNotify = !autoNotify}
                    class="w-12 h-7 rounded-full p-1 transition-all {autoNotify ? 'bg-toss-blue' : 'bg-toss-grey-200'}"
                >
                    <div class="w-5 h-5 bg-white rounded-full transition-all {autoNotify ? 'translate-x-5' : ''}"></div>
                </button>
            </div>
            <button class="toss-btn-primary px-8 flex items-center gap-2 shadow-lg shadow-toss-blue/20">
                <PlusCircle size={20} /> 전체 출석 처리
            </button>
        </div>
    </header>

    <!-- Stats Dashboard -->
    <div class="grid grid-cols-4 gap-6 px-2">
        {#each [
            { label: '대상', value: stats.total, color: 'text-toss-grey-400', bg: 'bg-white' },
            { label: '출석', value: stats.present, color: 'text-toss-blue', bg: 'bg-blue-50/30' },
            { label: '지각/미등원', value: stats.late, color: 'text-orange-500', bg: 'bg-orange-50/30' },
            { label: '결석', value: stats.absent, color: 'text-red-500', bg: 'bg-red-50/30' }
        ] as s}
            <div class="{s.bg} p-8 rounded-[40px] border border-toss-grey-100 shadow-sm transition-all hover:shadow-lg">
                <p class="text-[12px] font-black {s.color} uppercase tracking-widest">{s.label}</p>
                <h4 class="text-[34px] font-black text-toss-grey-600 mt-2">{s.value}<span class="text-[16px] text-toss-grey-300 ml-1">명</span></h4>
            </div>
        {/each}
    </div>

    <!-- Main Table Area -->
    <div class="flex gap-8 items-start px-2">
        <!-- class Sidebar -->
        <aside class="w-80 shrink-0 space-y-4">
            <h3 class="text-[13px] font-black text-toss-grey-300 uppercase tracking-[0.2em] pl-4">강의 선택</h3>
            <div class="space-y-2">
                {#each settings.data.classes as cls}
                    <button 
                        onclick={() => selectedClassId = cls.id}
                        class="w-full text-left p-6 rounded-[32px] border transition-all {selectedClassId === cls.id ? 'bg-white border-toss-blue shadow-lg ring-4 ring-toss-blue/5' : 'bg-white/50 border-toss-grey-100 hover:bg-white hover:border-toss-grey-200'}"
                    >
                        <p class="text-[16px] font-black {selectedClassId === cls.id ? 'text-toss-blue' : 'text-toss-grey-600'}">{cls.name}</p>
                        <p class="text-[12px] font-bold text-toss-grey-300 mt-1">{cls.time}</p>
                    </button>
                {/each}
            </div>
        </aside>

        <!-- Attendance Table -->
        <main class="flex-1 space-y-6">
            <div class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm overflow-hidden">
                <div class="p-6 border-b border-toss-grey-50 bg-toss-grey-50/30 flex justify-between items-center">
                    <div class="relative w-80 group flex items-center">
                        <Search size={20} class="absolute left-5 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" />
                        <input bind:value={searchQuery} placeholder="학생 이름을 입력하세요" class="w-full h-[60px] pl-16 pr-6 bg-white rounded-2xl border border-toss-grey-100 outline-none font-bold text-[16px] focus:border-toss-blue transition-all shadow-sm" />
                    </div>
                    <div class="flex items-center gap-2 text-[13px] font-bold text-toss-grey-400">
                        <Calendar size={16} /> {today} 기준
                    </div>
                </div>

                <table class="w-full text-left border-collapse">
                    <thead class="bg-toss-grey-50/50">
                <tr class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest">
                    <th class="py-2.5 px-8">학생 프로필</th>
                    <th class="py-2.5 px-8">학교 / 학년</th>
                    <th class="py-2.5 px-8">출결 상태</th>
                    <th class="py-2.5 px-8 text-right">체크 시간</th>
                    <th class="py-2.5 px-8 text-right">작업</th>
                </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-50">
                        {#each classStudents as s (s.id)}
                            {@const att = getAttendance(s.id)}
                            <tr class="hover:bg-toss-grey-50 transition-all group">
                                <td class="py-2.5 px-8">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-toss-grey-100 flex items-center justify-center font-black text-[14px] text-toss-grey-500">
                                            {s.name[0]}
                                        </div>
                                        <span class="text-[15px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors">{s.name}</span>
                                    </div>
                                </td>
                                <td class="py-2.5 px-8 text-[13px] font-bold text-toss-grey-400">
                                    {s.school} · {s.grade}
                                </td>
                                <td class="py-2.5 px-8">
                                    <div class="flex gap-1">
                                        {#each ['출석', '지각', '결석', '조퇴'] as status}
                                            <button 
                                                onclick={() => setSpecificStatus(s.id, status)}
                                                class="px-3 py-1.5 rounded-lg text-[11px] font-black transition-all {att?.status === status ? (status === '출석' ? 'bg-green-500 text-white' : status === '지각' ? 'bg-orange-500 text-white' : status === '결석' ? 'bg-red-500 text-white' : 'bg-purple-500 text-white') : 'bg-toss-grey-50 text-toss-grey-300 hover:bg-toss-grey-100 hover:text-toss-grey-500'}"
                                            >
                                                {status}
                                            </button>
                                        {/each}
                                    </div>
                                </td>
                                <td class="py-2.5 px-8 text-right">
                                    {#if att}
                                        <span class="text-[12px] font-black text-toss-blue">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {:else}
                                        <span class="text-[12px] font-bold text-toss-grey-200">-</span>
                                    {/if}
                                </td>
                                <td class="py-2.5 px-8 text-right">
                                    <button class="p-1.5 text-toss-grey-200 hover:text-toss-blue transition-colors" title="문자 강제 발송">
                                        <Smartphone size={16} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </main>
    </div>
</div>

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
</style>
