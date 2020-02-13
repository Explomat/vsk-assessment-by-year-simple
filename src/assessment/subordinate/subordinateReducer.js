import { constants } from './subordinateActions';

const uiReducer = (state = {}, action) => {
	switch(action.type){
		case constants.SUBORDINATE_SET_LOADING: {
			return {
				...state,
				isLoading: action.payload
			}
		}

		case constants.SUBORDINATE_TOGGLE_PA: {
			const newState = {
				...state,
				pas: {
					...state.pas,
					[action.payload]: !state.pas[action.payload]
				}
			}
			return newState;
		}
		default: return state;
	}
}

const pasReducer = (state = {}, action) => {
	switch(action.type){
		case constants.SUBORDINATE_UPDATE_PA: {
			return {
				...state,
				[action.payload.paId]: {
					...state[action.payload.paId],
					overall: action.payload.paOverall
				}
			}
		}

		default: return state;
	}
}

const competencesReducer = (state = {}, action) => {
	switch(action.type){
		/*case constants.SUBORDINATE_UPDATE_PA: {
			return {
				...state,
				[action.payload.competenceId]: {
					...state[action.payload.competenceId],
					mark_text: action.payload.markText,
					mark_value: action.payload.markValue
				}
			}
		}*/

		case constants.SUBORDINATE_SET_MARK: {
			return {
				...state,
				[action.payload.competenceId]: {
					...state[action.payload.competenceId],
					mark_text: action.payload.markText,
					mark_value: action.payload.markValue
				}
			}
		}

		case constants.SUBORDINATE_SET_COMMENT: {
			const newState = {
				...state,
				[action.payload.competenceId]: {
					...state[action.payload.competenceId],
					comment: action.payload.comment
				}
			};

			return newState;
		}

		default: return state;
	}
}

const indicatorsReducer = (state = {}, action) => {
	switch(action.type){
		case constants.SUBORDINATE_SET_MARK: {
			return {
				...state,
				[action.payload.indicatorId]: {
					...state[action.payload.indicatorId],
					mark_text: action.payload.markText,
					mark_value: action.payload.markValue
				}
			}
		}

		case constants.SUBORDINATE_SET_COMMENT: {
			return {
				...state,
				[action.payload.indicatorId]: {
					...state[action.payload.indicatorId],
					comment: action.payload.comment
				}
			}
		}

		default: return state;
	}
}

const subordinateReducer = (state = {
	commonIndicators: {},
	commonCompetences: {},
	rules: {},
	indicators: {},
	competences: {},
	pas: {},
	result: {
		user: {
			subordinates: [],
			assessment: {
				pas: []
			}
		},
		rules: [],
		commonCompetences: []
	},
	ui: {
		isLoading: true,
		pas: {}
	}
}, action) => {
	switch(action.type){
		case constants.SUBORDINATE_GET_INITIAL_DATA_SUCCESS: {
			const newState = {
				...state,
				...action.payload
			}
			return newState;
		}

		case constants.SUBORDINATE_TOGGLE_PA:
		case constants.SUBORDINATE_SET_LOADING:{
			return {
				...state,
				ui: uiReducer(state.ui, action)
			}
		}

		case constants.SUBORDINATE_UPDATE_PA:
		case constants.SUBORDINATE_SET_COMMENT:
		case constants.SUBORDINATE_SET_MARK: {
			return {
				...state,
				/*indicators: indicatorsReducer(state.indicators, action),*/
				competences: competencesReducer(state.competences, action),
				pas: pasReducer(state.pas, action)
			}
		}

		default: return state;
	}
}

export default subordinateReducer;