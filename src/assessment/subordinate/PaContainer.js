import Pa from '../profile/Pa';
import { assessmentSteps } from '../config/steps';
import CompetenceContainer from './CompetenceContainer';
import { togglePa } from './subordinateActions';
import { omit } from 'lodash';
import { connect } from 'react-redux';

function mapStateToProps(state, ownProps){
	const { subordinate } = state.app;
	const result = omit(subordinate, 'result');
	const pa = result.pas[ownProps.id];
	const isDisabled = pa.status === 'self' ? true : subordinate.result.assessment.step != assessmentSteps.second;
	return {
		isDisabled,
		CompetenceContainer,
		pa,
		...result
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		onTogglePa: (paId) => dispatch(togglePa(paId))
	}
}

export default connect(mapStateToProps, mapDispatchProps)(Pa);