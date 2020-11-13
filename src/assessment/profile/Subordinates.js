import React, { Component } from 'react';
import { assessmentSteps } from '../config/steps';
import ViewSubordinate from '../subordinate';
import Subordinate from './Subordinate';
import { withRouter } from 'react-router';
import { Input, List, Dimmer, Loader, Header, Button, Icon, Message } from 'semantic-ui-react';
import { searchSubordinates, subordinateChecked } from './profileActions';
import { connect } from 'react-redux';
import { find } from 'lodash';

class Subordinates extends Component {

	constructor(props){
		super(props);
		this.state = {
			isShowSubordinate: false,
			curSubordinate: {}
		}

		this.onShowSubordinate = this.onShowSubordinate.bind(this);
		this.onSelectSubordinate = this.onSelectSubordinate.bind(this);
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
		const { ui, user, delegateUser, shouldHasPa, subordinates, checkedSubordinates, onChangeTab, onSearchSubordinates, onDelegateUser } = this.props;
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
				{subordinates.length > 0 ? (
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
				)}
				{isShowSubordinate && (
					<ViewSubordinate
						onClose={this.onShowSubordinate}
						subordinateId={subordinateId}
					/>)
				}
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
		
	}
}

export default withRouter(connect(mapStateToProps)(Subordinates));