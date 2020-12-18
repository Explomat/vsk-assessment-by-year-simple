import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'DP_META_FETCH_COMPETENCES_AND_THEMES'
	]),
	'DP_META_LOADING': 'DP_META_LOADING',
	'DP_META_CHECKED': 'DP_META_CHECKED'
};

export function onChecked(id, isChecked) {
	return {
		type: constants.DP_META_CHECKED,
		payload: {
			id,
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

export function getCompetencesAndThemes(id){
	return dispatch => {
		dispatch(loading(true));
		request('idp', 'CompetencesAndThemes')
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