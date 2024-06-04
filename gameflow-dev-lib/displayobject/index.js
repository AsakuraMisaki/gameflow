import * as _Yoga from '../support/yoga-layout/dist/src/index.js';

let Yoga;

async function init(){
  const source = await _Yoga.loadYoga();
  const _ = _Yoga.wrapAssembly(source);
  Yoga = Object.assign({}, _Yoga);
  Yoga = Object.assign(Yoga, _);
  console.warn(Yoga);
  test();
}
init();

let YogaContext = new Map();

function YogaWrap(){ this.init(...arguments) };
YogaWrap.prototype.constructor = YogaWrap;
YogaWrap.prototype.init = function(){ };
YogaWrap.prototype.link = function(displayo, children = displayo.children){ 
  if(!children) return;
  let root = Yoga.Node.create();
  YogaContext.set(displayo, root);
  return root;
}




function test(){

  const { FlexDirection, Node, Edge } = Yoga;

  const root = Yoga.Node.create();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const child0 = Yoga.Node.create();
  child0.setFlexGrow(1);
  child0.setMargin(Edge.Right, 10);
  root.insertChild(child0, 0);

  const child1 = Yoga.Node.create();
  child1.setFlexGrow(1);
  root.insertChild(child1, 1);

  root.calculateLayout(Yoga.UNDEFINED, Yoga.UNDEFINED, Yoga.DIRECTION_LTR);

  // 输出布局信息
  console.log('Root layout:', root.getComputedLayout());
  console.log('Child1 layout:', child0.getComputedLayout());
  console.log('Child2 layout:', child1.getComputedLayout());

  
}

export { Yoga, YogaWrap, YogaContext };