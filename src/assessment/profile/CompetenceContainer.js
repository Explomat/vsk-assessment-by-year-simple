import Competence from './Competence';
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
		onUpdatePa: (paId, competenceId, scale) => {
			dispatch(updatePa(paId, competenceId, scale));
		},
		changeComment: (compId, value) => dispatch(setComment(compId, value))
	}
}

export default connect(mapStateToProps, mapDispatchProps)(Competence);