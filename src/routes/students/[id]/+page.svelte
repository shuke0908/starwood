<script lang="ts">
    import { page } from '$app/state';
    import { settings } from '$lib/settings.svelte';
    import { MOCK_STUDENTS_DATA, MOCK_CONSULTATIONS } from '$lib/mock-data';
    import { 
        Phone, User, Calendar, GraduationCap, 
        ClipboardList, History, Plus, Save, 
        ChevronLeft, Pause, Play, Tag, Clock,
        MessageSquare, UserPlus, AlertCircle
    } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    const studentId = page.params.id;
    const student = $derived(settings.data.students.find(s => s.id === studentId));
    const consultations = $derived(settings.data.consultations.filter(c => c.studentId === studentId));

    let activeTab = $state('info'); // info, consultation, payment, attendance
    let isEditing = $state(false);

    // Consultation Form State
    let newConsultation = $state({
        type: '전화',
        keyword: '',
        content: '',
        followup: ''
    });

    if (!student) {
        // Fallback if not found (shouldn't happen with mock data)
    }
</script>

{#if student}
<div class="max-w-[1400px] mx-auto space-y-8 pb-20">
    <!-- Top Navigation -->
    <a href="/students" class="flex items-center gap-2 text-toss-grey-400 font-bold hover:text-toss-blue transition-colors group">
        <ChevronLeft size={20} class="group-hover:-translate-x-1 transition-transform" />
        목록으로 돌아가기
    </a>

    <!-- Profile Header Card -->
    <section class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-toss-blue-light/30 rounded-full blur-3xl"></div>
        
        <div class="flex flex-col md:flex-row gap-10 relative z-10">
            <div class="w-32 h-32 rounded-[40px] bg-toss-grey-100 flex items-center justify-center text-[48px] font-black text-toss-grey-500 shadow-inner">
                {student.name[0]}
            </div>
            
            <div class="flex-1 space-y-6">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-3">
                            <h2 class="text-[32px] font-black text-toss-grey-600">{student.name}</h2>
                            <span class="px-4 py-1.5 rounded-2xl bg-toss-blue-light text-toss-blue text-[14px] font-black">
                                {student.status}
                            </span>
                            <span class="px-4 py-1.5 rounded-2xl bg-toss-grey-100 text-toss-grey-500 text-[14px] font-black">
                                {student.gender}
                            </span>
                        </div>
                        <p class="text-[18px] font-bold text-toss-grey-400 mt-2">
                            {student.school} · {student.grade}학년 · {student.regDate} 등록
                        </p>
                    </div>
                    <div class="flex gap-3">
                        <button class="toss-btn-secondary flex items-center gap-2 pr-5">
                            <MessageSquare size={18} /> 메시지 보내기
                        </button>
                        <button class="toss-btn-primary px-8" onclick={() => isEditing = !isEditing}>
                            {isEditing ? '저장하기' : '정보 수정'}
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="p-5 bg-toss-grey-100 rounded-[24px]">
                        <p class="text-[12px] font-black text-toss-grey-400 tracking-widest mb-2 uppercase">학부모 연락처 (주)</p>
                        <p class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px]">{student.parentContacts[0].type}</span>
                            {student.parentContacts[0].phone}
                        </p>
                        <p class="text-[13px] font-bold text-toss-grey-400 mt-1 pl-10">{student.parentContacts[0].name}</p>
                    </div>
                    <div class="p-5 bg-toss-grey-100 rounded-[24px]">
                        <p class="text-[12px] font-black text-toss-grey-400 tracking-widest mb-2 uppercase">학부모 연락처 (부)</p>
                        <p class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2 opacity-60">
                            <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px]">{student.parentContacts[1].type}</span>
                            {student.parentContacts[1].phone}
                        </p>
                        <p class="text-[13px] font-bold text-toss-grey-400 mt-1 pl-10">비상/기타 연락처</p>
                    </div>
                    <div class="p-5 bg-toss-grey-100 rounded-[24px]">
                        <p class="text-[12px] font-black text-toss-grey-400 tracking-widest mb-2 uppercase">학생 연락처</p>
                        <p class="text-[17px] font-black text-toss-grey-600 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] animate-bounce-slow">📱</span>
                            {student.studentPhone}
                        </p>
                    </div>
                </div>

                <button class="text-[13px] font-bold text-toss-grey-400 hover:text-toss-blue flex items-center gap-2 group/add">
                    <Plus size={16} class="group-hover/add:rotate-90 transition-transform" /> 추가 연락처 등록 (부번호)
                </button>
            </div>
        </div>
    </section>

    <!-- Main Content Area -->
    <div class="flex gap-10">
        <!-- Left: Consultation History (Timeline) -->
        <section class="flex-1 space-y-8">
            <div class="flex items-center justify-between">
                <h3 class="text-[24px] font-black text-toss-grey-600 flex items-center gap-3">
                    <ClipboardList class="text-toss-blue" />
                    상담 타임라인
                </h3>
                <span class="text-[14px] font-bold text-toss-grey-400">총 {student.consultationCount}회 상담</span>
            </div>

            <div class="relative pl-8 space-y-10 border-l-2 border-toss-grey-100 ml-4">
                {#each consultations as c (c.id)}
                    <div class="relative" in:slide>
                        <div class="absolute -left-[41px] top-0 w-[18px] h-[18px] rounded-full bg-white border-4 border-toss-blue"></div>
                        <div class="bg-white p-6 rounded-[32px] border border-toss-grey-100 shadow-sm space-y-4">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-1 bg-toss-grey-100 text-toss-grey-500 text-[11px] font-black rounded-lg uppercase">{c.type}</span>
                                    <span class="text-[15px] font-bold text-toss-grey-600">{c.type}</span>
                                </div>
                                <span class="text-[13px] font-bold text-toss-grey-400">{c.date}</span>
                            </div>
                            <p class="text-[15px] font-medium text-toss-grey-500 leading-relaxed border-l-4 border-toss-grey-100 pl-4">
                                "{c.note}"
                            </p>
                        </div>
                    </div>
                {/each}

                <!-- Empty State if no consultations -->
                {#if consultations.length === 0}
                    <div class="text-[15px] text-toss-grey-400 font-bold py-10">아직 등록된 상담 기록이 없습니다.</div>
                {/if}
            </div>
        </section>

        <!-- Right: Actions & Quick Entry -->
        <aside class="w-[400px] space-y-8 sticky top-10 h-fit">
            <!-- Quick Consultation Entry -->
            <div class="bg-toss-blue p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-toss-blue/20">
                <h3 class="text-[20px] font-black flex items-center gap-2">
                    <Plus size={24} /> 신규 상담 작성
                </h3>
                
                <div class="space-y-4">
                    <div class="flex gap-2">
                        {#each ['전화', '대면', '카톡'] as type}
                            <button 
                                class="flex-1 py-2 px-3 rounded-xl text-[13px] font-black transition-all {newConsultation.type === type ? 'bg-white text-toss-blue' : 'bg-white/20 text-white/70 hover:bg-white/30'}"
                                onclick={() => newConsultation.type = type}
                            >
                                {type}
                            </button>
                        {/each}
                    </div>
                    <input 
                        type="text" 
                        bind:value={newConsultation.keyword}
                        placeholder="상담 키워드 (예: 성적 하락)" 
                        class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-[14px] outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                    />
                    <textarea 
                        bind:value={newConsultation.content}
                        placeholder="상담 상세 내용을 입력하세요.." 
                        class="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-[14px] outline-none focus:bg-white/20 transition-all placeholder:text-white/40 min-h-[120px] resize-none"
                    ></textarea>
                </div>

                <button class="w-full bg-white text-toss-blue h-[56px] rounded-[20px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                    <Save size={20} /> 상담 저장하기
                </button>
            </div>

            <!-- Class & Attendance Status -->
            <div class="bg-white p-8 rounded-[40px] border border-toss-grey-100 shadow-sm space-y-6">
                <h3 class="text-[18px] font-black text-toss-grey-600 flex items-center gap-2">
                    <GraduationCap class="text-toss-blue" size={20} /> 수강 상태
                </h3>
                
                <div class="space-y-4">
                    {#each student.classes as cls}
                        <div class="flex flex-col gap-3 p-5 bg-toss-grey-100 rounded-[28px] group transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-toss-grey-100">
                            <div class="flex items-center justify-between">
                                <span class="text-[16px] font-bold text-toss-grey-600">{cls}</span>
                                <span class="text-[11px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg uppercase">재원</span>
                            </div>
                            <div class="flex gap-2">
                                <input type="text" placeholder="휴원 기간 (예: 1주일)" class="flex-1 bg-white px-3 py-2 rounded-xl text-[12px] font-bold border-none outline-none focus:ring-1 focus:ring-toss-blue/30" />
                                <button class="px-3 bg-white text-toss-grey-400 hover:text-red-500 rounded-xl transition-all" title="휴원 처리">
                                    <Pause size={14} />
                                </button>
                            </div>
                        </div>
                    {/each}
                    <button class="w-full h-[52px] border-2 border-dashed border-toss-grey-100 rounded-2xl text-[14px] font-bold text-toss-grey-400 hover:border-toss-blue hover:text-toss-blue transition-all flex items-center justify-center gap-2">
                        <UserPlus size={18} /> 클래스 추가 배정
                    </button>
                </div>
            </div>
        </aside>
    </div>
</div>
{:else}
<div class="flex flex-col items-center justify-center py-40 space-y-4">
    <AlertCircle size={48} class="text-toss-grey-200" />
    <p class="text-[17px] font-bold text-toss-grey-400">학생 정보를 찾을 수 없습니다.</p>
    <a href="/students" class="toss-btn-primary px-8">목록으로 돌아가기</a>
</div>
{/if}

<style>
    :global(.animate-bounce-slow) {
        animation: bounce 2s infinite;
    }
    @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
    }
</style>
