import createRemoteActions from '../../utils/createRemoteActions';
import { error, loading as appLoading } from '../appActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'DP_META_FETCH_COMPETENCES_AND_THEMES'
	]),
	'DP_META_DELETE_TASK': 'DP_META_DELETE_TASK',
	'DP_META_SAVE_TASK': 'DP_META_SAVE_TASK',
	'DP_META_LOADING': 'DP_META_LOADING',
	'DP_META_COMPETENCE_CHECKED': 'DP_META_COMPETENCE_CHECKED',
	'DP_META_THEME_CHECKED': 'DP_META_THEME_CHECKED'
};

export function onDeleteTask(competence_id, task_id) {
	return {
		type: constants.DP_META_DELETE_TASK,
		payload: {
			competence_id,
			task_id
		}
	}
}

export function onSaveTask(task, competence_id) {
	return {
		type: constants.DP_META_SAVE_TASK,
		payload: {
			task,
			competence_id
		}
	}
}

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

export function saveIdp(assessment_appraise_id) {
	return (dispatch, getState) => {
		dispatch(appLoading(true));

		const { idp } = getState();
		const competences = idp.meta.main.competences.filter(c => c.checked);

		competences.forEach(c => {
			const themes = c.competence_themes.filter(ct => ct.checked);
			c.competence_themes = themes;
		});

		request('idp', 'Idps', { assessment_appraise_id })
			.post({ competences })
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}

				dispatch(appLoading(false));
			})
			.catch(e => {
				dispatch(appLoading(false));
				console.error(e);
				dispatch(error(e.message));
			});
	}
}

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