import React, { Component } from 'react';
import SubordinateContainer from './SubordinateContainer';
import { assessmentSteps } from '../config/steps';  
import { Modal, Button, Icon, Loader, Dimmer, Message } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { getInitialData, thirdStep } from './subordinateActions';
import { isCompetencesCompleted } from '../calculations';
import { omit } from 'lodash';

class Main extends Component {

	componentDidMount(){
		const { match, onLoadData } = this.props;
		onLoadData(this.props.subordinateId, match.params.id);
	}

	render(){
		const { ui, user, onClose, onThirdStep } = this.props;
		if (ui.isLoading) {
			return (
				<Dimmer active inverted>
					<Loader inverted>Loading</Loader>
				</Dimmer>
			)
		}
		return(
			<Modal size='large' className='assessment-subordinate' open closeIcon onClose={onClose} style={{
				position: 'relative'
			}}>
				<Modal.Header>Оценка подчиненного</Modal.Header>
				<Modal.Content  scrolling>
					<Modal.Description>
						<SubordinateContainer />
					</Modal.Description>
				</Modal.Content>
				{user.assessment.step == assessmentSteps.second ?
					(
						isCompetencesCompleted(this.props) && (<Modal.Actions>
							<Button primary onClick={() => onThirdStep(this.props.match.params.id)}>
								Сохранить <Icon name='chevron right' />
							</Button>
						</Modal.Actions>)
					) : (
						<Message size='small' icon info>
							<Icon name='exclamation' />
							<Message.Content>
								Анкета доступна только для просмотра
							</Message.Content>
						</Message>
					)
				}
			</Modal>
		);
	}
}

function mapStateToProps(state){
	const { subordinate } = state.app;
	const result = omit(subordinate, 'result');
	return {
		ui: subordinate.ui,
		user: subordinate.result.user,
		...result
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		onLoadData: (subordinateId, assessmentId) => dispatch(getInitialData(subordinateId, assessmentId)),
		onThirdStep: assessmentId => dispatch(thirdStep(assessmentId))
	}
}


export default withRouter(connect(mapStateToProps, mapDispatchProps)(Main));
export { default as subordinateReducer } from './subordinateReducer';