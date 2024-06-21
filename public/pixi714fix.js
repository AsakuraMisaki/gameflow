// es5 class fix
export function es5New (_class, context, ...args) {
    const _proto_ = new _class(...args);
    Object.assign(context, _proto_);
};

// PIXI.Renderer.registerPlugin
export function registerPlugin (pluginName, ctor) {
    Renderer.__plugins[pluginName] = ctor;
};
