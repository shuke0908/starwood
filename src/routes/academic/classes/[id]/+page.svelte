<script lang="ts">
    import { page } from '$app/state';
    import { settings } from '$lib/settings.svelte';
    import { 
        ChevronLeft, GraduationCap, User, Clock, Calendar, 
        CircleDollarSign, Wallet, AlertCircle, Plus, 
        ChevronRight, Edit3, MessageSquare, PieChart,
        Calculator, Settings2, Trash2, CheckCircle2, ClipboardList
    } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    const classId = page.params.id;
    const cls = $derived(settings.data.classes.find(c => c.id === classId));
    const teacher = $derived(cls ? settings.data.teachers.find(t => t.id === cls.teacherId) : null);
    
    // Filter students belonging to this class
    const classStudents = $derived(
        settings.data.students.filter(s => 
            cls && (s.classes || []).includes(cls.name)
        )
    );

    // Calculate dynamic stats
    const stats = $derived({
        revenue: classStudents.length * 350000, // Mock revenue calculation
        unpaid: classStudents.reduce((acc, s) => acc + (s.unpaid || 0), 0),
        paidCount: classStudents.filter(s => s.status !== '미납').length
    });

    let activeTab = $state('students'); // students, schedule, billing
    
    // Logic for auto-calculating session count
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    function getSessionCount(days: string[] | undefined) {
        if (!days) return 0;
        const dayMap: Record<string, number> = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };
        const dayIndices = days.map(d => dayMap[d]);
        
        let count = 0;
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month, d);
            if (dayIndices.includes(date.getDay())) count++;
        }
        return count;
    }

    const sessionCount = $derived(cls ? getSessionCount(cls.day) : 0);
    const baseFee = 350000;
    const calculatedFee = $derived(cls ? (cls.billingType === 'session' ? (baseFee / 10) * sessionCount : baseFee) : 0);

    const fmt = (val: number) => val.toLocaleString();
</script>

