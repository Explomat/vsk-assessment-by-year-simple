import { constants } from './metaActions';

const metaReducer = (state = {
	hasChecked: false,
	selectedNode: null,
	parentNode: null,
	hasPa: false,
	channels: [],
	is_train: false,
	channel_id: null,
	position_level_id: null
}, action) => {
	switch(action.type){
		case constants.META_GET_SUCCESS: {
			return {
				...state,
				...action.payload
			}
		}

		case constants.META_CHECKED: {
			const { id, isChecked } = action.payload;

			let node = null;
			let parentNode = null;
			const items = state.channels;
			const queue = [];

			for (var i = 0; i < items.length; i++) {
				queue.push(items[i]);
			}

			while (queue.length > 0) {
				var tempNode = queue.shift();
				tempNode.checked = false;

				if (tempNode.id == id) {
					node = tempNode;
				}

				for (var j = 0; j < tempNode.children.length; j++) {
					var ch = tempNode.children[j];
					ch.checked = false;

					if (ch.id == id) {
						node = ch;
						parentNode = tempNode;
					}
					queue.push(ch);
				}
			}

			if (node != null) {
				node.checked = isChecked;
			}

			return {
				...state,
				channels: items,
				hasChecked: isChecked,
				selectedNode: node,
				parentNode: parentNode
			}
		}

		default: return state;
	}
}

export default metaReducer;