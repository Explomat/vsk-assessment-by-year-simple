import Competence from '../profile/Competence';
import { updatePa, setComment } from './subordinateActions';
import { omit } from 'lodash';
import { connect } from 'react-redux';

function mapStateToProps(state, ownProps){
	const { subordinate } = state.assessment;
	const result = omit(subordinate, 'result');
	return {
		legends: subordinate.result.rules.map(r => subordinate.rules[r]),
		paId: ownProps.paId,
		...result
	}
}

function mapDispatchProps(dispatch) {
	return {
		onUpdatePa: (paId, competenceId, scale) => {
			dispatch(updatePa(paId, competenceId, scale));
		},
		changeComment: (competenceId, value) => dispatch(setComment(competenceId, value))
	}
}

export default connect(mapStateToProps, mapDispatchProps)(Competence);