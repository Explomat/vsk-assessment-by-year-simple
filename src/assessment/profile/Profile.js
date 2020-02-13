import React, { Component } from 'react';
import Instruction from './Instruction';
//import { Collapse } from 'react-collapse';
//import { presets } from 'react-motion';
import { createBaseUrl } from '../../utils/request';
import { Card, Image, Icon, Message, Table, Divider, Dropdown, Button, Label, Header } from 'semantic-ui-react';
import { assessmentSteps } from '../config/steps';  
import { isCompetencesCompleted } from '../calculations';

import './profile.css';

class Profile extends Component {

	constructor(props){
		super(props);

		this.renderResultMark = this.renderResultMark.bind(this);
		this.handleToggleInstruction = this.handleToggleInstruction.bind(this);
		this.state = {
			isShowInstruction: false
		}
	}

	handleToggleInstruction(){
		this.setState({
			isShowInstruction: !this.state.isShowInstruction
		});
	}

	renderResultMark(resultMark){
		const { rules } = this.props;
		return resultMark && (
			<Label
				size='large'
				className='assessment-profile__label'
				style={{
					backgroundColor: rules[resultMark].color,
					borderColor: rules[resultMark].color,
					float: 'right'
				}}
			>
				{resultMark}
			</Label>
		);
	}

	_isAssessmentOpened(paId, index){
		const { ui, user } = this.props;
		//return user.assessment.pas.length > 1 ? (index === 0 ? !ui.pas[paId] : !!ui.pas[paId]) : true;
		return user.assessment.pas.length > 1 ? ui.pas[paId] : !ui.pas[paId];
	}

	render(){
		const {
			PaContainer,
			onChangeManager,
			onSecondStep,
			onFourthStep,
			legends,
			meta,
			user,
			instruction,
			match
		} = this.props;

		const pasLen = user.assessment.pas.length;
		const isCompleted = isCompetencesCompleted(this.props);
		const { isShowInstruction } = this.state;
		return (
			<div className='assessment-profile'>
				<Card fluid>
					<Card.Content>
						<Image floated='right'>
							<Icon size='huge' color='blue' name='user' />
						</Image>
						<Card.Header
							as='a'
							target='__blank'
							href={`/view_doc.html?mode=collaborator&object_id=${user.id}`}
						>	
							{user.fullname}
						</Card.Header>
						<Card.Meta>{user.department} -> {user.position}</Card.Meta>
						<Card.Description>
							<span className='assessment-profile__description'>Название : </span><strong>"{user.assessment.name}"</strong>
						</Card.Description>
						<Card.Description>
							<span className='assessment-profile__description'>Период : </span><strong>{new Date(user.assessment.startDate).toLocaleDateString()} -  {new Date(user.assessment.finishDate).toLocaleDateString()}</strong>
						</Card.Description>
						<Card.Description>
							<span className='assessment-profile__description'>Этап : </span><strong>"{user.assessment.stepName}"</strong>
						</Card.Description>
						<Card.Description>
							<span className='assessment-profile__description'>Руководитель {' : '}</span>
							<Dropdown inline text={user.manager.fullname}>
								<Dropdown.Menu>
									<Dropdown.Item
										icon='address card'
										text='Посмотреть профиль'
										onClick={() => {
											window.open(`/view_doc.html?mode=collaborator&object_id=${user.manager.id}`, '_blank');
										}}
									/>
								</Dropdown.Menu>
							</Dropdown>
						</Card.Description>
					</Card.Content>
					<Card.Content className='assessment-profile__card-actions' extra>
						<a className='assessment-profile__card-actions_action-a' onClick={this.handleToggleInstruction}>
							<Icon name='file alternate outline' />
							Инструкция
						</a>
						<a href={`${createBaseUrl('Report')}&user_id=${user.id}&assessment_appraise_id=${match.params.id}`} className='assessment-profile__card-actions_action-a'>
							<Icon name='list alternate outline' />
							Отчет
						</a>
					</Card.Content>
				</Card>
				{isShowInstruction && <Instruction instruction={instruction} onClose={this.handleToggleInstruction} />}
				<Message warning>
					<Message.Header>Внимательно прочитайте инструкцию перед заполнением!</Message.Header>
					<Table celled size='small'>
						<Table.Header>
							<Table.Row>
								<Table.HeaderCell>Оценка</Table.HeaderCell>
								<Table.HeaderCell>Описание</Table.HeaderCell>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{legends.map((l, index) => {
								return (
									<Table.Row key={index}>
										<Table.Cell
											textAlign='center'
											style={{ position: 'relative', height: '60px' }}
										>
											<span style={{
												backgroundColor: l.color,
												position: 'absolute',
												top: '0',
												left: '0',
												width: '100%',
												height: '100%'
											}}>
												<strong style={{
													position: 'absolute',
													top: '50%',
													transform: 'translate(-50%,-50%)',
													left: '50%'
												}}>{l.scale}</strong>
											</span>
										</Table.Cell>
										<Table.Cell style={{ position: 'relative', height: '60px' }}>
											<span>{l.description}</span>
										</Table.Cell>
									</Table.Row>
								)
							})}
						</Table.Body>
					</Table>
				</Message>
				<Divider />
				<div className='assessment-profile__pas'>
					{
						user.assessment.pas.map((p, index) => {
							//const pa = pas[p];
							//const resultMark = computeResultMark(p, this.props);
							const isOpened = this._isAssessmentOpened(p, index);
							return <PaContainer key={p} id={p} isHeaderOpened={pasLen > 1} isOpened={isOpened} />
						})
					}
				</div>
				<div className='assessment-profile__result'>
					{
						user.assessment.step == assessmentSteps.first && 
						meta.curUserID === user.id && (
							<div>
								<Button
									disabled={!isCompleted}
									color='blue'
									onClick={() => onSecondStep(this.props.match.params.id)}
								>
									Перевести на оценку руководителя
								</Button>
								{!isCompleted &&
									<Message negative>
										<Message.Content>
											Анкета заполнена не полностью!
										</Message.Content>
									</Message>
								}
							</div>
						)
					}
					{
						user.assessment.step == assessmentSteps.third && 
						meta.curUserID === user.id &&
						<Button.Group>
							<Button
								style={{ marginRight: '16px' }}
								inverted
								color='green'
								onClick={() => onFourthStep(true, this.props.match.params.id)}
							>
								Согласен с оценкой
							</Button>
							<Button
								inverted
								color='red'
								onClick={() => onFourthStep(false, this.props.match.params.id)}
							>
								Не согласен
							</Button>
						</Button.Group>
					}
					{
						user.assessment.step == assessmentSteps.second &&
						meta.curUserID === user.id &&
						<Message info>
							<Message.Content>
								Вы не можете больше редактировать анкету, т.к. она находится на этапе "{user.assessment.stepName}"
							</Message.Content>
						</Message>
					}
					{
						user.assessment.step == assessmentSteps.fourth &&
						meta.curUserID === user.id &&
						<Message info>
							<Message.Content>
								Ваша оценка завершена
							</Message.Content>
						</Message>
					}
				</div>
				<Divider clearing hidden/>
			</div>
		);
	}
}

export default Profile;