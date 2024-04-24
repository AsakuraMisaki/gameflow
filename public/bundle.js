(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SvelteBuiltIn = {}));
})(this, (function (exports) { 'use strict';

	/** @returns {void} */
	function noop() {}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} target
	 * @param {string} style_sheet_id
	 * @param {string} styles
	 * @returns {void}
	 */
	function append_styles(target, style_sheet_id, styles) {
		const append_styles_to = get_root_for_style(target);
		if (!append_styles_to.getElementById(style_sheet_id)) {
			const style = element('style');
			style.id = style_sheet_id;
			style.textContent = styles;
			append_stylesheet(append_styles_to, style);
		}
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data(text, data) {
		data = '' + data;
		if (text.data === data) return;
		text.data = /** @type {string} */ (data);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, important ? 'important' : '');
		}
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	const PUBLIC_VERSION = '4';

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src\base\Sprite.svelte generated by Svelte v4.2.15 */

	function create_fragment$4(ctx) {
		let u_sprite;
		let t;
		let mounted;
		let dispose;

		return {
			c() {
				u_sprite = element("u_sprite");
				t = text(/*text*/ ctx[12]);
				set_style(u_sprite, "display", /*display*/ ctx[1]);
				set_style(u_sprite, "margin-top", /*marginTop*/ ctx[2] + "px");
				set_style(u_sprite, "margin-left", /*marginLeft*/ ctx[3] + "px");
				set_style(u_sprite, "margin-bottom", /*marginBottom*/ ctx[4] + "px");
				set_style(u_sprite, "margin-right", /*marginRight*/ ctx[5] + "px");
				set_style(u_sprite, "position", /*position*/ ctx[13]);
				set_style(u_sprite, "left", /*left*/ ctx[6] + "px");
				set_style(u_sprite, "top", /*top*/ ctx[7] + "px");
				set_style(u_sprite, "bottom", /*bottom*/ ctx[8] + "px");
				set_style(u_sprite, "right", /*right*/ ctx[9] + "px");
				set_style(u_sprite, "opacity", /*opacity*/ ctx[10]);
				set_style(u_sprite, "visibility", /*visibility*/ ctx[11]);
			},
			m(target, anchor) {
				insert(target, u_sprite, anchor);
				append(u_sprite, t);
				/*u_sprite_binding*/ ctx[16](u_sprite);

				if (!mounted) {
					dispose = listen(u_sprite, "mount", function () {
						if (is_function(/*create*/ ctx[14])) /*create*/ ctx[14].apply(this, arguments);
					});

					mounted = true;
				}
			},
			p(new_ctx, [dirty]) {
				ctx = new_ctx;
				if (dirty & /*text*/ 4096) set_data(t, /*text*/ ctx[12]);

				if (dirty & /*display*/ 2) {
					set_style(u_sprite, "display", /*display*/ ctx[1]);
				}

				if (dirty & /*marginTop*/ 4) {
					set_style(u_sprite, "margin-top", /*marginTop*/ ctx[2] + "px");
				}

				if (dirty & /*marginLeft*/ 8) {
					set_style(u_sprite, "margin-left", /*marginLeft*/ ctx[3] + "px");
				}

				if (dirty & /*marginBottom*/ 16) {
					set_style(u_sprite, "margin-bottom", /*marginBottom*/ ctx[4] + "px");
				}

				if (dirty & /*marginRight*/ 32) {
					set_style(u_sprite, "margin-right", /*marginRight*/ ctx[5] + "px");
				}

				if (dirty & /*position*/ 8192) {
					set_style(u_sprite, "position", /*position*/ ctx[13]);
				}

				if (dirty & /*left*/ 64) {
					set_style(u_sprite, "left", /*left*/ ctx[6] + "px");
				}

				if (dirty & /*top*/ 128) {
					set_style(u_sprite, "top", /*top*/ ctx[7] + "px");
				}

				if (dirty & /*bottom*/ 256) {
					set_style(u_sprite, "bottom", /*bottom*/ ctx[8] + "px");
				}

				if (dirty & /*right*/ 512) {
					set_style(u_sprite, "right", /*right*/ ctx[9] + "px");
				}

				if (dirty & /*opacity*/ 1024) {
					set_style(u_sprite, "opacity", /*opacity*/ ctx[10]);
				}

				if (dirty & /*visibility*/ 2048) {
					set_style(u_sprite, "visibility", /*visibility*/ ctx[11]);
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(u_sprite);
				}

				/*u_sprite_binding*/ ctx[16](null);
				mounted = false;
				dispose();
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { display = "" } = $$props;
		let { marginTop = 0 } = $$props;
		let { marginLeft = 0 } = $$props;
		let { marginBottom = 0 } = $$props;
		let { marginRight = 0 } = $$props;
		let { left = 0 } = $$props;
		let { top = 0 } = $$props;
		let { bottom = 0 } = $$props;
		let { right = 0 } = $$props;
		let { opacity = 255 } = $$props;
		let { visibility = "visible" } = $$props;
		let { text = "" } = $$props;
		let { position = "relative" } = $$props;
		let { _self = null } = $$props;

		let { self = function () {
			return _self;
		} } = $$props;

		let { create = function () {
			console.log(this);
		} } = $$props;

		onMount(() => {
			create();
		});

		function u_sprite_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				self = $$value;
				$$invalidate(0, self);
			});
		}

		$$self.$$set = $$props => {
			if ('display' in $$props) $$invalidate(1, display = $$props.display);
			if ('marginTop' in $$props) $$invalidate(2, marginTop = $$props.marginTop);
			if ('marginLeft' in $$props) $$invalidate(3, marginLeft = $$props.marginLeft);
			if ('marginBottom' in $$props) $$invalidate(4, marginBottom = $$props.marginBottom);
			if ('marginRight' in $$props) $$invalidate(5, marginRight = $$props.marginRight);
			if ('left' in $$props) $$invalidate(6, left = $$props.left);
			if ('top' in $$props) $$invalidate(7, top = $$props.top);
			if ('bottom' in $$props) $$invalidate(8, bottom = $$props.bottom);
			if ('right' in $$props) $$invalidate(9, right = $$props.right);
			if ('opacity' in $$props) $$invalidate(10, opacity = $$props.opacity);
			if ('visibility' in $$props) $$invalidate(11, visibility = $$props.visibility);
			if ('text' in $$props) $$invalidate(12, text = $$props.text);
			if ('position' in $$props) $$invalidate(13, position = $$props.position);
			if ('_self' in $$props) $$invalidate(15, _self = $$props._self);
			if ('self' in $$props) $$invalidate(0, self = $$props.self);
			if ('create' in $$props) $$invalidate(14, create = $$props.create);
		};

		return [
			self,
			display,
			marginTop,
			marginLeft,
			marginBottom,
			marginRight,
			left,
			top,
			bottom,
			right,
			opacity,
			visibility,
			text,
			position,
			create,
			_self,
			u_sprite_binding
		];
	}

	class Sprite extends SvelteComponent {
		constructor(options) {
			super();

			init(this, options, instance$3, create_fragment$4, safe_not_equal, {
				display: 1,
				marginTop: 2,
				marginLeft: 3,
				marginBottom: 4,
				marginRight: 5,
				left: 6,
				top: 7,
				bottom: 8,
				right: 9,
				opacity: 10,
				visibility: 11,
				text: 12,
				position: 13,
				_self: 15,
				self: 0,
				create: 14
			});
		}
	}

	/* src\base\Graphics.svelte generated by Svelte v4.2.15 */

	function add_css$2(target) {
		append_styles(target, "svelte-vr3tyx", ".custom.svelte-vr3tyx{background-color:bgColor ;color:textColor }");
	}

	function create_fragment$3(ctx) {
		let div;

		return {
			c() {
				div = element("div");
				div.textContent = "This div has custom background and text color.";
				attr(div, "class", "custom svelte-vr3tyx");
			},
			m(target, anchor) {
				insert(target, div, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	class Graphics extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, null, create_fragment$3, safe_not_equal, {}, add_css$2);
		}
	}

	/* src\base\Icon.svelte generated by Svelte v4.2.15 */

	function add_css$1(target) {
		append_styles(target, "svelte-1cvgtq7", "ul.svelte-1cvgtq7{margin:80px}");
	}

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[3] = list[i];
		child_ctx[5] = i;
		return child_ctx;
	}

	// (14:2) {#each items as item, index}
	function create_each_block$2(ctx) {
		let li;
		let t0_value = /*item*/ ctx[3] + "";
		let t0;
		let t1;
		let button;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[2](/*index*/ ctx[5]);
		}

		return {
			c() {
				li = element("li");
				t0 = text(t0_value);
				t1 = space();
				button = element("button");
				button.textContent = "Remove";
			},
			m(target, anchor) {
				insert(target, li, anchor);
				append(li, t0);
				append(li, t1);
				append(li, button);

				if (!mounted) {
					dispose = listen(button, "click", click_handler);
					mounted = true;
				}
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[3] + "")) set_data(t0, t0_value);
			},
			d(detaching) {
				if (detaching) {
					detach(li);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function create_fragment$2(ctx) {
		let h2;
		let t1;
		let ul;
		let each_value = ensure_array_like(/*items*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		return {
			c() {
				h2 = element("h2");
				h2.textContent = "Backpack";
				t1 = space();
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(ul, "class", "svelte-1cvgtq7");
			},
			m(target, anchor) {
				insert(target, h2, anchor);
				insert(target, t1, anchor);
				insert(target, ul, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*removeItem, items*/ 3) {
					each_value = ensure_array_like(/*items*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(h2);
					detach(t1);
					detach(ul);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { items = [] } = $$props;

		// 删除物品
		function removeItem(index) {
			$$invalidate(0, items = items.filter((_, i) => i !== index));
		}

		const click_handler = index => removeItem(index);

		$$self.$$set = $$props => {
			if ('items' in $$props) $$invalidate(0, items = $$props.items);
		};

		return [items, removeItem, click_handler];
	}

	class Icon extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$2, create_fragment$2, safe_not_equal, { items: 0 }, add_css$1);
		}
	}

	/* src\base\Text.svelte generated by Svelte v4.2.15 */

	function add_css(target) {
		append_styles(target, "svelte-1cvgtq7", "ul.svelte-1cvgtq7{margin:80px}");
	}

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[3] = list[i];
		child_ctx[5] = i;
		return child_ctx;
	}

	// (14:2) {#each items as item, index}
	function create_each_block$1(ctx) {
		let li;
		let t0_value = /*item*/ ctx[3] + "";
		let t0;
		let t1;
		let button;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[2](/*index*/ ctx[5]);
		}

		return {
			c() {
				li = element("li");
				t0 = text(t0_value);
				t1 = space();
				button = element("button");
				button.textContent = "Remove";
			},
			m(target, anchor) {
				insert(target, li, anchor);
				append(li, t0);
				append(li, t1);
				append(li, button);

				if (!mounted) {
					dispose = listen(button, "click", click_handler);
					mounted = true;
				}
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[3] + "")) set_data(t0, t0_value);
			},
			d(detaching) {
				if (detaching) {
					detach(li);
				}

				mounted = false;
				dispose();
			}
		};
	}

	function create_fragment$1(ctx) {
		let h2;
		let t1;
		let ul;
		let each_value = ensure_array_like(/*items*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		return {
			c() {
				h2 = element("h2");
				h2.textContent = "Backpack";
				t1 = space();
				ul = element("ul");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr(ul, "class", "svelte-1cvgtq7");
			},
			m(target, anchor) {
				insert(target, h2, anchor);
				insert(target, t1, anchor);
				insert(target, ul, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(ul, null);
					}
				}
			},
			p(ctx, [dirty]) {
				if (dirty & /*removeItem, items*/ 3) {
					each_value = ensure_array_like(/*items*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(ul, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}
			},
			i: noop,
			o: noop,
			d(detaching) {
				if (detaching) {
					detach(h2);
					detach(t1);
					detach(ul);
				}

				destroy_each(each_blocks, detaching);
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { items = [] } = $$props;

		// 删除物品
		function removeItem(index) {
			$$invalidate(0, items = items.filter((_, i) => i !== index));
		}

		const click_handler = index => removeItem(index);

		$$self.$$set = $$props => {
			if ('items' in $$props) $$invalidate(0, items = $$props.items);
		};

		return [items, removeItem, click_handler];
	}

	class Text extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance$1, create_fragment$1, safe_not_equal, { items: 0 }, add_css);
		}
	}

	/* src\template\Backpack.svelte generated by Svelte v4.2.15 */

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[14] = list[i];
		child_ctx[15] = list;
		child_ctx[16] = i;
		return child_ctx;
	}

	// (62:4) {#if item.name }
	function create_if_block(ctx) {
		let sprite;
		let each_value = /*each_value*/ ctx[15];
		let index = /*index*/ ctx[16];
		let current;

		function func() {
			return /*func*/ ctx[7](/*item*/ ctx[14]);
		}

		const assign_sprite = () => /*sprite_binding_1*/ ctx[8](sprite, each_value, index);
		const unassign_sprite = () => /*sprite_binding_1*/ ctx[8](null, each_value, index);

		let sprite_props = {
			text: /*item*/ ctx[14].name,
			create: func
		};

		sprite = new Sprite({ props: sprite_props });
		assign_sprite();

		return {
			c() {
				create_component(sprite.$$.fragment);
			},
			m(target, anchor) {
				mount_component(sprite, target, anchor);
				current = true;
			},
			p(new_ctx, dirty) {
				ctx = new_ctx;

				if (each_value !== /*each_value*/ ctx[15] || index !== /*index*/ ctx[16]) {
					unassign_sprite();
					each_value = /*each_value*/ ctx[15];
					index = /*index*/ ctx[16];
					assign_sprite();
				}

				const sprite_changes = {};
				if (dirty & /*items*/ 8) sprite_changes.text = /*item*/ ctx[14].name;
				if (dirty & /*items*/ 8) sprite_changes.create = func;
				sprite.$set(sprite_changes);
			},
			i(local) {
				if (current) return;
				transition_in(sprite.$$.fragment, local);
				current = true;
			},
			o(local) {
				transition_out(sprite.$$.fragment, local);
				current = false;
			},
			d(detaching) {
				unassign_sprite();
				destroy_component(sprite, detaching);
			}
		};
	}

	// (61:2) {#each items as item, index}
	function create_each_block(ctx) {
		let if_block_anchor;
		let current;
		let if_block = /*item*/ ctx[14].name && create_if_block(ctx);

		return {
			c() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			m(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
				current = true;
			},
			p(ctx, dirty) {
				if (/*item*/ ctx[14].name) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*items*/ 8) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o(local) {
				transition_out(if_block);
				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};
	}

	function create_fragment(ctx) {
		let u_backpack;
		let sprite;
		let t0;
		let t1;
		let button;
		let current;
		let mounted;
		let dispose;

		let sprite_props = {
			left: /*totalWidth*/ ctx[2],
			text: "S",
			top: "50"
		};

		sprite = new Sprite({ props: sprite_props });
		/*sprite_binding*/ ctx[6](sprite);
		let each_value = ensure_array_like(/*items*/ ctx[3]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		return {
			c() {
				u_backpack = element("u_backpack");
				create_component(sprite.$$.fragment);
				t0 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t1 = space();
				button = element("button");
				button.textContent = "tttttt";
			},
			m(target, anchor) {
				insert(target, u_backpack, anchor);
				mount_component(sprite, u_backpack, null);
				append(u_backpack, t0);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(u_backpack, null);
					}
				}

				append(u_backpack, t1);
				append(u_backpack, button);
				/*u_backpack_binding*/ ctx[9](u_backpack);
				current = true;

				if (!mounted) {
					dispose = listen(button, "click", /*selectTest*/ ctx[4]);
					mounted = true;
				}
			},
			p(ctx, [dirty]) {
				const sprite_changes = {};
				if (dirty & /*totalWidth*/ 4) sprite_changes.left = /*totalWidth*/ ctx[2];
				sprite.$set(sprite_changes);

				if (dirty & /*items, spriteRef*/ 40) {
					each_value = ensure_array_like(/*items*/ ctx[3]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(u_backpack, t1);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i(local) {
				if (current) return;
				transition_in(sprite.$$.fragment, local);

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o(local) {
				transition_out(sprite.$$.fragment, local);
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d(detaching) {
				if (detaching) {
					detach(u_backpack);
				}

				/*sprite_binding*/ ctx[6](null);
				destroy_component(sprite);
				destroy_each(each_blocks, detaching);
				/*u_backpack_binding*/ ctx[9](null);
				mounted = false;
				dispose();
			}
		};
	}

	function instance($$self, $$props, $$invalidate) {
		let top;
		let selector;
		let totalWidth = 0;
		let mapping = new Map();

		//单元测试 (UI数据独立测试)
		let items = [{ name: undefined }, { name: 'unit test' }, { name: 'unit test1111111' }];

		let select = null;
		let count = -1;

		let selectTest = function () {
			console.log(mapping);
			count++;

			if (count >= items.length) {
				count = 0;
			}

			select = items[count];

			if (select.sprite) {
				$$invalidate(2, totalWidth = select.sprite.$$.ctx[14]().offsetLeft);
			}
		};

		// $: (window.$gamePlayer ? window.$gamePlayer.svelteAlert = select : null);
		let spriteRef = (item, sprite) => {
			mapping.set(item, item.sprite);
			delete item.sprite;
		};

		function sprite_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				selector = $$value;
				$$invalidate(1, selector);
			});
		}

		const func = item => {
			spriteRef(item);
		};

		function sprite_binding_1($$value, each_value, index) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				each_value[index].sprite = $$value;
				$$invalidate(3, items);
			});
		}

		function u_backpack_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				top = $$value;
				$$invalidate(0, top);
			});
		}

		return [
			top,
			selector,
			totalWidth,
			items,
			selectTest,
			spriteRef,
			sprite_binding,
			func,
			sprite_binding_1,
			u_backpack_binding
		];
	}

	class Backpack extends SvelteComponent {
		constructor(options) {
			super();
			init(this, options, instance, create_fragment, safe_not_equal, {});
		}
	}

	exports.Backpack = Backpack;
	exports.Graphics = Graphics;
	exports.Icon = Icon;
	exports.Sprite = Sprite;
	exports.Text = Text;

}));
