import createRemoteActions from '../../../utils/createRemoteActions';
import { constants as appConstants, error, loading } from '../../appActions';
import request from '../../../utils/request';

export const constants = {
	...createRemoteActions([
		'SUBORDINATES_GET_INITIAL_DATA',
		'SUBORDINATES_GET_COLLABORATORS'
	]),
	'SUBORDINATES_CHANGE_SEARCH': 'SUBORDINATES_CHANGE_SEARCH',
	'SUBORDINATES_TOGGLE_CHECK': 'SUBORDINATES_TOGGLE_CHECK',
	'SUBORDINATES_SET_DELEGATE_USER': 'SUBORDINATES_SET_DELEGATE_USER'
}


export function changeSearch(val){
	return {
		type: constants.SUBORDINATES_CHANGE_SEARCH,
		payload: val
	}
}

export function searchSubordinates(assessmentId) {
	return (dispatch, getState) => {
		const { subordinates } = getState().app;
		dispatch(loadData(assessmentId, subordinates.meta.search));
	}
}

export function loadData(assessmentId, search = '', isPrev = false, isNext = false){
	return (dispatch, getState) => {
		dispatch(loading(true));

		const { app } = getState();

		request('Subordinates')
		.get({
			assessment_appraise_id: assessmentId,
			is_prev: isPrev,
			is_next: isNext,
			...app.subordinates.meta
		})
		.then(r => r.json())
		.then(d => {
			if (d.type === 'error') {
				dispatch(loading(false));
				throw d.message;
			}

			dispatch({
				type: constants.SUBORDINATES_GET_INITIAL_DATA_SUCCESS,
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
}

export function subordinateChecked(subordinateId, checked) {
	return {
		type: constants.SUBORDINATES_TOGGLE_CHECK,
		payload: {
			subordinateId,
			checked
		}
	}
}

export function setUser(result){
	return {
		type: constants.SUBORDINATES_SET_DELEGATE_USER,
		payload: result
	}
};

export function searchUsers(value){
	return (dispatch, getState) => {
		const { app } = getState();		

		request('Collaborators', {
			subordinates: app.subordinates.checkedSubordinates.join(',')
		})
			.get({ search: value })
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					throw d.message;
				}

				dispatch({
					type: constants.SUBORDINATES_GET_COLLABORATORS_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};


export function delegateUser(assessmentId) {
	return (dispatch, getState) => {
		const { app } = getState();
		const user = app.subordinates.delegate.value;

		//dispatch(setLoading(true));

		request('DelegateUser', { assessment_appraise_id: assessmentId })
			.post({
				user_id: user.id,
				subordinates: app.subordinates.checkedSubordinates
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					dispatch(loading(false));
					throw d.message;
				}

				//window.location.href = window.location.pathname + window.location.search + window.location.hash;
				//dispatch(getInitialData(assessmentId));
				//window.location.reload(true);
				//dispatch(setLoading(false));

				dispatch(loadData(assessmentId, app.subordinates.meta.search));
			})
			.catch(e => {
				//dispatch(setLoading(false));
				console.error(e);
				dispatch(error(e.message));
			});
	}
}