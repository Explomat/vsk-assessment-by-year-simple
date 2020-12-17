import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'FETCH_USERS_BY_MANAGER_DPS'
	])
};

export function getUserDpsByManager(id){
	return dispatch => {
		request('idp', 'Idps')
			.get({
				assessment_appraise_id: id,
				is_manager: true
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error'){
					throw d;
				}
				dispatch({
					type: constants.FETCH_USERS_BY_MANAGER_DPS_SUCCESS,
					payload: d.data
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};