<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { toast } from '$lib/stores/toast.svelte';
    import { 
        BookOpen, ClipboardList, CheckCircle2, XCircle, 
        AlertCircle, Send, Plus, Calendar, Clock,
        ChevronRight, MessageSquare, History, PieChart,
        FileText, Download, Star, MoreVertical, Search,
        PlusCircle, ChevronDown, Check
    } from 'lucide-svelte';
    import { fade, fly, slide, scale } from 'svelte/transition';

    let selectedClassId = $state(settings.data.classes[0]?.id || "");
    let selectedClass = $derived(settings.data.classes.find(c => c.id === selectedClassId));
    let searchQuery = $state("");
    
    // Filter students for the selected class
    let classStudents = $derived(
        settings.data.students
            .filter(s => selectedClass && selectedClass.studentIds.includes(s.id))
            .filter(s => s.name.includes(searchQuery))
    );

    // Homework for the selected class
    let currentHomework = $derived(settings.data.homework.find(h => h.classId === selectedClassId));

    function setSubmission(studentId: string, status: 'done' | 'none') {
        const homework = currentHomework;
        if (!homework) return;

        const existingIdx = settings.data.submissions.findIndex(s => s.homeworkId === homework.id && s.studentId === studentId);
        if (existingIdx !== -1) {
            settings.data.submissions[existingIdx].status = status;
            settings.data.submissions[existingIdx].date = status === 'done' ? new Date().toISOString().split('T')[0] : '';
        } else {
            settings.data.submissions.push({
                id: `sub_${Math.random().toString(36).slice(2, 7)}`,
                homeworkId: homework.id,
                studentId: studentId,
                status: status,
                date: status === 'done' ? new Date().toISOString().split('T')[0] : ''
            });
        }
        
        if (status === 'done') {
            toast.show("과제 제출 확인", "success", "원생의 과제 제출 상태를 업데이트했습니다.");
        }
    }

    function getSubmission(studentId: string) {
        const homework = currentHomework;
        if (!homework) return null;
        return settings.data.submissions.find(s => s.homeworkId === homework.id && s.studentId === studentId);
    }

    function sendNudge(studentName: string) {
        toast.show(`${studentName} 학생 독촉 알림`, "info", "학부모님께 과제 미제출 안내 카톡을 발송했습니다.");
    }

    function sendMassNudge() {
        const missingCount = classStudents.filter(s => getSubmission(s.id)?.status !== 'done').length;
        if (missingCount === 0) {
            toast.show("발송 대상 없음", "info", "모든 학생이 과제를 제출했습니다.");
            return;
        }
        toast.show("대량 독촉 발송", "success", `${missingCount}명의 미제출자 학부모님께 알림톡을 발송했습니다.`);
    }

    const stats = $derived({
        total: classStudents.length,
        done: classStudents.filter(s => getSubmission(s.id)?.status === 'done').length,
        missing: classStudents.filter(s => getSubmission(s.id)?.status !== 'done').length,
        percent: classStudents.length > 0 ? Math.round((classStudents.filter(s => getSubmission(s.id)?.status === 'done').length / classStudents.length) * 100) : 0
    });
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="text-[32px] font-black text-toss-grey-600 tracking-tight">과제 피드백 시스템</h2>
            <div class="flex items-center gap-3 mt-2">
                <span class="px-3 py-1 bg-toss-blue-light text-toss-blue text-[12px] font-black rounded-full uppercase tracking-widest">Learning Hub</span>
            </div>
        </div>
        <div class="flex gap-4">
            <button class="bg-white px-8 py-4 rounded-[28px] border border-toss-grey-100 font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all flex items-center gap-2 shadow-sm">
                <History size={20} /> 과거 과제 아카이브
            </button>
            <button class="bg-toss-blue px-8 py-4 rounded-[28px] text-white font-black hover:scale-105 transition-all flex items-center gap-2 shadow-xl shadow-toss-blue/20">
                <PlusCircle size={20} /> 새 과제 배포
            </button>
        </div>
    </header>

    <!-- Top Stats & Controls -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Stats Card -->
        <div class="lg:col-span-3 space-y-6">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <Star size={180} />
                </div>
                <h3 class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2 relative z-10">
                    <PieChart size={20} class="text-toss-blue" />
                    실시간 제출 완료율
                </h3>
                <div class="flex flex-col items-center justify-center space-y-6 relative z-10">
                    <div class="relative w-40 h-40 flex items-center justify-center">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="72" stroke="currentColor" stroke-width="14" fill="transparent" class="text-toss-grey-50" />
                            <circle cx="80" cy="80" r="72" stroke="currentColor" stroke-width="14" fill="transparent" class="text-toss-blue" 
                                stroke-dasharray="452.3" stroke-dashoffset={452.3 - (452.3 * stats.percent / 100)} 
                                stroke-linecap="round"
                            />
                        </svg>
                        <div class="absolute text-center">
                            <span class="text-[36px] font-black text-toss-grey-600 leading-none">{stats.percent}%</span>
                            <p class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest mt-1">Status</p>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="text-[15px] font-black text-toss-grey-600">전체 {stats.total}명 중 {stats.done}명 완료</p>
                        <p class="text-[13px] font-bold text-toss-grey-300 mt-1">미제출 {stats.missing}명 집중 관리 필요</p>
                    </div>
                </div>
            </div>

            <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-6">
                <h3 class="text-[14px] font-black text-toss-grey-300 uppercase tracking-widest px-2">반 선택</h3>
                <div class="space-y-2">
                    {#each settings.data.classes as cls}
                        <button 
                            onclick={() => selectedClassId = cls.id}
                            class="w-full text-left p-6 rounded-[32px] transition-all group {selectedClassId === cls.id ? 'bg-toss-blue-light text-toss-blue' : 'text-toss-grey-500 hover:bg-toss-grey-50'}"
                        >
                            <span class="text-[17px] font-black group-hover:translate-x-1 transition-transform inline-block">{cls.name}</span>
                        </button>
                    {/each}
                </div>
            </div>
        </div>

        <!-- Main Table -->
        <div class="lg:col-span-9 space-y-8">
            <div class="bg-white rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden">
                <div class="p-10 border-b border-toss-grey-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 bg-toss-grey-50 rounded-2xl flex items-center justify-center text-toss-grey-300">
                            <ClipboardList size={28} />
                        </div>
                        <div>
                            <h3 class="text-[22px] font-black text-toss-grey-600">{selectedClass?.name} 과제 현황</h3>
                            <div class="flex items-center gap-3 mt-1">
                                <span class="px-2 py-0.5 bg-orange-50 text-orange-500 text-[11px] font-black rounded-md">진행중</span>
                                <p class="text-[14px] font-bold text-toss-grey-400">
                                    {#if currentHomework}
                                        {currentHomework.title} (마감: {currentHomework.dueDate})
                                    {:else}
                                        등록된 활성 과제가 없습니다.
                                    {/if}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button 
                            onclick={sendMassNudge}
                            class="h-[52px] px-8 rounded-2xl bg-orange-50 text-orange-600 font-black text-[15px] flex items-center gap-2 hover:bg-orange-100 transition-all border border-orange-100"
                        >
                            <Send size={18} /> 미제출자 전원 독촉
                        </button>
                    </div>
                </div>

                <div class="p-8 bg-toss-grey-50/30 border-b border-toss-grey-100">
                    <div class="relative w-full max-w-md group flex items-center">
                        <Search size={22} class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" />
                        <input 
                            bind:value={searchQuery}
                            placeholder="이름으로 필터링..." 
                            class="w-full h-[60px] pl-16 pr-8 rounded-[24px] bg-white border-none focus:ring-8 focus:ring-toss-blue/5 outline-none text-[17px] font-bold transition-all shadow-sm group-hover:shadow-md" 
                        />
                    </div>
                </div>

                <table class="w-full border-collapse">
                    <thead class="bg-toss-grey-50">
                        <tr class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest text-left">
                            <th class="py-5 px-10">원생명 / 학교</th>
                            <th class="py-5 px-8 text-center">제출 여부</th>
                            <th class="py-5 px-8 text-center">PDF/자료</th>
                            <th class="py-5 px-8 text-center">점수 / 피드백</th>
                            <th class="py-5 px-10 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-100">
                        {#each classStudents as s (s.id)}
                            {@const sub = getSubmission(s.id)}
                            <tr class="hover:bg-toss-grey-50/50 transition-all group">
                                <td class="py-8 px-10">
                                    <div class="flex items-center gap-5">
                                        <div class="w-12 h-12 rounded-[20px] bg-toss-grey-100 flex items-center justify-center text-[18px] font-black text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all shadow-sm">
                                            {s.name[0]}
                                        </div>
                                        <div>
                                            <p class="text-[17px] font-black text-toss-grey-600 leading-tight">{s.name}</p>
                                            <p class="text-[13px] font-bold text-toss-grey-300 mt-1">{s.school} · {s.grade}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-8 px-8 text-center">
                                    <button 
                                        onclick={() => setSubmission(s.id, sub?.status === 'done' ? 'none' : 'done')}
                                        class="px-6 py-2.5 rounded-full text-[13px] font-black transition-all {sub?.status === 'done' ? 'bg-toss-blue text-white shadow-lg shadow-toss-blue/20' : 'bg-toss-grey-100 text-toss-grey-400 hover:bg-toss-blue-light hover:text-toss-blue'}"
                                    >
                                        {sub?.status === 'done' ? '제출됨' : '미제출'}
                                    </button>
                                </td>
                                <td class="py-8 px-8 text-center">
                                    {#if sub?.status === 'done'}
                                        <div class="flex items-center justify-center gap-1 text-toss-blue hover:scale-110 transition-transform cursor-pointer" title="PDF 파일 이름.pdf">
                                            <FileText size={20} />
                                            <span class="text-[11px] font-black">PDF</span>
                                        </div>
                                    {:else}
                                        <div class="w-8 h-8 rounded-full border-2 border-dashed border-toss-grey-100 mx-auto flex items-center justify-center text-toss-grey-100">
                                            <Download size={14} />
                                        </div>
                                    {/if}
                                </td>
                                <td class="py-8 px-8 text-center">
                                    <div class="flex flex-col items-center gap-1">
                                        {#if sub?.status === 'done'}
                                            <input type="text" placeholder="점수" class="w-12 h-8 text-center text-[13px] font-black bg-toss-grey-50 border-none rounded-lg focus:ring-2 focus:ring-toss-blue outline-none" value="95" />
                                            <span class="text-[10px] font-bold text-toss-blue">피드백 완료</span>
                                        {:else}
                                            <span class="text-[13px] font-bold text-toss-grey-200">데이터 없음</span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="py-8 px-10 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button 
                                            onclick={() => sendNudge(s.name)}
                                            class="p-3 rounded-xl hover:bg-orange-50 text-toss-grey-200 hover:text-orange-600 transition-all" 
                                            title="과제 독촉 발송"
                                        >
                                            <MessageSquare size={20} />
                                        </button>
                                        <button class="p-3 rounded-xl hover:bg-toss-grey-100 text-toss-grey-200 hover:text-toss-grey-600 transition-all">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Empty State -->
            {#if classStudents.length === 0}
                <div class="bg-white p-24 rounded-[48px] border border-toss-grey-100 text-center space-y-6 shadow-sm" in:scale>
                    <div class="w-24 h-24 bg-toss-grey-50 rounded-[40px] flex items-center justify-center mx-auto text-toss-grey-200">
                        <BookOpen size={48} />
                    </div>
                    <div>
                        <p class="text-[18px] font-black text-toss-grey-500">배정된 학생이 없습니다.</p>
                        <p class="text-toss-grey-300 font-bold mt-2">반 구성원을 먼저 확인하거나 다른 반을 선택해주세요.</p>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Toss Design Tokens Integration */
    :global(body) {
        background-color: #f9fafb;
    }
</style>
