<script lang="ts">
    import { toast } from '$lib/stores/toast.svelte';
    import { fade, fly } from 'svelte/transition';
    import { CheckCircle2, AlertCircle, Info, X } from 'lucide-svelte';

    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        info: Info
    };

    const colors = {
        success: 'border-green-100 bg-green-50 text-green-700',
        error: 'border-red-100 bg-red-50 text-red-700',
        info: 'border-blue-100 bg-blue-50 text-blue-700'
    };
</script>

<div class="fixed top-6 right-6 z-[200] space-y-3 pointer-events-none">
    {#each toast.messages as msg (msg.id)}
        <div 
            in:fly={{ x: 20, duration: 300 }}
            out:fade={{ duration: 200 }}
            class="w-[380px] p-4 rounded-2xl border {colors[msg.type]} shadow-xl pointer-events-auto flex items-start gap-3 backdrop-blur-md"
        >
            <div class="mt-0.5">
                <svelte:component this={icons[msg.type]} size={20} />
            </div>
            <div class="flex-1">
                <p class="text-[15px] font-black">{msg.message}</p>
                {#if msg.description}
                    <p class="text-[13px] font-medium opacity-80 mt-1">{msg.description}</p>
                {/if}
            </div>
            <button 
                onclick={() => toast.dismiss(msg.id)}
                class="p-1 hover:bg-black/5 rounded-lg transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    {/each}
</div>
