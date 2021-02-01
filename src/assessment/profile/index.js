import React, { Component } from 'react';
//import IdpApp from '../../idp/App';
import ProfileContainer from './ProfileContainer';
import Subordinates from './subordinates';
import { withRouter } from 'react-router';
import { Menu, Segment, Dimmer, Loader } from 'semantic-ui-react';
import { setTab, getInitialData } from './profileActions';
import { connect } from 'react-redux';

class Main extends Component {

	componentDidMount() {
		const { match, loadData } = this.props;
		loadData(match.params.id);
		//getDp(match.params.id);
	}

	render() {
		const { ui, user, onChangeTab } = this.props;

		if (ui.isLoading) {
			return (
				<Dimmer active inverted>
					<Loader inverted>Loading</Loader>
				</Dimmer>
			)
		}

		return (
			<div className='assessment-profile'>
				<Menu attached='top' tabular>
					<Menu.Item
						name='profile'
						active={ui.activeTab === 'profile'}
						onClick={onChangeTab}
					>
						Моя анкета
					</Menu.Item>

					{user.isManager && <Menu.Item
						name='subordinates'
						active={ui.activeTab === 'subordinates'}
						onClick={onChangeTab}
					>
						Мои сотрудники
					</Menu.Item>}
					{/*idpUi.isIdp && <Menu.Item
						name='idp'
						active={ui.activeTab === 'idp'}
						onClick={onChangeTab}
					>
						ИПР
					</Menu.Item>*/}
				</Menu>

				<Segment attached='bottom'>
					{ui.activeTab === 'profile' && <ProfileContainer />}
					{ui.activeTab === 'subordinates' && <Subordinates />}
					{/*ui.activeTab === 'idp' && <IdpApp />*/}
				</Segment>
			</div>
		);
	}
}


function mapStateToProps(state){
	const { profile } = state.assessment;

	return {
		user: profile.result.user,
		ui: {
			...state.assessment.ui,
			...profile.ui
		},
		idpUi: state.idp.ui
		/*subordinates: subordinates,
		checkedSubordinates*/
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		onChangeTab: (e, data) => dispatch(setTab(data.name)),
		//onSearchSubordinates: (e, { value }) => dispatch(searchSubordinates(value)),
		loadData: id => dispatch(getInitialData(id)),
		//getDp: assessmentId => dispatch(getDp(assessmentId))
		//selectToggleSubordinate: (subordinateId, checked) => dispatch(subordinateChecked(subordinateId, checked)),
		//onDelegateUser: assessmentId => dispatch(delegateUser(assessmentId))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Main));
export { default as profileReducer } from './profileReducer';