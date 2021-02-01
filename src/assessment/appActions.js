import createRemoteActions from '../utils/createRemoteActions';

export const constants = {
	'LOADING': 'LOADING',
	'ERROR': 'ERROR',
	...createRemoteActions('GET_STEP')
}

export function loading(state){
	return {
		type: constants.LOADING,
		payload: state
	}
}

export function error(err){
	return {
		type: constants.ERROR,
		payload: err
	}
}

/*export function getStep(){
	return dispatch => {
		request('UiStep')
		.get()
		.then(r => r.json())
		.then(d => {
			dispatch({
				type: constants.GET_STEP_SUCCESS,
				step: d.step
			});
			dispatch(loading(false));
		})
		.catch(e => {
			console.error(e);
			dispatch(error(e.message));
		});
	}
}*/