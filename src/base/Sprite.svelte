<script>
    import { onMount } from "svelte";

    export let display = "";
    export let marginTop = 0;
    export let marginLeft = 0;
    export let marginBottom = 0;
    export let marginRight = 0;
    export let left = 0;
    export let top = 0;
    export let bottom = 0;
    export let right = 0;
    export let opacity = 255;
    export let visibility = "visible";
    export let text = "";
    export let position = "relative";
    export let _self = null;
    export let self = function () {
        return _self;
    };
    export let create = function () {
        console.log(this);
    };
    onMount(()=>{
        create();
    })
</script>

<u_sprite
    style="
    display: {display};
    margin-top: {marginTop}px;
    margin-left: {marginLeft}px;
    margin-bottom: {marginBottom}px;
    margin-right: {marginRight}px;
    position: {position};
    left: {left}px;
    top: {top}px;
    bottom: {bottom}px;
    right: {right}px;
    opacity: {opacity};
    visibility: {visibility};
    "
    bind:this={self}
    on:mount={create}
>
    {text}
</u_sprite>

<!-- 这个是子组件，如何从刚才的父组件改这个组件的display -->
