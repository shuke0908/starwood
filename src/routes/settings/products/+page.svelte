<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import type { ProductSetting, DiscountPolicy, RefundMode } from '$lib/types';
    import { 
        fade, fly, slide, scale
    } from 'svelte/transition';
    import { 
        Package, Percent, CreditCard, Plus, 
        Trash2, Save, RotateCcw, HelpCircle,
        CheckCircle2, AlertCircle, X, ChevronRight,
        Settings2
    } from 'lucide-svelte';

    let activeTab = $state<'products' | 'refunds' | 'discounts'>('products');
    let editingProduct = $state<ProductSetting | null>(null);
    let editingDiscount = $state<DiscountPolicy | null>(null);

    // Products Logic
    function addProduct() {
        editingProduct = { id: `p_${Date.now()}`, name: "신규 수강 상품", baseFee: 0, billingType: 'flat', classIds: [] };
    }
    function saveProduct() {
        if (!editingProduct) return;
        const idx = settings.data.products.findIndex(p => p.id === editingProduct?.id);
        if (idx !== -1) settings.data.products[idx] = editingProduct;
        else settings.data.products.push(editingProduct);
        editingProduct = null;
    }

    // Discounts Logic
    function addDiscount() {
        editingDiscount = { id: `d_${Date.now()}`, name: "신규 할인 항목", type: 'percent', value: 0, description: "" };
    }
    function saveDiscount() {
        if (!editingDiscount) return;
        const idx = settings.data.discounts.findIndex(d => d.id === editingDiscount?.id);
        if (idx !== -1) settings.data.discounts[idx] = editingDiscount;
        else settings.data.discounts.push(editingDiscount);
        editingDiscount = null;
    }

    // Refund Logic
    function addRefundRule() {
        settings.data.academy.refundRules.push({ threshold: 1, refundPercent: 0 });
    }

    const fmt = (val: number) => val.toLocaleString();
</script>