{#if cls}
<div class="max-w-[1400px] mx-auto space-y-8 pb-20">
    <!-- Top Navigation -->
    <a href="/classes" class="flex items-center gap-2 text-toss-grey-400 font-bold hover:text-toss-blue transition-colors group">
        <ChevronLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
        클래스 목록으로 돌아가기
    </a>

    <!-- Class Header Card -->
    <section class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-toss-blue-light/30 rounded-full blur-3xl"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row justify-between gap-10">
            <div class="space-y-6">
                <div class="flex items-center gap-3">
                    <span class="px-4 py-1.5 rounded-2xl bg-toss-blue text-white text-[13px] font-black uppercase tracking-widest">
                        {cls.billingType === 'session' ? '횟수제 정산' : '월정액 정산'}
                    </span>
                    <h2 class="text-[36px] font-black text-toss-grey-600">{cls.name}</h2>
                </div>

                <div class="flex flex-wrap gap-8">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-toss-grey-100 rounded-2xl flex items-center justify-center text-toss-grey-500">
                            <User size={24} />
                        </div>
                        <div>
                            <p class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest mb-0.5">담당 강사</p>
                            <p class="text-[17px] font-bold text-toss-grey-600">{teacher?.name || '미배정'} 강사</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-toss-grey-100 rounded-2xl flex items-center justify-center text-toss-grey-500">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest mb-0.5">수업 요일</p>
                            <div class="flex gap-1">
                                {#each cls.day as d}
                                    <span class="text-[17px] font-bold text-toss-grey-600">{d}</span>
                                {/each}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-toss-grey-100 rounded-2xl flex items-center justify-center text-toss-grey-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest mb-0.5">수업 시간</p>
                            <p class="text-[17px] font-bold text-toss-grey-600">{cls.time}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-4 items-end">
                <button class="toss-btn-secondary flex items-center gap-2 pr-6">
                    <Settings2 size={20} /> 반 관리
                </button>
                <button class="toss-btn-primary flex items-center gap-2 pr-6">
                    <Plus size={20} /> 원생 추가 배정
                </button>
            </div>
        </div>
    </section>

    <!-- Financial Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-[15px] font-black text-toss-grey-400 uppercase tracking-widest">이번 달 청구 총액</h4>
                <PieChart size={20} class="text-toss-blue" />
            </div>
            <p class="text-[32px] font-black text-toss-grey-600">₩{fmt(stats.revenue)}</p>
            <div class="flex items-center gap-2 text-[13px] font-bold text-toss-grey-400">
                <span class="text-toss-blue">지난 달 대비 +4.2%</span>
            </div>
        </div>
        <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-[15px] font-black text-toss-grey-400 uppercase tracking-widest">수납 완료</h4>
                <CircleDollarSign size={20} class="text-green-500" />
            </div>
            <p class="text-[32px] font-black text-toss-grey-600">₩{fmt(stats.revenue - stats.unpaid)}</p>
            <div class="w-full h-2 bg-toss-grey-100 rounded-full mt-2 overflow-hidden">
                <div class="h-full bg-green-500" style="width: {stats.revenue > 0 ? ((stats.revenue - stats.unpaid) / stats.revenue) * 100 : 0}%"></div>
            </div>
        </div>
        <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-[15px] font-black text-toss-grey-400 uppercase tracking-widest">미수금</h4>
                <AlertCircle size={20} class="text-red-500" />
            </div>
            <p class="text-[32px] font-black text-red-500">₩{fmt(stats.unpaid)}</p>
            <button class="text-[14px] font-black text-toss-blue hover:underline">미수자 전원 독촉 발송</button>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Student List (Left) -->
        <div class="lg:col-span-2 space-y-6">
            <div class="flex items-center justify-between">
                <h3 class="text-[22px] font-black text-toss-grey-600">수강 중인 원생 ({classStudents.length}명)</h3>
                <div class="flex gap-2">
                    <button class="p-2.5 rounded-xl bg-toss-grey-100 text-toss-grey-400 hover:text-toss-blue transition-all">
                        <MessageSquare size={18} />
                    </button>
                    <button class="p-2.5 rounded-xl bg-toss-grey-100 text-toss-grey-400 hover:text-red-500 transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div class="bg-white rounded-[40px] border border-toss-grey-100 overflow-hidden shadow-sm">
                <table class="w-full">
                    <thead class="bg-toss-grey-50">
                        <tr class="border-b border-toss-grey-100 uppercase tracking-widest text-[11px] font-black text-toss-grey-400">
                            <th class="py-5 px-8 text-left">이름 / 학교</th>
                            <th class="py-5 px-8 text-center">출결 현황</th>
                            <th class="py-5 px-8 text-right">수납 상태</th>
                            <th class="py-5 px-8 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-100">
                        {#each classStudents as s (s.id)}
                            <tr class="group hover:bg-toss-grey-100/30 transition-all">
                                <td class="py-6 px-8">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-2xl bg-toss-grey-100 flex items-center justify-center font-black text-toss-grey-500">
                                            {s.name[0]}
                                        </div>
                                        <div class="flex flex-col">
                                            <span class="text-[16px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors leading-tight">{s.name}</span>
                                            <span class="text-[13px] font-bold text-toss-grey-400 mt-1">{s.school}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-6 px-8">
                                    <div class="flex justify-center flex-wrap gap-1 max-w-[120px] mx-auto">
                                        {#each Array(4) as _, i}
                                            <div class="w-2.5 h-2.5 rounded-[1px] {i < 3 ? 'bg-green-400' : 'bg-red-400'}" title="최근 출결"></div>
                                        {/each}
                                    </div>
                                </td>
                                <td class="py-6 px-8 text-right">
                                    <span class="text-[14px] font-black {s.status === '미납' ? 'text-red-500' : 'text-toss-blue'}">
                                        {s.status === '미납' ? '미납 중' : '납부 완료'}
                                    </span>
                                </td>
                                <td class="py-6 px-8 text-right">
                                    <a href="/students/{s.id}" class="inline-flex p-2.5 rounded-xl hover:bg-toss-blue-light text-toss-grey-300 hover:text-toss-blue transition-all">
                                        <ChevronRight size={18} />
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Billing Logic Card (Right) -->
        <aside class="space-y-8">
            <div class="bg-toss-blue p-8 rounded-[40px] text-white space-y-8 shadow-xl shadow-toss-blue/20">
                <div class="flex items-center justify-between">
                    <h3 class="text-[20px] font-black flex items-center gap-2">
                        <Calculator size={24} /> 정산 상세
                    </h3>
                    <button class="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <Edit3 size={18} />
                    </button>
                </div>

                <div class="space-y-6">
                    <div class="p-5 bg-white/10 rounded-3xl border border-white/10">
                        <p class="text-[12px] font-bold text-white/60 mb-1">방식</p>
                        <p class="text-[18px] font-black">{cls.billingType === 'session' ? '횟수제 (자동 계산)' : '월정액 (고정)'}</p>
                    </div>

                    <div class="space-y-4">
                        <div class="flex justify-between items-center text-[15px] font-bold text-white/80">
                            <span>이번 달 수업 횟수 ({today.getMonth() + 1}월)</span>
                            <span class="text-[17px] font-black text-white">{sessionCount}회</span>
                        </div>
                        <div class="flex justify-between items-center text-[15px] font-bold text-white/80">
                            <span>1회 수업료</span>
                            <span class="text-[17px] font-black text-white">₩{fmt(baseFee / (cls.billingType === 'session' ? 10 : 1))}</span>
                        </div>
                        <div class="pt-4 border-t border-white/20 flex justify-between items-end">
                            <span class="text-[14px] font-bold text-white/60">최종 청구액</span>
                            <span class="text-[24px] font-black">₩{fmt(calculatedFee)}</span>
                        </div>
                    </div>
                </div>

                <button class="w-full bg-white text-toss-blue h-[56px] rounded-[24px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10">
                    <CheckCircle2 size={20} /> 정산 내역 확정
                </button>
            </div>

            <!-- Homework Alert -->
            <div class="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm space-y-6 relative overflow-hidden">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-orange-50 rounded-full blur-2xl"></div>
                <h3 class="text-[18px] font-black text-toss-grey-600 flex items-center gap-2 relative z-10">
                    <ClipboardList class="text-orange-500" size={20} /> 숙제 제출 현황
                </h3>
                
                <div class="space-y-4 relative z-10">
                    <div class="flex justify-between items-center">
                        <span class="text-[14px] font-bold text-toss-grey-400">전체 원생 12명 중</span>
                        <span class="text-[14px] font-black text-orange-500">8명 미제출</span>
                    </div>
                    <div class="w-full h-2 bg-toss-grey-100 rounded-full overflow-hidden">
                        <div class="h-full bg-orange-500" style="width: 33%"></div>
                    </div>
                </div>

                <button class="w-full toss-btn-secondary text-[14px] h-[48px] bg-orange-50 text-orange-600 hover:bg-orange-100 relative z-10">미제출자 일괄 소환</button>
            </div>
        </aside>
    </div>
</div>
{:else}
<div class="flex flex-col items-center justify-center py-40 space-y-4 text-toss-grey-400">
    <AlertCircle size={48} />
    <p class="text-[18px] font-black">클래스 정보를 찾을 수 없습니다.</p>
</div>
{/if}
