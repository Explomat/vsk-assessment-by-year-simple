import { constants } from './metaActions';

const metaReducer = (state = {
	competences: [],
	scales: [],
	hasChecked: false,
	ui: {
		isLoading: true
	}
}, action) => {
	switch(action.type) {
		case constants.DP_META_FETCH_COMPETENCES_AND_THEMES_SUCCESS: {
			return {
				...state,
				...action.payload
			}
		}

		case constants.DP_META_CHECKED: {
			const { id, isChecked } = action.payload;

			let i = 0;
			const comps = state.competences.map(c => {
				if (c.checked) {
					i++;
				}

				if (i > 1) {
					return c;
				}

				if (c.id === id) {
					return {
						...c,
						checked: isChecked
					}
				}
				return c;
			});
			
			return {
				...state,
				competences: [ ...comps ],
				hasChecked: i > 0
			}
		}

		case constants.DP_META_LOADING: {
			return {
				...state,
				ui: {
					...state.ui,
					isLoading: action.payload
				}
			}
		}

		default: return state;
	}
}

export default metaReducer;