import Sprite from "./base/Sprite.svelte";
import Graphics from "./base/Graphics.svelte";
import Icon from "./base/Icon.svelte";
import Text from "./base/Text.svelte";
import Backpack from "./template/Backpack.svelte";
import {LGraph, LGraphCanvas, LiteGraph} from 'litegraph.js';

var graph = new LGraph();


var canvas = new LGraphCanvas("#graph", graph);

var node_const = LiteGraph.createNode("basic/const");
node_const.pos = [200,200];
graph.add(node_const);
node_const.setValue(4.5);

var node_watch = LiteGraph.createNode("basic/watch");
node_watch.pos = [700,200];
graph.add(node_watch);

node_const.connect(0, node_watch, 0);

graph.start();

export { Backpack, Sprite, Graphics, Text, Icon };
