import { constants } from './appActions';
import { combineReducers } from 'redux';
import dpReducer from './dp/dpReducer';
import managerReducer from './manager/managerReducer';
import metaReducer from './meta/metaReducer';

const uiReducer = (state = {
	isLoading: false,
	error: null,
	isIdp: false
}, action) => {
	switch(action.type) {
		case constants.IDP_SET_IDP: {
			return {
				...state,
				isIdp: action.payload
			}
		}

		case constants.IDP_LOADING: {
			const newState = {
				...state,
				isLoading: action.payload
			}

			return newState;
		}

		case constants.IDP_ERROR: {
			return {
				...state,
				error: action.payload
			}
		}

		default: return state;
	}
}

const reducer = combineReducers({
	ui: uiReducer,
	dp: dpReducer,
	meta: metaReducer,
	manager: managerReducer
});

export default reducer;