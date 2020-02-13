import Competence from './Competence';
//import { assessmentSteps } from '../config/steps';
import { updatePa, setComment } from './profileActions';
import { omit } from 'lodash';
import { connect } from 'react-redux';

function mapStateToProps(state, ownProps){
	const { profile } = state.app;
	const result = omit(profile, 'result');
	return {
		legends: profile.result.rules.map(r => profile.rules[r]),
		paId: ownProps.paId,
		...result
	}
}

function mapDispatchProps(dispatch) {
	return {
		onUpdatePa: (paId, competenceId, markText, markValue) => {
			dispatch(updatePa(paId, competenceId, markText, markValue));
		},
		changeComment: (compId, value) => dispatch(setComment(compId, value))
	}
}

export default connect(mapStateToProps, mapDispatchProps)(Competence);