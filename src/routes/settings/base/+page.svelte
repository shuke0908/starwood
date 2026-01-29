<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { 
        Settings, Building, FileSpreadsheet, Printer, 
        Save, Download, Upload, ShieldCheck, 
        CheckCircle2, AlertCircle, ChevronRight,
        Briefcase, CreditCard, Lock
    } from 'lucide-svelte';
    import { fade, fly, slide } from 'svelte/transition';

    let activeTab = $state('academy'); // academy, data, receipts
    
    // Academy Settings state (Bound to store)
    let academy = $derived(settings.data.academy);

    // Receipt selection state
    let selectedStudents = $state<string[]>([]);
    function toggleAll() {
        if (selectedStudents.length === settings.data.students.length) selectedStudents = [];
        else selectedStudents = settings.data.students.map(s => s.id);
    }

    function saveSettings() {
        alert("학원 정보가 저장되었습니다.");
    }
</script>

<div class="max-w-[1200px] mx-auto space-y-10 pb-20">
    <!-- Header -->
    <header class="flex justify-between items-end">
        <div>
            <h2 class="toss-title">설정 및 데이터 관리</h2>
        </div>
    </header>

    <!-- Nav Tabs -->
    <div class="flex gap-1 bg-toss-grey-100 p-1.5 rounded-[24px] w-fit">
        <button onclick={() => activeTab = 'academy'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab === 'academy' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">학원 정보</button>
        <button onclick={() => activeTab = 'data'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab === 'data' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">데이터 도구 (Excel)</button>
        <button onclick={() => activeTab = 'receipts'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab === 'receipts' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">영수증 일괄 출력</button>
    </div>

    {#if activeTab === 'academy'}
        <section class="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div class="md:col-span-2 bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-10">
                <div class="space-y-6">
                    <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3">
                        <Building class="text-toss-blue" /> 학원 기본 정보
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-[13px] font-black text-toss-grey-400">학원 명칭</label>
                            <input type="text" bind:value={settings.data.academy.name} class="toss-input" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[13px] font-black text-toss-grey-400">사업자 등록번호</label>
                            <input type="text" bind:value={settings.data.academy.businessId} class="toss-input" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[13px] font-black text-toss-grey-400">원장 명의</label>
                            <input type="text" bind:value={settings.data.academy.director} class="toss-input" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[13px] font-black text-toss-grey-400">결제 정책 (기본)</label>
                            <select bind:value={settings.data.academy.refundMode} class="toss-input bg-toss-grey-100/50">
                                <option value="session">횟수제 (자동 계산)</option>
                                <option value="date">날짜제</option>
                                <option value="proportion">비율제</option>
                            </select>
                        </div>
                        <div class="md:col-span-2 space-y-2">
                            <label class="text-[13px] font-black text-toss-grey-400">학원 주소</label>
                            <input type="text" bind:value={settings.data.academy.address} class="toss-input" />
                        </div>
                    </div>
                </div>

                <div class="space-y-6 pt-10 border-t border-toss-grey-100">
                    <h3 class="text-[20px] font-black text-toss-grey-600 flex items-center gap-3">
                        <Building class="text-toss-blue" /> 학교 및 학년 관리 (8-1-B)
                    </h3>
                    <p class="text-[14px] font-bold text-toss-grey-400">학원에서 관리하는 학교 및 학년 체계를 설정합니다.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-3">
                            <p class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest">등록된 학교 목록</p>
                            <div class="flex flex-wrap gap-2">
                                {#each ['스타고', '그라미중', '에듀초', '비전고', '글로벌중'] as school}
                                    <span class="px-4 py-2 bg-toss-grey-50 border border-toss-grey-100 rounded-xl text-[14px] font-bold text-toss-grey-600">
                                        {school}
                                    </span>
                                {/each}
                                <button class="px-4 py-2 border-2 border-dashed border-toss-grey-100 rounded-xl text-[14px] font-black text-toss-grey-300 hover:border-toss-blue hover:text-toss-blue transition-all">
                                    + 학교 추가
                                </button>
                            </div>
                        </div>
                        <div class="space-y-3">
                            <p class="text-[12px] font-black text-toss-grey-400 uppercase tracking-widest">관리 학년 설정</p>
                            <div class="grid grid-cols-3 gap-2">
                                {#each ['초등', '중등', '고등'] as level}
                                    <label class="flex items-center gap-2 p-3 bg-toss-grey-50 rounded-xl cursor-pointer hover:bg-white border hover:border-toss-blue/30 transition-all">
                                        <input type="checkbox" checked class="accent-toss-blue" />
                                        <span class="text-[13px] font-black text-toss-grey-500">{level}</span>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-10 border-t border-toss-grey-100 flex justify-end">
                    <button onclick={saveSettings} class="toss-btn-primary px-10 flex items-center gap-2">
                        <Save size={20} /> 설정 저장하기
                    </button>
                </div>
            </div>

            <aside class="space-y-8">
                <div class="bg-toss-grey-600 p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-black/10">
                    <h3 class="text-[18px] font-black flex items-center gap-3">
                        <ShieldCheck class="text-toss-blue" /> 학원 보안
                    </h3>
                    <p class="text-white/60 text-[14px]">사업자 정보 및 결제 정책 변경 시 모든 영수증과 청구서에 즉시 반영됩니다.</p>
                    <button class="w-full py-4 rounded-2xl bg-white/10 text-white font-black hover:bg-white/20 transition-all">전용 로고 업로드</button>
                </div>
            </aside>
        </section>

    {:else if activeTab === 'data'}
        <section class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600">
                    <Download size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">데이터 내보내기</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">재원생 명부, 수납 내역, 출결 현황을 엑셀 파일로 다운로드합니다. 필요한 컬럼만 선택할 수 있습니다.</p>
                
                <div class="grid grid-cols-2 gap-3 pt-4">
                    <label class="flex items-center gap-2 p-3 bg-toss-grey-50 rounded-xl">
                        <input type="checkbox" checked class="accent-toss-blue" />
                        <span class="text-[13px] font-bold text-toss-grey-500">원생 인적사항</span>
                    </label>
                    <label class="flex items-center gap-2 p-3 bg-toss-grey-50 rounded-xl">
                        <input type="checkbox" checked class="accent-toss-blue" />
                        <span class="text-[13px] font-bold text-toss-grey-500">보호자 연락처</span>
                    </label>
                    <label class="flex items-center gap-2 p-3 bg-toss-grey-50 rounded-xl">
                        <input type="checkbox" class="accent-toss-blue" />
                        <span class="text-[13px] font-bold text-toss-grey-500">수납 내역</span>
                    </label>
                    <label class="flex items-center gap-2 p-3 bg-toss-grey-50 rounded-xl">
                        <input type="checkbox" class="accent-toss-blue" />
                        <span class="text-[13px] font-bold text-toss-grey-500">성적 데이터</span>
                    </label>
                </div>
                
                <button class="w-full toss-btn-primary bg-green-600 hover:bg-green-700 h-[64px] flex items-center justify-center gap-2">
                    <FileSpreadsheet size={20} /> 엑셀 파일 생성
                </button>
            </div>

            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-toss-blue-light rounded-3xl flex items-center justify-center text-toss-blue">
                    <Upload size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">데이터 일괄 가져오기</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">기존에 사용하시던 엑셀 명부를 업로드하여 대량의 원생 정보를 한 번에 등록하세요.</p>
                
                <div class="border-2 border-dashed border-toss-grey-100 p-10 rounded-[32px] text-center space-y-4">
                    <p class="text-[14px] font-bold text-toss-grey-400">엑셀 파일을 이 곳으로 드래그하거나 클릭하여 업로드하세요.</p>
                    <button class="toss-btn-secondary px-6">샘플 양식 다운로드</button>
                </div>
            </div>
        </section>

    {:else if activeTab === 'receipts'}
        <section class="bg-white p-10 rounded-[56px] border border-toss-grey-100 shadow-sm space-y-8" in:fade>
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-[24px] font-black text-toss-grey-600">영수증 일괄 인쇄</h3>
                    <p class="text-[15px] font-bold text-toss-grey-400">기간별, 반별로 수납 완료된 영수증을 모아서 PDF로 인쇄합니다.</p>
                </div>
                <button class="toss-btn-primary px-10 flex items-center gap-2">
                    <Printer size={20} /> {selectedStudents.length}건 일괄 출력
                </button>
            </div>

            <div class="bg-toss-grey-50 p-6 rounded-[32px] flex flex-wrap gap-4 items-center">
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-white rounded-xl border border-toss-grey-100 text-[13px] font-bold">2026년 1월</button>
                    <button class="px-4 py-2 bg-white rounded-xl border border-toss-grey-100 text-[13px] font-bold">모든 클래스</button>
                </div>
                <div class="h-6 w-[1px] bg-toss-grey-200"></div>
                <label class="flex items-center gap-2 text-[14px] font-bold text-toss-grey-600">
                    <input type="checkbox" onchange={toggleAll} class="w-5 h-5 rounded accent-toss-blue" />
                    전체 선택
                </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each settings.data.students.slice(0, 15) as s}
                    <div class="p-6 rounded-[32px] border border-toss-grey-100 flex items-center justify-between group hover:border-toss-blue/30 transition-all">
                        <div class="flex items-center gap-4">
                            <input type="checkbox" bind:group={selectedStudents} value={s.id} class="w-5 h-5 rounded accent-toss-blue" />
                            <div>
                                <p class="text-[15px] font-black text-toss-grey-600">{s.name}</p>
                                <p class="text-[12px] font-bold text-toss-grey-400">{s.school} {s.grade}</p>
                            </div>
                        </div>
                        <span class="text-[13px] font-black text-toss-blue">₩{s.unpaid.toLocaleString()}</span>
                    </div>
                {/each}
            </div>
        </section>
    {/if}
</div>
