import { constants } from './managerActions';

const managerReducer = (state = {
	list: [],
	meta: {}
}, action) => {
	switch(action.type) {
		case constants.FETCH_USERS_BY_MANAGER_DPS_SUCCESS: {
			return {
				...action.payload
			}
		}

		default: return state;
	}
}

export default managerReducer;