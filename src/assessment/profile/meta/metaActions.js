import createRemoteActions from '../../../utils/createRemoteActions';
import { error, loading } from '../../appActions';
import { getInitialData } from '../profileActions';
import request from '../../../utils/request';

export const constants = {
	...createRemoteActions([
		'META_GET'
	]),
	'META_CHECKED': 'META_CHECKED'
}

export function onChecked(id, isChecked) {
	return {
		type: constants.META_CHECKED,
		payload: {
			id, isChecked
		}
	}
}

export function getMeta(id){
	return (dispatch, getState) => {
		dispatch(loading(true));

		const { app } = getState();
		const reqObj = {};
		if (app.meta.parentNode) {
			reqObj.channel_id = app.meta.parentNode.id;
		}

		if (app.meta.selectedNode) {
			reqObj.position_level_id = app.meta.selectedNode.id;
		}

		request('Meta', { assessment_appraise_id: id })
		.post(reqObj)
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