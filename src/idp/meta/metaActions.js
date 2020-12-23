import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'DP_META_FETCH_COMPETENCES_AND_THEMES'
	]),
	'DP_META_LOADING': 'DP_META_LOADING',
	'DP_META_COMPETENCE_CHECKED': 'DP_META_COMPETENCE_CHECKED',
	'DP_META_THEME_CHECKED': 'DP_META_THEME_CHECKED'
};

export function onCompetenceChecked(isChecked, competence_id) {
	return {
		type: constants.DP_META_COMPETENCE_CHECKED,
		payload: {
			competence_id,
			isChecked
		}
	}
}

export function onThemeChecked(isChecked, competence_id, theme_id) {
	return {
		type: constants.DP_META_THEME_CHECKED,
		payload: {
			competence_id,
			theme_id,
			isChecked
		}
	}
}

export function loading(isLoading){
	return {
		type: constants.DP_META_LOADING,
		payload: isLoading
	}
};

export function getMeta(id){
	return dispatch => {
		dispatch(loading(true));
		request('idp', 'Meta')
			.get({
				assessment_appraise_id: id
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.DP_META_FETCH_COMPETENCES_AND_THEMES_SUCCESS,
					payload: d.data
				});

				dispatch(loading(false));
			})
			.catch(e => {
				dispatch(loading(false));
				console.error(e);
				dispatch(error(e.message));
			});
	}
};