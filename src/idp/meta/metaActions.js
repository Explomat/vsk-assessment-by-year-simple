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
	'DP_META_THEME_CHECKED': 'DP_META_THEME_CHECKED',
	'DP_META_CHANGE_STEP': 'DP_META_CHANGE_STEP',
	'DP_META_RESET_STATE': 'DP_META_RESET_STATE'
};

export function resetState() {
	return {
		type: constants.DP_META_RESET_STATE
	}
}

export function onChangeStep(step) {
	return {
		type: constants.DP_META_CHANGE_STEP,
		payload: step
	}
}

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

export function saveIdp(assessment_appraise_id, dp_id) {
	return (dispatch, getState) => {
		dispatch(appLoading(true));

		const { idp } = getState();
		const competences = [];

		idp.meta.competences.forEach(c => {
			if (c.checked) {
				c.themes = c.themes.filter(t => t.checked);
				competences.push(c);
			}
		});

		const robj = { assessment_appraise_id };
		if (dp_id) {
			robj.development_plan_id = dp_id;
		}

		request('idp', 'Idps', robj)
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

export function getMeta(assessment_appraise_id, dpId){
	return (dispatch, getState) => {
		dispatch(loading(true));

		const { assessment } = getState();
		const paKey = Object.keys(assessment.profile.pas).find(p => assessment.profile.pas[p].status === 'self');
		if (!paKey) {
			dispatch(error('client: Не найдена анкета самооценки'));
			return;
		}

		const comps = assessment.profile.pas[paKey].competences.map(c =>
			assessment.profile.competences[c]
		);

		const robj = { assessment_appraise_id };
		if (dpId) {
			robj.dp_id = dpId;
		}

		request('idp', 'Meta', robj)
			.post({
				competences: comps
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