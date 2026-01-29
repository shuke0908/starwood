<script lang="ts">
    let { tabs, activeTab = $bindable(), children } = $props();

    function setActive(id: string) {
        activeTab = id;
    }
</script>

<div class="space-y-8">
    <div class="flex gap-1 bg-toss-grey-100 p-1.5 rounded-[24px] w-fit">
        {#each tabs as tab}
            <button 
                onclick={() => setActive(tab.id)}
                class="px-8 py-3 rounded-2xl text-[15px] font-black transition-all {activeTab === tab.id ? 'bg-white shadow-sm text-toss-blue' : 'text-toss-grey-400 hover:text-toss-grey-600'}"
            >
                {tab.label}
            </button>
        {/each}
    </div>

    <div class="transition-all duration-300">
        {@render children()}
    </div>
</div>
