import { constants } from './metaActions';

const themeReducer = (state = [], action) => {
	switch(action.type) {
		case constants.DP_META_THEME_CHECKED: {
			const { theme_id, isChecked, maxCountThemesForSelected } = action.payload;
			const themes = state.map(c => {
				if (c.id === theme_id) {
					return {
						...c,
						checked: isChecked
					}
				}
				return c;
			});

			const countChecked = themes.filter(c => c.checked).length;
			const result = countChecked > maxCountThemesForSelected ? state : themes;
			
			return [ ...result ];
		}

		default: return state;
	}
}

const metaReducer = (state = {
	competences: [
		{
			competence_themes: []
		}
	],
	scales: [],
	hasChecked: false,
	hasThemesChecked: false,
	maxCountCompetencesForSelected: 2,
	maxCountThemesForSelected: 3,
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

		case constants.DP_META_COMPETENCE_CHECKED: {
			const { competence_id, isChecked } = action.payload;
			const comps = state.competences.map(c => {
				if (c.id === competence_id) {
					return {
						...c,
						checked: isChecked
					}
				}
				return c;
			});

			const countChecked = comps.filter(c => c.checked).length;
			const result = countChecked > state.maxCountCompetencesForSelected ? state.competences : comps;
			
			return {
				...state,
				competences: [ ...result ],
				hasChecked: countChecked > 0
			}
		}

		case constants.DP_META_THEME_CHECKED: {
			const { payload } = action;

			const otherComps = state.competences.filter(c => c.id !== payload.competence_id);
			const comp = state.competences.find(c => c.id === payload.competence_id);

			if (comp) {
				comp.competence_themes = themeReducer(comp.competence_themes, {
					...action,
					payload: {
						...action.payload,
						maxCountThemesForSelected: state.maxCountThemesForSelected
					}
				});
				return {
					...state,
					competences: [...otherComps, comp],
					hasThemesChecked: comp.competence_themes.filter(c => c.checked).length > 0
				}
			}
			return state;
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