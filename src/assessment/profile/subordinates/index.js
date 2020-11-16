import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { assessmentSteps } from '../../config/steps';
import ViewSubordinate from '../../subordinate';
import SelectUser from './SelectUser';
import Subordinate from './Subordinate';
import { Input, List, Dimmer, Loader, Header, Button, Icon, Message, Modal } from 'semantic-ui-react';
import { loadData, subordinateChecked, changeSearch, searchSubordinates } from './subordinatesActions';
import { find } from 'lodash';

import './subordinates.css';

class Subordinates extends Component {

	constructor(props){
		super(props);
		this.state = {
			isShowDelegate: false,
			isShowSubordinate: false,
			isManagerCanNotEstimate: false,
			curSubordinate: {}
		}

		this.handleChangeSearch = this.handleChangeSearch.bind(this);
		this.handleSearch = this.handleSearch.bind(this);
		this.handleLoadData = this.handleLoadData.bind(this);
		this.onShowSubordinate = this.onShowSubordinate.bind(this);
		this.onSelectSubordinate = this.onSelectSubordinate.bind(this);
		this.handleShowDelegate = this.handleShowDelegate.bind(this);
	}

	handleSearch(ev) {
		const { searchSubordinates, match } = this.props;

		if (ev.charCode === 13) {
			searchSubordinates(match.params.id);
		}
	}

	handleChangeSearch(ev, data) {
		const { changeSearch } = this.props;
		changeSearch(data.value);
	}

	handleLoadData(isPrev, isNext) {
		const { match, meta, loadData } = this.props;
		loadData(match.params.id, meta.search, isPrev, isNext);
	}

	componentDidMount(){
		this.handleLoadData();
	}

	handleDelegateUser() {
		const { match, onDelegateUser } = this.props;
		onDelegateUser(match.params.id);
	}

	handleShowDelegate() {
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
		this.props.subordinateChecked(subordinateId, checked);
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
		const { ui, meta, subordinates, delegate, checkedSubordinates, onDelegateUser } = this.props;
		const { isShowDelegate, isShowSubordinate, isManagerCanNotEstimate, curSubordinate, subordinateId } = this.state;

		if (ui.isLoading) {
			return (
				<Dimmer active inverted>
					<Loader inverted>Loading</Loader>
				</Dimmer>
			)
		}

		return (
			<div className='assessment-subordinates'>
				{meta.isInitialTotal === 0 ? (
					<Message info>
						<Message.Content>У вас нет сотрудников</Message.Content>
					</Message>
				): (
					<div>
						<div className='assessment-subordinates__header'>
							<Input
								className='assessment-subordinates__header-search'
								placeholder='Поиск...'
								onChange={this.handleChangeSearch}
								onKeyPress={this.handleSearch}
								value={meta.search}
							/>
							<Button className='assessment-subordinates__header-delegate' disabled={!(checkedSubordinates.length > 0)} color='blue' onClick={this.handleShowDelegate}>
								Делегировать обязанности
							</Button>
						</div>
						<List className='assessment-profile__subordinates' verticalAlign='middle' selection divided>
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
						<div className='assessment-subordinates__footer'>
							<Button disabled={meta.min_row === 0} primary inverted onClick={() => this.handleLoadData(true)}>
								<Icon name='chevron left' />
							</Button>
							<Button disabled={subordinates.length < meta.pageSize} primary inverted onClick={() => this.handleLoadData(false, true)}>
								<Icon name='chevron right' />
							</Button>
						</div>
					</div>
				)}
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
					<Modal open closeIcon onClose={this.handleShowDelegate} size='small'>
						<Modal.Header>Выберите сотрудника, на которого делегируете обязанности оценивающего</Modal.Header>
						<Modal.Content>
							<SelectUser />
						</Modal.Content>
						 <Modal.Actions>
							{delegate.value &&
								<Button onClick={this.handleDelegateUser} color='green' inverted>
									<Icon name='checkmark' /> Выбрать
								</Button>
							}
						</Modal.Actions>
					</Modal>
				)}
			</div>
		);
	}
}


function mapStateToProps(state){
	const { profile, subordinates } = state.app;

	return {
		ui: profile.ui,
		...subordinates
	}
}

export default withRouter(connect(mapStateToProps, { loadData, subordinateChecked, changeSearch, searchSubordinates })(Subordinates));