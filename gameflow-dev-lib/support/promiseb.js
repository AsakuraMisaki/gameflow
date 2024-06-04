function newPromise() {
  let _ = {};
  let promise = new Promise((resolve, reject) => {
    _.resolve = resolve;
    _.reject = reject;
  });
  Object.assign(promise, _);
  return promise;
}

function loadImage(src) {
  let promise = newPromise();
  const img = new Image();
  img.crossOrigin = 'Anonymous'; // 如果需要处理跨域问题
  img.onload = () => promise.resolve(img);
  img.onerror = promise.reject;
  img.src = src;
  return promise;
}

export { newPromise, loadImage };