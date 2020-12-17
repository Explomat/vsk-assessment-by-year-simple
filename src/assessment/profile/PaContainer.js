import Pa from './Pa';
import CompetenceContainer from './CompetenceContainer';
import { assessmentSteps } from '../config/steps';
import { togglePa } from './profileActions';
import { omit } from 'lodash';
import { connect } from 'react-redux';

function mapStateToProps(state, ownProps){
	const { profile } = state.assessment;
	const result = omit(profile, 'result');
	const pa = result.pas[ownProps.id];
	const isDisabled = profile.result.assessment.step > assessmentSteps.first;
	return {
		CompetenceContainer,
		isDisabled,
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