import { combineReducers } from 'redux';
import { profileReducer } from './profile';
import metaReducer from './profile/meta/metaReducer';
import subordinatesReducer from './profile/subordinates/subordinatesReducer';
import { subordinateReducer } from './subordinate';
//import { stepsReducer } from './steps';
import { constants as appConstants } from './appActions';
//import { uiSteps } from './config/steps';

const ui = (state = {
	isLoading: false,
	error: null
}, action) => {
	switch(action.type) {
		case appConstants.LOADING: {
			return {
				...state,
				isLoading: action.payload
			}
		}

		case appConstants.ERROR: {
			return {
				...state,
				error: action.payload
			}
		}
		default: return state;
	}
}

/*const step = (state = uiSteps.first, action) => {
	switch(action.type) {
		case appConstants.GET_STEP_SUCCESS: {
			return action.step;
		}
		default: return state;
	}
}*/

const message = (state = null, action) => {
	if (action.type === 'SET_MESSAGE') {
		return action.message;
	}
	return state;
}

const assessmentReducer = combineReducers({
	ui,
	//step,
	message,
	profile: profileReducer,
	meta: metaReducer,
	subordinates: subordinatesReducer,
	subordinate: subordinateReducer
	//steps: stepsReducer
});

export default assessmentReducer;