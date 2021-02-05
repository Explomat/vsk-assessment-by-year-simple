import Profile from './Profile';
import PaContainer from './PaContainer';
import { /*setNewManager,*/ secondStep, fourthStep} from './profileActions';
import { omit } from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

function mapStateToProps(state){
	const { profile } = state.assessment;
	const { idp } = state;
	const result = omit(profile, 'result');
	return {
		PaContainer,
		idp: {
			hasThemesChecked: idp.meta.hasThemesChecked,
			currentStep: idp.meta.ui.currentStep,
			stepsCount: idp.meta.ui.stepsCount
		},
		curPa: result.pas[profile.result.meta.curPaId],
		meta: profile.result.meta,
		user: profile.result.user,
		managers: profile.result.managers,
		assessment: profile.result.assessment,
		legends: profile.result.rules.map(r => profile.rules[r]),
		...result
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		//onChangeManager: id => dispatch(setNewManager(id)),
		onSecondStep: id => dispatch(secondStep(id)),
		onFourthStep: (id, isAgree) => dispatch(fourthStep(id, isAgree))
	}
}

/*const wrapHOC = (WrappedComponent) => (props) => (
	<WrappedComponent {...props} CompetenceComponent={CompetenceContainer}/>
);*/

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Profile));