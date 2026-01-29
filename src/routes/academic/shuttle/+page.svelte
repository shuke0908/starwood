<script lang="ts">
    import { settings } from '$lib/settings.svelte';
    import { 
        Bus, User, MapPin, Search, Plus, 
        ChevronRight, Star, AlertCircle, CheckCircle2,
        Navigation, Clock, Users, Wrench, Phone, Trash2, Save, X
    } from 'lucide-svelte';
    import { fade, fly } from 'svelte/transition';
    import Drawer from '$lib/components/Drawer.svelte';

    let activeTab = $state<'vehicles' | 'drivers' | 'routes'>('vehicles');
    let searchQuery = $state("");
    let isDrawerOpen = $state(false);
    let selectedId = $state<string | null>(null);

    const filteredVehicles = $derived(
        settings.data.shuttleVehicles.filter(v => 
            v.plate.includes(searchQuery) || v.model.includes(searchQuery)
        )
    );

    const filteredDrivers = $derived(
        settings.data.shuttleDrivers.filter(d => 
            d.name.includes(searchQuery) || d.phone.includes(searchQuery)
        )
    );

    const filteredRoutes = $derived(
        settings.data.shuttleRoutes.filter(r => 
            r.name.includes(searchQuery)
        )
    );

    const selectedItem = $derived.by(() => {
        if (!selectedId) return null;
        if (activeTab === 'vehicles') return settings.data.shuttleVehicles.find(v => v.id === selectedId);
        if (activeTab === 'drivers') return settings.data.shuttleDrivers.find(d => d.id === selectedId);
        return settings.data.shuttleRoutes.find(r => r.id === selectedId);
    });

    function openDetail(id: string) {
        selectedId = id;
        isDrawerOpen = true;
    }

    const fmt = (val?: number) => val ? val.toLocaleString() : "0";
</script>

