<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { 
        Receipt, Plus, Trash2, Calendar, 
        TrendingUp, PieChart, Wallet, CreditCard,
        Building, Users, Zap, Megaphone, MoreHorizontal,
        CheckCircle2, AlertCircle, ArrowUpRight, X
    } from 'lucide-svelte';
    import type { ExpenseRecord } from '$lib/types';

    let showAddForm = $state(false);
    let activeMonth = $state(new Date().toISOString().slice(0, 7));
    
    let newExpense = $state<Partial<ExpenseRecord>>({
        category: 'etc',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: "",
        payMethod: '이체'
    });

    const categories = [
        { id: 'rent', label: '임대료', icon: Building, color: 'bg-blue-500' },
        { id: 'salary', label: '인건비', icon: Users, color: 'bg-toss-blue' },
        { id: 'utilities', label: '공과금', icon: Zap, color: 'bg-orange-400' },
        { id: 'marketing', label: '홍보비', icon: Megaphone, color: 'bg-green-500' },
        { id: 'etc', label: '기타', icon: MoreHorizontal, color: 'bg-toss-grey-400' }
    ];

    function addExpense() {
        if (!newExpense.amount || !newExpense.description) {
            alert("금액과 내용을 입력해주세요.");
            return;
        }

        const expense: ExpenseRecord = {
            id: `exp_${Date.now()}`,
            category: newExpense.category as any,
            amount: newExpense.amount!,
            date: newExpense.date!,
            description: newExpense.description!,
            payMethod: newExpense.payMethod as any
        };

        settings.data.expenses = [expense, ...settings.data.expenses];
        showAddForm = false;
        newExpense = {
            category: 'etc',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            description: "",
            payMethod: '이체'
        };
    }

    function removeExpense(id: string) {
        if (!confirm("지출 기록을 삭제하시겠습니까?")) return;
        settings.data.expenses = settings.data.expenses.filter(e => e.id !== id);
    }

    const teacherSalaries = $derived.by(() => {
        const teachers = settings.data.teachers || [];
        const payments = settings.data.payments || [];
        const timetable = settings.data.timetable || [];
        const classes = settings.data.classes || [];
        const products = settings.data.products || [];

        const monthlyPayments = payments.filter(p => p.date && p.date.startsWith(activeMonth) && p.status === 'completed');
        
        return teachers.map(t => {
            const teacherRevenue = monthlyPayments.reduce((acc, p) => {
                const pProductIds = p.productIds || [];
                const paidProducts = products.filter(prod => pProductIds.includes(prod.id));
                const linkedClasses = classes.filter(cls => 
                    paidProducts.some(prod => prod.classIds.includes(cls.id)) && 
                    cls.teacherId === t.id
                );
                return linkedClasses.length > 0 ? acc + (p.amount / paidProducts.length) : acc;
            }, 0);

            const teacherEvents = timetable.filter(e => e.teacherId === t.id);
            const totalHours = teacherEvents.length * 1.5; 

            let baseAmount = Number(t.settlementValue) || 0;
            if (t.settlementType === 'ratio') baseAmount = teacherRevenue * ((t.settlementValue || 0) / 100);
            else if (t.settlementType === 'hourly') baseAmount = totalHours * (t.settlementValue || 0);
            else if (t.settlementType === 'equity') {
                const totalRevenue = monthlyPayments.reduce((acc, p) => acc + p.amount, 0);
                baseAmount = totalRevenue * ((t.settlementValue || 0) / 100);
            }

            return { id: t.id, name: t.name, amount: baseAmount };
        });
    });

    const totalTeacherSalary = $derived(teacherSalaries.reduce((sum, s) => sum + s.amount, 0));
    const manualExpenses = $derived(settings.data.expenses.filter(e => e.date.startsWith(activeMonth)));
    const totalExpense = $derived(manualExpenses.reduce((sum, e) => sum + e.amount, 0) + totalTeacherSalary);

    const categoryTotals = $derived(
        categories.map(c => {
            let total = manualExpenses.filter(e => e.category === c.id).reduce((sum, e) => sum + e.amount, 0);
            if (c.id === 'salary') total += totalTeacherSalary;
            return { ...c, total };
        })
    );

    const fmt = (val: number) => Math.floor(val).toLocaleString();
