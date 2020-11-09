import { constants } from './stepsActions';
import { combineReducers } from 'redux';

function instruction(state = '', action) {
	switch(action.type){
		case constants.STEPS_GET_INSTRUCTION_SUCCESS: {
			return action.payload;
		}
		default: return state;
	}
}

function ui(state = {
	isLoading: false
}, action) {
	switch(action.type) {
		case constants.STEPS_SET_LOADING: {
			return {
				...state,
				isLoading: action.payload
			}
		}

		default: return state;
	}
}

function step(state = 0, action){
	if (action.type === constants.STEPS_SET_STEP){
		return action.payload;
	}
	return state;
}

function status(state = '', action){
	if (action.type === constants.STEPS_SET_STATUS){
		return action.payload
	}
	return state;
}

function manager(state = {
	results: [],
	value: null
}, action){

	switch(action.type){
		case constants.STEPS_SET_MANAGER: {
			return {
				...state,
				value: action.payload
			}
		}
		case constants.STEPS_GET_COLLABORATORS_SUCCESS: {
			return {
				...state,
				results: action.payload
			}
		}

		default: return state;
	}
}

export default combineReducers({
	instruction,
	ui,
	step,
	status,
	manager
});
