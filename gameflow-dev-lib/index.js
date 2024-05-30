
// console.warn(gameflowEntry);
const path = gameflowEntry.path();
// console.log(require == requirejs);

requirejs.config({
  baseUrl: path + './gameflow-dev-lib',
  paths: {
    config: './gameflow.config',
    support: './support',
    animation: './animation',
    physical: './physical',
    queryobj: './queryobj',
  }
});
gameflowEntry.requirePolyFill(requirejs);


async function init(){
  
  let config = await __require__('config');
  console.log(config);

  let physical = await __require__('physical/index', path + './gameflow-dev-lib/physical/');
  console.log(physical);
  physical.render();
  
  console.log('requirejs work');
  __GLOBAL__.box2d = physical;
};



init();



