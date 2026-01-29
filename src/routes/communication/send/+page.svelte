<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { 
        MessageSquare, MessageCircle, Send, Clock, 
        Users, BookOpen, UserCheck, CreditCard,
        Plus, History, ChevronRight, X, Hash,
        AlertCircle, Smile, Image as ImageIcon
    } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import type { MessageRecord } from '$lib/types';

    let messageType = $state<'sms' | 'kakao' | 'lms'>('sms');
    let messageText = $state("");
    let isReserved = $state(false);
    let reservationTime = $state("");
    
    let targetType = $state('individual'); // class, all, unpaid, individual
    let selectedClassId = $state("");
    let selectedStudentIds = $state<string[]>([]);

    const variables = ["{학생명}", "{금액}", "{납부기한}", "{학원명}"];

    function insertVariable(v: string) {
        messageText += v;
    }

    const availablePoints = {
        kakao: 2500,
        sms: 1200
    };

    const targetStudents = $derived.by(() => {
        if (targetType === 'all') return settings.data.students;
        if (targetType === 'class') return settings.data.students.filter(s => {
            const cls = settings.data.classes.find(c => c.id === selectedClassId);
            return cls?.studentIds.includes(s.id);
        });
        if (targetType === 'unpaid') return settings.data.students.filter(s => s.unpaid > 0);
        if (targetType === 'individual') return settings.data.students.filter(s => selectedStudentIds.includes(s.id));
        return [];
    });

    const targetCount = $derived(targetStudents.length);
    const byteCount = $derived(new TextEncoder().encode(messageText).length);

    function sendMessage() {
        if (!messageText) return alert("메시지 내용을 입력해주세요.");
        if (targetCount === 0) return alert("수신 대상을 선택해주세요.");

        const newMsg: MessageRecord = {
            id: Math.random().toString(36).slice(2),
            type: messageType,
            title: messageText.split('\n')[0].slice(0, 20),
            content: messageText,
            targetCount: targetCount,
            date: new Date().toLocaleString(),
            status: isReserved ? 'reserved' : 'success',
            reservationTime: isReserved ? reservationTime : undefined
        };

        settings.data.messages = [newMsg, ...settings.data.messages];
        alert(isReserved ? "메시지 예약이 완료되었습니다." : `${targetCount}명에게 메시지를 전송했습니다.`);
        
        // Reset
        messageText = "";
        selectedStudentIds = [];
    }
</script>

