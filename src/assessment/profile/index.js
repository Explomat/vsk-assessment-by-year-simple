import React, { Component } from 'react';
import { assessmentSteps } from '../config/steps';
import ProfileContainer from './ProfileContainer';
import Subordinates from './subordinates';
import { withRouter } from 'react-router';
import { Menu, Segment, Input, List, Dimmer, Loader, Modal, Header, Button, Icon, Message } from 'semantic-ui-react';
import { setTab, getInitialData,  delegateUser } from './profileActions';
import { connect } from 'react-redux';
import { find } from 'lodash';

class Main extends Component {

	constructor(props){
		super(props);
	}

	componentDidMount(){
		const { match, loadData } = this.props;
		loadData(match.params.id);
	}

	render(){
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
				</Menu>

				<Segment attached='bottom'>
					{ui.activeTab === 'profile' && <ProfileContainer />}
					{ui.activeTab === 'subordinates' && <Subordinates />}
				</Segment>
			</div>
		);
	}
}


function mapStateToProps(state){
	const { profile } = state.app;

	return {
		user: profile.result.user,
		ui: profile.ui
		/*subordinates: subordinates,
		checkedSubordinates*/
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		onChangeTab: (e, data) => dispatch(setTab(data.name)),
		//onSearchSubordinates: (e, { value }) => dispatch(searchSubordinates(value)),
		loadData: id => dispatch(getInitialData(id))
		//selectToggleSubordinate: (subordinateId, checked) => dispatch(subordinateChecked(subordinateId, checked)),
		//onDelegateUser: assessmentId => dispatch(delegateUser(assessmentId))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Main));
export { default as profileReducer } from './profileReducer';