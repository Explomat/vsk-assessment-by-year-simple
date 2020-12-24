import { getUserDps } from './dp/dpActions';
import { getUserDpsByManager } from './manager/managerActions';
import { getCompetencesAndThemes } from './meta/metaActions';

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
	return (dispatch, getState) => {
		dispatch(loading(true));
		Promise.all([dispatch(getUserDps(id)), dispatch(getUserDpsByManager(id))])
		.then(()  => {
			dispatch(loading(false));
		});
	}
}