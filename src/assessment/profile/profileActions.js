import createRemoteActions from '../../utils/createRemoteActions';
import { constants as appConstants, error } from '../appActions';
import request from '../../utils/request';
import mock from './mockData';
import { setStepMock } from '../mock';
import { normalize, denormalize, schema } from 'normalizr';
import { find } from 'lodash';
import {
	computeCompetencePercent,
	computeResultPercents,
	computeScaleByPercent
} from '../calculations';


const rule = new schema.Entity('rules', {}, { idAttribute: 'scale' });
const commonIndicator = new schema.Entity('commonIndicators');
const commonCompetence = new schema.Entity('commonCompetences', {
	commonIndicators: [ commonIndicator ]
});
const indicator = new schema.Entity('indicators', {}, { idAttribute: (value, parent, key) => {
	return `${value.pa_id}_${parent.competence_id}_${value.indicator_id}`
}});
const competence = new schema.Entity('competences', {
	indicators: [ indicator ]
}, { idAttribute: (value, parent, key) => {
	return `${parent.id}_${value.competence_id}`
}});

const pa = new schema.Entity('pas', {
	competences: [ competence ]
});

//const manager = new schema.Entity('managers');

const app = new schema.Object({
	commonCompetences: [ commonCompetence ],
	rules: [ rule ],
	user: new schema.Object({}),
	assessment: new schema.Object({
		pas: [ pa ]
	})
	//managers: [ manager ]
});

export const constants = {
	...createRemoteActions([
		'PROFILE_GET_COLLABORATORS',
		'PROFILE_GET_INITIAL_DATA',
		'PROFILE_SECOND_STEP',
		'PROFILE_FOURTH_STEP',
		'PROFILE_GET_INSTRUCTION'
	]),
	'PROFILE_SET_USER': 'PROFILE_SET_USER',
	'PROFILE_SET_TAB': 'PROFILE_SET_TAB',
	'PROFILE_SET_LOADING': 'PROFILE_SET_LOADING',
	'PROFILE_SET_MARK': 'PROFILE_SET_MARK',
	'PROFILE_UPDATE_PA': 'PROFILE_UPDATE_PA',
	'PROFILE_SET_COMMENT': 'PROFILE_SET_COMMENT',
	'PROFILE_TOGGLE_PA': 'PROFILE_TOGGLE_PA',
	'PROFILE_TOGGLE_CHECK_SUBORDINATE': 'PROFILE_TOGGLE_CHECK_SUBORDINATE',
	'PROFILE_TOGGLE_BOSS_BUTTON': 'PROFILE_TOGGLE_BOSS_BUTTON'
}

export function togglePa(paId){
	return {
		type: constants.PROFILE_TOGGLE_PA,
		payload: paId
	}
}

export function loading(isLoading) {
	return {
		type: constants.PROFILE_SET_LOADING,
		payload: isLoading
	}
}

/*export function setNewManager(id){
	return dispatch => {
		dispatch(loading(true));

		request('ResetManager')
		.post({}, {
			assessment_appraise_id: id
		})
		.then(data => {
			dispatch(loading(false));
			dispatch({
				type: appConstants.GET_STEP_SUCCESS,
				step: 'first'
			});
		})
		.catch(e => {
			dispatch(loading(false));
			console.error(e);
			dispatch(error(e.message));
		});
	}
}*/

export function setComment(competenceId, comment){
	return {
		type: constants.PROFILE_SET_COMMENT,
		payload: {
			competenceId,
			comment
		}
	}
}

export function setTab(tabName){
	return {
		type: constants.PROFILE_SET_TAB,
		payload:tabName
	}
}

export function getInitialData(id){
	return dispatch => {
		dispatch(loading(true));

		request('Profile')
		.get({ assessment_appraise_id: id })
		.then(r => r.json())
		.then(d => {
			if (d.type === 'error') {
				dispatch(loading(false));
				throw d;
			}

			const ndata = normalize(d.data, app);
			dispatch({
				type: constants.PROFILE_GET_INITIAL_DATA_SUCCESS,
				payload: {
					...ndata.entities,
					result: ndata.result
				}
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

export function getInstruction(id){
	return dispatch => {
		request('Instruction')
		.get({ assessment_appraise_id: id })
		.then(r => r.json())
		.then(d => {
			if (d.type === 'error') {
				dispatch(loading(false));
				throw d;
			}

			dispatch({
				type: constants.PROFILE_GET_INSTRUCTION_SUCCESS,
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

function setMark(competenceId, scale){
	return {
		type: constants.PROFILE_SET_MARK,
		payload: {
			competenceId,
			...scale
		}
	}
}

export function updatePa(paId, competenceId, scale) {
	return (dispatch, getState) => {
		dispatch(setMark(competenceId, scale));

		const { app } = getState();
		const competencePercent = computeCompetencePercent(competenceId, app.profile);
		const competenceScale = computeScaleByPercent(competencePercent, app.profile);
		const paOverall = computeResultPercents(paId, app.profile);

		dispatch({
			type: constants.PROFILE_UPDATE_PA,
			payload: {
				paId,
				competenceId,
				competenceMarkText: competenceScale,
				competenceMarkValue: competencePercent,
				paOverall
			}
		});
	}
}

function setBossButton(isShow){
	return {
		type: constants.PROFILE_TOGGLE_BOSS_BUTTON,
		payload: isShow
	}
}

export function secondStep(assessmentId){
	return (dispatch, getState) => {
		dispatch(setBossButton(false));
		dispatch(loading(true));

		const { app } = getState();
		const { competences, indicators, pas, result } = app.profile;

		/*const indicator = new schema.Entity('indicators', {}, { idAttribute: 'indicator_id'});
		const competence = new schema.Entity('competences', {
			indicators: [ indicator ]
		}, { idAttribute: 'competence_id'});
		const pa = new schema.Entity('pas', {
			competences: [ competence ]
		});

		const entities = {
			pas
		};
		const denormalizedData = denormalize({pas: Object.keys(pas)}, competence, entities);*/

		const pa = find(result.assessment.pas.map(p => pas[p]), { status: 'self' });
		if (pa !== undefined){
			const comps = pa.competences.map(c => {
				const comp = competences[c];
				return {
					...comp,
					indicators: comp.indicators.map(i => indicators[i])
				}
			});

			const data = {
				id: pa.id,
				overall: pa.overall,
				competences: comps
			}

			dispatch(loading(true));
			request('SecondStep', { assessment_appraise_id: assessmentId })
				.post(data)
				.then(r => r.json())
				.then(d => {
					if (d.type === 'error') {
						dispatch(loading(false));
						throw d;
					}

					dispatch(getInitialData(assessmentId));
					dispatch(loading(false));
				})
				.catch(e => {
					dispatch(loading(false));
					console.error(e);
					dispatch(error(e.message));
				});

		}
	}
}

export function fourthStep(isAgree, assessmentId){
	return dispatch => {
		dispatch(loading(true));
		request('FourthStep', { assessment_appraise_id: assessmentId })
			.post({ answer: isAgree })
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					dispatch(loading(false));
					throw d;
				}

				dispatch(getInitialData(assessmentId));
				dispatch(loading(false));
			})
			.catch(e => {
				dispatch(loading(false));
				console.error(e);
				dispatch(error(e.message));
			});
	}
}