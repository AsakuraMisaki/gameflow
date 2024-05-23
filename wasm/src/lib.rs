use wasm_bindgen::prelude::*;
use web_sys::js_sys::{Function, Array};
use std::cell::RefCell;
use std::rc::Rc;

#[wasm_bindgen]
pub struct ObservableElement {
    value: RefCell<JsValue>,
    callback: RefCell<Option<Function>>,
}

#[wasm_bindgen]
impl ObservableElement {
    #[wasm_bindgen(constructor)]
    pub fn new(value: JsValue) -> ObservableElement {
        ObservableElement {
            value: RefCell::new(value),
            callback: RefCell::new(None),
        }
    }

    #[wasm_bindgen]
    pub fn set_callback(&self, callback: Function) {
        *self.callback.borrow_mut() = Some(callback);
    }

    #[wasm_bindgen]
    pub fn set_value(&self, new_value: JsValue) {
        *self.value.borrow_mut() = new_value.clone();
        if let Some(ref cb) = *self.callback.borrow() {
            cb.call1(&JsValue::NULL, &new_value).unwrap();
        }
    }

    #[wasm_bindgen]
    pub fn get_value(&self) -> JsValue {
        self.value.borrow().clone()
    }
}

#[wasm_bindgen]
pub struct TrackedArray {
    array: RefCell<Vec<Rc<ObservableElement>>>,
    callback: RefCell<Option<Function>>,
    id: i32,
}

#[wasm_bindgen]
impl TrackedArray {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TrackedArray {
        TrackedArray {
            array: RefCell::new(Vec::new()),
            callback: RefCell::new(None),
            id: 0
        }
    }

    #[wasm_bindgen]
    pub fn set_callback(&self, callback: Function) {
        *self.callback.borrow_mut() = Some(callback);
    }

    #[wasm_bindgen]
    pub fn add_element(&self, element: ObservableElement) {
        self.array.borrow_mut().push(Rc::new(element));
        self.notify_callback();
    }

    #[wasm_bindgen]
    pub fn remove_element(&self, index: usize) -> Result<JsValue, JsValue> {
        if index < self.array.borrow().len() {
            self.array.borrow_mut().remove(index);
            self.notify_callback();
            Ok(JsValue::from(index))
        } else {
            Err(JsValue::from_str("Index out of bounds"))
        }
    }

    #[wasm_bindgen]
    pub fn get_array(&self) -> Array {
        let array = Array::new();
        for element in self.array.borrow().iter() {
            array.push(&element.get_value());
        }
        array
    }

    #[wasm_bindgen]
    pub fn bulk_update(&self, updates: Array) {
        let mut array = self.array.borrow_mut();
        for update in updates.iter() {
            let update_tuple: Array = update.into();
            let index = update_tuple.get(0).as_f64().unwrap() as usize;
            let new_value = update_tuple.get(1);
            if let Some(element) = array.get(index) {
                element.set_value(new_value);
            }
        }
        self.notify_callback();
    }

    fn notify_callback(&self) {
        if let Some(ref cb) = *self.callback.borrow() {
            let array = self.get_array();
            cb.call1(&JsValue::NULL, &array).unwrap();
        }
    }
}
