<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import type { TeacherSetting, SettlementType } from '$lib/types';
    import { 
        Users, GraduationCap, Calendar, CreditCard, 
        Search, Plus, ChevronRight, MoreVertical,
        Wallet, Star, MessageSquare, ClipboardList,
        TrendingUp, FileText, X, Clock, Trash2,
        ShieldCheck, UserCheck, Briefcase, Settings2,
        Save, AlertCircle
    } from 'lucide-svelte';
    import { fade, fly, slide, scale } from 'svelte/transition';

    let searchQuery = $state("");
    let isEditing = $state(false);
    let editingTeacher = $state<TeacherSetting | null>(null);

    const filteredTeachers = $derived(
        settings.data.teachers.filter(t => t.name.includes(searchQuery))
    );

    function editTeacher(teacher: TeacherSetting) {
        editingTeacher = JSON.parse(JSON.stringify(teacher));
        isEditing = true;
    }

    function createTeacher() {
        editingTeacher = {
            id: `t_${Date.now()}`,
            name: "",
            settlementType: 'fixed',
            settlementValue: 0,
            availability: []
        };
        isEditing = true;
    }

    function saveTeacher() {
        if (!editingTeacher || !editingTeacher.name) {
            alert("강사 성함을 입력해주세요.");
            return;
        }
        const idx = settings.data.teachers.findIndex(t => t.id === editingTeacher?.id);
        if (idx !== -1) {
            settings.data.teachers[idx] = editingTeacher;
        } else {
            settings.data.teachers.push(editingTeacher);
        }
        isEditing = false;
        editingTeacher = null;
    }

    function deleteTeacher(id: string) {
        if (!confirm("강사 정보를 영구히 삭제하시겠습니까? 관련 시간표 데이터가 손실될 수 있습니다.")) return;
        settings.data.teachers = settings.data.teachers.filter(t => t.id !== id);
        isEditing = false;
        editingTeacher = null;
    }

    function addTimeSlot() {
        if (editingTeacher) {
            editingTeacher.availability = [...editingTeacher.availability, { day: '월', startTime: '14:00', endTime: '18:00' }];
        }
    }

    const fmt = (val: number) => val.toLocaleString();

    function getSettlementLabel(type: SettlementType) {
        switch(type) {
            case 'fixed': return '월정액';
            case 'ratio': return '비율제 (%)';
            case 'equity': return '지분제';
            case 'hourly': return '시급제';
            default: return '미지정';
        }
    }
</script>

