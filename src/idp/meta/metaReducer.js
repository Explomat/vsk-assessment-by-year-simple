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
			themes: []
		}
	],
	selected_items: [],
	scales: [],
	task_types: [],
	hasChecked: false,
	hasThemesChecked: false,
	ui: {
		isLoading: true,
		currentStep: 1,
		stepsCount: 2,
		maxCountCompetencesForSelected: 2,
		maxCountThemesForSelected: 2
	}
}, action) => {
	switch(action.type) {
		case constants.DP_META_RESET_STATE: {
			return {
				...state,
				hasChecked: false,
				hasThemesChecked: false,
				selected_items: [],
				ui: {
					...state.ui,
					currentStep: 1
				}
			}
		}

		case constants.DP_META_FETCH_COMPETENCES_AND_THEMES_SUCCESS: {
			const { competences, selected_items } = action.payload;
			let hasChecked = false;
			let hasThemesChecked = false;

			const ncompetences = competences.map(c => {
				const selectedComp = selected_items.find(sc => sc.competence_id === c.id);
				if (selectedComp) {
					hasChecked = true;
					const newComp = { ...c, checked: true };
					const nthemes = newComp.themes.map(ct => {
						const selectedTheme = selected_items.find(sc => (sc.theme_id === ct.id && sc.competence_id === newComp.id));
						if (selectedTheme) {
							hasThemesChecked = true;
						}

						return {
							...ct,
							checked: !!selectedTheme
						}
					});
					newComp.themes = nthemes;

					return newComp;
				}

				return c;
			});

			return {
				...state,
				...action.payload,
				competences: ncompetences,
				hasChecked,
				hasThemesChecked
			}
		}

		case constants.DP_META_DELETE_TASK: {
			const { competence_id, task_id } = action.payload;

			const comp = state.competences.find(c => c.id === competence_id);

			if (comp) {
				if (!comp.tasks) {
					comp.tasks = [];
				}

				comp.tasks = comp.tasks.filter(t => t.id !== task_id);
			}

			return {
				...state,
				competences: [ ...state.competences ]
			}
		}

		case constants.DP_META_SAVE_TASK: {
			const { competence_id, task } = action.payload;
			const comp = state.competences.find(c => c.id === competence_id);

			if (comp) {
				if (!comp.tasks) {
					comp.tasks = [];
				}

				comp.tasks = comp.tasks.concat({
					id: comp.tasks.length,
					...task
				});
			}

			/*const comps = state.competences.map(c => {
				if (c.id === competence_id) {
					return {
						...c,
						...task
					}
				}
				return c;
			});*/

			//const countChecked = comps.filter(c => c.checked).length;
			//const result = countChecked > state.maxCountCompetencesForSelected ? state.competences : comps;
			
			return {
				...state,
				competences: [ ...state.competences ]
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
			const result = countChecked > state.ui.maxCountCompetencesForSelected ? state.competences : comps;
			
			return {
				...state,
				competences: [ ...result ],
				hasChecked: countChecked > 0
			}
		}

		case constants.DP_META_THEME_CHECKED: {
			const { payload } = action;
			const comp = state.competences.find(c => c.id == payload.competence_id);

			if (comp) {
				comp.themes = themeReducer(comp.themes, {
					...action,
					payload: {
						...action.payload,
						maxCountThemesForSelected: state.ui.maxCountThemesForSelected
					}
				});
				return {
					...state,
					competences: [...state.competences],
					hasThemesChecked: comp.themes.filter(c => c.checked).length > 0
				}
			}
			return state;
		}

		case constants.DP_META_CHANGE_STEP: {
			const { payload } = action;

			return {
				...state,
				ui: {
					...state.ui,
					currentStep: payload
				}
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