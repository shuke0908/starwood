<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { 
        TrendingUp, CreditCard, Wallet, Banknote, 
        Calendar, Download, ChevronLeft, ChevronRight,
        ArrowUpRight, ArrowDownRight, Package, Users
    } from 'lucide-svelte';

    let activeMonth = $state("2026-01");

    // Derived Data
    const monthlyPayments = $derived(
        (settings.data.payments || []).filter(p => p.date.startsWith(activeMonth) && p.status === 'completed')
    );

    const totalRevenue = $derived(monthlyPayments.reduce((acc, p) => acc + p.amount, 0));
    const transactionCount = $derived(monthlyPayments.length);
    const averageTicket = $derived(transactionCount > 0 ? totalRevenue / transactionCount : 0);

    const methodStats = $derived.by(() => {
        const stats = {
            '카드': { amount: 0, count: 0 },
            '현금': { amount: 0, count: 0 },
            '이체': { amount: 0, count: 0 }
        };
        monthlyPayments.forEach(p => {
            const method = p.method as keyof typeof stats || '카드';
            if (stats[method]) {
                stats[method].amount += p.amount;
                stats[method].count += 1;
            }
        });
        return stats;
    });

    const fmt = (val: number) => val.toLocaleString();

    function prevMonth() {
        let d = new Date(activeMonth + "-01");
        d.setMonth(d.getMonth() - 1);
        activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function nextMonth() {
        let d = new Date(activeMonth + "-01");
        d.setMonth(d.getMonth() + 1);
        activeMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="text-[32px] font-black text-toss-grey-600">매출 보고서</h2>
        </div>
        <div class="flex gap-4">
            <div class="bg-toss-grey-100 p-1.5 rounded-[20px] flex items-center pr-4">
                <button 
                    onclick={prevMonth}
                    class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
                >
                    <ChevronLeft size={20} />
                </button>
                <span class="px-4 font-black text-[15px] text-toss-grey-600">{activeMonth.replace('-', '.')} 매출</span>
                <button 
                    onclick={nextMonth}
                    class="w-10 h-10 rounded-xl hover:bg-white flex items-center justify-center text-toss-grey-400 transition-all"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
            <button class="toss-btn-secondary px-6 flex items-center gap-2">
                <Download size={18} /> 보고서 내보내기
            </button>
        </div>
    </header>

    <!-- Main Stats Overlay -->
    <div class="bg-toss-blue p-12 rounded-[48px] text-white shadow-2xl shadow-toss-blue/20 relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <TrendingUp size={240} />
        </div>
        <div class="relative z-10 space-y-4">
            <div class="flex items-center gap-2 text-toss-blue-light font-black uppercase tracking-widest text-[13px]">
                <div class="w-1.5 h-1.5 bg-toss-blue-light rounded-full animate-pulse"></div>
                Real-time Monthly Revenue
            </div>
            <h3 class="text-[64px] font-black py-2 tracking-tight">₩{fmt(totalRevenue)}</h3>
            <div class="flex gap-10">
                <div class="space-y-1">
                    <p class="text-[13px] font-bold opacity-60">총 결제 건수</p>
                    <p class="text-[20px] font-black">{transactionCount}건</p>
                </div>
                <div class="w-px h-10 bg-white/20 my-auto"></div>
                <div class="space-y-1">
                    <p class="text-[13px] font-bold opacity-60">건당 평균 결제액</p>
                    <p class="text-[20px] font-black">₩{fmt(Math.round(averageTicket))}</p>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Payment Methods -->
        <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8">
            <h3 class="text-[20px] font-black text-toss-grey-600">결제 수단별 비중</h3>
            <div class="space-y-6">
                {#each Object.entries(methodStats) as [method, stats]}
                    {@const percentage = totalRevenue > 0 ? (stats.amount / totalRevenue) * 100 : 0}
                    <div class="space-y-3">
                        <div class="flex justify-between items-end">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-toss-grey-50 flex items-center justify-center text-toss-grey-400">
                                    {#if method === '카드'}<CreditCard size={20} />{/if}
                                    {#if method === '현금'}<Banknote size={20} />{/if}
                                    {#if method === '이체'}<Wallet size={20} />{/if}
                                </div>
                                <span class="font-black text-toss-grey-600">{method}</span>
                            </div>
                            <div class="text-right">
                                <p class="text-[16px] font-black text-toss-grey-600">₩{fmt(stats.amount)}</p>
                                <p class="text-[12px] font-bold text-toss-grey-300">{stats.count}건 ({percentage.toFixed(1)}%)</p>
                            </div>
                        </div>
                        <div class="h-2 bg-toss-grey-50 rounded-full overflow-hidden">
                            <div 
                                class="h-full bg-toss-blue transition-all duration-1000 ease-out" 
                                style="width: {percentage}%"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <!-- Sales Insights -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm">
            <div class="flex justify-between items-center mb-8">
                <h3 class="text-[20px] font-black text-toss-grey-600">최근 결제 내역</h3>
                <button class="text-toss-blue font-black text-[14px]">전체 보기 ➔</button>
            </div>
            <div class="space-y-4">
                {#if monthlyPayments.length === 0}
                    <div class="py-20 text-center space-y-4 opacity-30">
                        <Package size={48} class="mx-auto" />
                        <p class="font-bold">해당 월의 결제 내역이 없습니다.</p>
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest border-b border-toss-grey-50 text-left">
                                    <th class="pb-4 px-4">날짜</th>
                                    <th class="pb-4 px-4">학생명</th>
                                    <th class="pb-4 px-4">결제수단</th>
                                    <th class="pb-4 px-4 text-right">금액</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-toss-grey-50">
                                {#each monthlyPayments.slice(0, 5) as p}
                                    {@const student = settings.data.students.find(s => s.id === p.studentId)}
                                    <tr class="hover:bg-toss-grey-50/50 transition-colors group">
                                        <td class="py-4 px-4 text-[14px] font-bold text-toss-grey-400">{p.date.slice(5)}</td>
                                        <td class="py-4 px-4">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-lg bg-toss-grey-100 flex items-center justify-center font-black text-[12px] text-toss-grey-400">{student?.name[0] || '?'}</div>
                                                <span class="text-[15px] font-black text-toss-grey-600">{student?.name || '알 수 없음'}</span>
                                            </div>
                                        </td>
                                        <td class="py-4 px-4">
                                            <span class="px-2 py-0.5 bg-toss-grey-50 rounded text-[12px] font-black text-toss-grey-400">{p.method}</span>
                                        </td>
                                        <td class="py-4 px-4 text-right">
                                            <span class="text-[15px] font-black text-toss-grey-600">₩{fmt(p.amount)}</span>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
