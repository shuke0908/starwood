<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { X } from "lucide-svelte";

  let {
    isOpen = $bindable(false),
    title,
    children,
    width = "500px",
  } = $props();

  function close() {
    isOpen = false;
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[100] transition-all"
    onclick={close}
    transition:fade={{ duration: 200 }}
  ></div>

  <div
    class="fixed inset-y-0 right-0 bg-white shadow-2xl z-[101] border-l border-toss-grey-100 flex flex-col overflow-hidden"
    style="width: {width}"
    transition:fly={{ x: 500, duration: 400, opacity: 1 }}
  >
    {#if title}
      <header
        class="p-8 border-b border-toss-grey-50 flex justify-between items-center bg-white sticky top-0 z-10"
      >
        <div>
          <h3 class="text-[22px] font-black text-toss-grey-600">{title}</h3>
        </div>
        <button
          onclick={close}
          class="w-12 h-12 flex items-center justify-center rounded-2xl bg-toss-grey-50 text-toss-grey-400 hover:bg-toss-grey-100 transition-all"
        >
          <X size={24} />
        </button>
      </header>
    {:else}
      <button
        onclick={close}
        class="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-2xl bg-toss-grey-50/50 text-toss-grey-400 hover:bg-toss-grey-100 transition-all z-[110] backdrop-blur-sm"
      >
        <X size={24} />
      </button>
    {/if}

    <div class="flex-1 overflow-y-auto p-8 scrollbar-hide">
      {@render children()}
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
