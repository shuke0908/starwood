<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { 
        BarChart3, FileLineChart, TrendingDown, TrendingUp, 
        ChevronRight, Plus, Download, Send, 
        AlertCircle, MoreVertical, ClipboardCheck,
        MonitorPlay, PieChart, Star, Target, Calendar as CalendarIcon
    } from 'lucide-svelte';
    import { fade, fly, slide, scale } from 'svelte/transition';

    let activeExamId = $state(settings.data.exams[2]?.id || settings.data.exams[0]?.id || "");
    let activeExam = $derived(settings.data.exams.find(e => e.id === activeExamId));
    
    let examScores = $derived(settings.data.scores.filter(s => s.examId === activeExamId));

    const getStudentName = (id: string) => settings.data.students.find(s => s.id === id)?.name || "알 수 없음";
    const getStudentInfo = (id: string) => settings.data.students.find(s => s.id === id);

    function createReport(scoreId: string) {
        alert("해당 학생의 심층 분석 리포트 PDF가 생성되었습니다. (시뮬레이션)");
    }

    const fmt = (val: number) => val.toLocaleString();
</script>

<div class="space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="toss-title">성적 및 분석 리포트</h2>
        </div>
        <div class="flex gap-4">
            <button class="toss-btn-secondary px-6 flex items-center gap-2 border-toss-grey-100">
                <Download size={18} /> 전체 데이터 엑셀
            </button>
            <button class="toss-btn-primary flex items-center gap-2 pl-4 pr-6">
                <Plus size={20} /> 신규 시험 결과 등록
            </button>
        </div>
    </header>

    <!-- Top Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Exam Switcher -->
        <div class="lg:col-span-3 bg-white p-3 rounded-[32px] border border-toss-grey-100 shadow-sm flex gap-3 overflow-x-auto no-scrollbar">
            {#each settings.data.exams as exam}
                <button 
                    onclick={() => activeExamId = exam.id}
                    class="flex-shrink-0 min-w-[200px] p-5 rounded-[24px] text-left transition-all border {activeExamId === exam.id ? 'bg-toss-blue border-toss-blue text-white shadow-xl shadow-toss-blue/20' : 'bg-toss-grey-50 border-transparent text-toss-grey-500 hover:bg-toss-grey-100'}"
                >
                    <p class="text-[11px] font-black uppercase tracking-wider opacity-60 mb-1">{exam.type}</p>
                    <h4 class="text-[16px] font-black leading-tight truncate">{exam.name}</h4>
                    <div class="mt-3 flex items-center gap-2 opacity-80">
                        <CalendarIcon size={12} />
                        <span class="text-[12px] font-bold">{exam.date}</span>
                    </div>
                </button>
            {/each}
        </div>

        <!-- Warning HUD -->
        <div class="bg-red-50 p-6 rounded-[32px] border border-red-100 flex flex-col justify-between">
            <div class="space-y-2">
                <div class="flex items-center gap-2 text-red-500">
                    <AlertCircle size={20} />
                    <span class="font-black">집중 케어 대상</span>
                </div>
                <p class="text-[14px] font-bold text-red-500/70 leading-relaxed">이전 시험 대비 15점 이상 하락한 학생이 3명 있습니다.</p>
            </div>
            <button class="w-full h-11 bg-white border border-red-100 text-red-500 rounded-xl font-black text-[13px] hover:bg-red-500 hover:text-white transition-all mt-4">명단 확인</button>
        </div>
    </div>

    <!-- Main Table -->
    <div class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-toss-grey-100 flex justify-between items-center bg-toss-grey-50/30">
            <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3">
                <Target size={24} class="text-toss-blue" />
                {activeExam?.name} 성적 분석표
            </h3>
        </div>

        <table class="w-full border-collapse">
            <thead class="bg-toss-grey-50">
                <tr class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest border-b border-toss-grey-100 text-left">
                    <th class="py-2.5 px-8">학생 명단</th>
                    <th class="py-2.5 px-8 text-center">세부 영역 (L / R / G)</th>
                    <th class="py-2.5 px-8 text-right">총점</th>
                    <th class="py-2.5 px-8 text-center">추이</th>
                    <th class="py-2.5 px-8">학습 성취도/특이사항</th>
                    <th class="py-2.5 px-8 text-right">관리</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-100">
                {#each examScores as score (score.id)}
                    {@const student = getStudentInfo(score.studentId)}
                    <tr class="hover:bg-toss-grey-50/50 transition-all group">
                        <td class="py-2.5 px-8">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg bg-toss-grey-100 flex items-center justify-center font-black text-[13px] text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all">
                                    {getStudentName(score.studentId)[0]}
                                </div>
                                <div>
                                    <p class="text-[14px] font-black text-toss-grey-600 leading-tight">{getStudentName(score.studentId)}</p>
                                    <p class="text-[10px] font-bold text-toss-grey-300 mt-1">{student?.school} · {student?.grade}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-2.5 px-8">
                            <div class="flex items-center justify-center gap-4">
                                <div class="text-center">
                                    <p class="text-[9px] font-black text-toss-grey-300 mb-0.5">LIS</p>
                                    <p class="text-[13px] font-black text-toss-grey-600">{score.components.listening}</p>
                                </div>
                                <div class="text-center border-x border-toss-grey-100 px-4">
                                    <p class="text-[9px] font-black text-toss-grey-300 mb-0.5">READ</p>
                                    <p class="text-[13px] font-black text-toss-grey-600">{score.components.reading}</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-[9px] font-black text-toss-grey-300 mb-0.5">GRAM</p>
                                    <p class="text-[13px] font-black text-toss-grey-600">{score.components.grammar}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-2.5 px-8 text-right">
                            <span class="text-[18px] font-black text-toss-grey-600">{score.total}</span>
                            <span class="text-[12px] font-bold text-toss-grey-200 ml-0.5">/ 100</span>
                        </td>
                        <td class="py-2.5 px-8">
                                <div class="flex flex-col items-center gap-0.5">
                                    {#if score.total > (score.prevTotal ?? 0)}
                                        <TrendingUp size={14} class="text-toss-blue" />
                                        <span class="text-[10px] font-black text-toss-blue">+{score.total - (score.prevTotal ?? 0)}</span>
                                    {:else if score.total < (score.prevTotal ?? 0)}
                                        <TrendingDown size={14} class="text-red-500" />
                                        <span class="text-[10px] font-black text-red-500">{score.total - (score.prevTotal ?? 0)}</span>
                                    {:else}
                                        <span class="text-[10px] font-black text-toss-grey-300">-</span>
                                    {/if}
                                </div>
                        </td>
                        <td class="py-2.5 px-8">
                            <div class="flex gap-1 mb-1">
                                {#each Array(5) as _, i}
                                    <Star size={10} class={i < (score.total / 20) ? 'text-toss-blue fill-toss-blue' : 'text-toss-grey-100'} />
                                {/each}
                            </div>
                            <p class="text-[12px] font-bold text-toss-grey-400 line-clamp-1">부족한 문법 개념 재 정리가 필요함</p>
                        </td>
                        <td class="py-2.5 px-8 text-right">
                            <div class="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button onclick={() => createReport(score.id)} class="toss-btn-secondary h-8 px-3 text-[11px] border-toss-grey-100 hover:text-toss-blue">리포트</button>
                                <button class="p-1.5 rounded-lg hover:bg-toss-blue-light text-toss-blue"><Send size={14} /></button>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Analytics Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8">
            <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3">
                <BarChart3 class="text-toss-blue" />
                문항 분석 요약
            </h3>
            <div class="space-y-6">
                {#each [
                    { label: '리스닝 이해도', val: 88, color: 'bg-toss-blue' },
                    { label: '독해 추론력', val: 72, color: 'bg-toss-blue' },
                    { label: '문법 정확도', val: 56, color: 'bg-orange-400' }
                ] as stat}
                    <div class="space-y-2">
                        <div class="flex justify-between text-[14px] font-black">
                            <span class="text-toss-grey-400">{stat.label}</span>
                            <span class={stat.val < 60 ? 'text-orange-500' : 'text-toss-blue'}>{stat.val}%</span>
                        </div>
                        <div class="w-full h-2.5 bg-toss-grey-50 rounded-full overflow-hidden">
                            <div class="{stat.color} h-full transition-all duration-1000" style="width: {stat.val}%"></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <div class="bg-toss-grey-600 p-10 rounded-[48px] text-white space-y-6 shadow-2xl shadow-toss-grey-200">
            <div class="flex items-center gap-3">
                <div class="p-3 bg-white/10 rounded-2xl"><MonitorPlay size={24} class="text-toss-blue" /></div>
                <h3 class="text-[20px] font-black">스마트 리포트 자동 생성</h3>
            </div>
            <p class="text-white/60 font-medium leading-relaxed">
                모든 학생의 성적 데이터를 바탕으로 개인별 맞춤 리포트를 생성했습니다. 
                학부모님 카카오톡으로 즉시 전송이 가능합니다.
            </p>
            <div class="pt-6 border-t border-white/5 flex gap-4">
                <button class="flex-1 h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black transition-all">전체 미리보기</button>
                <button class="flex-1 h-14 bg-toss-blue text-white rounded-2xl font-black hover:scale-[1.02] shadow-lg shadow-toss-blue/20 transition-all">일괄 리포트 전송</button>
            </div>
        </div>
    </div>
</div>
