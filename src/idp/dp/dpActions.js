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

export function getDp(assessment_appraise_id){
	return (dispatch, getState) => {
		const { idp } = getState();
		dispatch(loading(true));

		request('idp', 'Idps')
			.get({
				assessment_appraise_id
			})
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


export function addTask(data){
	return (dispatch, getState) => {
		const { idp } = getState();

		request('idp', 'Tasks', { development_plan_id: idp.dp.development_plan_id })
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

export function removeTask(id){
	return dispatch => {
		request('idp', 'Tasks', { task_id: id })
			.delete()
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.REMOVE_TASK_SUCCESS,
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