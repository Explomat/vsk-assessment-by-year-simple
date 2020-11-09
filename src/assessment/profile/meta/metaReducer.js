import { constants } from './metaActions';

const metaReducer = (state = {
	hasPa: false,
	channels: [],
	is_train: false,
	channel_id: null,
	position_level_id: null
}, action) => {
	switch(action.type){
		case constants.META_GET_SUCCESS: {
			const { channels } = action.payload;

			return {
				...state,
				channels
			}
		}

		default: return state;
	}
}

export default metaReducer;