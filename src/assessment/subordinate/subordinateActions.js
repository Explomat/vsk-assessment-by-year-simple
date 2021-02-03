import createRemoteActions from '../../utils/createRemoteActions';
import { error } from '../appActions';
import { loading } from '../profile/profileActions';
import { loadData as loadSubordinates } from '../profile/subordinates/subordinatesActions';
import { nextMainStep } from '../../idp/dp/dpActions';
import request from '../../utils/request';
import { normalize, schema } from 'normalizr';
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

const app = new schema.Object({
	commonCompetences: [ commonCompetence ],
	rules: [ rule ],
	user: new schema.Object({}),
	assessment: new schema.Object({
		pas: [ pa ]
	})
});

export const constants = {
	...createRemoteActions([
		'SUBORDINATE_GET_INITIAL_DATA'
	]),
	'SUBORDINATE_SET_LOADING': 'SUBORDINATE_SET_LOADING',
	'SUBORDINATE_SET_MARK': 'SUBORDINATE_SET_MARK',
	'SUBORDINATE_UPDATE_PA': 'SUBORDINATE_UPDATE_PA',
	'SUBORDINATE_SET_COMMENT': 'SUBORDINATE_SET_COMMENT',
	'SUBORDINATE_TOGGLE_PA': 'SUBORDINATE_TOGGLE_PA'
}

export function togglePa(paId){
	return {
		type: constants.SUBORDINATE_TOGGLE_PA,
		payload: paId
	}
}

export function setComment(competenceId, comment){
	return {
		type: constants.SUBORDINATE_SET_COMMENT,
		payload: {
			competenceId,
			comment
		}
	}
}

export function getInitialData(subordinateId, assessmentId){
	return dispatch => {
		//dispatch(loading(true));

		request('assessment', 'Profile')
			.get({
				user_id: subordinateId,
				assessment_appraise_id: assessmentId
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					dispatch(loading(false));
					throw d;
				}

				const ndata = normalize(d.data, app);
				dispatch({
					type: constants.SUBORDINATE_GET_INITIAL_DATA_SUCCESS,
					payload: {
						...ndata.entities,
						result: ndata.result
					}
				});
				dispatch(loading(false));
			})
			.catch(e => {
				console.error(e);
				dispatch(error(e.message));
			});
	}
}

export function thirdStep(assessmentId){
	return (dispatch, getState) => {
		dispatch(loading(true));

		const app = getState().assessment;
		const { competences, indicators, pas } = app.subordinate;
		const { assessment } = app.subordinate.result;

		const pa = find(assessment.pas.map(p => pas[p]), { status: 'manager' });
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
			request('assessment', 'ThirdStep', { assessment_appraise_id: assessmentId })
				.post(data)
				.then(r => r.json())
				.then(d => {
					if (d.type === 'error') {
						dispatch(loading(false));
						throw d;
					}

					dispatch(loadSubordinates(assessmentId));
					//dispatch(getInitialData(user.id, assessmentId));
					dispatch(loading(false));
					//window.location.reload(true);
				})
				.catch(e => {
					console.error(e);
					dispatch(error(e.message));
				});
		}
	}
}


export function changeStepI(assessment_appraise_id, action, comment) {
	return (dispatch, getState) => {
		const { idp } = getState();

		dispatch(loading(true));
		return request('idp', 'changeStep', {
				assessment_appraise_id,
				development_plan_id: idp.dp.card.development_plan_id
			})
			.post({
				action,
				comment
			})
			.then(r => r.json())
			.then(d => {
				if (d.type === 'error') {
					throw d;
				}
				dispatch(loading(false));
			})
			.catch(e => {
				dispatch(loading(false));
				console.error(e.message);
				dispatch(error(e.message));
			});
	}
};

export function updateIdp(assessmentId) {
	return (dispatch, getState) => {
		dispatch(changeStepI(assessmentId, 'approve')).then(() => {
			dispatch(nextMainStep(assessmentId));
		});
		
	}
}

function setMark(competenceId, scale){
	return {
		type: constants.SUBORDINATE_SET_MARK,
		payload: {
			competenceId,
			...scale
		}
	}
}

export function updatePa(paId, competenceId, scale) {
	return (dispatch, getState) => {
		dispatch(setMark(competenceId, scale));

		const { assessment } = getState();
		const competencePercent = computeCompetencePercent(competenceId, assessment.subordinate);
		const competenceScale = computeScaleByPercent(competencePercent, assessment.subordinate);
		const paOverall = computeResultPercents(paId, assessment.subordinate);

		dispatch({
			type: constants.SUBORDINATE_UPDATE_PA,
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