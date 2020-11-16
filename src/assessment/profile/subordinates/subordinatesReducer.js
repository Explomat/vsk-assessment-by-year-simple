import { constants } from './subordinatesActions';

const delegateReducer = (state = {}, action) => {
	switch(action.type) {
		case constants.SUBORDINATES_SET_DELEGATE_USER: {
			return {
				...state,
				value: action.payload
			}
		}

		case constants.SUBORDINATES_GET_COLLABORATORS_SUCCESS: {
			return {
				...state,
				results: action.payload
			}
		}

		default: return state;
	}
}


const subordinatesReducer = (state = {
	subordinates: [],
	checkedSubordinates: [],
	delegate: {
		results: [],
		value: null
	},
	meta: {
		search: '',
		min_row: 0,
		max_row: 10,
		pageSize: 10,
		total: 0,
		initialTotal: 0
	}
}, action) => {
	switch(action.type){
		case constants.SUBORDINATES_GET_INITIAL_DATA_SUCCESS: {
			const { subordinates, meta } = action.payload;
			const newState = {
				...state,
				subordinates,
				meta: {
					initialTotal: subordinatesReducer.isInitialLoaded ? state.meta.initialTotal : meta.total,
					...state.meta,
					...meta
				}
			}

			subordinatesReducer.isInitialLoaded = true;
			return newState;
		}

		case constants.SUBORDINATES_TOGGLE_CHECK: {
			const { subordinateId, checked } = action.payload;

			const subs = state.subordinates.map(s => {
				if (s.id == subordinateId) {
					return {
						...s,
						checked: checked
					}
				}
				return s;
			});

			let selectedItems = state.checkedSubordinates;
			if (checked) {
				selectedItems = selectedItems.concat([subordinateId]);
			} else {
				selectedItems = state.checkedSubordinates.filter(s => s != subordinateId)
			}

			return {
				...state,
				subordinates: subs,
				checkedSubordinates: selectedItems
			}
		}

		case constants.SUBORDINATES_CHANGE_SEARCH: {
			return {
				...state,
				meta: {
					...state.meta,
					search: action.payload
				}
			}
		}

		case constants.SUBORDINATES_SET_DELEGATE_USER:
		case constants.SUBORDINATES_GET_COLLABORATORS_SUCCESS: {
			return {
				...state,
				delegate: delegateReducer(state.delegate, action)
			}
		}

		default: return state;
	}
}

subordinatesReducer.isInitialLoaded = false;

export default subordinatesReducer;