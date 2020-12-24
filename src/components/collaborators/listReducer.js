import { constants } from './listActions';

const listReducer = (state = {
	list: [],
	selectedItems: [],
	meta: {
		search: '',
		total: 0,
		page: 1,
		pageSize: 10
	},
	ui: {
		isLoading: false,
		multiple: true
	}
}, action) => {
	switch(action.type) {

		case constants.COMPONENT_COLLABORATOR_LIST_FETCH_SUCCESS: {
			return {
				...state,
				list: action.payload.collaborators,
				meta: {
					...state.meta,
					...action.payload.meta
				}  
			}
		}

		case constants.COMPONENT_COLLABORATOR_LIST_SELECT_ITEM: {
			const { checked, item } = action.payload;

			if (!state.ui.multiple && state.selectedItems.length > 0 && checked) {
				return {
					...state
				}
			}

			const items = state.list.map(s => {
				if (s.id === item.id){
					return {
						...s,
						checked: checked
					}
				}
				return s;
			});

			if (checked){
				return {
					...state,
					list: items,
					selectedItems: state.selectedItems.concat(item)
				}
			}

			return {
				...state,
				list: items,
				selectedItems: state.selectedItems.filter(s => s.id !== item.id)
			}
		}

		case constants.COMPONENT_COLLABORATOR_LIST_RESET_SELECTED: {
			return {
				...state,
				list: state.list.map(s => {
					return {
						...s,
						checked: false
					}
				}),
				selectedItems: []
			}
		}

		case constants.COMPONENT_COLLABORATOR_LIST_SET_SEARCH: {
			return {
				...state,
				meta: {
					...state.meta,
					search: action.payload
				}
			}
		}

		case constants.COMPONENT_COLLABORATOR_LIST_LOADING: {
			return {
				...state,
				ui: {
					...state.ui,
					isLoading: action.payload
				}
			};
		}

		case constants.COMPONENT_COLLABORATOR_LIST_SET_PARAMS: {
			return {
				...state,
				selectedItems: [],
				ui: {
					...state.ui,
					...action.payload
				}
			}
		}

		default: return state;
	}
}

export default listReducer;