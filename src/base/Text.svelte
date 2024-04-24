<!-- 背包 -->
<script>
  export let items = [];

  // 删除物品
  function removeItem(index) {
    items = items.filter((_, i) => i !== index);
  }
</script>

<h2>Backpack</h2>

<ul>
  {#each items as item, index}
    <li>{item} <button on:click={() => removeItem(index)}>Remove</button></li>
  {/each}
</ul>

<style>
  ul{
    margin: 80px;
  }
</style>
