import Profile from '../profile/Profile';
import PaContainer from './PaContainer';
import { omit } from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

function mapStateToProps(state){
	const { subordinate } = state.assessment;
	const result = omit(subordinate, 'result');
	return {
		PaContainer,
		meta: subordinate.result.meta,
		user: subordinate.result.user,
		assessment: subordinate.result.assessment,
		managers: subordinate.result.managers,
		curPa: subordinate.pas[subordinate.result.meta.curPaId],
		legends: subordinate.result.rules.map(r => subordinate.rules[r]),
		...result
	}
}

export default withRouter(connect(mapStateToProps)(Profile));