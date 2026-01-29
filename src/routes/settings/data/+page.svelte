<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { fade, slide, fly } from 'svelte/transition';
    import { 
        Database, Download, Upload, RefreshCw, 
        AlertTriangle, CheckCircle2, FileJson,
        ShieldAlert, FileSpreadsheet, Search,
        ArrowRightLeft, UserCheck
    } from 'lucide-svelte';
    import * as XLSX from 'xlsx';

    let showResetConfirm = $state(false);
    let activeTool = $state<'backup' | 'excel' | 'bank'>('backup');

    // JSON Export/Import (Existing)
    function exportJSON() {
        const data = JSON.stringify(settings.data, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `starwood_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }

    function importJSON(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                settings.data = parsed;
                alert("데이터를 성공적으로 불러왔습니다.");
            } catch (err) { alert("잘못된 파일 형식입니다."); }
        };
        reader.readAsText(file);
    }

    // Excel Export
    function exportExcel(type: 'students' | 'payments') {
        let data: any[] = [];
        let filename = "";

        if (type === 'students') {
            data = settings.data.students.map(s => ({
                'ID': s.id,
                '이름': s.name,
                '학교': s.school,
                '학년': s.grade,
                '연락처': s.studentPhone,
                '상태': s.status,
                '미납액': s.unpaid
            }));
            filename = "원생명부";
        } else {
            data = settings.data.payments.map(p => ({
                'ID': p.id,
                '학생ID': p.studentId,
                '금액': p.amount,
                '수단': p.type,
                '날짜': p.date,
                '내용': p.description,
                '상태': p.status || '완료'
            }));
            filename = "수납내역";
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, filename);
        XLSX.writeFile(wb, `스타우드_${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // Bank Matching Tool
    let bankText = $state("");
    let matchedResults = $derived.by(() => {
        if (!bankText) return [];
        const results: any[] = [];
        const students = settings.data.students;
        
        // Simple logic: look for student names in each line
        const lines = bankText.split('\n');
        lines.forEach(line => {
            const student = students.find(s => line.includes(s.name));
            if (student) {
                results.push({ line, student, matched: true });
            } else if (line.trim()) {
                results.push({ line, matched: false });
            }
        });
        return results;
    });

    function resetData() {
        settings.reset();
        showResetConfirm = false;
        alert("모든 데이터가 초기화되었습니다.");
    }
</script>

<div class="max-w-[1200px] mx-auto space-y-10 pb-20">
    <header>
        <h2 class="toss-title">데이터 통합 관리</h2>
    </header>

    <!-- Navigation -->
    <div class="flex gap-1 bg-toss-grey-100 p-1.5 rounded-[24px] w-fit">
        <button onclick={() => activeTool = 'backup'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTool === 'backup' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">백업/복구</button>
        <button onclick={() => activeTool = 'excel'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTool === 'excel' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">엑셀 도구</button>
        <button onclick={() => activeTool = 'bank'} class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTool === 'bank' ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400'}">무통장 매칭</button>
    </div>

    <!-- Active Content -->
    {#if activeTool === 'backup'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-toss-blue-light rounded-3xl flex items-center justify-center text-toss-blue">
                    <Download size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">JSON 전체 백업</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">데이터 구조를 포함한 전체 백업 파일을 생성합니다.</p>
                <button onclick={exportJSON} class="w-full toss-btn-primary h-[64px] flex items-center justify-center gap-2">
                    <FileJson size={20} /> JSON 내보내기
                </button>
            </div>

            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600">
                    <Upload size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">JSON 복구</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">백업 파일을 업로드하여 저장소를 덮어씌웁니다.</p>
                <label class="w-full h-[64px] bg-toss-grey-100 rounded-[24px] flex items-center justify-center gap-2 cursor-pointer font-black text-toss-grey-500 hover:bg-toss-grey-200 transition-all">
                    <Upload size={20} /> JSON 파일 선택
                    <input type="file" accept=".json" onchange={importJSON} class="hidden" />
                </label>
            </div>
        </div>
    {:else if activeTool === 'excel'}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-8">
                <div class="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600">
                    <FileSpreadsheet size={32} />
                </div>
                <div>
                    <h3 class="text-[22px] font-black text-toss-grey-600">엑셀 내보내기</h3>
                    <p class="text-[15px] font-bold text-toss-grey-400 mt-2">필요한 데이터를 엑셀(XLSX) 형식으로 다운로드합니다.</p>
                </div>
                <div class="space-y-3">
                    <button onclick={() => exportExcel('students')} class="w-full h-16 rounded-2xl bg-toss-grey-100 flex items-center justify-between px-6 font-black text-toss-grey-600 hover:bg-toss-grey-200 transition-all">
                        <span>원생 명부 내보내기</span>
                        <Download size={20} class="opacity-40" />
                    </button>
                    <button onclick={() => exportExcel('payments')} class="w-full h-16 rounded-2xl bg-toss-grey-100 flex items-center justify-between px-6 font-black text-toss-grey-600 hover:bg-toss-grey-200 transition-all">
                        <span>수납/매출 내역 내보내기</span>
                        <Download size={20} class="opacity-40" />
                    </button>
                </div>
            </div>

            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-toss-blue-light rounded-3xl flex items-center justify-center text-toss-blue">
                    <Upload size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">엑셀 일괄 등록</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">대량의 원생 정보를 엑셀로 한 번에 등록합니다. (샘플 양식 필요)</p>
                <div class="border-2 border-dashed border-toss-grey-100 p-10 rounded-[32px] text-center space-y-4">
                    <p class="text-[14px] font-bold text-toss-grey-400">엑셀 파일을 이 곳으로 드래그하거나 선택하세요.</p>
                    <button class="toss-btn-secondary px-6">샘플 양식 받기</button>
                </div>
            </div>
        </div>
    {:else if activeTool === 'bank'}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6">
                <div class="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-600">
                    <ArrowRightLeft size={32} />
                </div>
                <h3 class="text-[22px] font-black text-toss-grey-600">무통장 입금 매칭</h3>
                <p class="text-[15px] font-bold text-toss-grey-400">통장 거래 내역을 복사해서 붙여넣으면 이름이 일치하는 원생을 자동으로 찾습니다.</p>
                <textarea 
                    bind:value={bankText}
                    class="w-full h-80 p-6 bg-toss-grey-50 rounded-[32px] border-none focus:ring-2 focus:ring-toss-blue/20 text-[14px] font-medium" 
                    placeholder="여기에 통장 내역을 붙여넣으세요.&#10;예: 2026/02/01 350,000 입금(홍길동)"
                ></textarea>
            </div>

            <div class="bg-white p-10 rounded-[48px] border border-toss-grey-100 shadow-sm space-y-6 flex flex-col">
                <h3 class="text-[20px] font-black text-toss-grey-600">매칭 분석 결과</h3>
                
                <div class="flex-1 overflow-auto space-y-3">
                    {#each matchedResults as res}
                        <div class="p-5 rounded-[24px] border {res.matched ? 'bg-blue-50/50 border-blue-100' : 'bg-toss-grey-50 border-toss-grey-100'} transition-all">
                            <p class="text-[13px] font-medium text-toss-grey-400 truncate mb-2">{res.line}</p>
                            {#if res.matched}
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <UserCheck size={18} class="text-toss-blue" />
                                        <span class="text-[15px] font-black text-toss-grey-600">{res.student.name}</span>
                                        <span class="text-[12px] font-bold text-toss-grey-400">{res.student.school} {res.student.grade}</span>
                                    </div>
                                    <span class="text-[14px] font-black text-toss-blue">미납 ₩{res.student.unpaid.toLocaleString()}</span>
                                </div>
                            {:else}
                                <p class="text-[13px] font-bold text-toss-grey-300">일치하는 원생 없음</p>
                            {/if}
                        </div>
                    {/each}
                    
                    {#if matchedResults.length === 0}
                        <div class="h-full flex flex-col items-center justify-center text-toss-grey-200 py-20">
                            <Search size={48} class="opacity-30 mb-4" />
                            <p class="font-bold">입금 내역을 입력하면 결과가 표시됩니다.</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}

    <!-- Danger Zone -->
    <div class="bg-red-50 p-10 rounded-[48px] border border-red-100 space-y-8">
        <div class="flex items-center gap-4 text-red-600">
            <ShieldAlert size={32} />
            <div>
                <h3 class="text-[22px] font-black">위험 구역</h3>
                <p class="text-[15px] font-bold opacity-80">데이터 초기화는 되돌릴 수 없습니다. 신중하게 결정하세요.</p>
            </div>
        </div>

        {#if showResetConfirm}
            <div class="p-8 bg-white rounded-[32px] border border-red-200 space-y-6" in:slide>
                <p class="text-[16px] font-bold text-red-600 text-center">정말로 모든 데이터를 초기화하시겠습니까?<br/>기본 설정값으로 돌아가며 모든 기록이 삭제됩니다.</p>
                <div class="flex gap-3">
                    <button onclick={() => showResetConfirm = false} class="flex-1 h-[56px] rounded-2xl bg-toss-grey-100 font-black text-toss-grey-500">취소</button>
                    <button onclick={resetData} class="flex-1 h-[56px] rounded-2xl bg-red-600 font-black text-white shadow-lg shadow-red-200">네, 삭제하겠습니다</button>
                </div>
            </div>
        {:else}
            <button onclick={() => showResetConfirm = true} class="w-full h-[64px] border-2 border-red-200 text-red-600 rounded-[24px] font-black hover:bg-red-100/50 transition-all flex items-center justify-center gap-2">
                <RefreshCw size={20} /> 모든 데이터 초기화
            </button>
        {/if}
    </div>
</div>
