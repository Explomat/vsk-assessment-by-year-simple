import React, { Component } from 'react';
import { assessmentSteps } from '../config/steps';
import ProfileContainer from './ProfileContainer';
import ViewSubordinate from '../subordinate';
import Subordinate from './Subordinate';
import SelectUser from './SelectUser';
import { withRouter } from 'react-router';
import { Menu, Segment, Input, List, Dimmer, Loader, Modal, Header, Button, Icon, Message } from 'semantic-ui-react';
import { setTab, getInitialData, /*searchSubordinates, subordinateChecked,*/ delegateUser } from './profileActions';
import { connect } from 'react-redux';
import { find } from 'lodash';

class Main extends Component {

	constructor(props){
		super(props);
		this.state = {
			isShowDelegate: false,
			isShowSubordinate: false,
			isManagerCanNotEstimate: false,
			curSubordinate: {}
		}

		this.handleDelegateUser = this.handleDelegateUser.bind(this);
		this.onShowDelegate = this.onShowDelegate.bind(this);
		this.onShowSubordinate = this.onShowSubordinate.bind(this);
		this.onSelectSubordinate = this.onSelectSubordinate.bind(this);
		this.onShowMessage = this.onShowMessage.bind(this);
	}

	_isContainsSubordinate() {
		const { checkedSubordinates, delegateUser } = this.props;

		for (var i = checkedSubordinates.length - 1; i >= 0; i--) {
			if (checkedSubordinates[i].id == delegateUser.id) {
				return true;
			}
		}

		return false;
	}

	componentDidMount(){
		const { match, loadData } = this.props;
		loadData(match.params.id);
	}

	handleDelegateUser() {
		const { match, onDelegateUser } = this.props;
		onDelegateUser(match.params.id);
	}

	onShowDelegate() {
		this.setState({
			isShowDelegate: !this.state.isShowDelegate
		});
	}

	onShowMessage(){
		this.setState({
			isManagerCanNotEstimate: !this.state.isManagerCanNotEstimate
		});
	}

	onSelectSubordinate(subordinateId, checked) {
		this.props.selectToggleSubordinate(subordinateId, checked);
	}

	onShowSubordinate(subordinateId){
		const { subordinates } = this.props;
		const subordinate = find(subordinates, { id: subordinateId });
		if (subordinate){
			if (subordinate.assessment.step === assessmentSteps.first){
				return this.setState({
					isManagerCanNotEstimate: true,
					curSubordinate: subordinate
				});
			}
		}

		this.setState({
			isShowSubordinate: !this.state.isShowSubordinate,
			subordinateId
		});
	}

	render(){
		const { ui, user, delegateUser, subordinates, checkedSubordinates, onChangeTab, onSearchSubordinates, onDelegateUser } = this.props;
		const { isShowDelegate, isShowSubordinate, isManagerCanNotEstimate, curSubordinate, subordinateId } = this.state;

		if (ui.isLoading) {
			return (
				<Dimmer active inverted>
					<Loader inverted>Loading</Loader>
				</Dimmer>
			)
		}

		return(
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
						Анкеты подчиненных
					</Menu.Item>}
					{user.isManager
						&& ui.activeTab === 'subordinates'
						&& (<Menu.Menu position='right'>
						<Menu.Item disabled>
							<Input
								transparent
								icon={{ name: 'search', link: true }}
								placeholder='Поиск...'
								onChange={onSearchSubordinates}
								value={ui.searchSubodinatesValue}
							/>
						</Menu.Item>
					</Menu.Menu>)}
				</Menu>

				<Segment attached='bottom'>
					{
						ui.activeTab === 'profile' ? (
							<ProfileContainer />
						) : (
							subordinates.length > 0 ? (
								<div>
									<Button disabled={!(checkedSubordinates.length > 0)} color='blue' onClick={this.onShowDelegate}>
										Делегировать обязанности
									</Button>
									<List className='assessment-profile__subordinates' verticalAlign='middle' selection>
										{
											subordinates.map(s => (
												<Subordinate
													key={s.id}
													subordinate={s}
													onShow={this.onShowSubordinate}
													onSelect={this.onSelectSubordinate}
												/>
											))
										}
									</List>
								</div>
							) : (
								<Message info>
									<Message.Content>У вас еще нет подчиненных</Message.Content>
								</Message>
							)
						) 
					}
				</Segment>
				{isShowSubordinate && (
					<ViewSubordinate
						onClose={this.onShowSubordinate}
						subordinateId={subordinateId}
					/>)
				}
				{isManagerCanNotEstimate && (
					<Modal open basic size='small'>
						<Header icon='user' content={curSubordinate.fullname} />
						<Modal.Content>
							<p>{`Вы не можете сейчас оценвать сотрудника, т.к. он находится на этапе "${curSubordinate.assessment.stepName}"`}</p>
						</Modal.Content>
						<Modal.Actions>
							<Button color='blue' inverted onClick={this.onShowMessage}>
								<Icon name='checkmark' /> Ok
							</Button>
						</Modal.Actions>
					</Modal>
				)}
				{isShowDelegate && (
					<Modal open closeIcon onClose={this.onShowDelegate} size='small'>
						<Modal.Header>Выберите сотрудника, на которого делегируете обязанности оценивающего</Modal.Header>
						<Modal.Content>
							<SelectUser />
						</Modal.Content>
						 <Modal.Actions>
							{delegateUser && (this._isContainsSubordinate() ? (
									<Message error style={{ textAlign: 'left' }}>
										<Message.Content>
											Недопустимое делегирование.
											Сотрудник {delegateUser.title} не может выступать своим же руководителем.
										</Message.Content>
									</Message>
								) : (
								<Button onClick={this.handleDelegateUser} color='green' inverted>
									<Icon name='checkmark' /> Выбрать
								</Button>
							))}
						</Modal.Actions>
					</Modal>
				)}
			</div>
		);
	}
}


function mapStateToProps(state){
	const { profile } = state.app;
	/*let subordinates = profile.result.subordinates.map(s => profile.subordinates[s]);

	subordinates = subordinates.filter(s => {
		const w = s.fullname.toLowerCase();
		const ss = profile.ui.searchSubodinatesValue.toLowerCase();
		return ~w.indexOf(ss);
	});

	const checkedSubordinates = subordinates.filter(s => s.checked);*/

	return {
		user: profile.result.user,
		delegateUser: profile.delegate.value,
		ui: profile.ui
		/*subordinates: subordinates,
		checkedSubordinates*/
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		onChangeTab: (e, data) => dispatch(setTab(data.name)),
		//onSearchSubordinates: (e, { value }) => dispatch(searchSubordinates(value)),
		loadData: id => dispatch(getInitialData(id)),
		//selectToggleSubordinate: (subordinateId, checked) => dispatch(subordinateChecked(subordinateId, checked)),
		onDelegateUser: assessmentId => dispatch(delegateUser(assessmentId))
	}
}

export default withRouter(connect(mapStateToProps, mapDispatchProps)(Main));
export { default as profileReducer } from './profileReducer';