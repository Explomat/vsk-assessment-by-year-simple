import createRemoteActions from '../../utils/createRemoteActions';
import request from '../../utils/request';

export const constants = {
	...createRemoteActions([
		'COMPONENT_COLLABORATOR_LIST_FETCH'
	]),
	'COMPONENT_COLLABORATOR_LIST_ERROR': 'COMPONENT_COLLABORATOR_LIST_ERROR',
	'COMPONENT_COLLABORATOR_LIST_INFO': 'COMPONENT_COLLABORATOR_LIST_INFO',
	'COMPONENT_COLLABORATOR_LIST_LOADING': 'COMPONENT_COLLABORATOR_LIST_LOADING',
	'COMPONENT_COLLABORATOR_LIST_SELECT_ITEM': 'COMPONENT_COLLABORATOR_LIST_SELECT_ITEM',
	'COMPONENT_COLLABORATOR_LIST_RESET_SELECTED': 'COMPONENT_COLLABORATOR_LIST_RESET_SELECTED',
	'COMPONENT_COLLABORATOR_LIST_SET_SEARCH': 'COMPONENT_COLLABORATOR_LIST_SET_SEARCH',
	'COMPONENT_COLLABORATOR_LIST_SET_PARAMS': 'COMPONENT_COLLABORATOR_LIST_SET_PARAMS'
};

export function error(message) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_ERROR,
		payload: message
	}
};

export function info(message) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_INFO,
		payload: message
	}
};

export function loading(isLoading) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_LOADING,
		payload: isLoading
	}
};

export function resetSelected() {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_RESET_SELECTED
	}
}

export function selectItem(checked, item) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_SELECT_ITEM,
		payload: {
			checked,
			item
		}
	}
}

function setSearch(s) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_SET_SEARCH,
		payload: s
	}
}

export function getItems(type, page, pageSize, search) {
	return (dispatch, getState) => {

		dispatch(loading(true));
		const { idp } = getState();
		const p = page || idp.meta.collaborators.meta.page;
		const s = (search === undefined || search === null) ? idp.meta.collaborators.meta.search : search;
		dispatch(setSearch(s));

		request('idp', type)
		.get({
			search: s,
			page: p,
			page_size: pageSize || idp.meta.collaborators.meta.pageSize
		})
		.then(r => r.json())
		.then(d => {
			if (d.type === 'error'){
				throw d;
			}
			dispatch({
				type: constants.COMPONENT_COLLABORATOR_LIST_FETCH_SUCCESS,
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

export function onSetParams(params) {
	return {
		type: constants.COMPONENT_COLLABORATOR_LIST_SET_PARAMS,
		payload: params
	}
}