</script>

<div class="space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="toss-title">학원 지출 및 결의</h2>
        </div>
        <button 
            onclick={() => showAddForm = !showAddForm}
            class="toss-btn-primary px-8 flex items-center gap-2"
        >
            <Plus size={20} /> 지출 결의서 작성
        </button>
    </header>

    <!-- Visual Dashboard -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-toss-grey-900 p-8 rounded-[40px] text-white space-y-4 shadow-2xl shadow-toss-grey-300 col-span-1">
            <p class="text-[12px] font-black opacity-40 uppercase tracking-widest">이달의 총 지출</p>
            <p class="text-[36px] font-black">₩{fmt(totalExpense)}</p>
            <div class="flex items-center gap-2 text-toss-blue font-black text-[13px]">
                <TrendingUp size={16} /> 전월 대비 -2.4%
            </div>
        </div>

        <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm col-span-3 space-y-6">
            <div class="flex justify-between items-center">
                <h4 class="text-[16px] font-black text-toss-grey-600 flex items-center gap-2">
                    <PieChart size={18} class="text-toss-blue" /> 카테고리별 비중
                </h4>
                <div class="flex gap-4">
                    {#each categoryTotals as cat}
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full {cat.color}"></div>
                            <span class="text-[12px] font-bold text-toss-grey-300">{cat.label}</span>
                        </div>
                    {/each}
                </div>
            </div>
            <div class="w-full h-12 bg-toss-grey-50 rounded-[20px] overflow-hidden flex">
                {#each categoryTotals as cat}
                    <div 
                        class="{cat.color} h-full transition-all duration-700" 
                        style="width: {(cat.total / (totalExpense || 1)) * 100}%"
                        title="{cat.label}: ₩{fmt(cat.total)}"
                    ></div>
                {/each}
            </div>
            <div class="grid grid-cols-5 gap-4">
                {#each categoryTotals as cat}
                    <div>
                        <p class="text-[11px] font-black text-toss-grey-300">{cat.label}</p>
                        <p class="text-[15px] font-black text-toss-grey-600">₩{fmt(cat.total)}</p>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    {#if showAddForm}
        <div class="bg-white p-10 rounded-[48px] border-2 border-toss-blue/20 shadow-2xl shadow-toss-blue/5 space-y-8" transition:slide>
            <div class="flex justify-between items-center">
                <h3 class="text-[22px] font-black text-toss-grey-600">지출 정보 입력</h3>
                <button onclick={() => showAddForm = false} class="text-toss-grey-300"><X size={24} /></button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="space-y-2">
                    <label class="text-[12px] font-black text-toss-grey-300">카테고리</label>
                    <select bind:value={newExpense.category} class="toss-input">
                        {#each categories as cat}
                            <option value={cat.id}>{cat.label}</option>
                        {/each}
                    </select>
                </div>
                <!-- ... other inputs ... -->
                <div class="space-y-2">
                    <label class="text-[12px] font-black text-toss-grey-300">지출 일자</label>
                    <input type="date" bind:value={newExpense.date} class="toss-input" />
                </div>
                <div class="space-y-2">
                    <label class="text-[12px] font-black text-toss-grey-300">금액</label>
                    <input type="number" bind:value={newExpense.amount} class="toss-input font-black text-right" placeholder="0" />
                </div>
                <div class="space-y-2">
                    <label class="text-[12px] font-black text-toss-grey-300">결제 수단</label>
                    <select bind:value={newExpense.payMethod} class="toss-input">
                        <option>이체</option>
                        <option>카드</option>
                        <option>현금</option>
                    </select>
                </div>
                <div class="md:col-span-3 space-y-2">
                    <label class="text-[12px] font-black text-toss-grey-300">지출 내용 요약</label>
                    <input bind:value={newExpense.description} class="toss-input" placeholder="증빙 서류에 표기될 내용을 입력하세요." />
                </div>
                <div class="flex items-end">
                    <button onclick={addExpense} class="w-full h-16 bg-toss-blue text-white rounded-2xl font-black text-[18px]">결의 완료</button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Expense Table -->
    <div class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-toss-grey-100 flex justify-between items-center bg-toss-grey-50/20">
            <h3 class="text-[18px] font-black text-toss-grey-600">지출 장부</h3>
        </div>

        <table class="w-full">
            <thead class="bg-toss-grey-50">
                <tr class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest text-left">
                    <th class="py-2.5 px-10">지출일</th>
                    <th class="py-2.5 px-8">항목 / 수단</th>
                    <th class="py-2.5 px-8">지출 내역</th>
                    <th class="py-2.5 px-10 text-right">금액</th>
                    <th class="py-2.5 px-10 text-center">상태</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-100">
                <!-- Auto Salaries -->
                {#each teacherSalaries as salary}
                    <tr class="bg-toss-blue/5 hover:bg-toss-blue/10 transition-all">
                        <td class="py-2.5 px-10 text-[13px] font-bold text-toss-grey-400">{activeMonth}-28</td>
                        <td class="py-2.5 px-8">
                            <span class="px-2 py-0.5 bg-toss-blue text-white rounded text-[10px] font-black uppercase">인건비 자동</span>
                        </td>
                        <td class="py-2.5 px-8">
                            <p class="text-[14px] font-black text-toss-grey-600">{salary.name} 강사 급여</p>
                        </td>
                        <td class="py-2.5 px-10 text-right">
                            <p class="text-[15px] font-black text-toss-blue">₩{fmt(salary.amount)}</p>
                        </td>
                        <td class="py-2.5 px-10 text-center">
                            <span class="flex items-center justify-center gap-1 text-[11px] font-black text-toss-blue">
                                <CheckCircle2 size={12} /> 확정
                            </span>
                        </td>
                    </tr>
                {/each}

                <!-- Manual -->
                {#each manualExpenses as exp}
                    {@const cat = categories.find(c => c.id === exp.category)}
                    <tr class="hover:bg-toss-grey-50/50 transition-all group">
                        <td class="py-2.5 px-10 text-[13px] font-bold text-toss-grey-400">{exp.date}</td>
                        <td class="py-2.5 px-8">
                            <span class="px-2 py-0.5 {cat?.color} text-white rounded text-[10px] font-black uppercase">{cat?.label}</span>
                            <span class="text-[10px] font-bold text-toss-grey-300 ml-1">{exp.payMethod}</span>
                        </td>
                        <td class="py-2.5 px-8">
                            <p class="text-[14px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors line-clamp-1">{exp.description}</p>
                        </td>
                        <td class="py-2.5 px-10 text-right">
                            <p class="text-[15px] font-black text-toss-grey-600">₩{fmt(exp.amount)}</p>
                        </td>
                        <td class="py-2.5 px-10 text-center">
                            <button onclick={() => removeExpense(exp.id)} class="text-toss-grey-200 hover:text-red-500 transition-colors p-1.5">
                                <Trash2 size={16} />
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    <!-- Analytics CTA -->
    <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 flex items-center justify-between group cursor-pointer hover:border-toss-blue/20 transition-all">
        <div class="flex items-center gap-8">
            <div class="w-16 h-16 bg-toss-blue-light text-toss-blue rounded-[28px] flex items-center justify-center">
                <PieChart size={32} />
            </div>
            <div>
                <h4 class="text-[22px] font-black text-toss-grey-600">사업소득 간편 지급 대행</h4>
                <p class="text-toss-grey-400 font-bold leading-relaxed">증빙 서류 누락 없이 정산 내역을 세무 대리인에게 즉시 전송하세요.</p>
            </div>
        </div>
        <ArrowUpRight size={24} class="text-toss-grey-200 group-hover:text-toss-blue transition-all" />
    </div>
</div>
