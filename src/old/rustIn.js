import * as wa from '../wasm/pkg/wasm.js';
import { TrackedArray, ObservableElement } from '../wasm/pkg/wasm.js';

async function run(){
    let r = await wa.default();
    console.log(r);
    let trackedArray = new TrackedArray();
    trackedArray.set_callback(function(arr) {
        console.log("Array changed:", arr);
    });

    let observableElement1 = new ObservableElement({ name: "Alice", age: 30 });
    let observableElement2 = new ObservableElement([1, 2, 3]);

    // 设置元素变化的回调函数
    observableElement1.set_callback(function(newVal) {
        console.log("Element 1 changed to:", newVal);
    });

    observableElement2.set_callback(function(newVal) {
        console.log("Element 2 changed to:", newVal);
    });

    trackedArray.add_element(observableElement1);
    trackedArray.add_element(observableElement2);

    try {
        trackedArray.bulk_update([
            [0, { name: "Bob", age: 25 }],
            [1, [4, 5, 6]]
        ]);
    } catch (e) {
        console.error(e);
    }

    // observableElement1.set_value({ name: "Bob", age: 25 });
    // observableElement2.set_value([4, 5, 6]);

    // let a = r.main();
    window.r = {trackedArray, observableElement1, observableElement2};
}

run();