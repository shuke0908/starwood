<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { fade, fly } from 'svelte/transition';
    import { 
        UserPlus, UserMinus, Search, Filter, 
        MoreVertical, Phone, Calendar, BookOpen,
        Download, Mail, MessageSquare, ChevronRight,
        X, Trash2, UserCheck
    } from 'lucide-svelte';
    import Drawer from '$lib/components/Drawer.svelte';

    let activeTab = $state('waiting'); // waiting, former
    let searchQuery = $state("");
    let isDrawerOpen = $state(false);
    let selectedStudentId = $state<string | null>(null);

    const waitingList = $derived(
        settings.data.students.filter(s => s.status === '대기' && s.name.includes(searchQuery))
    );

    const formerStudents = $derived(
        settings.data.students.filter(s => s.status === '퇴원' && s.name.includes(searchQuery))
    );

    const currentData = $derived(activeTab === 'waiting' ? waitingList : formerStudents);
    const selectedStudent = $derived(
        selectedStudentId ? settings.data.students.find(s => s.id === selectedStudentId) : null
    );

    function openDetail(id: string) {
        selectedStudentId = id;
        isDrawerOpen = true;
    }

    function changeStatus(id: string, newStatus: any) {
        const student = settings.data.students.find(s => s.id === id);
        if (student) {
            student.status = newStatus;
            isDrawerOpen = false;
        }
    }

    function deleteStudent(id: string) {
        if (!confirm('정말로 삭제하시겠습니까?')) return;
        settings.data.students = settings.data.students.filter(s => s.id !== id);
        isDrawerOpen = false;
    }
</script>

