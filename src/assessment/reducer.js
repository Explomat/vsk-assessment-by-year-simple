import { combineReducers } from 'redux';
import { profileReducer } from './profile';
import { subordinateReducer } from './subordinate';
import { stepsReducer } from './steps';
import { constants as appConstants } from './appActions';
import { uiSteps } from './config/steps';

const ui = (state = {
	isLoading: false,
	error: null
}, action) => {
	switch(action.type) {
		case appConstants.INITIAL_LOADING: {
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

const step = (state = uiSteps.first, action) => {
	switch(action.type) {
		case appConstants.GET_STEP_SUCCESS: {
			return action.step;
		}
		default: return state;
	}
}

const message = (state = null, action) => {
	if (action.type === 'SET_MESSAGE') {
		return action.message;
	}
	return state;
}

const assessmentReducer = combineReducers({
	ui,
	step,
	message,
	profile: profileReducer,
	subordinate: subordinateReducer,
	steps: stepsReducer
});

export default assessmentReducer;