<div class="space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end px-2">
        <div>
            <h2 class="toss-title">인적 자원 관리</h2>
        </div>
        <button onclick={createTeacher} class="toss-btn-primary px-8 flex items-center gap-2">
            <Plus size={20} /> 신규 강사 등록
        </button>
    </header>

    <!-- Search -->
    <div class="flex gap-4 items-center bg-white p-3 rounded-[28px] border border-toss-grey-100 shadow-sm mx-2">
        <div class="relative flex-1 group flex items-center">
            <Search class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" size={20} />
            <input 
                bind:value={searchQuery}
                placeholder="성함으로 빠른 검색.." 
                class="w-full pl-16 pr-6 bg-transparent h-[56px] text-[17px] font-bold text-toss-grey-600 outline-none border-none"
            />
        </div>
    </div>

    <!-- High-Density Teacher Table -->
    <div class="bg-white rounded-[32px] border border-toss-grey-100 shadow-sm overflow-hidden mx-2">
        <table class="w-full text-left border-collapse">
            <thead class="bg-toss-grey-50/50 border-b border-toss-grey-100">
                <tr class="text-[11px] font-black text-toss-grey-400 uppercase tracking-widest text-left">
                    <th class="py-2 px-8">강사 프로필</th>
                    <th class="py-2 px-8">정산 정책</th>
                    <th class="py-2 px-8">정산 수치</th>
                    <th class="py-2 px-8">근무 요일</th>
                    <th class="py-2 px-8 text-right">상태</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-50">
                {#each filteredTeachers as t (t.id)}
                    <tr 
                        class="hover:bg-toss-grey-50 transition-all cursor-pointer group"
                        onclick={() => editTeacher(t)}
                    >
                        <td class="py-2 px-8">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-xl bg-toss-grey-100 flex items-center justify-center font-black text-[14px] text-toss-grey-500 group-hover:bg-toss-blue group-hover:text-white transition-all">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p class="text-[14px] font-black text-toss-grey-600 group-hover:text-toss-blue transition-colors">{t.name} 강사</p>
                                    <p class="text-[10px] font-bold text-toss-grey-300 uppercase tracking-tighter mt-0.5">ID: {t.id}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-2.5 px-8">
                            <span class="px-2 py-0.5 rounded bg-toss-grey-100 text-[11px] font-black text-toss-grey-500 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-colors">
                                {getSettlementLabel(t.settlementType)}
                            </span>
                        </td>
                        <td class="py-2.5 px-8">
                            <p class="text-[14px] font-black text-toss-grey-600">
                                {t.settlementType === 'ratio' || t.settlementType === 'equity' ? t.settlementValue + '%' : '₩' + fmt(t.settlementValue)}
                            </p>
                        </td>
                        <td class="py-2.5 px-8">
                            <div class="flex gap-1">
                                {#each ['월', '화', '수', '목', '금', '토', '일'] as d}
                                    {@const isWorking = t.availability.some(a => a.day === d)}
                                    <span class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black {isWorking ? 'bg-toss-blue text-white' : 'bg-toss-grey-50 text-toss-grey-200'}">{d}</span>
                                {/each}
                            </div>
                        </td>
                        <td class="py-2.5 px-8 text-right">
                            <button class="p-1.5 text-toss-grey-200 group-hover:text-toss-blue transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>

        {#if filteredTeachers.length === 0}
            <div class="py-40 flex flex-col items-center justify-center text-center opacity-40">
                <Users size={48} class="text-toss-grey-300 mb-4" />
                <p class="text-[20px] font-black text-toss-grey-600">등록된 강사가 없습니다</p>
            </div>
        {/if}
    </div>
</div>

<!-- Edit Modal -->
{#if isEditing && editingTeacher}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6" transition:fade>
        <div class="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden" in:scale={{ duration: 400 }}>
            <div class="p-10">
                <div class="flex justify-between items-start mb-10">
                    <div>
                        <h3 class="text-[28px] font-black text-toss-grey-600">{editingTeacher.name || '신규 강사'} 설정</h3>
                        <p class="text-[15px] font-bold text-toss-grey-400 mt-1">강사 계약 정보와 근무 시간을 관리합니다.</p>
                    </div>
                    <button onclick={() => isEditing = false} class="w-12 h-12 rounded-2xl bg-toss-grey-100 flex items-center justify-center text-toss-grey-400 hover:text-red-500 transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto pr-4 scrollbar-hide">
                    <div class="col-span-2 space-y-2">
                        <label class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1">강사 성함</label>
                        <input bind:value={editingTeacher.name} class="toss-input h-[64px] text-[18px]" placeholder="성함을 입력하세요" />
                    </div>

                    <div class="space-y-2">
                        <label class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1">정산 정책</label>
                        <select bind:value={editingTeacher.settlementType} class="toss-input h-[64px] font-bold">
                            <option value="fixed">월 고정 급여</option>
                            <option value="ratio">수강료 비율제 (%)</option>
                            <option value="equity">지분 정산형 (%)</option>
                            <option value="hourly">시급/시간제</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1">정산 기준 수치</label>
                        <input type="number" bind:value={editingTeacher.settlementValue} class="toss-input h-[64px] text-right font-black" />
                    </div>

                    <div class="col-span-2 space-y-4">
                        <div class="flex justify-between items-center">
                            <label class="text-[13px] font-black text-toss-grey-400 uppercase tracking-widest pl-1">근무 가능 시간 설정</label>
                            <button onclick={addTimeSlot} class="text-[12px] font-black text-toss-blue hover:underline">+ 시간대 추가</button>
                        </div>
                        <div class="space-y-3">
                            {#each editingTeacher.availability as slot, i}
                                <div class="flex gap-2 items-center" transition:slide>
                                    <select bind:value={slot.day} class="w-24 h-12 bg-toss-grey-100 rounded-xl px-4 font-bold outline-none border-none">
                                        {#each ['월', '화', '수', '목', '금', '토', '일'] as d}
                                            <option value={d}>{d}요일</option>
                                        {/each}
                                    </select>
                                    <input type="time" bind:value={slot.startTime} class="flex-1 h-12 bg-toss-grey-100 rounded-xl px-4 font-bold outline-none border-none" />
                                    <span class="text-toss-grey-300 font-black">~</span>
                                    <input type="time" bind:value={slot.endTime} class="flex-1 h-12 bg-toss-grey-100 rounded-xl px-4 font-bold outline-none border-none" />
                                    <button onclick={() => editingTeacher!.availability = editingTeacher!.availability.filter((_, idx) => idx !== i)} class="p-2 text-red-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <div class="mt-12 flex gap-4 border-t border-toss-grey-50 pt-8">
                    <button onclick={() => deleteTeacher(editingTeacher!.id)} class="h-[64px] px-8 rounded-2xl font-black text-red-500 hover:bg-red-50 transition-all flex items-center gap-2">
                        <Trash2 size={20} /> 삭제
                    </button>
                    <button onclick={saveTeacher} class="flex-1 h-[64px] bg-toss-blue text-white rounded-2xl font-black text-[18px] shadow-xl shadow-toss-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Save size={20} /> 강사 정보 저장하기
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

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
    .toss-input {
        width: 100%;
        background-color: #f2f4f6;
        border-radius: 16px;
        padding: 0 24px;
        outline: none;
        border: 2px solid transparent;
        transition: all 0.2s;
    }
    .toss-input:focus {
        background-color: white;
        border-color: #3182f6;
        box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.1);
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
    th {
        white-space: nowrap;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
