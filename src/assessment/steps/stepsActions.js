import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import request from '../../utils/request';
import { getStep } from '../appActions';
import { searchManagersMock, saveAssessmentMock } from '../mock';

export const constants = {
	...createRemoteActions([
		'STEPS_GET_COLLABORATORS',
		'STEPS_SAVE',
		'STEPS_GET_INSTRUCTION'
	]),
	'STEPS_SET_STEP': 'STEPS_SET_STEP',
	'STEPS_SET_LOADING': 'STEPS_SET_LOADING',
	'STEPS_SET_MANAGER': 'STEPS_SET_MANAGER',
	'STEPS_SET_STATUS': 'STEPS_SET_STATUS'
};

export function setStep(step){
	return {
		type: constants.STEPS_SET_STEP,
		payload: step
	}
};

export function setStatus(status){
	return {
		type: constants.STEPS_SET_STATUS,
		payload: status
	}
};

export function setManager(result){
	return {
		type: constants.STEPS_SET_MANAGER,
		payload: result
	}
};

function setLoading(isLoading){
	return {
		type: constants.STEPS_SET_LOADING,
		payload: isLoading
	}
};

export function saveAssessment( ownProps){
	return (dispatch, getState) => {
		dispatch(setLoading(true));

		const { app } = getState();
		request('CreateInitialProfile')
			.post({
				status: app.steps.status,
				manager: app.steps.manager.value
			})
			.then(d => {
				dispatch(getStep());
				dispatch(setLoading(false));
				//window.location.hash = '/profile';
				ownProps.history.push('/profile');
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});

		/*setTimeout(() => {
			saveAssessmentMock({
				status: app.steps.status,
				manager: app.steps.manager.value
			});
			dispatch(getStep());
			dispatch(setLoading(false));
			ownProps.history.push('/profile');
		}, 1000);*/
	}
};

export function searchManagers(value){
	return dispatch => {

		request('Collaborators')
			.get({ search: value })
			.then(r => r.json())
			.then(d => {
				dispatch({
					type: constants.STEPS_GET_COLLABORATORS_SUCCESS,
					payload: d
				});
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
};


export function loadInstruction(){
	return dispatch => {
		dispatch(setLoading(true));

		request('Instruction')
			.get()
			.then(r => r.json())
			.then(d => {
				dispatch({
					type: constants.STEPS_GET_INSTRUCTION_SUCCESS,
					payload: d.instruction
				});
				dispatch(setLoading(false));
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});

		/*setTimeout(() => {
			dispatch({
					type: constants.STEPS_GET_INSTRUCTION_SUCCESS,
					payload: "<div>test test test test test test test test</div>"
			});
			dispatch(setLoading(false));
		}, 300);*/
	}
}