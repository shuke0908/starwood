<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { X } from 'lucide-svelte';

    let { isOpen = $bindable(false), title, children, maxWidth = "max-w-2xl" } = $props();

    function close() {
        isOpen = false;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
        onclick={close}
        transition:fade={{ duration: 200 }}
    >
        <div 
            class="bg-white w-full {maxWidth} rounded-[40px] shadow-2xl overflow-hidden border border-toss-grey-100 flex flex-col"
            onclick={(e) => e.stopPropagation()}
            transition:scale={{ start: 0.95, duration: 300, opacity: 0 }}
        >
            <header class="p-8 border-b border-toss-grey-50 flex justify-between items-center">
                <h3 class="text-[20px] font-black text-toss-grey-600">{title}</h3>
                <button onclick={close} class="text-toss-grey-300 hover:text-toss-grey-600 transition-colors p-2"><X size={24} /></button>
            </header>
            
            <div class="p-8 overflow-y-auto max-h-[80vh] scrollbar-hide">
                {@render children()}
            </div>
        </div>
    </div>
{/if}

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
