(function (root, factory) {
	if (typeof define === 'function' && define.amd) define([], factory); // AMD. Register as an anonymous module.
	else if (typeof module === 'object' && module.exports) module.exports = factory(); // Node. CommonJS-like environments that support module.exports, like Node.
	else factory({ }); // Browser globals (root is window)
}(typeof self !== 'undefined' ? self : this, function (exports = { }) {
	const socket = new WebSocket(`ws://${location.host}`);

    socket.addEventListener('message', (event) => {
		const data = event.data;
		if (/reload\-/i.test(data)) {
			console.warn(data);
			location.reload();
		}
    });

    socket.addEventListener('open', () => {
      console.log('Connected to the server');
    });

    socket.addEventListener('close', () => {
      console.log('Disconnected from the server');
    });
}));