<div class="max-w-[1400px] mx-auto space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="toss-title">소통 관리</h2>
        </div>
        <div class="flex gap-4">
            <!-- Point Card -->
            <div class="bg-white px-6 py-3 rounded-[24px] border border-toss-grey-100 shadow-sm flex items-center gap-6">
                <div class="flex items-center gap-2">
                    <MessageCircle class="text-toss-blue" size={20} />
                    <span class="text-[14px] font-black text-toss-grey-600">{availablePoints.kakao.toLocaleString()} 건</span>
                </div>
                <div class="w-[1px] h-6 bg-toss-grey-100"></div>
                <div class="flex items-center gap-2">
                    <MessageSquare class="text-orange-500" size={20} />
                    <span class="text-[14px] font-black text-toss-grey-600">{availablePoints.sms.toLocaleString()} 건</span>
                </div>
                <button class="toss-btn-primary h-[36px] px-4 text-[13px]">충전</button>
            </div>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Message Composer (Left) -->
        <div class="lg:col-span-2 space-y-8">
            <section class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8">
                <!-- Type Selector -->
                <div class="flex gap-1 bg-toss-grey-100 p-1.5 rounded-[24px] w-fit">
                    {#each [
                        { id: 'sms' as const, label: '단문 SMS', icon: MessageSquare },
                        { id: 'kakao' as const, label: '알림톡/카톡', icon: MessageCircle },
                        { id: 'lms' as const, label: '장문 LMS', icon: Hash }
                    ] as type}
                        <button 
                            onclick={() => messageType = type.id}
                            class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all flex items-center gap-2 {messageType === type.id ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}"
                        >
                            <type.icon size={18} />
                            {type.label}
                        </button>
                    {/each}
                </div>

                <!-- Textarea Area -->
                <div class="relative group">
                    <textarea 
                        bind:value={messageText}
                        placeholder="메시지 내용을 입력하세요. 변수를 선택하여 자동 치환할 수 있습니다."
                        class="w-full min-h-[300px] p-8 rounded-[40px] bg-toss-grey-100/50 border-2 border-transparent focus:border-toss-blue focus:bg-white transition-all outline-none text-[17px] font-medium leading-relaxed placeholder:text-toss-grey-300"
                    ></textarea>
                    
                    <div class="absolute bottom-6 right-8 flex items-center gap-4 text-[13px] font-bold">
                        <span class="{byteCount > 80 && messageType === 'sms' ? 'text-red-500' : 'text-toss-grey-400'}">
                            {byteCount} / 80 Byte (단문 기준)
                        </span>
                        <div class="flex gap-2">
                            <button class="p-2 rounded-xl hover:bg-toss-grey-100 text-toss-grey-400 transition-colors"><Smile size={20} /></button>
                            <button class="p-2 rounded-xl hover:bg-toss-grey-100 text-toss-grey-400 transition-colors"><ImageIcon size={20} /></button>
                        </div>
                    </div>
                </div>

                <!-- Variable Buttons -->
                <div class="space-y-4">
                    <p class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest">자동 치환 변수</p>
                    <div class="flex flex-wrap gap-3">
                        {#each variables as v}
                            <button 
                                onclick={() => insertVariable(v)}
                                class="px-4 py-2.5 rounded-xl bg-white border border-toss-grey-100 text-toss-grey-600 text-[14px] font-bold hover:border-toss-blue hover:text-toss-blue transition-all active:scale-95"
                            >
                                {v}
                            </button>
                        {/each}
                        <button class="px-4 py-2.5 rounded-xl bg-toss-grey-100 text-toss-grey-400 text-[14px] font-black flex items-center gap-2">
                            <Plus size={16} /> 템플릿 가져오기
                        </button>
                    </div>
                </div>
            </section>

            <!-- Target Selection -->
            <section class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8">
                <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3">
                    <Users class="text-toss-blue" /> 수신 대상 설정
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-4">
                        <label class="block text-[14px] font-black text-toss-grey-400">발송 그룹 선택</label>
                        <div class="grid grid-cols-2 gap-2">
                            {#each [
                                { id: 'all', label: '전체 원생', icon: Users },
                                { id: 'class', label: '특정 반', icon: BookOpen },
                                { id: 'unpaid', label: '미납자만', icon: AlertCircle },
                                { id: 'individual', label: '개별 선택', icon: UserCheck }
                            ] as t}
                                <button 
                                    onclick={() => targetType = t.id}
                                    class="py-3 px-4 rounded-2xl border-2 transition-all flex items-center gap-3 {targetType === t.id ? 'border-toss-blue bg-toss-blue-light/50 text-toss-blue font-black' : 'border-toss-grey-100 text-toss-grey-400 font-bold hover:border-toss-grey-200'}"
                                >
                                    <t.icon size={18} /> {t.label}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div class="space-y-4" in:slide>
                        {#if targetType === 'class'}
                            <label class="block text-[14px] font-black text-toss-grey-400">반 선택</label>
                            <select bind:value={selectedClassId} class="w-full h-[56px] px-5 rounded-2xl bg-toss-grey-100 border-none font-bold text-toss-grey-600 outline-none focus:ring-2 focus:ring-toss-blue">
                                {#each settings.data.classes as cls}
                                    <option value={cls.id}>{cls.name}</option>
                                {/each}
                            </select>
                        {:else if targetType === 'individual'}
                            <label class="block text-[14px] font-black text-toss-grey-400">선택된 대상</label>
                            <div class="flex flex-wrap gap-2">
                                <span class="px-4 py-2 rounded-xl bg-toss-grey-100 text-toss-grey-600 text-[13px] font-bold flex items-center gap-2">
                                    김민준 <button class="hover:text-red-500"><X size={14} /></button>
                                </span>
                                <button class="px-4 py-2 rounded-xl border-2 border-dashed border-toss-grey-100 text-toss-grey-400 text-[13px] font-bold">+ 원생 추가</button>
                            </div>
                        {:else}
                            <div class="h-full flex items-center py-6">
                                <p class="text-[14px] font-bold text-toss-grey-300">그룹 발송 시 해당 조건의 모든 원생에게 동시 발송됩니다.</p>
                            </div>
                        {/if}
                    </div>
                </div>
            </section>
        </div>

        <!-- Sending Sidebar (Right) -->
        <aside class="space-y-8 sticky top-10 h-fit">
            <div class="bg-toss-grey-600 p-8 rounded-[48px] text-white space-y-8 shadow-xl">
                <h3 class="text-[22px] font-black flex items-center gap-3">
                    <Send class="text-toss-blue" /> 발송 설정
                </h3>

                <div class="space-y-6">
                    <div class="flex items-center justify-between p-4 bg-white/10 rounded-3xl border border-white/10">
                        <span class="text-[15px] font-bold">발송 예약</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" bind:checked={isReserved} class="sr-only peer">
                            <div class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-toss-grey-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-toss-blue"></div>
                        </label>
                    </div>

                    {#if isReserved}
                        <div class="space-y-4" in:slide>
                            <div class="bg-white/10 p-5 rounded-3xl space-y-4">
                                <div class="flex items-center gap-3">
                                    <Clock size={18} class="text-toss-blue" />
                                    <span class="text-[14px] font-black">예약 시간 설정</span>
                                </div>
                                <input 
                                    type="datetime-local" 
                                    bind:value={reservationTime}
                                    class="w-full bg-white text-toss-grey-600 rounded-xl px-4 py-2 outline-none text-[14px] font-bold"
                                />
                            </div>
                        </div>
                    {/if}

                    <div class="space-y-2 pt-4">
                        <div class="flex justify-between text-[14px] font-bold text-white/60">
                            <span>수신 대상</span>
                            <span class="text-white">{targetCount}명</span>
                        </div>
                        <div class="flex justify-between text-[14px] font-bold text-white/60">
                            <span>예상 소요 포인트</span>
                            <span class="text-white">{targetCount} 건</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-3">
                    <button 
                        onclick={sendMessage}
                        class="w-full h-[64px] bg-toss-blue text-white rounded-[24px] font-black text-[18px] hover:scale-[1.02] transition-all shadow-lg shadow-toss-blue/30 flex items-center justify-center gap-3"
                    >
                        <Send size={24} /> {isReserved ? '예약 발송하기' : '지금 발송하기'}
                    </button>
                    <button class="w-full h-[56px] bg-white/10 text-white rounded-[24px] font-black text-[16px] hover:bg-white/20 transition-all">
                        미리보기
                    </button>
                </div>
            </div>

            <!-- Recent History Quick View -->
            <div class="bg-white p-8 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <h3 class="text-[18px] font-black text-toss-grey-600 flex items-center gap-2">
                    <History size={20} class="text-toss-grey-300" /> 최근 발송 내역
                </h3>
                <div class="space-y-4">
                    {#each settings.data.messages.slice(0, 3) as hist}
                        <div class="flex items-center justify-between group transition-all hover:translate-x-1">
                            <div>
                                <p class="text-[14px] font-bold text-toss-grey-600 line-clamp-1">{hist.title}</p>
                                <p class="text-[12px] font-bold text-toss-grey-400">{hist.date} · {hist.targetCount}명</p>
                            </div>
                            <ChevronRight size={16} class="text-toss-grey-200" />
                        </div>
                    {/each}
                    <button class="w-full text-center text-[13px] font-black text-toss-blue pt-2 hover:underline">전체 내역 보기</button>
                </div>
            </div>
        </aside>
    </div>
</div>
