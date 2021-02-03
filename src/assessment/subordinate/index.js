import React, { Component } from 'react';
import SubordinateContainer from './SubordinateContainer';
import { assessmentSteps } from '../config/steps';  
import { Modal, Button, Icon, Loader, Dimmer, Message } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { getInitialData, thirdStep, updateIdp } from './subordinateActions';
import { isCompetencesCompleted } from '../calculations';
import { omit } from 'lodash';

class Main extends Component {

	constructor(props) {
		super(props);

		this.handleSave = this.handleSave.bind(this);
	}

	componentDidMount(){
		const { match, loadData } = this.props;
		loadData(this.props.subordinateId, match.params.id);
	}

	handleSave() {
		const { onThirdStep, onUpdateIdp, onClose, match } = this.props;
		onThirdStep(match.params.id);

		onUpdateIdp(match.params.id);
		onClose();
	}

	render(){
		const { ui, assessment, onClose } = this.props;
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
				{assessment.step == assessmentSteps.second ?
					(
						isCompetencesCompleted(this.props) && (<Modal.Actions>
							<Button primary onClick={this.handleSave}>
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
	const { subordinate, profile } = state.assessment;
	const result = omit(subordinate, 'result');
	return {
		ui: profile.ui,
		user: subordinate.result.user,
		assessment: subordinate.result.assessment,
		meta: subordinate.result.meta,
		...result
	}
}

function mapDispatchProps(dispatch, ownProps) {
	return {
		loadData: (subordinateId, assessmentId) => dispatch(getInitialData(subordinateId, assessmentId)),
		onThirdStep: assessmentId => dispatch(thirdStep(assessmentId)),
		onUpdateIdp: assessmentId => dispatch(updateIdp(assessmentId))
	}
}


export default withRouter(connect(mapStateToProps, mapDispatchProps)(Main));
export { default as subordinateReducer } from './subordinateReducer';