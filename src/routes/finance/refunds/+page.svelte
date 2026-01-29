<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { toast } from '$lib/stores/toast.svelte';
    import { fade, fly, slide, scale } from 'svelte/transition';
    import { 
        RotateCcw, Search, Calendar, User, 
        CreditCard, Banknote, History, X,
        CheckCircle2, AlertCircle, Calculator,
        FileText, ArrowRight, Info, Download
    } from 'lucide-svelte';
    import type { PaymentRecord, RefundRecord } from '$lib/types';

    let searchTerm = $state("");
    let showRefundModal = $state(false);
    let selectedPayment = $state<PaymentRecord | null>(null);
    let refundAmount = $state(0);
    let refundReason = $state("");
    
    // Education office refund policy logic
    let totalLessons = $state(20); // Placeholder: Should be from class/product
    let attendedLessons = $state(5);
    let refundPreview = $derived.by(() => {
        if (!selectedPayment) return 0;
        const ratio = attendedLessons / totalLessons;
        if (ratio <= 1/3) return Math.floor(selectedPayment.amount * (2/3));
        if (ratio <= 1/2) return Math.floor(selectedPayment.amount * (1/2));
        return 0; // Over 1/2: No refund per standard policy
    });

    // Filter completed payments
    let refundablePayments = $derived(
        settings.data.payments
            .filter(p => p.status !== 'refunded' && p.status !== 'canceled')
            .filter(p => {
                const studentName = settings.data.students.find(s => s.id === p.studentId)?.name || "";
                return studentName.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    function getStudent(id: string) {
        return settings.data.students.find(s => s.id === id);
    }

    function openRefundModal(payment: PaymentRecord) {
        selectedPayment = payment;
        refundAmount = payment.amount; // Initial full set
        refundReason = "단순 변심/퇴원";
        showRefundModal = true;
    }

    function applySmartRefund() {
        refundAmount = refundPreview;
        toast.show("스마트 계산기 적용", "info", "교육청 규정에 따른 환불 금액이 자동 산출되었습니다.");
    }

    function processRefund() {
        if (!selectedPayment) return;
        if (refundAmount > selectedPayment.amount) {
            toast.show("금액 오류", "error", "결제 금액보다 큰 금액은 환불할 수 없습니다.");
            return;
        }

        const refund: RefundRecord = {
            id: `ref_${Date.now()}`,
            paymentId: selectedPayment.id,
            studentId: selectedPayment.studentId,
            amount: refundAmount,
            date: new Date().toISOString().split('T')[0],
            reason: refundReason,
            method: selectedPayment.type
        };
        settings.data.refunds = [refund, ...settings.data.refunds];

        const payIdx = settings.data.payments.findIndex(p => p.id === selectedPayment?.id);
        if (payIdx !== -1) {
            settings.data.payments[payIdx].status = 'refunded';
        }

        const student = settings.data.students.find(s => s.id === selectedPayment?.studentId);
        if (student) {
            student.unpaid += refundAmount;
        }

        toast.show("환불 완료", "success", "환불 처리가 정상적으로 완료되었습니다.");
        showRefundModal = false;
        selectedPayment = null;
    }
</script>

<div class="max-w-[1600px] mx-auto space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="text-[32px] font-black text-toss-grey-600 tracking-tight">환불 및 정산 관리</h2>
            <div class="flex items-center gap-3 mt-2">
                <span class="px-3 py-1 bg-orange-100 text-orange-600 text-[12px] font-black rounded-full uppercase tracking-widest">Refund Intelligence</span>
            </div>
        </div>
        <div class="flex gap-4">
            <button class="bg-white px-8 py-4 rounded-[28px] border border-toss-grey-100 font-black text-toss-grey-500 hover:bg-toss-grey-50 transition-all flex items-center gap-2 shadow-sm">
                <FileText size={20} /> 환불 영수증 일괄 출력
            </button>
        </div>
    </header>

    <!-- Top Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Left: Search & History -->
        <aside class="lg:col-span-4 space-y-8">
            <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="relative group flex items-center">
                    <Search class="absolute left-5 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" size={20} />
                    <input 
                        bind:value={searchTerm}
                        placeholder="이름/결제내용 검색" 
                        class="w-full h-14 pl-14 pr-6 rounded-2xl bg-toss-grey-50 border-none focus:ring-8 focus:ring-toss-blue/5 outline-none text-[16px] font-bold transition-all shadow-sm" 
                    />
                </div>
                
                <h3 class="text-[14px] font-black text-toss-grey-300 uppercase tracking-widest px-2">최근 환불 히스토리</h3>
                <div class="space-y-4">
                    {#each settings.data.refunds.slice(0, 4) as r}
                        {@const s = getStudent(r.studentId)}
                        <div class="p-6 rounded-[32px] bg-toss-grey-50/50 border border-transparent hover:border-toss-grey-100 hover:bg-white hover:shadow-xl transition-all group cursor-pointer">
                            <div class="flex justify-between items-start">
                                <div class="flex gap-4">
                                    <div class="w-11 h-11 rounded-xl bg-red-100 text-red-500 flex items-center justify-center font-black">
                                        <RotateCcw size={18} />
                                    </div>
                                    <div>
                                        <p class="text-[15px] font-black text-toss-grey-600">{s?.name || '알 수 없음'}</p>
                                        <p class="text-[12px] font-bold text-toss-grey-300 mt-1">{r.date}</p>
                                    </div>
                                </div>
                                <span class="text-[14px] font-black text-red-500">-₩{r.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    {/each}
                </div>
                <button class="w-full h-12 text-[14px] font-black text-toss-grey-300 hover:text-toss-blue transition-colors">내역 더보기 <ArrowRight size={14} class="inline ml-1"/></button>
            </div>

            <!-- Smart Tip -->
            <div class="bg-toss-grey-700 p-10 rounded-[48px] text-white shadow-xl shadow-toss-grey-700/20 space-y-4 relative overflow-hidden">
                <div class="absolute -right-6 -bottom-6 opacity-10">
                    <Calculator size={140} />
                </div>
                <div class="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-toss-blue">
                    <Info size={24} />
                </div>
                <h4 class="text-[20px] font-black">교육청 환불 규정 가이드</h4>
                <p class="text-[14px] opacity-70 leading-relaxed font-medium">
                    1. 교습 시간의 1/3 경과 전: 수강료의 2/3 반환<br/>
                    2. 교습 시간의 1/2 경과 전: 수강료의 1/2 반환<br/>
                    3. 교습 시간의 1/2 경과 후: 반환하지 않음
                </p>
                <button class="w-full h-14 bg-white/10 rounded-2xl text-white font-black text-[15px] hover:bg-white/20 transition-all border border-white/10">자세히 보기</button>
            </div>
        </aside>

        <!-- Right: Target List -->
        <main class="lg:col-span-8 space-y-8">
            <div class="bg-white rounded-[48px] border border-toss-grey-100 shadow-sm overflow-hidden">
                <div class="p-10 border-b border-toss-grey-50 flex justify-between items-center bg-toss-grey-50/20">
                    <h3 class="text-[22px] font-black text-toss-grey-600">환불 가능 결제 건 ({refundablePayments.length})</h3>
                    <div class="flex gap-2">
                        <button class="h-11 px-6 rounded-xl bg-white border border-toss-grey-100 text-toss-grey-400 font-black text-[13px] hover:text-toss-blue transition-all">전체 내역</button>
                        <button class="h-11 px-6 rounded-xl bg-white border border-toss-grey-100 text-toss-grey-400 font-black text-[13px] hover:text-toss-blue transition-all">이번 달</button>
                    </div>
                </div>
                
                <table class="w-full text-left">
                    <thead class="bg-toss-grey-50/50">
                        <tr class="text-toss-grey-400 text-[12px] font-black uppercase tracking-widest">
                            <th class="px-10 py-6">일시</th>
                            <th class="px-8 py-6">원생 / 내역</th>
                            <th class="px-8 py-6 text-right">결제 금액</th>
                            <th class="px-8 py-6 text-center">수단</th>
                            <th class="px-10 py-6 text-right">작업</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-100">
                        {#each refundablePayments as p}
                            {@const s = getStudent(p.studentId)}
                            <tr class="hover:bg-toss-grey-50/30 transition-all group">
                                <td class="px-10 py-8">
                                    <p class="text-[14px] font-black text-toss-grey-300">{p.date}</p>
                                </td>
                                <td class="px-8 py-8">
                                    <p class="text-[17px] font-black text-toss-grey-600">{s?.name || '알 수 없음'}</p>
                                    <p class="text-[13px] font-bold text-toss-grey-300 mt-1">{p.description}</p>
                                </td>
                                <td class="px-8 py-8 text-right font-black text-toss-blue text-[18px]">
                                    ₩{p.amount.toLocaleString()}
                                </td>
                                <td class="px-8 py-8 text-center">
                                    <span class="px-3 py-1 bg-toss-grey-50 rounded-lg text-[11px] font-black text-toss-grey-400 border border-toss-grey-100">{p.type}</span>
                                </td>
                                <td class="px-10 py-8 text-right">
                                    <button 
                                        onclick={() => openRefundModal(p)} 
                                        class="h-11 px-6 rounded-xl bg-orange-50 text-orange-600 text-[14px] font-black hover:bg-orange-100 transition-all flex items-center gap-2 ml-auto shadow-sm"
                                    >
                                        <RotateCcw size={16} /> 환불 처리
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>

                {#if refundablePayments.length === 0}
                    <div class="p-24 text-center space-y-4">
                        <Banknote size={60} class="mx-auto text-toss-grey-100" />
                        <p class="text-toss-grey-300 font-bold">환불 가능한 결제 내역이 없습니다.</p>
                    </div>
                {/if}
            </div>
        </main>
    </div>

    <!-- Refund Intelligence Modal -->
    {#if showRefundModal && selectedPayment}
        <div class="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-6" transition:fade>
            <div class="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden" in:fly={{ y: 30 }} out:scale={{ start: 0.95 }}>
                <div class="p-10 border-b border-toss-grey-50 flex justify-between items-center bg-white">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center">
                            <Calculator size={24} />
                        </div>
                        <h2 class="text-[24px] font-black text-toss-grey-600 tracking-tight">스마트 환불 계산기</h2>
                    </div>
                    <button onclick={() => showRefundModal = false} class="p-3 text-toss-grey-200 hover:text-toss-grey-600 transition-colors"><X size={28} /></button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2">
                    <!-- Config Side -->
                    <div class="p-10 border-r border-toss-grey-50 space-y-8 bg-toss-grey-50/30">
                        <div class="space-y-4">
                            <h4 class="text-[13px] font-black text-toss-grey-300 uppercase tracking-widest">수업 진행 상태 입력</h4>
                            <div class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[14px] font-black text-toss-grey-500">총 교습 시간 (또는 횟수)</label>
                                    <input type="number" bind:value={totalLessons} class="w-full h-14 bg-white border-2 border-toss-grey-100 rounded-2xl px-6 font-black text-[18px] focus:border-toss-blue outline-none transition-all" />
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[14px] font-black text-toss-grey-500">진행한 시간 (또는 횟수)</label>
                                    <input type="number" bind:value={attendedLessons} class="w-full h-14 bg-white border-2 border-toss-grey-100 rounded-2xl px-6 font-black text-[18px] focus:border-toss-blue outline-none transition-all" />
                                </div>
                            </div>
                        </div>

                        <div class="p-6 bg-white rounded-3xl border border-toss-grey-100 space-y-3 shadow-sm">
                            <p class="text-[12px] font-black text-toss-grey-300">진행률 분석</p>
                            <div class="w-full h-3 bg-toss-grey-50 rounded-full overflow-hidden">
                                <div class="h-full bg-toss-blue transition-all" style="width: {(attendedLessons/totalLessons)*100}%"></div>
                            </div>
                            <p class="text-[14px] font-black text-toss-grey-600">{Math.round((attendedLessons/totalLessons)*100)}% 경과 <span class="text-toss-blue ml-1">({attendedLessons}/{totalLessons})</span></p>
                        </div>
                    </div>

                    <!-- Result Side -->
                    <div class="p-10 space-y-8 flex flex-col justify-between">
                        <div class="space-y-6">
                            <div class="p-8 bg-toss-blue-light border-2 border-toss-blue/20 rounded-[32px] space-y-4">
                                <p class="text-[13px] font-black text-toss-blue uppercase tracking-widest">예상 환불 가능 금액</p>
                                <div class="flex items-baseline gap-2">
                                    <h3 class="text-[40px] font-black text-toss-blue leading-none">₩{refundPreview.toLocaleString()}</h3>
                                    <span class="text-[18px] font-black text-toss-blue/40">원</span>
                                </div>
                                <div class="pt-4 border-t border-toss-blue/10">
                                    <p class="text-[14px] font-bold text-toss-blue/60 leading-relaxed">
                                        {#if (attendedLessons/totalLessons) <= 1/3}
                                            총금액의 2/3 반환 대상 (진행률 1/3 이하)
                                        {:else if (attendedLessons/totalLessons) <= 1/2}
                                            총금액의 1/2 반환 대상 (진행률 1/2 이하)
                                        {:else}
                                            반환 대상 아님 (진행률 1/2 초과)
                                        {/if}
                                    </p>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <div class="flex justify-between items-center px-2">
                                    <span class="text-[14px] font-black text-toss-grey-400">최종 환불액 확정</span>
                                    <button onclick={applySmartRefund} class="text-[12px] font-black text-toss-blue hover:underline">계산값 바로 적용</button>
                                </div>
                                <div class="relative">
                                    <input type="number" bind:value={refundAmount} class="w-full h-16 bg-toss-grey-50 rounded-2xl px-6 pr-14 text-[22px] font-black text-toss-grey-600 border-none focus:ring-2 focus:ring-toss-blue outline-none transition-all" />
                                    <span class="absolute right-6 top-1/2 -translate-y-1/2 font-black text-toss-grey-300">₩</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onclick={processRefund}
                            class="w-full h-20 bg-orange-600 text-white rounded-[24px] font-black text-[18px] hover:scale-[1.02] transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3"
                        >
                            <RotateCcw size={24} /> 환불 완료 처리하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #f9fafb;
    }
    .toss-title {
        font-size: 32px;
        font-weight: 900;
        color: #333d4b;
    }
    .toss-desc {
        font-size: 16px;
        color: #8b95a1;
        font-weight: 600;
        margin-top: 8px;
    }
    .toss-input {
        width: 100%;
        height: 56px;
        border-radius: 16px;
        background: #f2f4f6;
        border: 2px solid transparent;
        padding: 0 16px;
        font-weight: 700;
        transition: all 0.2s;
    }
    .toss-input:focus {
        background: white;
        border-color: #3182f6;
    }
</style>