<div class="space-y-10 pb-20 max-w-[1600px] mx-auto">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="toss-title">입학/대기 관리</h2>
        </div>
        <div class="flex gap-4">
            <div class="bg-toss-grey-100 p-1.5 rounded-[24px] flex">
                <button 
                    onclick={() => activeTab = 'waiting'} 
                    class="px-8 py-2.5 rounded-2xl font-black text-[14px] transition-all flex items-center gap-2 {activeTab === 'waiting' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}"
                >
                    <UserPlus size={18} /> 입학 대기자
                </button>
                <button 
                    onclick={() => activeTab = 'former'} 
                    class="px-8 py-2.5 rounded-2xl font-black text-[14px] transition-all flex items-center gap-2 {activeTab === 'former' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}"
                >
                    <UserMinus size={18} /> 퇴원/졸업생
                </button>
            </div>
            <button class="toss-btn-secondary px-6 flex items-center gap-2 border-toss-grey-100">
                <Download size={18} /> 엑셀 다운로드
            </button>
        </div>
    </header>

    <!-- Table Section -->
    <div class="bg-white rounded-[40px] border border-toss-grey-100 shadow-sm overflow-hidden">
        <div class="p-8 border-b border-toss-grey-100 flex justify-between items-center bg-toss-grey-50/20">
            <div class="relative flex-1 max-w-md group flex items-center">
                <Search size={22} class="absolute left-5 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" />
                <input 
                    type="text" 
                    bind:value={searchQuery}
                    placeholder="성함으로 검색.." 
                    class="w-full h-14 pl-14 pr-6 bg-white border border-toss-grey-100 rounded-2xl outline-none focus:ring-8 focus:ring-toss-blue/5 font-bold text-[16px] transition-all shadow-sm"
                />
            </div>
        </div>

        <table class="w-full border-collapse">
            <thead class="bg-toss-grey-50">
                <tr class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest border-b border-toss-grey-100 text-left">
                    <th class="py-5 px-8">학생 명단</th>
                    <th class="py-5 px-8">연락처</th>
                    <th class="py-5 px-8">{activeTab === 'waiting' ? '대기 신청일' : '종료일'}</th>
                    <th class="py-5 px-8">비고</th>
                    <th class="py-5 px-8 text-right">상태</th>
                    <th class="py-5 px-8 text-right">작업</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-toss-grey-100">
                {#each currentData as item (item.id)}
                    <tr class="hover:bg-toss-grey-50/50 transition-all cursor-pointer group" onclick={() => openDetail(item.id)}>
                        <td class="py-6 px-8">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl bg-toss-grey-100 flex items-center justify-center font-black text-toss-grey-400 group-hover:bg-toss-blue group-hover:text-white transition-all text-[18px]">
                                    {item.name[0]}
                                </div>
                                <div>
                                    <p class="text-[16px] font-black text-toss-grey-600 leading-tight">{item.name}</p>
                                    <p class="text-[12px] font-bold text-toss-grey-300 mt-1">{item.school} · {item.grade}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-6 px-8 text-[15px] font-bold text-toss-grey-500">{item.studentPhone}</td>
                        <td class="py-6 px-8 text-[14px] font-bold text-toss-grey-400">
                            <div class="flex items-center gap-2">
                                <Calendar size={14} class="text-toss-blue" />
                                {item.regDate}
                            </div>
                        </td>
                        <td class="py-6 px-8 text-[14px] font-medium text-toss-grey-400 max-w-sm truncate">{item.memo || '-'}</td>
                        <td class="py-6 px-8 text-right">
                            <span class="px-3 py-1 rounded-xl text-[12px] font-black {activeTab === 'waiting' ? 'bg-toss-blue-light text-toss-blue' : 'bg-red-50 text-red-500'}">
                                {item.status}
                            </span>
                        </td>
                        <td class="py-6 px-8 text-right">
                            <button class="p-2.5 rounded-xl hover:bg-toss-blue-light text-toss-grey-300 hover:text-toss-blue transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </td>
                    </tr>
                {:else}
                    <tr>
                        <td colspan="6" class="py-32 text-center">
                            <div class="flex flex-col items-center gap-4 text-toss-grey-300">
                                <UserMinus size={64} strokeWidth={1} />
                                <p class="text-[18px] font-black">해당하는 학생이 없습니다.</p>
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<!-- Admission Drawer -->
<Drawer bind:isOpen={isDrawerOpen} title="상세 상태 관리" width="500px">
    {#if selectedStudent}
        <div class="space-y-10" in:fade>
            <div class="p-8 bg-toss-grey-50 rounded-[40px] flex items-center gap-6">
                <div class="w-20 h-20 rounded-[32px] bg-white border border-toss-grey-100 flex items-center justify-center text-[28px] font-black text-toss-grey-600">
                    {selectedStudent.name[0]}
                </div>
                <div>
                    <h3 class="text-[24px] font-black text-toss-grey-600">{selectedStudent.name}</h3>
                    <p class="text-[15px] font-bold text-toss-grey-400">{selectedStudent.school} · {selectedStudent.grade}</p>
                </div>
            </div>

            <section class="space-y-6">
                <h4 class="text-[16px] font-black text-toss-grey-600">상태 변경</h4>
                <div class="grid grid-cols-2 gap-4">
                    <button 
                        onclick={() => changeStatus(selectedStudent.id, '재원')}
                        class="p-6 rounded-[32px] border-2 border-toss-grey-100 hover:border-toss-blue hover:bg-toss-blue-light/30 transition-all flex flex-col items-center gap-3 text-toss-grey-400 hover:text-toss-blue"
                    >
                        <UserCheck size={32} />
                        <span class="font-black">재원으로 전환</span>
                    </button>
                    <button 
                        onclick={() => changeStatus(selectedStudent.id, activeTab === 'waiting' ? '퇴원' : '재원')}
                        class="p-6 rounded-[32px] border-2 border-toss-grey-100 hover:border-red-400 hover:bg-red-50 transition-all flex flex-col items-center gap-3 text-toss-grey-400 hover:text-red-500"
                    >
                        <UserMinus size={32} />
                        <span class="font-black">{activeTab === 'waiting' ? '대기 취소(퇴원)' : '재원생 복귀'}</span>
                    </button>
                </div>
            </section>

            <section class="space-y-4">
                <label class="text-[12px] font-black text-toss-grey-300 uppercase tracking-widest">메모 / 특이사항</label>
                <textarea 
                    bind:value={selectedStudent.memo}
                    class="w-full h-40 p-6 rounded-[32px] bg-toss-grey-50 border-none outline-none font-medium text-toss-grey-600"
                ></textarea>
            </section>

            <footer class="pt-10 border-t border-toss-grey-50 flex gap-4">
                <button onclick={() => deleteStudent(selectedStudent.id)} class="w-16 h-16 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center">
                    <Trash2 size={24} />
                </button>
                <button onclick={() => isDrawerOpen = false} class="flex-1 h-16 bg-toss-grey-600 text-white rounded-[24px] font-black text-[18px]">
                    닫기
                </button>
            </footer>
        </div>
    {/if}
</Drawer>
