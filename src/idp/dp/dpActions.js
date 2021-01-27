import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'FETCH_USER_DPS',
		'FETCH_DP',
		'CHANGE_STEP',
		'ADD_TASK',
		'REMOVE_TASK',
		'EDIT_TASK'
	]),
	'LOADING_DP': 'LOADING_DP'
};

export function loading(isLoading){
	return {
		type: constants.LOADING_DP,
		payload: isLoading
	}
};

export function getUserDps(id){
	return dispatch => {
		// return request сделан для того, чтобы получить промис в appActions.js и узнать, когда функция завершится
		return request('idp', 'Idps')
			.get({ assessment_appraise_id: id })
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.FETCH_USER_DPS_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};

export function saveIdp(assessment_appraise_id, dp_id, user_id) {
	return (dispatch, getState) => {
		dispatch(loading(true));

		const { idp } = getState();
		const competences = [];

		// темы
		idp.meta.competences.forEach(c => {
			if (c.checked) {
				const nc = { ...c };
				nc.themes = nc.themes.filter(t => t.checked);
				competences.push(nc);
			}
		});

		// задачи
		const robj = { assessment_appraise_id };
		if (dp_id) {
			robj.development_plan_id = dp_id;
		}

		request('idp', 'Idps', robj)
			.post({ competences })
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					throw d;
				}

				dispatch(loading(false));
				dispatch(getDp(assessment_appraise_id, user_id));
			})
			.catch(e => {
				dispatch(loading(false));
				console.error(e);
				dispatch(error(e.message));
			});
	}
}

export function getDp(assessment_appraise_id, user_id){
	return (dispatch, getState) => {
		const { idp } = getState();
		dispatch(loading(true));

		const obj = {
			assessment_appraise_id
		}

		if (user_id) {
			obj.user_id = user_id;
		}

		request('idp', 'Idps')
			.get(obj)
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.FETCH_DP_SUCCESS,
					payload: d.data
				});
				dispatch(loading(false));
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};


export function addTask(data, assessment_appraise_id, development_plan_id, competence_id){
	return (dispatch, getState) => {
		const { idp } = getState();

		const obj = { assessment_appraise_id };
		if (development_plan_id) {
			obj.development_plan_id = development_plan_id;
		}

		if (competence_id) {
			obj.competence_id = competence_id;
		}

		request('idp', 'Tasks', obj)
			.post(data)
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.ADD_TASK_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};

export function updateTask(id, data){
	return (dispatch) => {
		request('idp', 'Tasks', { task_id: id })
			.post(data)
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.EDIT_TASK_SUCCESS,
					payload: d.data,
					id
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};

export function removeTask(task_id, assessment_appraise_id){
	return dispatch => {
		request('idp', 'Tasks', { assessment_appraise_id, task_id })
			.delete()
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.REMOVE_TASK_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};

export function updateThemes(competences){
	return (dispatch) => {
		request('idp', 'Themes')
			.post(competences)
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.EDIT_THEME_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};

export function changeStep(task_id, action, comment){
	return (dispatch, getState) => {
		dispatch(loading(true));

		const { idp } = getState();

		request('idp', 'changeStep', { development_plan_id: idp.dp.development_plan_id })
			.post({
				task_id,
				action,
				comment
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch(getDp(idp.dp.development_plan_id));
				dispatch(loading(false));
			})
			.catch(e => {
				dispatch(loading(false));
				console.error(e.message);
				dispatch(error(e.message));
			});
	}
};