import createRemoteActions from '../../../utils/createRemoteActions';
import { error, loading } from '../../appActions';
import { getInitialData } from '../profileActions';
import request from '../../../utils/request';

export const constants = {
	...createRemoteActions([
		'META_GET'
	])
}

export function getMeta(id){
	return dispatch => {
		dispatch(loading(true));

		request('Meta', { assessment_appraise_id: id })
		.post()
		.then(r => r.json())
		.then(d => {
			dispatch({
				type: constants.META_GET_SUCCESS,
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