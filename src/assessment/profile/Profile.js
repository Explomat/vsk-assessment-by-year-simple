import React, { Component } from 'react';
import Instruction from './Instruction';
import { createBaseUrl } from '../../utils/request';
import { Card, Image, Icon, Message, Table, Divider, Dropdown, Button, Label, Header } from 'semantic-ui-react';
import { isCompetencesCompleted } from '../calculations';
import DpMeta from '../../idp/meta';
import Dp from '../../idp/dp/dp';

import './profile.css';

class Profile extends Component {

	constructor(props){
		super(props);

		this.renderResultMark = this.renderResultMark.bind(this);
		this.handleToggleInstruction = this.handleToggleInstruction.bind(this);
		this.handleSecondStep = this.handleSecondStep.bind(this);
		this.handleNextPage = this.handleNextPage.bind(this);
		this.handlePrevPage = this.handlePrevPage.bind(this);

		this.pages = {
			1: 1,
			2: 2
		};
		this.state = {
			isShowInstruction: false,
			curPage: 1
		}
	}

	handlePrevPage() {
		this.setState({
			curPage: this.state.curPage - 1
		});
	}

	handleNextPage() {
		this.setState({
			curPage: this.state.curPage + 1
		});
	}

	handleSecondStep() {
		const { onSecondStep, match } = this.props;
		onSecondStep(match.params.id);
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
		const { ui, assessment } = this.props;
		//return user.assessment.pas.length > 1 ? (index === 0 ? !ui.pas[paId] : !!ui.pas[paId]) : true;
		return assessment.pas.length > 1 ? ui.pas[paId] : !ui.pas[paId];
	}

	render() {
		const {
			PaContainer,
			onSecondStep,
			onFourthStep,
			legends,
			meta,
			user,
			assessment,
			managers,
			match,
			ui,
			hasIdp,
			idp
		} = this.props;

		const pasLen = assessment.pas.length;
		const isCompleted = isCompetencesCompleted(this.props);
		const { isShowInstruction, curPage } = this.state;
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
						{user.shouldHasPa && <Card.Description>
							<span className='assessment-profile__description'>Название : </span><strong>{assessment.name}</strong>
						</Card.Description>}
						{user.shouldHasPa && <Card.Description>
							<span className='assessment-profile__description'>Период : </span><strong>{new Date(assessment.startDate).toLocaleDateString()} -  {new Date(assessment.finishDate).toLocaleDateString()}</strong>
						</Card.Description>}
						{user.shouldHasPa && <Card.Description>
							<span className='assessment-profile__description'>Этап : </span><strong>{assessment.stepName}</strong>
						</Card.Description>}
						{user.shouldHasPa && managers.map(m => <Card.Description key={m.id}>
							<span className='assessment-profile__description'>{m.boss_type_name} {' : '}</span>
							<Dropdown inline text={m.fullname}>
								<Dropdown.Menu>
									<Dropdown.Item
										icon='address card'
										text='Посмотреть профиль'
										onClick={() => {
											window.open(`/view_doc.html?mode=collaborator&object_id=${m.id}`, '_blank');
										}}
									/>
									<Dropdown.Item
										icon='mail outline'
										text='Написать письмо'
										onClick={() => {
											window.open(`mailto:${m.email}?subject=Оценка`);
										}}
									/>
								</Dropdown.Menu>
							</Dropdown>
						</Card.Description>)}
						{user.shouldHasPa && <Card.Description>
							<span className='assessment-profile__description'>Вертикаль : </span><strong>{user.channel_level}</strong>
						</Card.Description>}
						{user.shouldHasPa && <Card.Description>
							<span className='assessment-profile__description'>Уровень должности : </span><strong>{user.position_level}</strong>
						</Card.Description>}
					</Card.Content>
					<Card.Content className='assessment-profile__card-actions' extra>
						<a className='assessment-profile__card-actions_action-a' onClick={this.handleToggleInstruction}>
							<Icon name='file alternate outline' />
							Инструкция
						</a>
						<a href={`${createBaseUrl('assessment', 'Report')}&user_id=${user.id}&assessment_appraise_id=${match.params.id}`} className='assessment-profile__card-actions_action-a'>
							<Icon name='list alternate outline' />
							Отчет
						</a>
					</Card.Content>
				</Card>
				{isShowInstruction && <Instruction onClose={this.handleToggleInstruction} />}
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
										style={{ position: 'relative', height: '20px' }}
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
									<Table.Cell style={{ position: 'relative', height: '20px' }}>
										<span>{l.description}</span>
									</Table.Cell>
								</Table.Row>
							)
						})}
					</Table.Body>
				</Table>
				<Divider />
				{curPage === 1 && <div className='assessment-profile__pas'>
					{
						assessment.pas.map((p, index) => {
							//const pa = pas[p];
							//const resultMark = computeResultMark(p, this.props);
							const isOpened = this._isAssessmentOpened(p, index);
							return <PaContainer key={p} id={p} isHeaderOpened={pasLen > 1} isOpened={isOpened} />
						})
					}
					{meta.hasIdp && <Dp />}
				</div>}
				{curPage === 2 && <DpMeta />}
				<div className='assessment-profile__result'>
					{
						meta.canEditSelf && curPage === 1 && isCompleted && (
							<div>
								{ui.isShowBossButton && <Button
									disabled={!isCompleted}
									color='blue' 
									onClick={this.handleNextPage}
								>
									Выбрать компетенции для развития
								</Button>}
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
						meta.canEditSelf && curPage === 2 && (
							<div>
								{ui.isShowBossButton && <Button
									onClick={this.handlePrevPage}
								>
									Назад
								</Button>}
								{ui.isShowBossButton && idp.hasThemesChecked && (idp.currentStep === idp.stepsCount) && <Button
									disabled={!isCompleted}
									color='blue' 
									onClick={this.handleSecondStep}
								>
									Перевести на оценку руководителю
								</Button>}
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
						(user.shouldHasPa && !meta.canEditSelf && meta.canEditBoss && meta.curUserID === user.id) &&
						<Message info>
							<Message.Content>
								Вы не можете больше редактировать анкету, т.к. она находится на этапе "{assessment.stepName}"
							</Message.Content>
						</Message>
					}
					{
						/*assessment.step == assessmentSteps.third && 
						meta.curUserID === user.id &&
						<Button.Group>
							<Button
								style={{ marginRight: '16px' }}
								inverted
								color='green'
								onClick={() => onFourthStep(true, this.props.match.params.id)}
							>
								Ознакомлен с оценкой
							</Button>
						</Button.Group>*/
					}
					{
						user.shouldHasPa && meta.isAssessmentCompleted &&
						<Message info>
							<Message.Content>
								Оценка завершена
							</Message.Content>
						</Message>
					}
					{!user.shouldHasPa && 
						<Message info>
							<Message.Content>
								Вы не можете проходить оценку, но можете оценивать своих сотрудников
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