<div class="space-y-8 pb-10">
    <!-- Search & Active Tab -->
    <div class="flex gap-6 items-center justify-between">
        <div class="flex gap-6 items-center flex-1">
            <div class="relative w-[500px] group flex items-center">
                <Search class="absolute left-6 text-toss-grey-300 group-focus-within:text-toss-blue transition-colors pointer-events-none" size={24} />
                <input 
                    type="text" 
                    bind:value={searchQuery} 
                    placeholder="차량번호, 기사성함, 노선명 등으로 검색..." 
                    class="w-full bg-white border border-toss-grey-50 rounded-[24px] pl-16 pr-8 h-[64px] text-[17px] font-bold text-toss-grey-600 focus:ring-8 focus:ring-toss-blue/5 outline-none transition-all shadow-sm group-hover:border-toss-grey-100 group-hover:shadow-md" 
                />
            </div>
            
            <div class="bg-toss-grey-50 p-1.5 rounded-[24px] flex border border-toss-grey-100/50 shadow-inner">
                <button onclick={() => activeTab = 'vehicles'} class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab === 'vehicles' ? 'bg-white shadow-md text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}">차량 현황</button>
                <button onclick={() => activeTab = 'drivers'} class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab === 'drivers' ? 'bg-white shadow-md text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}">기사 관리</button>
                <button onclick={() => activeTab = 'routes'} class="px-8 py-3 rounded-[18px] font-black text-[15px] transition-all {activeTab === 'routes' ? 'bg-white shadow-md text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}">노선/배차</button>
            </div>
        </div>

        <button class="toss-btn-primary flex items-center gap-2 px-8 h-[64px] rounded-[24px] shadow-lg shadow-toss-blue/10 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-[16px] whitespace-nowrap">
            <Plus size={22} class="stroke-[3]" />
            {#if activeTab === 'vehicles'}차량 등록{:else if activeTab === 'drivers'}기사 등록{:else}노선 추가{/if}
        </button>
    </div>

    <!-- Data Table Area -->
    <div class="bg-white rounded-[40px] border border-toss-grey-50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)] relative">
        <div class="overflow-x-auto flex-1 custom-scroll">
            {#if activeTab === 'vehicles'}
                <table class="w-full text-left border-collapse whitespace-nowrap">
                    <thead class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10">
                        <tr class="text-[12px] font-black text-toss-grey-400 uppercase tracking-tight">
                            <th class="p-6 pl-10">차량번호</th>
                            <th class="p-6">차종 / 모델</th>
                            <th class="p-6">담당 기사</th>
                            <th class="p-6">누적 주행거리</th>
                            <th class="p-6 text-center">운행 상태</th>
                            <th class="p-6 text-right pr-10">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-50/50">
                        {#each filteredVehicles as v}
                            <tr onclick={() => openDetail(v.id)} class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group" style="height: 84px">
                                <td class="p-6 pl-10 font-black text-[16px] text-toss-grey-700 group-hover:text-toss-blue transition-colors">{v.plate}</td>
                                <td class="p-6 font-bold text-toss-grey-500">{v.model}</td>
                                <td class="p-6">
                                    <span class="font-black text-toss-grey-600">{settings.data.shuttleDrivers.find(d => d.id === v.driverId)?.name || '미배정'}</span>
                                </td>
                                <td class="p-6 font-bold text-toss-grey-400 uppercase tracking-tight">{fmt(v.mileage)} km</td>
                                <td class="p-6 text-center">
                                    <span class="px-3 py-1.5 rounded-full text-[11px] font-black {v.status === '정상' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}">
                                        {v.status}
                                    </span>
                                </td>
                                <td class="p-6 text-right pr-10">
                                    <button class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else if activeTab === 'drivers'}
                <table class="w-full text-left border-collapse whitespace-nowrap">
                    <thead class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10">
                        <tr class="text-[12px] font-black text-toss-grey-400 uppercase tracking-tight">
                            <th class="p-6 pl-10">성명</th>
                            <th class="p-6">연락처</th>
                            <th class="p-6 text-right">급여</th>
                            <th class="p-6">입사일</th>
                            <th class="p-6 text-center">현재 상태</th>
                            <th class="p-6 text-right pr-10">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-50/50">
                        {#each filteredDrivers as d}
                            <tr onclick={() => openDetail(d.id)} class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group" style="height: 84px">
                                <td class="p-6 pl-10 font-black text-[16px] text-toss-grey-700 group-hover:text-toss-blue transition-colors">{d.name}</td>
                                <td class="p-6 font-bold text-toss-grey-400">{d.phone}</td>
                                <td class="p-6 text-right font-bold text-toss-grey-600">₩{fmt(d.salary || 0)}</td>
                                <td class="p-6 font-bold text-toss-grey-400">{d.joinDate}</td>
                                <td class="p-6 text-center">
                                    {#if d.isOnHoliday}
                                        <span class="px-3 py-1.5 rounded-full text-[11px] font-black bg-orange-50 text-orange-600 border border-orange-100">휴가 중</span>
                                    {:else}
                                        <span class="px-3 py-1.5 rounded-full text-[11px] font-black {d.status === '운행중' ? 'bg-toss-blue-light text-toss-blue border border-toss-blue/10' : 'bg-toss-grey-50 text-toss-grey-300 border border-toss-grey-100'}">
                                            {d.status}
                                        </span>
                                    {/if}
                                </td>
                                <td class="p-6 text-right pr-10">
                                    <button class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else}
                <table class="w-full text-left border-collapse whitespace-nowrap">
                    <thead class="bg-toss-grey-25 border-b border-toss-grey-50 sticky top-0 z-10">
                        <tr class="text-[12px] font-black text-toss-grey-400 uppercase tracking-tight">
                            <th class="p-6 pl-10">노선 명칭</th>
                            <th class="p-6">정류장 수</th>
                            <th class="p-6">탑승 인원</th>
                            <th class="p-6">예상 운행 시간</th>
                            <th class="p-6 text-center">운행 여부</th>
                            <th class="p-6 text-right pr-10">관리</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-toss-grey-50/50">
                        {#each filteredRoutes as r}
                            <tr onclick={() => openDetail(r.id)} class="hover:bg-toss-blue-light/15 transition-all cursor-pointer group" style="height: 84px">
                                <td class="p-6 pl-10 font-black text-[16px] text-toss-grey-700 group-hover:text-toss-blue transition-colors">{r.name}</td>
                                <td class="p-6">
                                    <div class="flex items-center gap-2 font-bold text-toss-grey-400">
                                        <MapPin size={14} class="text-orange-400" />
                                        <span>{r.stops}개 정류장</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-2 font-black text-toss-grey-600">
                                        <Users size={14} class="text-toss-blue" />
                                        <span>{r.studentCount}명 탑승 중</span>
                                    </div>
                                </td>
                                <td class="p-6">
                                    <div class="flex items-center gap-2 font-bold text-toss-grey-400">
                                        <Clock size={14} class="text-purple-400" />
                                        <span>{r.startTime} ~ {r.endTime}</span>
                                    </div>
                                </td>
                                <td class="p-6 text-center">
                                    <span class="px-4 py-1.5 rounded-full bg-toss-blue-light/30 text-toss-blue text-[11px] font-black border border-toss-blue/10">정상 운행</span>
                                </td>
                                <td class="p-6 text-right pr-10">
                                    <button class="w-10 h-10 rounded-xl flex items-center justify-center text-toss-grey-200 group-hover:bg-toss-blue-light group-hover:text-toss-blue transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        </div>
    </div>
</div>

<Drawer bind:isOpen={isDrawerOpen} title="상세 정보 조회" width="560px">
    {#if selectedItem}
        <div class="space-y-10" in:fade>
             <section class="grid grid-cols-2 gap-4">
                 <div class="p-6 bg-toss-blue-light/30 rounded-[32px] space-y-1">
                     <p class="text-[11px] font-black text-toss-blue uppercase tracking-widest">분류</p>
                     <p class="text-[20px] font-black text-toss-blue">{activeTab === 'vehicles' ? '차량' : (activeTab === 'drivers' ? '운전원' : '노선')}</p>
                 </div>
                 <div class="p-6 bg-toss-grey-50 rounded-[32px] space-y-1">
                     <p class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest">현재 상태</p>
                     <p class="text-[20px] font-black text-toss-grey-600">{(selectedItem as any).status || '정상'}</p>
                 </div>
             </section>

             <section class="bg-toss-grey-25 p-8 rounded-[40px] border border-toss-grey-50 space-y-6">
                 <div class="space-y-2">
                     <label class="text-[11px] font-black text-toss-grey-300 uppercase tracking-widest pl-1">핵심 정보</label>
                     <div class="bg-white p-6 rounded-2xl shadow-sm text-[22px] font-black text-toss-grey-700">
                        {(selectedItem as any).plate || selectedItem.name}
                     </div>
                 </div>

                 {#if activeTab === 'vehicles'}
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <p class="text-[11px] font-bold text-toss-grey-300">누적 주행거리</p>
                            <p class="text-[18px] font-black text-toss-grey-600">{fmt((selectedItem as any).mileage)} km</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-[11px] font-bold text-toss-grey-300">최근 점검일</p>
                            <p class="text-[18px] font-black text-toss-grey-600">{(selectedItem as any).lastCheck}</p>
                        </div>
                    </div>
                 {:else if activeTab === 'drivers'}
                    <div class="space-y-4">
                        <div class="flex justify-between items-center py-4 border-b border-toss-grey-100">
                            <span class="font-bold text-toss-grey-400">연락처</span>
                            <span class="font-black text-toss-blue text-[18px]">{(selectedItem as any).phone}</span>
                        </div>
                        <div class="flex justify-between items-center py-4 border-b border-toss-grey-100">
                            <span class="font-bold text-toss-grey-400">월 급여</span>
                            <span class="font-black text-toss-grey-600">₩{fmt((selectedItem as any).salary || 0)}</span>
                        </div>
                        <div class="flex justify-between items-center py-4 border-b border-toss-grey-100">
                            <span class="font-bold text-toss-grey-400">휴가 여부</span>
                            <span class="font-black {(selectedItem as any).isOnHoliday ? 'text-orange-500' : 'text-green-500'}">{(selectedItem as any).isOnHoliday ? '휴가 중' : '정상'}</span>
                        </div>
                    </div>
                 {/if}
             </section>

             <footer class="pt-6 flex gap-4">
                <button onclick={() => isDrawerOpen = false} class="w-16 h-16 rounded-3xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={24} />
                </button>
                <button class="flex-1 h-16 bg-toss-grey-800 text-white rounded-[28px] font-black text-[18px]">
                    수정 모드로 전환
                </button>
            </footer>
        </div>
    {/if}
</Drawer>