<div class="max-w-[1600px] mx-auto pb-20 px-4 space-y-10">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="text-[32px] font-black text-toss-grey-600">수강료 및 정책 설정</h2>
        </div>
        <div class="bg-toss-grey-100 p-1.5 rounded-[20px] flex">
            <button onclick={() => activeTab = 'products'} class="px-6 py-2.5 rounded-xl font-black text-[14px] transition-all {activeTab === 'products' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">수강 상품</button>
            <button onclick={() => activeTab = 'refunds'} class="px-6 py-2.5 rounded-xl font-black text-[14px] transition-all {activeTab === 'refunds' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">환불 규칙</button>
            <button onclick={() => activeTab = 'discounts'} class="px-6 py-2.5 rounded-xl font-black text-[14px] transition-all {activeTab === 'discounts' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">할인 정책</button>
        </div>
    </header>

    {#if activeTab === 'products'}
        <!-- Products Section -->
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-2">
                        <Package size={22} class="text-toss-blue" /> 수강 상품 목록
                    </h3>
                    <button class="toss-btn-primary h-[48px] px-6 text-[14px]" onclick={addProduct}>+ 상품 추가</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#each settings.data.products as p}
                        <div 
                            class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
                            onclick={() => editingProduct = JSON.parse(JSON.stringify(p))}
                        >
                            <div class="flex justify-between items-start mb-6">
                                <div class="w-12 h-12 bg-toss-blue-light rounded-2xl flex items-center justify-center text-toss-blue">
                                    <CreditCard size={24} />
                                </div>
                                <span class="px-3 py-1 bg-toss-grey-50 text-toss-grey-400 text-[11px] font-black rounded-lg uppercase tracking-widest">{p.billingType === 'flat' ? '정액제' : '횟수제'}</span>
                            </div>
                            <h4 class="text-[20px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors">{p.name}</h4>
                            <p class="text-[24px] font-black text-toss-grey-600 mt-2">₩{fmt(p.baseFee)}</p>
                            <div class="mt-6 flex justify-between items-center text-[13px] font-bold text-toss-grey-300">
                                <span>연동 클래스: {p.classIds.length}개</span>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

            <aside class="space-y-6">
                <div class="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100/50 space-y-4">
                    <div class="flex items-center gap-2 text-toss-blue">
                        <HelpCircle size={20} />
                        <h4 class="font-black text-[16px]">수강료 청구 꿀팁</h4>
                    </div>
                    <p class="text-[14px] font-medium text-toss-grey-500 leading-relaxed">
                        **정액제**는 매월 고정 금액을 청구하며, **횟수제**는 달력상의 실제 수업 횟수를 자동 계산하여 청구합니다. 수납 데스크에서 공휴일 차감 여부를 선택할 수 있습니다.
                    </p>
                </div>
            </aside>
        </section>

    {:else if activeTab === 'refunds'}
        <!-- Refunds Section -->
        <section class="max-w-4xl space-y-10">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-10">
                <h3 class="text-[22px] font-black text-toss-grey-600 flex items-center gap-3">
                    <RotateCcw size={24} class="text-toss-blue" /> 학원 환불 정책 마스터
                </h3>

                <div class="space-y-6">
                    <p class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest">기본 환불 모드 선택</p>
                    <div class="grid grid-cols-3 gap-4">
                        {#each [
                            { id: 'session', label: '수업 회차 기준', desc: '1/2 경과 전/후 등' },
                            { id: 'date', label: '날짜 경과 기준', desc: '수강 시작일로부터 N일' },
                            { id: 'proportion', label: '1/N 단순 일할', desc: '잔여 수업료 100% 환불' }
                        ] as mode}
                            <button 
                                onclick={() => settings.data.academy.refundMode = mode.id as RefundMode}
                                class="p-6 rounded-3xl border-2 text-left transition-all {settings.data.academy.refundMode === mode.id ? 'border-toss-blue bg-toss-blue-light/20' : 'border-toss-grey-100 hover:border-toss-grey-200'}"
                            >
                                <p class="font-black text-[16px] {settings.data.academy.refundMode === mode.id ? 'text-toss-blue' : 'text-toss-grey-600'}">{mode.label}</p>
                                <p class="text-[12px] font-bold text-toss-grey-400 mt-1">{mode.desc}</p>
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="flex justify-between items-center">
                        <p class="text-[14px] font-black text-toss-grey-400 uppercase tracking-widest">세부 구간별 환불 비율</p>
                        <button class="text-toss-blue font-black text-[13px]" onclick={addRefundRule}>+ 구간 추가</button>
                    </div>
                    <div class="space-y-4">
                        {#each settings.data.academy.refundRules as rule, i}
                            <div class="flex items-center gap-6 p-6 bg-toss-grey-50 rounded-[32px] group" in:slide>
                                <div class="flex-1 flex items-center gap-4">
                                    <span class="text-[14px] font-bold text-toss-grey-400">전체 수업의</span>
                                    <div class="relative w-32">
                                        <input type="number" step="0.1" bind:value={rule.threshold} class="w-full h-12 bg-white rounded-xl border-none font-black text-center text-toss-grey-600" />
                                        <span class="absolute right-[-2.5rem] top-1/2 -translate-y-1/2 text-toss-grey-400 font-bold">이하 경과 시</span>
                                    </div>
                                </div>
                                <div class="flex-1 flex items-center gap-4 justify-end">
                                    <span class="text-[14px] font-bold text-toss-grey-400">수강료의</span>
                                    <div class="relative w-32">
                                        <input type="number" bind:value={rule.refundPercent} class="w-full h-12 bg-white rounded-xl border-none font-black text-center text-toss-blue" />
                                        <span class="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 text-toss-blue font-black">%</span>
                                    </div>
                                    <span class="text-[14px] font-bold text-toss-grey-400">환불</span>
                                </div>
                                <button onclick={() => settings.data.academy.refundRules.splice(i, 1)} class="text-toss-grey-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={20} /></button>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="pt-6 flex justify-end">
                    <button class="toss-btn-primary px-10 h-[64px] flex items-center gap-2 shadow-lg shadow-toss-blue/20">
                        <CheckCircle2 size={20} /> 정책 저장하기
                    </button>
                </div>
            </div>
        </section>

    {:else if activeTab === 'discounts'}
        <!-- Discounts Section -->
        <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {#each settings.data.discounts as d}
                <div 
                    class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer"
                    onclick={() => editingDiscount = JSON.parse(JSON.stringify(d))}
                >
                    <div class="flex justify-between items-start mb-6">
                        <div class="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <Percent size={28} />
                        </div>
                        <button class="p-2 text-toss-grey-200 hover:text-red-500 transition-colors" onclick={(e) => { e.stopPropagation(); settings.data.discounts = settings.data.discounts.filter(item => item.id !== d.id); }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                    <h4 class="text-[22px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors">{d.name}</h4>
                    <p class="text-[15px] font-bold text-toss-grey-400 mt-2">{d.description || '설명 없음'}</p>
                    <div class="mt-8 pt-8 border-t border-toss-grey-50 flex justify-between items-end">
                        <div>
                            <p class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest">할인 혜택</p>
                            <p class="text-[28px] font-black text-purple-600">{d.value}{d.type === 'percent' ? '%' : '원'}</p>
                        </div>
                        <span class="text-[13px] font-black text-toss-blue">편집 <ChevronRight size={16} class="inline" /></span>
                    </div>
                </div>
            {/each}
            
            <button 
                class="bg-toss-grey-50 border-2 border-dashed border-toss-grey-200 rounded-[48px] flex flex-col items-center justify-center gap-4 text-toss-grey-300 hover:bg-white hover:border-toss-blue/30 hover:text-toss-blue transition-all min-h-[300px]"
                onclick={addDiscount}
            >
                <Plus size={40} />
                <span class="font-black text-[18px]">새 할인 정책 추가</span>
            </button>
        </section>
    {/if}

    <!-- Modal for Editing Product -->
    {#if editingProduct}
        <div class="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" transition:fade>
            <div class="bg-white w-full max-w-[500px] rounded-[48px] shadow-2xl p-10 space-y-8" transition:scale>
                <div class="flex justify-between items-center">
                    <h3 class="text-[24px] font-black text-toss-grey-600">상품 정보 편집</h3>
                    <button onclick={() => editingProduct = null} class="p-2 hover:bg-toss-grey-100 rounded-xl"><X /></button>
                </div>
                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-[13px] font-bold text-toss-grey-400">상품명</label>
                        <input bind:value={editingProduct.name} class="toss-input h-[60px]" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-[13px] font-bold text-toss-grey-400">청구 방식</label>
                            <select bind:value={editingProduct.billingType} class="toss-input h-[60px] cursor-pointer">
                                <option value="flat">정액제</option>
                                <option value="session">횟수제</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[13px] font-bold text-toss-grey-400">금액 (원)</label>
                            <input type="number" bind:value={editingProduct.baseFee} class="toss-input h-[60px]" />
                        </div>
                    </div>
                </div>
                <button class="w-full h-[64px] bg-toss-blue text-white rounded-3xl font-black text-[18px] shadow-lg shadow-toss-blue/20" onclick={saveProduct}>설정 완료</button>
            </div>
        </div>
    {/if}

    <!-- Modal for Editing Discount -->
    {#if editingDiscount}
        <div class="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" transition:fade>
            <div class="bg-white w-full max-w-[500px] rounded-[48px] shadow-2xl p-10 space-y-8" transition:scale>
                <div class="flex justify-between items-center">
                    <h3 class="text-[24px] font-black text-toss-grey-600">할인 정책 편집</h3>
                    <button onclick={() => editingDiscount = null} class="p-2 hover:bg-toss-grey-100 rounded-xl"><X /></button>
                </div>
                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-[13px] font-bold text-toss-grey-400">항목명</label>
                        <input bind:value={editingDiscount.name} class="toss-input h-[60px]" />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <label class="text-[13px] font-bold text-toss-grey-400">할인 타입</label>
                            <select bind:value={editingDiscount.type} class="toss-input h-[60px] cursor-pointer">
                                <option value="percent">퍼센트 (%)</option>
                                <option value="amount">고정금액 (원)</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[13px] font-bold text-toss-grey-400">할인 수치</label>
                            <input type="number" bind:value={editingDiscount.value} class="toss-input h-[60px]" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[13px] font-bold text-toss-grey-400">설명</label>
                        <textarea bind:value={editingDiscount.description} class="toss-input h-[100px] py-4 resize-none"></textarea>
                    </div>
                </div>
                <button class="w-full h-[64px] bg-toss-blue text-white rounded-3xl font-black text-[18px] shadow-lg shadow-toss-blue/20" onclick={saveDiscount}>정책 적용하기</button>
            </div>
        </div>
    {/if}
</div>
