import { getUserDps } from './dp/dpActions';
import { getUserDpsByManager } from './manager/managerActions';

export const constants = {
	'IDP_LOADING': 'IDP_LOADING',
	'IDP_ERROR': 'IDP_LOADING',
	'IDP_SET_IDP': 'IDP_SET_IDP'
};

export function loading(isLoading){
	return {
		type: constants.IDP_LOADING,
		payload: isLoading
	}
};

export function error(error){
	return {
		type: constants.IDP_ERROR,
		payload: error
	}
};


export function getUsers(id) {
	return dispatch => {
		Promise.all([dispatch(getUserDps(id)), dispatch(getUserDpsByManager(id))])
		.then(responses  => {
			dispatch(loading(false));
		});
	}
}