import { constants } from './dpActions';
import { combineReducers } from 'redux';

const tasksReducer = (state = [], action) => {
	switch(action.type) {
		case constants.ADD_TASK_SUCCESS: {
			return state.concat(action.payload);
		}
		
		case constants.REMOVE_TASK_SUCCESS: {
			const id = action.payload.task_id;
			return state.filter(t => t.id !== id);
		}

		case constants.EDIT_TASK_SUCCESS: {
			const id = action.payload.id;
			return state.map(t => {
				if (t.id === id){
					return action.payload;
				}
				return t;
			});
		}
		default: return state;
	}
}

const cardReducer = (state = {
	person_id: '',
	person_fullname: '',
	person_position_name: '',
	development_plan_id: '',
	create_date: '',
	main_step_id: '',
	main_step_name: '',
	state_id: '',
	state_name: '',
	managers: [],
	main_steps: [],
	//tasks: [], themes: []
	competences: [],
	main_flows: [],
	meta: {
		allow_add_tasks: true,
		allow_add_themes: true
	}
}, action) => {
	switch(action.type) {
		case constants.FETCH_DP_SUCCESS: {
			return {
				...state,
				...action.payload.card,
				meta: action.payload.meta
			}
		}

		case constants.ADD_TASK_SUCCESS:
		case constants.REMOVE_TASK_SUCCESS:
		case constants.EDIT_TASK_SUCCESS: {
			const { payload } = action;
			const compIndex = state.competences.findIndex(c => c.id === payload.competence_id);

			if (compIndex !== -1) {
				const comp = { ...state.competences[compIndex] };
				comp.tasks = tasksReducer(comp.tasks, action);
				state.competences.splice(compIndex, 1, comp);

				return {
					...state,
					competences: [...state.competences]
				}
			}
			return state;
		}

		default: return state;
	}
}

const listReducer = (state = [], action) => {
	switch(action.type) {
		case constants.FETCH_USER_DPS_SUCCESS: {
			return [
				...action.payload
			]
		}

		default: return state;
	}
}

const uiRducer = (state = {
	isLoading: true
}, action) => {
	switch(action.type) {

		case constants.LOADING_DP: {
			return {
				...state.ui,
				isLoading: action.payload
			}
		}

		default: return state;
	}
}

const dpReducer = combineReducers({
	card: cardReducer,
	list: listReducer,
	ui: uiRducer
});


export default dpReducer;